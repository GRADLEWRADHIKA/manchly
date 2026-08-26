// Creator-side reel manager: upload a short vertical promo for a course,
// watch it process, then hide or delete it.
// Uploading mirrors the Studio's lesson flow — ask the backend for a Mux
// direct-upload URL, PUT the file straight to Mux, then poll until READY.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clapperboard, Plus, Trash2, Eye, EyeOff, Loader2, UploadCloud, X, AlertCircle, Play,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { toast } from "../../utils/toast";
import colors from "../../utils/colors";

const MAX_MB = 200;
const POLL_MS = 5000;
const MAX_POLLS = 60; // ~5 minutes before we stop chasing Mux

export default function ReelsScreen() {
  const [reels, setReels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploads, setUploads] = useState([]); // {key, title, pct, status, error}

  const pollTimers = useRef({});

  const load = useCallback(async () => {
    const [reelRes, courseRes] = await Promise.allSettled([
      apiFetch("/reels/mine"),
      apiFetch("/courses?my_courses=true&page=1&limit=100"),
    ]);

    if (reelRes.status === "fulfilled") {
      setReels(unwrap(reelRes.value)?.reels || []);
    }
    if (courseRes.status === "fulfilled") {
      const d = unwrap(courseRes.value);
      setCourses(d?.courses || (Array.isArray(d) ? d : []));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Never leave interval timers running after the screen unmounts.
  useEffect(() => () => Object.values(pollTimers.current).forEach(clearInterval), []);

  const putWithProgress = (url, file, onPct) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
      xhr.upload.onprogress = (e) =>
        e.lengthComputable && onPct(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`Upload failed (${xhr.status})`));
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    });

  // Mux needs a moment to transcode; poll the reel until it reports READY.
  const pollStatus = (reelId, key) => {
    let tries = 0;
    pollTimers.current[key] = setInterval(async () => {
      tries += 1;
      try {
        const st = unwrap(await apiFetch(`/reels/${reelId}/status`));
        const status = st?.reel?.status;
        if (status === "READY" || status === "FAILED" || tries > MAX_POLLS) {
          clearInterval(pollTimers.current[key]);
          delete pollTimers.current[key];
          setUploads((u) => u.filter((x) => x.key !== key));
          if (status === "FAILED") toast.error("Mux could not process that video");
          else if (status === "READY") toast.success("Reel is live 🎬");
          load();
        }
      } catch {
        if (tries > MAX_POLLS) {
          clearInterval(pollTimers.current[key]);
          delete pollTimers.current[key];
          setUploads((u) => u.filter((x) => x.key !== key));
        }
      }
    }, POLL_MS);
  };

  const startUpload = async ({ courseId, caption, file }) => {
    const key = `${courseId}-${file.name}-${file.size}`;
    setModalOpen(false);
    setUploads((u) => [...u, { key, title: file.name, pct: 0, status: "uploading" }]);

    try {
      const res = unwrap(
        await apiFetch(`/reels/course/${courseId}`, {
          method: "POST",
          body: JSON.stringify({ caption }),
        }),
      );
      const uploadUrl = res?.upload_url;
      const reelId = res?.reel?.id;
      if (!uploadUrl || !reelId) throw new Error("Server did not return an upload URL");

      await putWithProgress(uploadUrl, file, (pct) =>
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, pct } : x))),
      );

      setUploads((u) =>
        u.map((x) => (x.key === key ? { ...x, pct: 100, status: "processing" } : x)),
      );
      pollStatus(reelId, key);
    } catch (e) {
      setUploads((u) =>
        u.map((x) => (x.key === key ? { ...x, status: "failed", error: e.message } : x)),
      );
      toast.error(e.message || "Upload failed");
    }
  };

  const toggleHidden = async (reel) => {
    const hide = reel.status === "READY";
    try {
      await apiFetch(`/reels/${reel.id}`, {
        method: "PATCH",
        body: JSON.stringify({ hidden: hide }),
      });
      toast.success(hide ? "Reel hidden from the feed" : "Reel is live again");
      load();
    } catch (e) {
      toast.error(e.message || "Could not update the reel");
    }
  };

  const remove = async (reel) => {
    if (!window.confirm(`Delete this reel?\n\nThe video is removed from Mux and cannot be recovered. The course itself is untouched.`)) return;
    try {
      await apiFetch(`/reels/${reel.id}`, { method: "DELETE" });
      toast.success("Reel deleted");
      setReels((r) => r.filter((x) => x.id !== reel.id));
    } catch (e) {
      toast.error(e.message || "Could not delete the reel");
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: colors.typography.primaryText }}>Reels</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: colors.typography.secondaryText, maxWidth: 560 }}>
              Short vertical videos that promote your course. Learners scroll the feed and can buy
              straight from your reel.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            disabled={!courses.length}
            title={courses.length ? "" : "Create a course first"}
            style={{ ...primaryBtn, opacity: courses.length ? 1 : 0.5, cursor: courses.length ? "pointer" : "not-allowed" }}
          >
            <Plus size={16} /> New reel
          </button>
        </div>

        {/* In-flight uploads */}
        {uploads.map((u) => (
          <div key={u.key} style={uploadRow}>
            {u.status === "failed"
              ? <AlertCircle size={16} color="#EF4444" />
              : <Loader2 size={16} className="reelspin" color={colors.brand?.primaryOrange || "#FFC107"} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.typography.primaryText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {u.title}
              </div>
              <div style={{ fontSize: 12, color: colors.typography.secondaryText }}>
                {u.status === "uploading" && `Uploading… ${u.pct}%`}
                {u.status === "processing" && "Processing on Mux — this can take a minute"}
                {u.status === "failed" && (u.error || "Upload failed")}
              </div>
              {u.status !== "failed" && (
                <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.08)", marginTop: 6 }}>
                  <div style={{ width: `${u.pct}%`, height: "100%", borderRadius: 2, background: colors.brand?.primaryOrange || "#FFC107", transition: "width 0.2s" }} />
                </div>
              )}
            </div>
            {u.status === "failed" && (
              <button onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))} style={iconBtn}>
                <X size={14} />
              </button>
            )}
          </div>
        ))}

        {loading ? (
          <Empty><Loader2 size={24} className="reelspin" /> <span style={{ marginLeft: 8 }}>Loading reels…</span></Empty>
        ) : !reels.length ? (
          <Empty>
            <Clapperboard size={34} color={colors.typography.secondaryText} />
            <h3 style={{ margin: "12px 0 4px", fontSize: 17, color: colors.typography.primaryText }}>No reels yet</h3>
            <p style={{ margin: 0, fontSize: 14, color: colors.typography.secondaryText, maxWidth: 380, textAlign: "center" }}>
              {courses.length
                ? "Upload a 15–60 second vertical video promoting one of your courses."
                : "Publish a course first — a reel always points at a course."}
            </p>
          </Empty>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 18 }}>
            {reels.map((reel) => (
              <ReelTile key={reel.id} reel={reel} onToggleHidden={() => toggleHidden(reel)} onDelete={() => remove(reel)} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <UploadModal courses={courses} onClose={() => setModalOpen(false)} onSubmit={startUpload} />
      )}

      <style>{`
        .reelspin { animation: reelspin 0.9s linear infinite; }
        @keyframes reelspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────── tile ──────────────────────────────── */

function ReelTile({ reel, onToggleHidden, onDelete }) {
  const isLive = reel.status === "READY";
  const isHidden = reel.status === "HIDDEN";
  const busy = reel.status === "UPLOADING" || reel.status === "PROCESSING";

  const badge = isLive ? { text: "Live", bg: "rgba(16,185,129,0.12)", fg: "#059669" }
    : isHidden ? { text: "Hidden", bg: "rgba(0,0,0,0.06)", fg: "#6B7280" }
    : reel.status === "FAILED" ? { text: "Failed", bg: "rgba(239,68,68,0.12)", fg: "#DC2626" }
    : { text: "Processing", bg: "rgba(255,193,7,0.16)", fg: "#B45309" };

  return (
    <div style={{ border: `1px solid ${colors.base.border}`, borderRadius: 14, background: colors.base.cardBackground, overflow: "hidden" }}>
      <div style={{
        position: "relative", aspectRatio: "9 / 16", background: reel.thumbnail_url
          ? `url(${reel.thumbnail_url}) center/cover no-repeat` : "rgba(0,0,0,0.05)",
        display: "grid", placeItems: "center",
      }}>
        {!reel.thumbnail_url && (busy
          ? <Loader2 size={22} className="reelspin" color={colors.typography.secondaryText} />
          : <Play size={22} color={colors.typography.secondaryText} />)}

        <span style={{ position: "absolute", top: 8, left: 8, padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.fg }}>
          {badge.text}
        </span>

        {isHidden && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.55)" }} />}
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.typography.primaryText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {reel.course?.title || "Course"}
        </div>
        {reel.caption && (
          <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.typography.secondaryText, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {reel.caption}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <span style={{ fontSize: 12, color: colors.typography.secondaryText }}>{reel.view_count || 0} views</span>
          <div style={{ display: "flex", gap: 6 }}>
            {(isLive || isHidden) && (
              <button onClick={onToggleHidden} title={isLive ? "Hide from feed" : "Show in feed"} style={iconBtn}>
                {isLive ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
            <button onClick={onDelete} title="Delete reel" style={{ ...iconBtn, color: "#DC2626" }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── modal ─────────────────────────────── */

function UploadModal({ courses, onClose, onSubmit }) {
  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const pick = (f) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) return setError("That file isn't a video");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Keep it under ${MAX_MB} MB`);
    setError("");
    setFile(f);
  };

  const submit = () => {
    if (!courseId) return setError("Pick a course");
    if (!file) return setError("Choose a video");
    onSubmit({ courseId, caption: caption.trim(), file });
  };

  return (
    <div onClick={onClose} style={backdrop}>
      <div onClick={(e) => e.stopPropagation()} style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.typography.primaryText }}>New reel</h2>
          <button onClick={onClose} style={iconBtn}><X size={16} /></button>
        </div>

        <label style={label}>Course this reel promotes</label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} style={input}>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}{String(c.status).toUpperCase() !== "PUBLISHED" ? " (draft)" : ""}
            </option>
          ))}
        </select>
        <p style={hint}>Only reels on published courses appear in the learner feed.</p>

        <label style={label}>Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 300))}
          rows={3}
          placeholder="Facebook page kaise banaye — full guide in this course"
          style={{ ...input, resize: "vertical", fontFamily: "inherit" }}
        />
        <p style={hint}>{caption.length}/300</p>

        <label style={label}>Video</label>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          style={dropzone}
        >
          <UploadCloud size={22} color={colors.typography.secondaryText} />
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.typography.primaryText, marginTop: 6 }}>
            {file ? file.name : "Click or drop a vertical video"}
          </div>
          <div style={{ fontSize: 12, color: colors.typography.secondaryText, marginTop: 2 }}>
            {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `9:16, 15–60 seconds, up to ${MAX_MB} MB`}
          </div>
        </div>
        <input ref={inputRef} type="file" accept="video/*" hidden onChange={(e) => pick(e.target.files?.[0])} />

        {error && <p style={{ color: "#DC2626", fontSize: 13, margin: "10px 0 0" }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={secondaryBtn}>Cancel</button>
          <button onClick={submit} style={{ ...primaryBtn, flex: 1, justifyContent: "center" }}>
            <UploadCloud size={16} /> Upload reel
          </button>
        </div>
      </div>
    </div>
  );
}

function Empty({ children }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 320, background: colors.base.cardBackground, borderRadius: 16,
      border: `1px solid ${colors.base.border}`, color: colors.typography.secondaryText,
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────── styles ─────────────────────────────── */

const primaryBtn = {
  display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px",
  borderRadius: 10, border: "none", background: colors.gradients?.orange || "linear-gradient(180deg,#FFC107,#FFB300)",
  color: colors.typography?.white || "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
};

const secondaryBtn = {
  padding: "10px 18px", borderRadius: 10, border: `1px solid ${colors.base.border}`,
  background: "transparent", color: colors.typography.secondaryText, fontWeight: 600,
  fontSize: 14, cursor: "pointer",
};

const iconBtn = {
  width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(0,0,0,0.04)",
  display: "grid", placeItems: "center", cursor: "pointer", color: "inherit",
};

const uploadRow = {
  display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 12,
  background: colors.base.cardBackground, border: `1px solid ${colors.base.border}`, borderRadius: 12,
};

const backdrop = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "grid",
  placeItems: "center", zIndex: 100, padding: 20,
};

const modal = {
  width: "100%", maxWidth: 480, background: colors.base.cardBackground, borderRadius: 16,
  padding: 22, maxHeight: "88vh", overflowY: "auto",
  boxShadow: "0 20px 48px rgba(16,24,40,0.2)",
};

const label = {
  display: "block", fontSize: 13, fontWeight: 700, color: colors.typography.primaryText,
  marginBottom: 6, marginTop: 14,
};

const input = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: `1px solid ${colors.base.border}`, background: colors.base.appBackground,
  color: colors.typography.primaryText, fontSize: 14, boxSizing: "border-box",
};

const hint = { margin: "6px 0 0", fontSize: 12, color: colors.typography.secondaryText };

const dropzone = {
  border: `1.5px dashed ${colors.base.border}`, borderRadius: 12, padding: "22px 16px",
  textAlign: "center", cursor: "pointer", background: colors.base.appBackground,
};
