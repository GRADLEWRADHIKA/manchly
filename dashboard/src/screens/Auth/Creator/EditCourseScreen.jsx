import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Pencil,
  UploadCloud,
  Trash2,
  Save,
  Loader2,
  Clock,
  CheckCircle2,
  MessageCircle,
  Users,
  IndianRupee,
  RotateCcw,
  PlayCircle,
  Activity,
  X,
  Video,
  AlertTriangle,
  //Sparkles,
  Rocket,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import colors from "../../../utils/colors";
import { apiFetch, unwrap } from "../../../utils/api";
import { toast } from "../../../utils/toast";
import { AiEnhance } from "../../../components/creatorUi";

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED"];
const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const DESCRIPTION_MAX = 500;
const THANKYOU_MAX = 300;

const DURATION_UNIT_OPTIONS = ["days", "weeks", "months", "years"];

const VIDEO_STATUS_STYLES = {
  READY: { label: "Published", bg: "rgba(34,197,94,0.1)", color: "#16A34A" },
  PROCESSING: {
    label: "Processing",
    bg: "rgba(59,130,246,0.1)",
    color: "#2563EB",
  },
  UPLOADING: {
    label: "Uploading",
    bg: "rgba(255,107,0,0.1)",
    color: "#C05200",
  },
  QUEUED: { label: "Queued", bg: "rgba(0,0,0,0.05)", color: "#64748B" },
  ERROR: { label: "Error", bg: "rgba(239,68,68,0.1)", color: "#EF4444" },
};

function fmtDuration(seconds) {
  if (seconds == null) return "--";
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function EditCourseScreen({ user, onNavigate, onLogout }) {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "DRAFT",
    level: "Beginner",
    price: 0,
    thumbnail: "",
    accessType: "lifetime", // "lifetime" | "limited"
    accessDurationDays: "",
    accessDurationUnit: "days",
    whatsappUrl: "",
    thankYouMessage: "",
  });

  const [videos, setVideos] = useState([]);
  const videoFileRef = useRef(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [editVideo, setEditVideo] = useState(null);
  const [deleteVideo, setDeleteVideo] = useState(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

  const fileInputRef = useRef(null);

  const loadCourse = () => {
    setLoading(true);
    setLoadError("");
    apiFetch(`/courses/${courseId}`)
      .then((res) => {
        const data = unwrap(res);
        const c = data?.course || data;
        if (!c?.id) throw new Error("Course not found.");
        setCourse(c);
        setVideos(Array.isArray(c.videos) ? c.videos : []);
        setForm({
          title: c.title || "",
          description: c.description || "",
          status: (c.status || "DRAFT").toUpperCase(),
          level: c.level || "Beginner",
          price: c.price ?? 0,
          thumbnail: c.thumbnail_url || c.thumbnail || "",
          accessType: c.access_duration_days ? "limited" : "lifetime",
          accessDurationDays: c.access_duration_days ?? "",
          accessDurationUnit: c.access_duration_unit || "days",
          whatsappUrl: c.whatsapp_community_url || "",
          thankYouMessage: c.thankyou_message || "",
        });
      })
      .catch((err) => setLoadError(err?.message || "Failed to load course."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({ ...f, thumbnail: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveThumbnail = () => {
    setForm((f) => ({ ...f, thumbnail: "" }));
  };

  const handleUploadVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingVideo(true);
    try {
      const initRes = await apiFetch(`/courses/${courseId}/videos`, {
        method: "POST",
        body: JSON.stringify({
          title: file.name,
          is_free: false,
          order: videos.length + 1,
        }),
      });
      const initData = unwrap(initRes);
      const { video, upload_url } = initData?.data || initData;
      if (!upload_url) throw new Error("Server did not return an upload URL.");

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url, true);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.send(file);
      });

      setVideos((prev) => [
        ...prev,
        { ...video, status: video?.status || "PROCESSING" },
      ]);
      toast.success("Video uploaded — processing started.");
    } catch (err) {
      toast.error(err?.message || "Video upload failed.");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveVideo = async (updated) => {
    try {
      await apiFetch(`/courses/videos/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: updated.title,
          description: updated.description,
          is_free: updated.is_free,
        }),
      });
      setVideos((prev) =>
        prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)),
      );
      toast.success("Video updated.");
      setEditVideo(null);
    } catch (err) {
      toast.error(err?.message || "Could not update video.");
    }
  };

  const handleConfirmDeleteVideo = async () => {
    if (!deleteVideo) return;
    setDeletingVideo(true);
    try {
      await apiFetch(`/courses/videos/${deleteVideo.id}`, { method: "DELETE" });
      setVideos((prev) => prev.filter((v) => v.id !== deleteVideo.id));
      toast.success("Video deleted.");
    } catch (err) {
      toast.error(err?.message || "Could not delete video.");
    } finally {
      setDeletingVideo(false);
      setDeleteVideo(null);
    }
  };

  const handleBack = () => onNavigate?.("courses");

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Course title is required.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Course description is required.");
      return;
    }
    if (form.accessType === "limited" && !Number(form.accessDurationDays)) {
      toast.error("Enter a valid duration for Limited Access.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(`/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          status: form.status,
          level: form.level,
          price: Number(form.price) || 0,
          thumbnail: form.thumbnail,
          thumbnail_url: form.thumbnail,
          access_duration_days:
            form.accessType === "limited"
              ? Number(form.accessDurationDays)
              : null,
          access_duration_unit:
            form.accessType === "limited" ? form.accessDurationUnit : null,
          whatsapp_community_url: form.whatsappUrl.trim() || null,
          thankyou_message: form.thankYouMessage.trim() || null,
        }),
      });
      const saved = unwrap(res)?.course;
      setCourse((prev) => ({ ...prev, ...(saved || form) }));
      toast.success("Course updated.");
    } catch (err) {
      toast.error(err?.message || "Could not save course.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenShell user={user} onNavigate={onNavigate} onLogout={onLogout}>
        <p style={{ color: colors.typography.secondaryText }}>
          Loading course…
        </p>
      </ScreenShell>
    );
  }

  if (loadError) {
    return (
      <ScreenShell user={user} onNavigate={onNavigate} onLogout={onLogout}>
        <p style={{ color: "red" }}>{loadError}</p>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell user={user} onNavigate={onNavigate} onLogout={onLogout}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button type="button" onClick={handleBack} style={backButtonStyle}>
            <ArrowLeft size={18} color={colors.typography.primaryText} />
          </button>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: colors.typography.primaryText,
              }}
            >
              Edit Course
            </h1>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 13,
                color: colors.typography.secondaryText,
              }}
            >
              Update your course details, manage videos and track performance.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              ...primaryButtonStyle,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Details + Thumbnail */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 20,
          alignItems: "start",
          marginBottom: 20,
        }}
      >
        {/* Course Details */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <Pencil
              size={16}
              color={colors.brand?.primaryOrange || "#FF6B00"}
            />
            <span style={sectionTitleStyle}>Course Details</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <label style={labelStyle}>
                  Course Title <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <AiEnhance
                  endpoint="/ai/course/enhance"
                  text={form.title}
                  kind="title"
                  tone="warm"
                  onUse={(t) => setForm((f) => ({ ...f, title: t }))}
                />
              </div>
              <input
                type="text"
                value={form.title}
                onChange={set("title")}
                style={inputStyle}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <label style={labelStyle}>
                  Course Description <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <AiEnhance
                  endpoint="/ai/course/enhance"
                  text={form.description}
                  kind="description"
                  tone="warm"
                  onUse={(t) => setForm((f) => ({ ...f, description: t }))}
                />
              </div>
              <textarea
                value={form.description}
                onChange={(e) => {
                  if (e.target.value.length <= DESCRIPTION_MAX) {
                    setForm((f) => ({ ...f, description: e.target.value }));
                  }
                }}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
              <div
                style={{
                  textAlign: "right",
                  fontSize: 11,
                  color: colors.typography.secondaryText,
                  marginTop: 4,
                }}
              >
                {form.description.length}/{DESCRIPTION_MAX}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 14,
              }}
            >
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={form.status}
                  onChange={set("status")}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Level</label>
                <select
                  value={form.level}
                  onChange={set("level")}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  {LEVEL_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Price (INR)</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={set("price")}
                  style={{ ...inputStyle, marginTop: 6 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Course Thumbnail */}
        <div style={cardStyle}>
          <span style={sectionTitleStyle}>Course Thumbnail</span>

          <div
            style={{
              marginTop: 14,
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: 14,
              overflow: "hidden",
              background: "#F1F5F9",
              backgroundImage: form.thumbnail
                ? `url(${form.thumbnail})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: `1px solid ${colors.base.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={editBadgeStyle}
              title="Edit thumbnail"
            >
              <Pencil size={13} />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImagePick}
            style={{ display: "none" }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={outlineButtonStyle}
            >
              <UploadCloud size={14} /> Change Image
            </button>
            <button
              type="button"
              onClick={handleRemoveThumbnail}
              disabled={!form.thumbnail}
              style={{
                ...outlineButtonStyle,
                color: "#EF4444",
                borderColor: "#FCA5A5",
                opacity: form.thumbnail ? 1 : 0.5,
                cursor: form.thumbnail ? "pointer" : "not-allowed",
              }}
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>

          <p
            style={{
              fontSize: 11.5,
              color: colors.typography.secondaryText,
              marginTop: 10,
            }}
          >
            Recommended size: 1280 × 720 (16:9)
            <br />
            JPG, PNG (Max 5MB)
          </p>
        </div>
      </div>

      {/* Course Validity + Community & Thank-you */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        {/* Course Validity */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Clock size={16} color={colors.brand?.primaryOrange || "#FF6B00"} />
            <span style={sectionTitleStyle}>Course Validity</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ValidityOption
              selected={form.accessType === "lifetime"}
              title="Lifetime Access"
              subtitle="Student will have access forever"
              onClick={() => setForm((f) => ({ ...f, accessType: "lifetime" }))}
            />
            <ValidityOption
              selected={form.accessType === "limited"}
              title="Limited Access"
              subtitle="Access to the course will be removed after a set time"
              onClick={() => setForm((f) => ({ ...f, accessType: "limited" }))}
            />

            {form.accessType === "limited" && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 4,
                  paddingLeft: 4,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Duration</label>
                  <input
                    type="number"
                    min="1"
                    value={form.accessDurationDays}
                    onChange={set("accessDurationDays")}
                    placeholder="e.g. 30"
                    style={{ ...inputStyle, marginTop: 6 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Unit</label>
                  <select
                    value={form.accessDurationUnit}
                    onChange={set("accessDurationUnit")}
                    style={{ ...inputStyle, marginTop: 6 }}
                  >
                    {DURATION_UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u.charAt(0).toUpperCase() + u.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Community & Thank-you */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <MessageCircle
              size={16}
              color={colors.brand?.primaryOrange || "#FF6B00"}
            />
            <span style={sectionTitleStyle}>Community & Thank-you</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>WhatsApp Community Link</label>
              <input
                type="text"
                value={form.whatsappUrl}
                onChange={set("whatsappUrl")}
                placeholder="https://chat.whatsapp.com/..."
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </div>

            <div>
              <label style={labelStyle}>Thank-you Message (Optional)</label>
              <textarea
                value={form.thankYouMessage}
                onChange={(e) => {
                  if (e.target.value.length <= THANKYOU_MAX) {
                    setForm((f) => ({ ...f, thankYouMessage: e.target.value }));
                  }
                }}
                rows={3}
                placeholder="A short note buyers see after purchase"
                style={{ ...inputStyle, marginTop: 6, resize: "vertical" }}
              />
              <div
                style={{
                  textAlign: "right",
                  fontSize: 11,
                  color: colors.typography.secondaryText,
                  marginTop: 4,
                }}
              >
                {form.thankYouMessage.length}/{THANKYOU_MAX}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Performance */}
      <div style={{ ...cardStyle, marginTop: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Activity
            size={16}
            color={colors.brand?.primaryOrange || "#FF6B00"}
          />
          <span style={sectionTitleStyle}>Course Performance</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <PerfStat
            icon={<IndianRupee size={16} color="#16A34A" />}
            bg="rgba(34,197,94,0.08)"
            label="Revenue"
            value="--"
          />
          <PerfStat
            icon={<Users size={16} color="#2563EB" />}
            bg="rgba(59,130,246,0.08)"
            label="Users"
            value={course?.total_students ?? 0}
          />
        </div>
      </div>

      {/* Course Videos */}
      <div style={{ ...cardStyle, marginTop: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlayCircle
              size={16}
              color={colors.brand?.primaryOrange || "#FF6B00"}
            />
            <span style={sectionTitleStyle}>
              Course Videos ({videos.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => videoFileRef.current?.click()}
            disabled={uploadingVideo}
            style={{ ...primaryButtonStyle, opacity: uploadingVideo ? 0.7 : 1 }}
          >
            {uploadingVideo ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UploadCloud size={14} />
            )}
            {uploadingVideo ? "Uploading…" : "Upload New Video"}
          </button>
          <input
            ref={videoFileRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={handleUploadVideo}
          />
        </div>

        {videos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px 0",
              color: colors.typography.secondaryText,
            }}
          >
            <Video size={26} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>No videos yet.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {videos.map((v, i) => {
                const s =
                  VIDEO_STATUS_STYLES[v.status] ||
                  VIDEO_STATUS_STYLES.PROCESSING;
                return (
                  <tr
                    key={v.id}
                    style={{ borderBottom: `1px solid ${colors.base.border}` }}
                  >
                    <td style={{ padding: "10px 8px", fontSize: 13 }}>
                      {i + 1}
                    </td>
                    <td
                      style={{
                        padding: "10px 8px",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {v.title}
                    </td>
                    <td style={{ padding: "10px 8px", fontSize: 13 }}>
                      {fmtDuration(v.duration)}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span
                        style={{
                          background: s.bg,
                          color: s.color,
                          borderRadius: 20,
                          padding: "2px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          justifyContent: "flex-end",
                        }}
                      >
                        {v.playback_url ? (
                          <a
                            href={v.playback_url}
                            target="_blank"
                            rel="noreferrer"
                            style={circleIconBtnStyle}
                            title="Play"
                          >
                            <PlayCircle size={16} />
                          </a>
                        ) : (
                          <span
                            style={{
                              ...circleIconBtnStyle,
                              opacity: 0.4,
                              cursor: "default",
                            }}
                          >
                            <PlayCircle size={16} />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditVideo(v)}
                          style={circleIconBtnStyle}
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteVideo(v)}
                          style={{
                            ...circleIconBtnStyle,
                            color: "#EF4444",
                            borderColor: "#FCA5A5",
                          }}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editVideo && (
        <VideoEditModal
          video={editVideo}
          onClose={() => setEditVideo(null)}
          onSave={handleSaveVideo}
        />
      )}
      {deleteVideo && (
        <DeleteVideoConfirm
          video={deleteVideo}
          loading={deletingVideo}
          onCancel={() => setDeleteVideo(null)}
          onConfirm={handleConfirmDeleteVideo}
        />
      )}
    </ScreenShell>
  );
}

function ValidityOption({ selected, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1.5px solid ${selected ? colors.brand?.primaryOrange || "#FF6B00" : colors.base.border}`,
        background: selected
          ? "rgba(255,107,0,0.06)"
          : colors.base.cardBackground,
        cursor: "pointer",
      }}
    >
      <CheckCircle2
        size={18}
        color={
          selected
            ? colors.brand?.primaryOrange || "#FF6B00"
            : colors.base.border
        }
        style={{ flexShrink: 0, marginTop: 1 }}
        fill={selected ? colors.brand?.primaryOrange || "#FF6B00" : "none"}
      />
      <div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: colors.typography.primaryText,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: colors.typography.secondaryText,
            marginTop: 2,
          }}
        >
          {subtitle}
        </div>
      </div>
    </button>
  );
}

function PerfStat({ icon, bg, label, value }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: 14 }}>
      <div style={{ marginBottom: 6 }}>{icon}</div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: colors.typography.primaryText,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: colors.typography.secondaryText,
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function VideoEditModal({ video, onClose, onSave }) {
  const [title, setTitle] = useState(video.title || "");
  const [description, setDescription] = useState(video.description || "");
  const [isFree, setIsFree] = useState(!!video.is_free);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFF",
          borderRadius: 16,
          padding: 20,
          width: 380,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <span style={sectionTitleStyle}>Edit Video</span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <label style={labelStyle}>Title</label>
          <AiEnhance
            endpoint="/ai/course/enhance"
            text={title}
            kind="video_title"
            tone="warm"
            onUse={(t) => setTitle(t)}
          />
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <label style={labelStyle}>Description</label>
          <AiEnhance
            endpoint="/ai/course/enhance"
            text={description}
            kind="video_description"
            tone="warm"
            onUse={(t) => setDescription(t)}
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What does this video cover?"
          style={{ ...inputStyle, resize: "vertical", marginBottom: 12 }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
          />
          <span style={{ fontSize: 13, color: colors.typography.primaryText }}>
            Free Preview
          </span>
        </label>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 16,
          }}
        >
          <button onClick={onClose} style={outlineButtonStyle}>
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({ ...video, title, description, is_free: isFree })
            }
            style={primaryButtonStyle}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteVideoConfirm({ video, loading, onCancel, onConfirm }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFF",
          borderRadius: 16,
          padding: 20,
          width: 360,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <AlertTriangle size={18} color="#EF4444" />
          <span style={sectionTitleStyle}>Delete Video</span>
        </div>
        <p style={{ fontSize: 13, color: colors.typography.secondaryText }}>
          Delete "{video.title}"? This cannot be undone.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 16,
          }}
        >
          <button
            onClick={onCancel}
            disabled={loading}
            style={outlineButtonStyle}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ ...primaryButtonStyle, background: "#EF4444" }}
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScreenShell({ user, onNavigate, onLogout, children }) {
  return (
    <div
      style={{
        display: "flex",
        backgroundColor: colors.base.appBackground,
        minHeight: "100vh",
      }}
    >
      <Sidebar active="courses" onNavigate={onNavigate} onLogout={onLogout} />
      <div style={{ flex: 1, minWidth: 0, padding: 32 }}>{children}</div>
    </div>
  );
}

// ----- styles -----
const cardStyle = {
  background: colors.base.cardBackground,
  border: `1px solid ${colors.base.border}`,
  borderRadius: 18,
  padding: 22,
};

const sectionTitleStyle = {
  fontSize: 15,
  fontWeight: 800,
  color: colors.typography.primaryText,
};

const labelStyle = {
  fontSize: 12.5,
  fontWeight: 700,
  color: colors.typography.primaryText,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${colors.base.border}`,
  fontSize: 13,
  outline: "none",
  color: colors.typography.primaryText,
  background: "#FFF",
  fontFamily: "inherit",
};

const smallActionBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 10px",
  borderRadius: 8,
  border: `1px solid ${colors.base.border}`,
  background: colors.base.cardBackground,
  color: colors.typography.primaryText,
  fontSize: 11.5,
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
};

const backButtonStyle = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: `1px solid ${colors.base.border}`,
  background: colors.base.cardBackground,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const outlineButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 16px",
  borderRadius: 10,
  border: `1px solid ${colors.base.border}`,
  background: colors.base.cardBackground,
  color: colors.typography.primaryText,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 18px",
  borderRadius: 10,
  border: "none",
  background: colors.brand?.primaryOrange || "#FF6B00",
  color: "#FFF",
  fontSize: 13,
  fontWeight: 700,
};

const circleIconBtnStyle = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: `1px solid ${colors.base.border}`,
  background: colors.base.cardBackground,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: colors.typography.secondaryText,
  textDecoration: "none",
  flexShrink: 0,
};

const editBadgeStyle = {
  position: "absolute",
  top: 10,
  right: 10,
  width: 30,
  height: 30,
  borderRadius: 8,
  border: "none",
  background: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
};
