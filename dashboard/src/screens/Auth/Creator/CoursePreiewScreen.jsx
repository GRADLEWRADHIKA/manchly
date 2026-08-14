import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { FileText, Video as VideoIcon, Eye, AlertTriangle, Play } from "lucide-react";
import { apiFetch, unwrap } from "../../../utils/api";
import colors from "../../../utils/colors";
import Sidebar from "../../../components/Sidebar";
import TopHeader from "../../../components/TopHeader";
import Breadcrumbs from "../Creator/components/Breadcrumbs";
import Stepper from "../Creator/components/Stepper";

const WIZARD_STEPS = [
  { key: "course-details", label: "Course Details", icon: FileText },
  { key: "video", label: "Video", icon: VideoIcon },
  { key: "preview", label: "Preview", icon: Eye },
];

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatDuration(totalSeconds) {
  if (!totalSeconds) return null;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Inline HLS player — reuses the same hls.js pattern already proven working
// in FloatingIntroVideo.jsx. Swap for a real <HlsVideo /> import if one
// already exists elsewhere in the app.
function CourseTrailerPlayer({ playbackUrl, posterUrl }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playbackUrl || !videoRef.current) return;
    const video = videoRef.current;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;
    } else {
      import("hls.js").then((HlsModule) => {
        const Hls = HlsModule.default;
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(playbackUrl);
          hls.attachMedia(video);
        } else {
          video.src = playbackUrl;
        }
      });
    }
  }, [playbackUrl]);

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#000", aspectRatio: "16/9" }}>
      <video
        ref={videoRef}
        poster={posterUrl}
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && (
        <button
          type="button"
          onClick={() => videoRef.current?.play()}
          style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.9)",
            border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          <Play size={22} color={colors.brand.primaryOrange} fill={colors.brand.primaryOrange} />
        </button>
      )}
    </div>
  );
}

export default function CoursePreviewScreen({ user, onNavigate}) {
  const {courseId} = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) return setLoading(false);
    (async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/courses/${courseId}`);
        setCourse(unwrap(response)?.course || unwrap(response));
      } catch (err) {
        console.error("Failed to load course", err);
        setError("Couldn't load course details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const videos = (course?.videos || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const totalDurationSeconds = videos.reduce((sum, v) => sum + (Number(v.duration) || 0), 0);
  const firstVideo = videos[0];

  const handlePublish = async () => {
    if (!courseId) return;
    setPublishing(true);
    setError("");
    try {
      await apiFetch(`/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      onNavigate?.("courses");
    } catch (err) {
      console.error("Failed to publish course", err);
      setError(err?.message || "Something went wrong publishing this course.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar active="courses" onNavigate={onNavigate} onLogout={() => console.log("logout")} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: colors.typography.secondaryText }}>
          Loading preview...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active="courses" onNavigate={onNavigate} onLogout={() => console.log("logout")} />

      <div style={{ flex: 1, minWidth: 0, background: colors.base.appBackground, padding: 32 }}>
        <TopHeader totalRevenue={0} walletBalance={0} hasUnreadNotifications={false} onWithdraw={() => {}} onNotifications={() => {}} />

        <Breadcrumbs items={[{ label: "Courses", active: false }, { label: "Preview", active: true }]} />

        <h1 style={{ margin: "4px 0 4px", fontSize: 24, fontWeight: 700, color: colors.typography.primaryText }}>
          Preview Your Course
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: colors.typography.secondaryText }}>
          Review how your course will appear to students.
        </p>

        <Stepper steps={WIZARD_STEPS} activeIndex={2} />

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
          {/* Left column — student view */}
          <div>
            <CourseTrailerPlayer playbackUrl={firstVideo?.playback_url} posterUrl={course?.thumbnail_url} />

            <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.typography.primaryText, margin: "18px 0 6px" }}>
              {course?.title || "Untitled course"}
            </h2>
            <p style={{ fontSize: 14, color: colors.typography.secondaryText, margin: "0 0 14px" }}>
              {course?.description}
            </p>

            <div style={{ display: "flex", gap: 20, fontSize: 13, color: colors.typography.secondaryText, marginBottom: 24 }}>
              <span>{course?.level || "Beginner"} <span style={{ opacity: 0.6 }}>Level</span></span>
              <span>{videos.length} Lessons</span>
              {formatDuration(totalDurationSeconds) && <span>{formatDuration(totalDurationSeconds)} Total Duration</span>}
            </div>

            {/* Course Content — flat list. No "sections" field exists anywhere
                in the confirmed API, so this is not grouped like the mockup —
                wire up real grouping once a section/module field exists. */}
            <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${colors.base.border}`, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.typography.primaryText, margin: "0 0 14px" }}>
                Course Content
              </h3>
              {videos.length === 0 ? (
                <div style={{ fontSize: 13, color: colors.typography.secondaryText }}>No lessons added yet.</div>
              ) : (
                videos.map((v, i) => (
                  <div key={v.id || i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < videos.length - 1 ? `1px solid ${colors.base.border}` : "none" }}>
                    <span style={{ fontSize: 13.5, color: colors.typography.primaryText }}>{i + 1}. {v.title}</span>
                    {formatDuration(v.duration) && <span style={{ fontSize: 12.5, color: colors.typography.secondaryText }}>{formatDuration(v.duration)}</span>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right column — summary card */}
          <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${colors.base.border}`, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.typography.primaryText, margin: "0 0 14px" }}>
              Course Summary
            </h3>

            <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12, background: course?.thumbnail_url ? `url(${course.thumbnail_url}) center/cover` : "rgba(0,0,0,0.04)", marginBottom: 16 }} />

            <SummaryRow label="Course Title" value={course?.title} />
            <SummaryRow label="Category" value={course?.category || "Not set"} />
            <SummaryRow label="Level" value={course?.level || "Beginner"} />
            <SummaryRow label="Price" value={Number(course?.price) > 0 ? formatCurrency(course.price) : "Free"} />
            <SummaryRow label="Access" value="Not set" />
            <SummaryRow label="Status" value={course?.status || "Draft"} last />

            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: 14, marginTop: 16, display: "flex", gap: 10 }}>
              <AlertTriangle size={16} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>Almost There!</div>
                <div style={{ fontSize: 12, color: "#92400E", marginTop: 2 }}>Review your course details carefully. You can go back and edit anytime.</div>
              </div>
            </div>
          </div>
        </div>

        {error && <div style={{ color: "red", fontSize: 13, marginTop: 16 }}>{error}</div>}

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => onNavigate?.("courses")}
            style={{ background: "#fff", color: colors.brand.primaryOrange, border: `1px solid ${colors.base.border}`, borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            style={{ background: colors.brand.primaryOrange, color: colors.typography.white, border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: publishing ? "default" : "pointer", opacity: publishing ? 0.7 : 1 }}
          >
            {publishing ? "Publishing..." : "Publish Course 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: last ? "none" : `1px solid ${colors.base.border}` }}>
      <span style={{ fontSize: 12.5, color: colors.typography.secondaryText }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: colors.typography.primaryText }}>{value}</span>
    </div>
  );
}