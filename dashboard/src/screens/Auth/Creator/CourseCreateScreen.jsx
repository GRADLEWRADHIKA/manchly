import { useState, useEffect } from "react";
import { FileText, Video as VideoIcon, Eye, Sparkles } from "lucide-react";
import { apiFetch, unwrap } from "../../../utils/api";
import colors from "../../../utils/colors";
import Sidebar from "../../../components/Sidebar";
import TopHeader from "../../../components/TopHeader";
import Breadcrumbs from "./components/Breadcrumbs";
import Stepper from "./components/Stepper";
import ThumbnailDropzone from "./components/ThumbnailDropZone";
import AccessOptionCard from "./components/AccessOptionCard";

const WIZARD_STEPS = [
  { key: "course-details", label: "Course Details", icon: FileText },
  { key: "video", label: "Video", icon: VideoIcon },
  { key: "preview", label: "Preview", icon: Eye },
];

const UNIT_MAP = {
  days: "DAY",
  months: "MONTH",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  status: "DRAFT",
  level: "Beginner",
  price: "",
  category: "General",
  language: "English",
};

export default function CourseCreateScreen({ user, onNavigate, courseId: propCourseId }) {
  const [resolvedCourseId] = useState(() => {
    const clean =
      typeof propCourseId === "object"
        ? propCourseId?.id || propCourseId?.courseId
        : propCourseId;
    return (
      clean ||
      (typeof localStorage !== "undefined" ? localStorage.getItem("activeCourseId") : "") ||
      ""
    );
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Course Validity state
  const [accessType, setAccessType] = useState("lifetime");
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState("days");

  const [whatsappCommunityUrl, setWhatsappCommunityUrl] = useState("");
  const [thankyouMessage, setThankyouMessage] = useState("");

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleThumbnailSelect = (file) => {
    setThumbnailFile(file);
    setThumbnailPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleEnhance = (field) => {
    console.log(`Enhance ${field} — feature placeholder`);
  };

  const uploadThumbnail = async () => {
    if (!thumbnailFile) return null;
    try {
      const formData = new FormData();
      formData.append("file", thumbnailFile);
      const response = await apiFetch("/upload", { method: "POST", body: formData });
      const unwrapped = unwrap ? unwrap(response) : response;
      return unwrapped?.url || unwrapped?.file_url || unwrapped?.path || response?.url || null;
    } catch (err) {
      console.warn("Thumbnail upload warning:", err);
      return null;
    }
  };

  useEffect(() => {
    if (!resolvedCourseId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/courses/${resolvedCourseId}`);
        const data = unwrap ? unwrap(response) : response;
        const course = data?.course || data;
        if (course) {
          setForm({
            title: course.title || "",
            description: course.description || "",
            status: course.status || "DRAFT",
            level: course.level || "Beginner",
            price: course.price != null ? String(course.price) : "",
            category: course.category || "General",
            language: course.language || "English",
          });
          setThumbnailPreviewUrl(course.thumbnail_url || null);
          if (course.access_duration_days) {
            setAccessType("limited");
            setDurationValue(course.access_duration_days);
            setDurationUnit(course.access_duration_unit === "MONTH" ? "months" : "days");
          } else {
            setAccessType("lifetime");
          }
          setWhatsappCommunityUrl(course.whatsapp_community_url || "");
          setThankyouMessage(course.thankyou_message || "");
        }
      } catch (err) {
        console.error("Failed to load existing course:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [resolvedCourseId]);

  const handleStepClick = (index) => {
    if (index === 0) return;

    const courseId = resolvedCourseId;

    if (!courseId) {
      setError("Please fill out the details and click 'Save & Continue' to create your course draft first.");
      return;
    }

    if (index === 1) {
      onNavigate?.("course-create-video", { courseId });
    } else if (index === 2) {
      onNavigate?.("course-create-preview", { courseId });
    }
  };

  const handleSaveAndContinue = async () => {
    const method = resolvedCourseId ? "PUT" : "POST";
    const url = resolvedCourseId ? `/courses/${resolvedCourseId}` : "/courses";

    if (!form.title.trim()) return setError("Give your course a title before continuing.");
    setSaving(true);
    setError("");

    try {
      const thumbnailUrl = await uploadThumbnail();

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || "No description provided.",
        status: (form.status || "DRAFT").toUpperCase(),
        level: form.level || "Beginner",
        price: form.price === "" ? 0 : Number(form.price),
        category: form.category || "General",
        language: form.language || "English",
        ...(thumbnailUrl && { thumbnail_url: thumbnailUrl }),
        access_duration_days: accessType === "limited" ? Number(durationValue) : null,
        access_duration_unit: accessType === "limited" ? (UNIT_MAP[durationUnit] || null) : null,
        whatsapp_community_url: whatsappCommunityUrl.trim() || null,
        thankyou_message: thankyouMessage.trim() || null,
      };

      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = unwrap ? unwrap(response) : response;

      const courseId =
        data?._id ||
        data?.id ||
        data?.courseId ||
        data?.course?._id ||
        data?.course?.id ||
        data?.data?._id ||
        data?.data?.id ||
        data?.data?.courseId ||
        response?._id ||
        response?.id;

      if (!courseId) {
        console.error("Unrecognized API response structure:", response);
        throw new Error("Course created, but failed to retrieve the new Course ID.");
      }

      if (typeof localStorage !== "undefined") {
        localStorage.setItem("activeCourseId", String(courseId));
      }

      onNavigate?.("course-create-video", { courseId: String(courseId) });
    } catch (err) {
      console.error("Failed to save course:", err);
      setError(err?.message || "Something went wrong creating the course. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar active="courses" onNavigate={onNavigate} onLogout={() => console.log("logout")} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: colors.typography.secondaryText }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active="courses" onNavigate={onNavigate} onLogout={() => console.log("logout")} />

      <div style={{ flex: 1, minWidth: 0, background: colors.base.appBackground, padding: 32 }}>
        <TopHeader totalRevenue={0} walletBalance={0} hasUnreadNotifications={false} onWithdraw={() => {}} onNotifications={() => {}} />

        <Breadcrumbs items={[{ label: "Courses", active: false }, { label: "New Course", active: true }]} />

        <h1 style={{ margin: "4px 0 4px", fontSize: 24, fontWeight: 700, color: colors.typography.primaryText }}>
          Create New Course
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: colors.typography.secondaryText }}>
          Provide the basic details to set up your course.
        </p>

        <Stepper steps={WIZARD_STEPS} activeIndex={0} onStepClick={handleStepClick} />

        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${colors.base.border}`, padding: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Left Column - Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={labelStyle}>Course Title *</label>
                  <EnhanceBadge onClick={() => handleEnhance("title")} />
                </div>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. Masterclass in Technical Trading"
                  style={inputStyle}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={labelStyle}>Course Description</label>
                  <EnhanceBadge onClick={() => handleEnhance("description")} />
                </div>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe what your course is about..."
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={(e) => updateField("status", e.target.value)} style={inputStyle}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Level</label>
                  <select value={form.level} onChange={(e) => updateField("level", e.target.value)} style={inputStyle}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Price (INR)</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="e.g. 499"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Right Column - Thumbnail */}
            <ThumbnailDropzone previewUrl={thumbnailPreviewUrl} onFileSelect={handleThumbnailSelect} />
          </div>

          {/* Course Validity Section */}
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.typography.primaryText, marginBottom: 14 }}>
              Course Validity
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <AccessOptionCard
                label="Lifetime Access"
                description="Student will have access forever"
                selected={accessType === "lifetime"}
                onSelect={() => setAccessType("lifetime")}
              />
              <AccessOptionCard
                label="Limited Access"
                description="Access to the course will be removed after a set time"
                selected={accessType === "limited"}
                onSelect={() => setAccessType("limited")}
              />
            </div>

            {accessType === "limited" && (
              <div style={{ marginTop: 20 }}>
                <label style={labelStyle}>Selection duration</label>
                <div style={{ display: "flex", gap: 12 }}>
                  <input
                    type="number"
                    min="1"
                    value={durationValue}
                    onChange={(e) => setDurationValue(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                <div style={{ fontSize: 12, color: colors.typography.secondaryText, marginTop: 6 }}>
                  Access to this course will be removed {durationValue} {durationUnit === "days" ? "Day" : "Month"}
                  {Number(durationValue) > 1 ? "s" : ""} from the date of purchase.
                </div>
              </div>
            )}
          </div>

          {/* Community & Thank-you Section */}
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.typography.primaryText, marginBottom: 4 }}>
              💬 Community &amp; Thank-you
            </h3>
            <p style={{ fontSize: 13, color: colors.typography.secondaryText, marginBottom: 16 }}>
              Shown to buyers on the thank-you screen after purchase.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>WhatsApp Community Link</label>
              <input
                type="text"
                value={whatsappCommunityUrl}
                onChange={(e) => setWhatsappCommunityUrl(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Thank-you Message (optional)</label>
              <textarea
                value={thankyouMessage}
                onChange={(e) => setThankyouMessage(e.target.value)}
                placeholder="A short note buyers see after purchase"
                rows={3}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {error && <div style={{ color: "#DC2626", fontSize: 13, marginTop: 20, fontWeight: 600 }}>{error}</div>}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            <button
              type="button"
              onClick={() => onNavigate?.("courses")}
              style={{
                flex: 1,
                background: "#fff",
                color: colors.brand.primaryOrange,
                border: `1px solid ${colors.base.border}`,
                borderRadius: 10,
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={saving}
              style={{
                flex: 1,
                background: colors.brand.primaryOrange,
                color: colors.typography.white,
                border: "none",
                borderRadius: 10,
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 700,
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving Course..." : "Save & Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnhanceBadge({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: colors.brand.noticeBlue,
        border: "none",
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
        color: colors.brand.actionBlue,
        cursor: "pointer",
      }}
    >
      <Sparkles size={11} /> Enhance
    </button>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: colors.typography.secondaryText,
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${colors.base.border}`,
  fontSize: 14,
  color: colors.typography.primaryText,
  boxSizing: "border-box",
};