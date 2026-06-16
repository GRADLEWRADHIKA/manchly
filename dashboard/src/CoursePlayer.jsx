import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  Clock,
  ArrowLeft,
  Loader2,
  BookOpen,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import { apiFetch, unwrap } from "./api";

const T = {
  bg: "#000000",
  card: "#111111",
  elevated: "#0A0A0A",
  orange: "#FFC107",
  green: "#10B981",
  red: "#EF4444",
  blue: "#3B82F6",
  border: "rgba(255,255,255,0.1)",
  textPri: "#FFFFFF",
  textSec: "#A1A1AA",
};

function fmtDuration(sec) {
  const s = Math.floor(Number(sec) || 0);
  if (!s) return "--:--";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${m}:${pad(ss)}`;
}

/** Cross-browser HLS player. Mux serves .m3u8; Chrome/Firefox need hls.js,
 *  Safari plays HLS natively. */
function HlsVideo({ src, poster, onEnded }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    let hls;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src; // Safari / iOS native HLS
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src; // best effort
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <video
      ref={ref}
      poster={poster || undefined}
      controls
      onEnded={onEnded}
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        background: "#000",
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        display: "block",
      }}
    />
  );
}

export default function CoursePlayer() {
  // course list
  const [enrollments, setEnrollments] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listErr, setListErr] = useState("");

  // selected course
  const [course, setCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [watched, setWatched] = useState(() => new Set());
  const [savingProgress, setSavingProgress] = useState(false);

  const loadEnrollments = useCallback(async () => {
    setListLoading(true);
    setListErr("");
    try {
      const body = await apiFetch("/courses/enrolled/me?page=1&limit=50");
      const data = unwrap(body) || {};
      const list = data.enrollments || data || [];
      setEnrollments(Array.isArray(list) ? list : []);
    } catch (e) {
      setListErr(e.message || "Failed to load your courses");
      setEnrollments([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const openCourse = async (courseId) => {
    setCourseLoading(true);
    setCourse(null);
    setActiveVideo(null);
    try {
      const body = await apiFetch(`/courses/${courseId}`);
      const c = (unwrap(body) || {}).course;
      setCourse(c || null);
      const vids = (c?.videos || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
      // pick the first playable video
      const firstPlayable = vids.find((v) => v.playback_url) || vids[0] || null;
      setActiveVideo(firstPlayable);
      // seed watched set from saved progress (approximate: progress% of videos)
      const savedPct = Number(c?.enrollment_info?.progress || 0);
      if (savedPct > 0 && vids.length) {
        const n = Math.round((savedPct / 100) * vids.length);
        setWatched(new Set(vids.slice(0, n).map((v) => v.id)));
      } else {
        setWatched(new Set());
      }
    } catch (e) {
      setListErr(e.message || "Failed to open course");
    } finally {
      setCourseLoading(false);
    }
  };

  const persistProgress = useCallback(
    async (courseId, nextWatched, total) => {
      if (!total) return;
      const pct = Math.round((nextWatched.size / total) * 100);
      setSavingProgress(true);
      try {
        await apiFetch(`/courses/${courseId}/progress`, {
          method: "PUT",
          body: JSON.stringify({ progress: pct }),
        });
      } catch {
        /* progress is best-effort; don't block playback */
      } finally {
        setSavingProgress(false);
      }
    },
    []
  );

  const markWatched = (video, advance) => {
    if (!course) return;
    const vids = (course.videos || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    const next = new Set(watched);
    next.add(video.id);
    setWatched(next);
    persistProgress(course.id, next, vids.length);

    if (advance) {
      const idx = vids.findIndex((v) => v.id === video.id);
      const nextVid = vids.slice(idx + 1).find((v) => v.playback_url);
      if (nextVid) setActiveVideo(nextVid);
    }
  };

  // ----- COURSE DETAIL / PLAYER VIEW -----
  if (course || courseLoading) {
    const vids = (course?.videos || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    const pct = vids.length ? Math.round((watched.size / vids.length) * 100) : 0;

    return (
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <button
          onClick={() => {
            setCourse(null);
            setActiveVideo(null);
          }}
          style={{ ...ghostBtn, marginBottom: 16 }}
        >
          <ArrowLeft size={15} /> All my courses
        </button>

        {courseLoading ? (
          <div style={center}>
            <Loader2 size={26} className="spin" color={T.orange} />
            <p style={{ color: T.textSec, marginTop: 10 }}>Loading course…</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 18 }} className="cp-grid">
            {/* player + meta */}
            <div>
              {activeVideo && activeVideo.playback_url ? (
                <HlsVideo
                  src={activeVideo.playback_url}
                  poster={activeVideo.thumbnail_url}
                  onEnded={() => markWatched(activeVideo, true)}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    background: T.elevated,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: T.textSec,
                  }}
                >
                  <Clock size={30} />
                  <p style={{ marginTop: 10 }}>
                    {activeVideo
                      ? "This video is still processing — check back soon."
                      : "No playable video in this course yet."}
                  </p>
                </div>
              )}

              <h2 style={{ margin: "16px 0 4px", fontSize: 20, fontWeight: 900 }}>
                {activeVideo?.title || course?.title}
              </h2>
              {activeVideo?.description && (
                <p style={{ color: T.textSec, fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
                  {activeVideo.description}
                </p>
              )}

              {activeVideo && !watched.has(activeVideo.id) && activeVideo.playback_url && (
                <button
                  onClick={() => markWatched(activeVideo, true)}
                  style={{ ...primaryBtn, marginTop: 14 }}
                >
                  <CheckCircle2 size={16} /> Mark as watched
                </button>
              )}
            </div>

            {/* playlist */}
            <div style={panel}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <BookOpen size={16} color={T.orange} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, flex: 1 }}>
                  {course?.title}
                </h3>
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>
                {vids.length} lessons · {fmtDuration(course?.total_duration)}
                {savingProgress ? " · saving…" : ""}
              </div>
              <div style={{ marginBottom: 14 }}>
                <Bar pct={pct} />
                <div style={{ fontSize: 11.5, color: T.textSec, marginTop: 5 }}>
                  {pct}% complete · {watched.size}/{vids.length} watched
                </div>
              </div>

              <div style={{ display: "grid", gap: 6, maxHeight: 460, overflowY: "auto" }}>
                {vids.map((v, i) => {
                  const isActive = activeVideo?.id === v.id;
                  const isWatched = watched.has(v.id);
                  const playable = !!v.playback_url;
                  return (
                    <button
                      key={v.id}
                      onClick={() => playable && setActiveVideo(v)}
                      disabled={!playable}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textAlign: "left",
                        background: isActive ? "rgba(255,193,7,0.12)" : T.elevated,
                        border: `1px solid ${isActive ? T.orange : T.border}`,
                        borderRadius: 10,
                        padding: "10px 12px",
                        cursor: playable ? "pointer" : "not-allowed",
                        opacity: playable ? 1 : 0.55,
                        width: "100%",
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>
                        {isWatched ? (
                          <CheckCircle2 size={18} color={T.green} />
                        ) : playable ? (
                          <PlayCircle size={18} color={isActive ? T.orange : T.textSec} />
                        ) : (
                          <Lock size={16} color={T.textSec} />
                        )}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 700,
                            color: isActive ? T.orange : T.textPri,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {i + 1}. {v.title}
                        </span>
                        <span style={{ fontSize: 11, color: T.textSec }}>
                          {playable ? fmtDuration(v.duration) : v.status === "PROCESSING" ? "Processing…" : "Not ready"}
                          {v.is_free ? " · Free" : ""}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <style>{`
          ${spinCss}
          @media (max-width: 820px) { .cp-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </div>
    );
  }

  // ----- COURSE LIST VIEW -----
  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "rgba(255,193,7,0.12)",
              border: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GraduationCap size={22} color={T.orange} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>My Learning</h2>
            <p style={{ margin: "3px 0 0", color: T.textSec, fontSize: 13 }}>
              Watch the courses you've enrolled in.
            </p>
          </div>
        </div>
        <button onClick={loadEnrollments} style={ghostBtn}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {listErr && <div style={errorBox}>⚠️ {listErr}</div>}

      {listLoading ? (
        <div style={center}>
          <Loader2 size={26} className="spin" color={T.orange} />
          <p style={{ color: T.textSec, marginTop: 10 }}>Loading your courses…</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div style={center}>
          <BookOpen size={32} color={T.textSec} />
          <p style={{ color: T.textSec, marginTop: 10, fontWeight: 600 }}>
            You haven't enrolled in any courses yet.
          </p>
          <p style={{ color: T.textSec, fontSize: 13 }}>
            Browse courses from the Dashboard to get started.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {enrollments.map((en) => {
            const c = en.course || en;
            const vids = c.videos || [];
            const ready = vids.filter((v) => v.status === "READY").length;
            const prog = Number(en.progress ?? c?.enrollment_info?.progress ?? 0);
            return (
              <button
                key={en.id || c.id}
                onClick={() => openCourse(c.id)}
                style={{
                  textAlign: "left",
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  cursor: "pointer",
                  padding: 0,
                  color: T.textPri,
                }}
              >
                <div
                  style={{
                    height: 130,
                    background: c.thumbnail_url
                      ? `center/cover no-repeat url(${c.thumbnail_url})`
                      : "linear-gradient(135deg, #1f2937, #0A0A0A)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {!c.thumbnail_url && <PlayCircle size={34} color={T.orange} />}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 4 }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: T.textSec, marginBottom: 10 }}>
                    {c.creator?.name ? `by ${c.creator.name} · ` : ""}
                    {ready || vids.length} lessons
                  </div>
                  <Bar pct={prog} />
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 5 }}>
                    {prog > 0 ? `${prog}% complete` : "Not started"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <style>{spinCss}</style>
    </div>
  );
}

function Bar({ pct }) {
  return (
    <div style={{ height: 7, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height: "100%",
          background: T.orange,
          borderRadius: 999,
          transition: "width .4s ease",
        }}
      />
    </div>
  );
}

const panel = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 };
const ghostBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  background: T.card,
  border: `1px solid ${T.border}`,
  color: T.textPri,
  padding: "9px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};
const primaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  background: T.orange,
  border: "none",
  color: "#000",
  padding: "10px 16px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 13,
};
const errorBox = {
  background: "rgba(239,68,68,0.1)",
  border: `1px solid ${T.red}`,
  color: T.red,
  borderRadius: 10,
  padding: "10px 14px",
  marginBottom: 14,
  fontSize: 13,
};
const center = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "70px 20px",
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  textAlign: "center",
};
const spinCss = `.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`;
