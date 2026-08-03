// Course Studio — light creator-suite redesign, fully dynamic:
// real course list + stats, create/edit course (thumbnail upload + AI enhance),
// lesson manager with drag-drop Mux direct upload, live progress, status
// polling until playback is ready, preview player, edit/delete.
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Pencil, Trash2, Share2, UploadCloud, PlayCircle, BookOpen,
  IndianRupee, Users, GraduationCap, CheckCircle2, Loader2, Sparkles, Film,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { Modal, Badge, Spinner, EmptyState } from "../../components/ui";
import HlsVideo from "../../components/HlsVideo";
import { toast } from "../../utils/toast";
import { formatCurrency } from "../../utils/formatters";

const G = colors.gradients;

/* ---------- small building blocks ---------- */

function GoldBtn({ children, onClick, loading, disabled, ghost, danger, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        border: ghost ? `1.5px solid ${danger ? "#FCA5A5" : "#E2C58A"}` : "none",
        background: ghost ? "#fff" : danger ? G.danger : G.orange,
        color: ghost ? (danger ? "#DC2626" : "#B45309") : "#fff",
        borderRadius: 12, padding: "10px 18px", fontSize: 14, fontWeight: 800,
        cursor: loading || disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
        display: "inline-flex", alignItems: "center", gap: 8,
        boxShadow: ghost ? "none" : "0 6px 16px rgba(245,166,35,0.3)",
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}
    >
      {loading ? <Spinner size={14} light={!ghost} /> : null}
      {children}
    </button>
  );
}

const inp = {
  width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10,
  border: `1.5px solid ${colors.base.border}`, fontSize: 14.5, outline: "none", fontFamily: "inherit",
};
const lbl = { display: "block", fontSize: 11.5, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: colors.typography.secondaryText, marginBottom: 6 };

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div style={{ flex: 1, background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{ width: 42, height: 42, borderRadius: 12, background: `${tint}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={tint} />
      </span>
      <span>
        <div style={{ fontSize: 21, fontWeight: 900, color: colors.typography.primaryText }}>{value}</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: colors.typography.secondaryText }}>{label}</div>
      </span>
    </div>
  );
}

// AI enhance helper — POST /ai/course/enhance, shows suggestion with Use/Keep.
function AiEnhance({ text, kind, tone, onUse }) {
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const run = async () => {
    if (!text?.trim()) return toast.info("Write something first, then enhance it");
    setBusy(true);
    try {
      const res = unwrap(await apiFetch("/ai/course/enhance", { method: "POST", body: JSON.stringify({ text, kind, tone }) }));
      setSuggestion(res?.enhanced || res?.text || null);
      if (!res?.enhanced) toast.info("No suggestion returned");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <button onClick={run} disabled={busy} style={{ background: "transparent", border: "none", color: "#7C3AED", fontWeight: 800, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, padding: 0, fontFamily: "inherit" }}>
        {busy ? <Spinner size={12} /> : <Sparkles size={13} />} Enhance with AI
      </button>
      {suggestion && (
        <div style={{ marginTop: 8, background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, color: "#4C1D95" }}>
          {suggestion}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={() => { onUse(suggestion); setSuggestion(null); }} style={{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Use this</button>
            <button onClick={() => setSuggestion(null)} style={{ background: "transparent", border: "none", color: "#6D28D9", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Keep original</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- main screen ---------- */

const EMPTY_FORM = { title: "", price: "", level: "Beginner", status: "DRAFT", description: "", thumbnail: "" };

export default function StudioScreen() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null); // selected course w/ videos
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // course form modal
  const [courseModal, setCourseModal] = useState(null); // null | 'create' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState(null);

  // lesson form modal
  const [lessonModal, setLessonModal] = useState(null); // null | {mode:'add', file} | {mode:'edit', video}
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", order: 1, thumbnail_url: "" });
  const [lessonSaving, setLessonSaving] = useState(false);
  const [deleteLesson, setDeleteLesson] = useState(null);
  const [preview, setPreview] = useState(null);

  // uploads
  const [uploads, setUploads] = useState([]); // {key, title, pct, status}
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const thumbRef = useRef(null);
  const lessonThumbRef = useRef(null);
  const pollTimers = useRef({});

  const loadCourses = useCallback(async (keepSelection = true) => {
    try {
      const [list, st] = await Promise.allSettled([
        apiFetch("/courses?my_courses=true&page=1&limit=50"),
        apiFetch("/courses/stats/creator"),
      ]);
      if (list.status === "fulfilled") {
        const d = unwrap(list.value);
        const arr = d?.courses || (Array.isArray(d) ? d : []);
        setCourses(arr);
        setSelectedId((prev) => (keepSelection && prev && arr.some((c) => c.id === prev) ? prev : arr[0]?.id || null));
      }
      if (st.status === "fulfilled") setStats(unwrap(st.value)?.statistics || unwrap(st.value));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id) => {
    if (!id) return setDetail(null);
    setDetailLoading(true);
    try {
      const d = unwrap(await apiFetch(`/courses/${id}`));
      setDetail(d?.course || d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { loadCourses(false); }, [loadCourses]);
  useEffect(() => { loadDetail(selectedId); }, [selectedId, loadDetail]);
  useEffect(() => () => Object.values(pollTimers.current).forEach(clearInterval), []);

  /* ---------- course CRUD ---------- */

  const openCreate = () => { setForm(EMPTY_FORM); setCourseModal("create"); };
  const openEdit = () => {
    if (!detail) return;
    setForm({
      title: detail.title || "", price: String(detail.price ?? ""), level: detail.level || "Beginner",
      status: detail.status || "DRAFT", description: detail.description || "", thumbnail: detail.thumbnail || "",
    });
    setCourseModal("edit");
  };

  const uploadImage = async (file, onDone, setBusy) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = unwrap(await apiFetch("/upload", { method: "POST", body: fd }));
      if (!res?.url) throw new Error("Upload failed");
      onDone(res.url);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const saveCourse = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (form.price === "" || isNaN(Number(form.price))) return toast.error("Valid price is required (0 for free)");
    if (form.description.trim().length < 5) return toast.error("Description must be at least 5 characters");
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), price: Number(form.price), level: form.level, status: form.status,
        description: form.description.trim(), thumbnail: form.thumbnail || undefined, category: "video",
      };
      if (courseModal === "create") {
        const res = unwrap(await apiFetch("/courses", { method: "POST", body: JSON.stringify(payload) }));
        toast.success("Course created 🎉");
        await loadCourses(false);
        const newId = res?.course?.id || res?.id;
        if (newId) setSelectedId(newId);
      } else {
        await apiFetch(`/courses/${selectedId}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Course updated");
        await Promise.all([loadCourses(), loadDetail(selectedId)]);
      }
      setCourseModal(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteCourse = async () => {
    try {
      await apiFetch(`/courses/${deleteCourse.id}`, { method: "DELETE" });
      toast.success("Course deleted");
      setDeleteCourse(null);
      setSelectedId(null);
      loadCourses(false);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const share = async () => {
    const url = `https://manchly.chottu.link/course/${detail.id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Course link copied");
  };

  /* ---------- lessons + Mux upload ---------- */

  const startAdd = (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) return toast.error("Please pick a video file");
    const nextOrder = (detail?.videos?.length || 0) + 1;
    setLessonForm({ title: file.name.replace(/\.[^.]+$/, ""), description: "", order: nextOrder, thumbnail_url: "" });
    setLessonModal({ mode: "add", file });
  };

  const startEditLesson = (video) => {
    setLessonForm({ title: video.title || "", description: video.description || "", order: video.order || 1, thumbnail_url: video.thumbnail_url || "" });
    setLessonModal({ mode: "edit", video });
  };

  const putWithProgress = (url, file, onPct) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
      xhr.upload.onprogress = (e) => e.lengthComputable && onPct(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    });

  const pollStatus = (videoId, key) => {
    let tries = 0;
    pollTimers.current[key] = setInterval(async () => {
      tries += 1;
      try {
        const st = unwrap(await apiFetch(`/courses/videos/${videoId}/status`));
        const ready = st?.playback_url || st?.status === "ready" || st?.video?.playback_url;
        if (ready || tries > 36) {
          clearInterval(pollTimers.current[key]);
          delete pollTimers.current[key];
          setUploads((u) => u.filter((x) => x.key !== key));
          if (ready) toast.success("Lesson is ready to watch 🎬");
          loadDetail(selectedId);
        }
      } catch { /* keep polling */ }
    }, 5000);
  };

  const submitLesson = async () => {
    if (!lessonForm.title.trim()) return toast.error("Lesson title is required");
    setLessonSaving(true);
    try {
      if (lessonModal.mode === "edit") {
        await apiFetch(`/courses/videos/${lessonModal.video.id}`, {
          method: "PUT",
          body: JSON.stringify({ title: lessonForm.title.trim(), description: lessonForm.description.trim(), is_free: false, order: Number(lessonForm.order) || 1, thumbnail_url: lessonForm.thumbnail_url || undefined }),
        });
        toast.success("Lesson updated");
        setLessonModal(null);
        loadDetail(selectedId);
        return;
      }
      // add: create video record → get Mux direct-upload URL → background PUT
      const file = lessonModal.file;
      const res = unwrap(
        await apiFetch(`/courses/${selectedId}/videos`, {
          method: "POST",
          body: JSON.stringify({ title: lessonForm.title.trim(), description: lessonForm.description.trim(), is_free: false, order: Number(lessonForm.order) || 1, thumbnail_url: lessonForm.thumbnail_url || undefined }),
        })
      );
      const uploadUrl = res?.upload_url || res?.uploadUrl;
      const videoId = res?.video?.id || res?.video_id;
      if (!uploadUrl) throw new Error("No upload URL returned");
      setLessonModal(null);

      const key = `${Date.now()}`;
      setUploads((u) => [...u, { key, title: lessonForm.title.trim(), pct: 0, status: "uploading" }]);
      toast.info("Uploading in background — you can keep working");

      putWithProgress(uploadUrl, file, (pct) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, pct } : x))))
        .then(() => {
          setUploads((u) => u.map((x) => (x.key === key ? { ...x, status: "processing", pct: 100 } : x)));
          if (videoId) pollStatus(videoId, key);
          else {
            setUploads((u) => u.filter((x) => x.key !== key));
            loadDetail(selectedId);
          }
        })
        .catch((e) => {
          setUploads((u) => u.map((x) => (x.key === key ? { ...x, status: "failed", error: e.message } : x)));
          toast.error(e.message);
        });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLessonSaving(false);
    }
  };

  const confirmDeleteLesson = async () => {
    try {
      await apiFetch(`/courses/videos/${deleteLesson.id}`, { method: "DELETE" });
      toast.success("Lesson deleted");
      setDeleteLesson(null);
      loadDetail(selectedId);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const fmtDur = (s) => {
    const sec = Number(s) || 0;
    if (!sec) return null;
    return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  };

  const videos = (detail?.videos || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  /* ---------- render ---------- */

  return (
    <div style={{ padding: 32, color: colors.typography.primaryText }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 900 }}>
            Course <span style={{ background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Studio</span>
          </h1>
          <p style={{ margin: "4px 0 0", color: colors.typography.secondaryText, fontSize: 14 }}>
            Build your courses, upload lessons, publish when ready.
          </p>
        </div>
        <GoldBtn onClick={openCreate}><Plus size={16} /> New Course</GoldBtn>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, marginBottom: 26, flexWrap: "wrap" }}>
        <StatCard icon={GraduationCap} label="Total Courses" value={stats?.total_courses ?? courses.length} tint="#3B82F6" />
        <StatCard icon={CheckCircle2} label="Published" value={stats?.published_courses ?? courses.filter((c) => c.status === "PUBLISHED").length} tint="#22C55E" />
        <StatCard icon={Users} label="Enrollments" value={stats?.total_enrollments ?? 0} tint="#8B5CF6" />
        <StatCard icon={IndianRupee} label="Course Revenue" value={formatCurrency(stats?.revenue ?? 0)} tint="#F5A623" />
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 22 }}>
          <div className="mn-shimmer" style={{ height: 300, borderRadius: 16, opacity: 0.35 }} />
          <div className="mn-shimmer" style={{ height: 300, borderRadius: 16, opacity: 0.35 }} />
        </div>
      ) : courses.length === 0 ? (
        <div style={{ background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 18 }}>
          <EmptyState
            icon="🎬"
            title="Create your first course"
            subtitle="Set a title, price and thumbnail — then drop in video lessons. Publish whenever you're ready."
            action={<GoldBtn onClick={openCreate}><Plus size={16} /> Create Course</GoldBtn>}
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 22, alignItems: "start" }}>
          {/* Course rail */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: colors.typography.secondaryText, marginBottom: 10 }}>
              Your Courses ({courses.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {courses.map((c) => (
                <button key={c.id} className={`cs-course-item ${c.id === selectedId ? "active" : ""}`} onClick={() => setSelectedId(c.id)}>
                  <div style={{ width: 58, height: 44, borderRadius: 9, flexShrink: 0, background: c.thumbnail ? `url(${c.thumbnail}) center/cover` : G.heroNavy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {!c.thumbnail && <BookOpen size={17} color="rgba(255,255,255,0.7)" />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: colors.typography.primaryText }}>{c.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <Badge color={c.status === "PUBLISHED" ? "#16A34A" : "#B45309"}>{c.status || "DRAFT"}</Badge>
                      <span style={{ fontSize: 12, color: colors.typography.secondaryText }}>{Number(c.price) > 0 ? formatCurrency(c.price) : "Free"}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lesson manager */}
          <div style={{ background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 18, padding: 24 }}>
            {detailLoading || !detail ? (
              <div className="mn-shimmer" style={{ height: 220, borderRadius: 14, opacity: 0.3 }} />
            ) : (
              <>
                {/* Course header */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", borderBottom: `1px solid ${colors.base.border}`, paddingBottom: 18, marginBottom: 18 }}>
                  <div style={{ display: "flex", gap: 14, minWidth: 0 }}>
                    <div style={{ width: 96, height: 66, borderRadius: 12, flexShrink: 0, background: detail.thumbnail ? `url(${detail.thumbnail}) center/cover` : G.heroNavy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {!detail.thumbnail && <BookOpen size={22} color="rgba(255,255,255,0.7)" />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 900 }}>{detail.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                        <Badge color={detail.status === "PUBLISHED" ? "#16A34A" : "#B45309"}>{detail.status || "DRAFT"}</Badge>
                        <span style={{ fontSize: 13, color: colors.typography.secondaryText }}>
                          {videos.length} lessons · {Number(detail.price) > 0 ? formatCurrency(detail.price) : "Free"} · {detail.level || "Beginner"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <button className="cs-icon-btn" title="Preview as user" onClick={() => navigate(`/app/course/${detail.id}`)}><PlayCircle size={16} /></button>
                    <button className="cs-icon-btn" title="Copy share link" onClick={share}><Share2 size={16} /></button>
                    <button className="cs-icon-btn" title="Edit course" onClick={openEdit}><Pencil size={16} /></button>
                    <button className="cs-icon-btn danger" title="Delete course" onClick={() => setDeleteCourse(detail)}><Trash2 size={16} /></button>
                    <GoldBtn onClick={() => fileRef.current?.click()} style={{ padding: "8px 16px" }}><UploadCloud size={15} /> Add Lesson</GoldBtn>
                  </div>
                </div>

                {/* Upload queue */}
                {uploads.map((u) => (
                  <div key={u.key} style={{ display: "flex", alignItems: "center", gap: 14, background: "#FFFBF2", border: "1px solid #F0DDB0", borderRadius: 14, padding: "12px 16px", marginBottom: 10 }}>
                    {u.status === "failed" ? <span style={{ fontSize: 18 }}>⚠️</span> : <Loader2 size={18} color="#B45309" className="mn-spin" style={{ border: "none" }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 700 }}>
                        <span>{u.title}</span>
                        <span style={{ color: "#B45309" }}>
                          {u.status === "uploading" ? `${u.pct}%` : u.status === "processing" ? "Processing on Mux…" : "Failed"}
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 99, background: "#F3E5C3", marginTop: 7, overflow: "hidden" }}>
                        <div style={{ width: `${u.pct}%`, height: "100%", background: u.status === "failed" ? "#EF4444" : G.orange, transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                    {u.status === "failed" && (
                      <button className="cs-icon-btn danger" onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))}><Trash2 size={15} /></button>
                    )}
                  </div>
                ))}

                {/* Lessons */}
                {videos.length === 0 && uploads.length === 0 ? null : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    {videos.map((v, i) => {
                      const ready = !!v.playback_url;
                      return (
                        <div key={v.id || i} className="cs-lesson-row">
                          <span style={{ width: 30, height: 30, borderRadius: "50%", background: G.orange, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
                            {v.order || i + 1}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 800, fontSize: 14.5 }}>{v.title}</span>
                              <Badge color={ready ? "#16A34A" : "#B45309"}>{ready ? "Ready" : "Processing"}</Badge>
                            </div>
                            <div style={{ color: colors.typography.secondaryText, fontSize: 12.5, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {fmtDur(v.duration) ? `${fmtDur(v.duration)} · ` : ""}{v.description || "No description"}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            <button className="cs-icon-btn" title="Preview" disabled={!ready} onClick={() => ready && setPreview(v)} style={{ opacity: ready ? 1 : 0.4 }}><PlayCircle size={16} /></button>
                            <button className="cs-icon-btn" title="Edit" onClick={() => startEditLesson(v)}><Pencil size={16} /></button>
                            <button className="cs-icon-btn danger" title="Delete" onClick={() => setDeleteLesson(v)}><Trash2 size={16} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Dropzone */}
                <div
                  className={`cs-dropzone ${dragOver ? "drag" : ""}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); startAdd(e.dataTransfer.files?.[0]); }}
                >
                  <Film size={30} color="#D69C3F" style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: "#92400E" }}>
                    Drop a video here or <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>click to upload</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#B45309", marginTop: 4 }}>Uploads directly to Mux · MP4, MOV, AVI · keeps working in background</div>
                </div>
                <input ref={fileRef} type="file" accept="video/*" hidden onChange={(e) => { startAdd(e.target.files?.[0]); e.target.value = ""; }} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ---------- Course create/edit modal ---------- */}
      <Modal open={!!courseModal} onClose={() => setCourseModal(null)} title={courseModal === "create" ? "New Course" : "Edit Course"} width={560}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>Course Title</label>
            <input style={inp} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Advanced Options Trading" />
            <div style={{ marginTop: 6 }}>
              <AiEnhance text={form.title} kind="title" tone="punchy" onUse={(t) => setForm((f) => ({ ...f, title: t }))} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Price (INR)</label>
              <input style={inp} inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d.]/g, "") })} placeholder="999" />
            </div>
            <div>
              <label style={lbl}>Level</label>
              <select style={inp} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Thumbnail</label>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 108, height: 68, borderRadius: 10, flexShrink: 0, background: form.thumbnail ? `url(${form.thumbnail}) center/cover` : "#F3F4F6", border: `1px solid ${colors.base.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {!form.thumbnail && <BookOpen size={20} color="#9CA3AF" />}
              </div>
              <GoldBtn ghost loading={thumbUploading} onClick={() => thumbRef.current?.click()}>
                <UploadCloud size={15} /> {form.thumbnail ? "Change" : "Upload"}
              </GoldBtn>
              <input ref={thumbRef} type="file" accept="image/*" hidden onChange={(e) => uploadImage(e.target.files?.[0], (url) => setForm((f) => ({ ...f, thumbnail: url })), setThumbUploading)} />
            </div>
          </div>

          <div>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, minHeight: 90, resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What will students learn? (5–200 characters)" />
            <div style={{ marginTop: 6 }}>
              <AiEnhance text={form.description} kind="description" tone="conversational" onUse={(t) => setForm((f) => ({ ...f, description: t }))} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <GoldBtn ghost onClick={() => setCourseModal(null)}>Cancel</GoldBtn>
            <GoldBtn loading={saving} onClick={saveCourse}>{courseModal === "create" ? "Create Course" : "Save Changes"}</GoldBtn>
          </div>
        </div>
      </Modal>

      {/* ---------- Lesson modal ---------- */}
      <Modal open={!!lessonModal} onClose={() => setLessonModal(null)} title={lessonModal?.mode === "edit" ? "Edit Lesson" : "New Lesson"} width={520}>
        {lessonModal?.mode === "add" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "9px 13px", marginBottom: 16, fontSize: 13, color: "#166534" }}>
            <Film size={15} /> {lessonModal.file?.name} · {(lessonModal.file?.size / (1024 * 1024)).toFixed(1)} MB
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Lesson Title</label>
            <input style={inp} value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, alignItems: "end" }}>
            <div>
              <label style={lbl}>Order</label>
              <input style={inp} inputMode="numeric" value={lessonForm.order} onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value.replace(/\D/g, "") })} />
            </div>
            <div>
              <label style={lbl}>Lesson Thumbnail (optional)</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {lessonForm.thumbnail_url && <img src={lessonForm.thumbnail_url} alt="" style={{ width: 62, height: 40, borderRadius: 8, objectFit: "cover" }} />}
                <GoldBtn ghost style={{ padding: "8px 14px" }} onClick={() => lessonThumbRef.current?.click()}><UploadCloud size={14} /> {lessonForm.thumbnail_url ? "Change" : "Upload"}</GoldBtn>
                <input ref={lessonThumbRef} type="file" accept="image/*" hidden onChange={(e) => uploadImage(e.target.files?.[0], (url) => setLessonForm((f) => ({ ...f, thumbnail_url: url })), () => {})} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <GoldBtn ghost onClick={() => setLessonModal(null)}>Cancel</GoldBtn>
            <GoldBtn loading={lessonSaving} onClick={submitLesson}>
              {lessonModal?.mode === "edit" ? "Save Changes" : <><UploadCloud size={15} /> Start Upload</>}
            </GoldBtn>
          </div>
        </div>
      </Modal>

      {/* ---------- Preview modal ---------- */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title || "Preview"} width={760}>
        {preview && <HlsVideo src={preview.playback_url} poster={preview.thumbnail_url} autoPlay style={{ aspectRatio: "16/9" }} />}
      </Modal>

      {/* ---------- Delete confirms ---------- */}
      <Modal open={!!deleteCourse} onClose={() => setDeleteCourse(null)} title="Delete course?" width={420}>
        <p style={{ color: colors.typography.secondaryText, fontSize: 14, marginTop: 0 }}>
          "<b>{deleteCourse?.title}</b>" and its lessons will be permanently deleted. Enrolled students will lose access.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <GoldBtn ghost onClick={() => setDeleteCourse(null)}>Cancel</GoldBtn>
          <GoldBtn danger onClick={confirmDeleteCourse}><Trash2 size={15} /> Delete</GoldBtn>
        </div>
      </Modal>

      <Modal open={!!deleteLesson} onClose={() => setDeleteLesson(null)} title="Delete lesson?" width={400}>
        <p style={{ color: colors.typography.secondaryText, fontSize: 14, marginTop: 0 }}>
          "<b>{deleteLesson?.title}</b>" will be removed from this course.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <GoldBtn ghost onClick={() => setDeleteLesson(null)}>Cancel</GoldBtn>
          <GoldBtn danger onClick={confirmDeleteLesson}><Trash2 size={15} /> Delete</GoldBtn>
        </div>
      </Modal>
    </div>
  );
}
