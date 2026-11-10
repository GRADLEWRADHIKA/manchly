import { spawn } from "child_process";

export const MAX_DURATION_SECONDS = 60 * 60;

export interface SourceAnalysis {
  durationSeconds: number;
  needsReencode: boolean;
  reasons: string[];
}

interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  profile?: string;
  pix_fmt?: string;
  start_time?: string;
  channels?: number;
  sample_rate?: string;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  tags?: Record<string, string>;
  side_data_list?: Array<{ side_data_type?: string; rotation?: number }>;
}

interface FfprobeResult {
  streams?: FfprobeStream[];
  format?: { duration?: string };
}

const CLEAN_VIDEO_CODECS = new Set(["h264"]);
const CLEAN_VIDEO_PROFILES = new Set([
  "Baseline",
  "Constrained Baseline",
  "Main",
  "High",
]);
const CLEAN_PIX_FMTS = new Set(["yuv420p", "yuvj420p"]);
const CLEAN_AUDIO_CODECS = new Set(["aac"]);
const CLEAN_SAMPLE_RATES = new Set([44100, 48000]);

// Tight threshold: anything bigger than floating-point noise is a real offset.
const START_TIME_EPSILON_SECONDS = 0.001;
// Variable frame rate tolerance — small differences are fine (rounding).
const FRAME_RATE_EPSILON_FPS = 0.5;

/**
 * ffprobe the source and decide whether it can go straight to Mux as-is or
 * whether it needs a full ffmpeg re-encode first.
 *
 * Fast — typically <1 second regardless of file size.
 */
export async function analyzeSource(filePath: string): Promise<SourceAnalysis> {
  const probe = await ffprobeJson(filePath);
  const reasons: string[] = [];

  const duration = parseFloat(probe.format?.duration ?? "");
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Could not determine video duration");
  }

  const streams = probe.streams ?? [];
  const video = streams.find((s) => s.codec_type === "video");
  const audio = streams.find((s) => s.codec_type === "audio");

  if (!video) {
    throw new Error("No video stream found in source file");
  }

  if (video.codec_name && !CLEAN_VIDEO_CODECS.has(video.codec_name)) {
    reasons.push(`video codec is ${video.codec_name}, not h264`);
  }
  if (video.profile && !CLEAN_VIDEO_PROFILES.has(video.profile)) {
    reasons.push(`video profile is ${video.profile}`);
  }
  if (video.pix_fmt && !CLEAN_PIX_FMTS.has(video.pix_fmt)) {
    reasons.push(`pixel format is ${video.pix_fmt} (not 8-bit 4:2:0)`);
  }

  const vStart = parseFloat(video.start_time ?? "0") || 0;
  if (Math.abs(vStart) > START_TIME_EPSILON_SECONDS) {
    reasons.push(`video has non-zero start_time ${vStart.toFixed(6)}s (edit list)`);
  }

  if (audio) {
    const aStart = parseFloat(audio.start_time ?? "0") || 0;
    if (Math.abs(vStart - aStart) > START_TIME_EPSILON_SECONDS) {
      reasons.push(
        `A/V skew: video starts at ${vStart.toFixed(6)}s, audio at ${aStart.toFixed(6)}s`
      );
    }
    if (audio.codec_name && !CLEAN_AUDIO_CODECS.has(audio.codec_name)) {
      reasons.push(`audio codec is ${audio.codec_name}, not aac`);
    }
    if (audio.channels && audio.channels > 2) {
      reasons.push(`audio has ${audio.channels} channels (needs downmix to stereo)`);
    }
    const sr = parseInt(audio.sample_rate ?? "", 10);
    if (sr && !CLEAN_SAMPLE_RATES.has(sr)) {
      reasons.push(`audio sample rate is ${sr}Hz (not 44100/48000)`);
    }
  }

  const rFrac = parseFraction(video.r_frame_rate);
  const aFrac = parseFraction(video.avg_frame_rate);
  if (rFrac !== null && aFrac !== null && Math.abs(rFrac - aFrac) > FRAME_RATE_EPSILON_FPS) {
    reasons.push(`variable frame rate (r=${rFrac.toFixed(2)}, avg=${aFrac.toFixed(2)})`);
  }

  const rotationTag = video.tags?.rotate;
  if (rotationTag && rotationTag !== "0") {
    reasons.push(`rotation metadata present (${rotationTag}°)`);
  }
  const displayMatrixRotation = video.side_data_list?.find(
    (s) => s.side_data_type === "Display Matrix"
  )?.rotation;
  if (displayMatrixRotation && displayMatrixRotation !== 0) {
    reasons.push(`display matrix rotation (${displayMatrixRotation}°)`);
  }

  return {
    durationSeconds: duration,
    needsReencode: reasons.length > 0,
    reasons,
  };
}

function parseFraction(frac: string | undefined): number | null {
  if (!frac) return null;
  const [a, b] = frac.split("/").map((x) => parseFloat(x));
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}

function ffprobeJson(filePath: string): Promise<FfprobeResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v", "error",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      filePath,
    ]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) =>
      reject(new Error(`ffprobe spawn failed: ${err.message}. Is ffmpeg installed on the host?`))
    );
    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`ffprobe exited ${code}: ${stderr.trim() || "unknown error"}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        reject(new Error(`ffprobe returned invalid JSON: ${(err as Error).message}`));
      }
    });
  });
}

export interface NormalizeProgress {
  percent: number;
  outTimeSeconds: number;
}

export async function normalizeTo720p(
  inputPath: string,
  outputPath: string,
  durationSeconds: number,
  onProgress?: (p: NormalizeProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i", inputPath,
      "-map_metadata", "-1",
      "-vf", "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease,setsar=1,format=yuv420p",
      "-c:v", "libx264",
      "-profile:v", "high",
      "-level", "4.0",
      "-preset", "veryfast",
      "-crf", "23",
      "-r", "30",
      "-c:a", "aac",
      "-b:a", "128k",
      "-ac", "2",
      "-ar", "48000",
      "-movflags", "+faststart",
      "-progress", "pipe:1",
      "-nostats",
      outputPath,
    ];

    const proc = spawn("ffmpeg", args);
    let stderrTail = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      if (!onProgress) return;
      for (const line of chunk.toString().split("\n")) {
        const [k, v] = line.split("=");
        if (k === "out_time_ms" && v) {
          const outMs = parseInt(v, 10);
          if (Number.isFinite(outMs)) {
            const outSec = outMs / 1_000_000;
            const percent = Math.min(100, Math.max(0, (outSec / durationSeconds) * 100));
            onProgress({ percent, outTimeSeconds: outSec });
          }
        }
      }
    });

    proc.stderr.on("data", (d: Buffer) => {
      stderrTail = (stderrTail + d.toString()).slice(-2000);
    });

    proc.on("error", (err) =>
      reject(new Error(`ffmpeg spawn failed: ${err.message}. Is ffmpeg installed on the host?`))
    );
    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`ffmpeg exited ${code}: ${stderrTail.trim()}`));
      }
      resolve();
    });
  });
}
