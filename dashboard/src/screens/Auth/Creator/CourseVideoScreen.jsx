import { useState, useEffect } from "react";
import {
  FileText,
  Video as VideoIcon,
  Eye,
  Trash2,
  Plus,
  ArrowLeft,
  Upload,
} from "lucide-react";
import { apiFetch, unwrap } from "../../../utils/api";
import colors from "../../../utils/colors";
import Sidebar from "../../../components/Sidebar";
import TopHeader from "../../../components/TopHeader";
import Breadcrumbs from "./components/Breadcrumbs";
import Stepper from "./components/Stepper";

const WIZARD_STEPS = [
  { key: "course-details", label: "Course Details", icon: FileText },
  { key: "video", label: "Video", icon: VideoIcon },
  { key: "preview", label: "Preview", icon: Eye },
];

export default function CourseCVideoScreen({
  user,
  onNavigate,
  courseId: propCourseId,
}) {
  const [resolvedCourseId] = useState(() => {
    const clean =
      typeof propCourseId === "object"
        ? propCourseId?.id || propCourseId?._id || propCourseId?.courseId
        : propCourseId;
    return (
      clean ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("activeCourseId")
        : "") ||
      ""
    );
  });

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!resolvedCourseId) return;

    const loadCourseVideos = async () => {
      setFetching(true);
      try {
        const res = await apiFetch(`/courses/${resolvedCourseId}`);
        const data = unwrap ? unwrap(res) : res;
        if (data?.videos && Array.isArray(data.videos)) {
          setVideos(data.videos);
        }
      } catch (err) {
        console.error("Failed to load course videos:", err);
      } finally {
        setFetching(false);
      }
    };

    loadCourseVideos();
  }, [resolvedCourseId]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const handleAddVideo = async () => {
    if (!lessonTitle.trim()) {
      return setError("Please provide a title for this lesson.");
    }
    if (!selectedFile) {
      return setError("Please select a video file.");
    }

    const cleanCourseId =
      resolvedCourseId ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("activeCourseId")
        : "");

    if (!cleanCourseId) {
      return setError(
        "Course ID missing. Please go back to Step 1 and save the course details.",
      );
    }

    setUploading(true);
    setError("");

    try {
      const createPayload = {
        title: lessonTitle.trim(),
        description: lessonDescription.trim() || "Lesson video",
        order: Number(videos.length + 1),
        is_free: Boolean(isFree),
      };

      const createRes = await apiFetch(`/courses/${cleanCourseId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });
      const created = unwrap ? unwrap(createRes) : createRes;

      const uploadUrl = created?.upload_url || created?.uploadUrl;
      const videoId = created?.video?.id || created?.video_id || created?.id;

      if (!uploadUrl) throw new Error("Server didn't return an upload URL.");

      const muxRes = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
      });
      if (!muxRes.ok)
        throw new Error(`Video upload failed with status ${muxRes.status}`);

      setVideos((prev) => [
        ...prev,
        {
          id: videoId || Date.now(),
          title: lessonTitle.trim(),
          description: lessonDescription.trim(),
          order: createPayload.order,
          is_free: isFree,
          status: "processing",
        },
      ]);

      setLessonTitle("");
      setLessonDescription("");
      setIsFree(false);
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to add video:", err);
      setError(
        err?.message ||
          "Failed to upload video. Please check your connection and try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId, index) => {
    try {
      if (
        videoId &&
        typeof videoId === "string" &&
        !videoId.toString().startsWith("17")
      ) {
        await apiFetch(`/courses/videos/${videoId}`, { method: "DELETE" });
      }
      setVideos((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Failed to delete video:", err);
      setError("Failed to delete video lesson.");
    }
  };

  const handleStepClick = (index) => {
    if (index === 1) return;

    if (index === 0) {
      onNavigate?.("course-create", { courseId: resolvedCourseId });
    } else if (index === 2) {
      if (videos.length === 0) {
        setError("Please add at least one video lesson before proceeding to preview.");
        return;
      }
      onNavigate?.("course-create-preview", { courseId: resolvedCourseId });
    }
  };

  const handleContinue = () => {
    if (videos.length === 0) {
      return setError(
        "Please add at least one video lesson before proceeding to preview.",
      );
    }
    onNavigate?.("course-create-preview", { courseId: resolvedCourseId });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        active="courses"
        onNavigate={onNavigate}
        onLogout={() => console.log("logout")}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: colors.base.appBackground,
          padding: 32,
        }}
      >
        <TopHeader
          totalRevenue={0}
          walletBalance={0}
          hasUnreadNotifications={false}
          onWithdraw={() => {}}
          onNotifications={() => {}}
        />

        <Breadcrumbs
          items={[
            { label: "Courses", active: false },
            { label: "Upload Content", active: true },
          ]}
        />

        <h1
          style={{
            margin: "4px 0 4px",
            fontSize: 24,
            fontWeight: 700,
            color: colors.typography.primaryText,
          }}
        >
          Add Video Lessons
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 14,
            color: colors.typography.secondaryText,
          }}
        >
          Upload and manage video lessons for your course.
        </p>

        <Stepper 
          steps={WIZARD_STEPS} 
          activeIndex={1} 
          onStepClick={handleStepClick} 
        />

        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: `1px solid ${colors.base.border}`,
            padding: 32,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}
          >
            {/* Left Form - Video Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: colors.typography.primaryText,
                  margin: 0,
                }}
              >
                Lesson Details
              </h3>

              <div>
                <label style={labelStyle}>Lesson Title *</label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g. Introduction to Module 1"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description (Optional)</label>
                <textarea
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  placeholder="Brief summary of what this video covers..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Video File *</label>
                <div
                  style={{
                    position: "relative",
                    border: `2px dashed ${colors.base.border}`,
                    borderRadius: 10,
                    padding: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "#FAFBFD",
                  }}
                >
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                  <Upload
                    size={24}
                    style={{
                      color: colors.brand.primaryOrange,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: colors.typography.primaryText,
                    }}
                  >
                    {selectedFile
                      ? selectedFile.name
                      : "Click or drag video file to upload"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: colors.typography.secondaryText,
                      marginTop: 4,
                    }}
                  >
                    MP4, MOV, or WEBM
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
                onClick={() => setIsFree(!isFree)}
              >
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.typography.primaryText,
                  }}
                >
                  Mark as Free Preview
                </span>
              </div>

              {error && (
                <div style={{ color: "red", fontSize: 13, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddVideo}
                disabled={uploading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: colors.brand.primaryOrange,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 0",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: uploading ? "default" : "pointer",
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                <Plus size={16} />
                {uploading ? "Uploading & Saving..." : "Add Lesson"}
              </button>
            </div>

            {/* Right Column - Lessons Playlist */}
            <div
              style={{
                borderLeft: `1px solid ${colors.base.border}`,
                paddingLeft: 32,
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: colors.typography.primaryText,
                  margin: "0 0 16px",
                }}
              >
                Course Lessons ({videos.length})
              </h3>

              {fetching ? (
                <div
                  style={{
                    fontSize: 13,
                    color: colors.typography.secondaryText,
                  }}
                >
                  Loading lessons...
                </div>
              ) : videos.length === 0 ? (
                <div
                  style={{
                    border: `1px dashed ${colors.base.border}`,
                    borderRadius: 10,
                    padding: 24,
                    textAlign: "center",
                    color: colors.typography.secondaryText,
                    fontSize: 13,
                  }}
                >
                  No lessons added yet. Fill out the details on the left to add
                  your first video.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    maxHeight: 400,
                    overflowY: "auto",
                  }}
                >
                  {videos.map((vid, index) => (
                    <div
                      key={vid.id || index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 12,
                        border: `1px solid ${colors.base.border}`,
                        borderRadius: 8,
                        background: "#FAFAFA",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: colors.brand.noticeBlue,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: colors.brand.actionBlue,
                          }}
                        >
                          {index + 1}
                        </div>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: colors.typography.primaryText,
                            }}
                          >
                            {vid.title || vid.name || `Lesson ${index + 1}`}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: colors.typography.secondaryText,
                            }}
                          >
                            {vid.is_free ? "Free Preview" : "Paid Lesson"}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(vid.id, index)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#DC2626",
                          cursor: "pointer",
                          padding: 4,
                        }}
                        title="Delete Lesson"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 32,
              paddingTop: 24,
              borderTop: `1px solid ${colors.base.border}`,
            }}
          >
            <button
              type="button"
              onClick={() =>
                onNavigate?.("course-create", { courseId: resolvedCourseId })
              }
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "#fff",
                color: colors.typography.primaryText,
                border: `1px solid ${colors.base.border}`,
                borderRadius: 10,
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>

            <button
              type="button"
              onClick={handleContinue}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: colors.brand.primaryOrange,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Save & Continue to Preview
            </button>
          </div>
        </div>
      </div>
    </div>
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