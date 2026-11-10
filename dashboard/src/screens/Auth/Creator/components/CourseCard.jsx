import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  Users,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Loader2,
  UserPlus,
  BarChart2,
  IndianRupee,
  RotateCcw,
  FileText,
  Link as LinkIcon,
  Clock,
} from "lucide-react";
import { createPortal } from "react-dom";
import colors from "../../../../utils/colors";
import { formatCurrency, timeAgo } from "../../../../utils/formatters";
import { apiFetch, unwrap } from "../../../../utils/api";
import { toast } from "../../../../utils/toast";

const ADD_USER_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADD_USER_PHONE_RE = /^\d{10}$/;

const PUBLIC_APP_URL = "https://manchly.com";

function Modal({ color, icon, title, width = 420, onClose, children }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2100,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: width,
          maxHeight: "85vh",
          background: "#FFFFFF",
          border: `1.5px solid ${color}`,
          borderRadius: 20,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "modalPop 0.15s ease-out forward",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.base.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {icon}
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: colors.typography.primaryText,
              }}
            >
              {title}
            </span>
          </div>
          <button type="button" onClick={onClose} style={smallIconButtonStyle}>
            <X size={16} color={colors.typography.secondaryText} />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function CourseCard({
  course,
  onEdit,
  onSave,
  onView,
  onDuplicate,
  onDelete,
  onAddUser,
  onEditVideos,
}) {
  const [displayCourse, setDisplayCourse] = useState(course);
  const [isHovered, setIsHovered] = useState(false);

  const [openModal, setOpenModal] = useState(null);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addUserValue, setAddUserValue] = useState("");
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);

  const [enrollments, setEnrollments] = useState(null);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState("");
  const [showEnrollments, setShowEnrollments] = useState(false);
  const [moreMenuPos, setMoreMenuPos] = useState(null);

  const moreButtonRef = useRef(null);
  const moreDropdownRef = useRef(null);

    useEffect(() => {
    setDisplayCourse(course);
  }, [course]);



  useEffect(() => {
    if (openModal !== "more") return;
    const handleClickOutside = (e) => {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(e.target) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target)
      ) {
        setOpenModal(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openModal]);

  const openModalFor = (name) => {
    setOpenModal(name);
  };

  useEffect(() => {
    if (openModal !== "more") return;
    const close = () => setOpenModal(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openModal]);

  const DROPDOWN_WIDTH = 230;
  const DROPDOWN_EST_HEIGHT = 260;

  const handleToggleMoreMenu = () => {
    if (openModal === "more") {
      setOpenModal(null);
      return;
    }
    const rect = moreButtonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward =
      spaceBelow < DROPDOWN_EST_HEIGHT && rect.top > DROPDOWN_EST_HEIGHT;

    const topPos = openUpward
      ? Math.max(10, rect.top - DROPDOWN_EST_HEIGHT - 6)
      : rect.bottom + 6;

    setMoreMenuPos({
      left: Math.max(10, rect.right - DROPDOWN_WIDTH),
      top: topPos,
    });
    setOpenModal("more");
  };

  const loadEnrollments = async () => {
    const id = displayCourse?.id || displayCourse?._id;
    if (!id) return;
    setEnrollmentsLoading(true);
    setEnrollmentsError("");
    try {
      const response = await apiFetch(`/courses/${id}/enrollments`);
      const data = unwrap(response);
      setEnrollments(data?.enrollments || data || []);
    } catch (err) {
      setEnrollmentsError(
        "Enrollment list isn't available yet — this needs a backend endpoint (GET /courses/:courseId/enrollments)."
      );
      setEnrollments([]);
    } finally {
      setEnrollmentsLoading(false);
    }
  };


  const trimmedAddUserValue = addUserValue.trim();
  const addUserIsEmail = ADD_USER_EMAIL_RE.test(trimmedAddUserValue);
  const addUserIsPhone = ADD_USER_PHONE_RE.test(trimmedAddUserValue);
  const addUserIsValid = addUserIsEmail || addUserIsPhone;

  const handleAddUserSubmit = async () => {
    if (!addUserIsValid || addUserSubmitting || !onAddUser) return;
    setAddUserSubmitting(true);
    try {
      await onAddUser(
        displayCourse,
        addUserIsEmail
          ? { email: trimmedAddUserValue }
          : { phone: trimmedAddUserValue }
      );
      setAddUserValue("");
      setIsAddUserModalOpen(false);
    } catch {
      // Parent toast error handler
    } finally {
      setAddUserSubmitting(false);
    }
  };


  const handleToggleDraft = () => {
    const nextStatus = isPublished ? "draft" : "published";
    const updatedCourse = {
      ...displayCourse,
      status: nextStatus,
      is_published: nextStatus === "published",
    };
    setDisplayCourse(updatedCourse);
    if (onSave) onSave(updatedCourse);
    setOpenModal(null);
  };

  const handleCopyLink = async () => {
    const id = displayCourse?.id || displayCourse?._id;
    const url = `${PUBLIC_APP_URL}/courses/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Course link copied to clipboard.");
    } catch {
      toast.error("Couldn't copy link. Copy manually: " + url);
    }
    setOpenModal(null);
  };

  const title =
    displayCourse?.title || displayCourse?.name || "Untitled course";
  const category = displayCourse?.category || displayCourse?.tags?.[0] || null;
  const isPublished =
    String(displayCourse?.status || "").toLowerCase() === "published" ||
    displayCourse?.is_published === true;
  const videos = displayCourse?.videos || [];
  const lessons =
    displayCourse?.lessons_count ??
    displayCourse?.total_lessons ??
    videos.length ??
    0;
  const students =
    displayCourse?.enrolled_count ??
    displayCourse?.students_count ??
    displayCourse?.total_students ??
    0;
  const updated = timeAgo(
    displayCourse?.updated_at || displayCourse?.updatedAt
  );
  const thumbnail =
    displayCourse?.thumbnail_url ||
    displayCourse?.thumbnail ||
    displayCourse?.cover_image ||
    null;
  const revenue = displayCourse?.revenue ?? course?.revenue ?? null;
  const refunds = displayCourse?.refunds ?? null;

  return (
    <>
      <tr
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          borderBottom: `1px solid ${colors.base.border}`,
          background: isHovered ? "rgba(255,107,0,0.03)" : "transparent",
        }}
      >
        <td
          style={{ padding: "12px 8px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <input type="checkbox" style={{ cursor: "pointer" }} />
        </td>

        <td style={{ padding: "12px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                flexShrink: 0,
                backgroundColor: "rgba(0,0,0,0.04)",
                backgroundImage: thumbnail ? `url(${thumbnail})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {!thumbnail && (
                <BookOpen size={16} color={colors.typography.secondaryText} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: colors.typography.primaryText,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 220,
                }}
              >
                {title}
              </div>
              {category && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: colors.typography.secondaryText,
                    marginTop: 2,
                  }}
                >
                  {category}
                </div>
              )}
            </div>
          </div>
        </td>

        {openModal === "more" &&
          moreMenuPos &&
          createPortal(
            <div
              ref={moreDropdownRef}
              style={{
                position: "fixed",
                top: moreMenuPos.top,
                left: moreMenuPos.left,
                width: 230,
                background: "#FFFFFF",
                border: `1px solid ${colors.base.border}`,
                borderRadius: 14,
                boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                zIndex: 2200,
                padding: 6,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <button
                type="button"
                onClick={handleToggleDraft}
                style={menuItemStyle}
              >
                <FileText size={15} color={colors.typography.secondaryText} />
                <span>{isPublished ? "Move to Draft" : "Draft Course"}</span>
              </button>

              {onAddUser && (
                <button
                  type="button"
                  onClick={() => {
                    setOpenModal(null);
                    setIsAddUserModalOpen(true);
                  }}
                  style={menuItemStyle}
                >
                  <UserPlus size={15} color={colors.typography.secondaryText} />
                  <span>Add User</span>
                </button>
              )}


              <button
                type="button"
                onClick={handleCopyLink}
                style={menuItemStyle}
              >
                <LinkIcon size={15} color={colors.typography.secondaryText} />
                <span>Copy Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowEnrollments(true);
                  loadEnrollments();
                }}
                style={menuItemStyle}
              >
                <Users size={15} color={colors.typography.secondaryText} />
                <span>View Users</span>
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setOpenModal(null);
                    onDelete?.(displayCourse);
                  }}
                  style={{ ...menuItemStyle, color: "#EF4444" }}
                >
                  <Trash2 size={15} color="#EF4444" />
                  <span>Delete Course</span>
                </button>
              )}
            </div>,
            document.body
          )}

        <td style={{ padding: "12px 8px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 700,
              color: isPublished
                ? colors.brand?.successGreen || "#22C55E"
                : colors.typography.secondaryText,
            }}
          >
            ● {isPublished ? "Published" : "Draft"}
          </span>
        </td>

        <td style={{ padding: "12px 8px" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: colors.typography.primaryText,
            }}
          >
            {(displayCourse?.price ?? 0) === 0
              ? "Free"
              : formatCurrency(displayCourse.price)}
          </span>
        </td>

        <td style={{ padding: "12px 8px" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              color: colors.typography.primaryText,
            }}
          >
            <Users size={13} color={colors.typography.secondaryText} />{" "}
            {students}
          </span>
        </td>

        <td style={{ padding: "12px 8px" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: colors.brand?.successGreen || "#22C55E",
            }}
          >
            {revenue != null ? formatCurrency(revenue) : "--"}
          </span>
        </td>

        <td style={{ padding: "12px 8px" }}>
          <span
            style={{ fontSize: 12, color: colors.typography.secondaryText }}
          >
            {updated || "--"}
          </span>
        </td>

        <td
          style={{ padding: "12px 8px", textAlign: "right" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={() => openModalFor("preview")}
              title="User View Preview"
              style={{
                ...iconButtonStyle,
                ...(openModal === "preview"
                  ? activeIconButtonStyle("#3B82F6")
                  : {}),
              }}
            >
              <Eye
                size={14}
                color={
                  openModal === "preview"
                    ? "#3B82F6"
                    : colors.typography.secondaryText
                }
              />
            </button>

                       <button
              type="button"
              onClick={() => onEdit?.(displayCourse)}
              title="Edit Course Details"
              style={iconButtonStyle}
            >
              <Pencil size={14} color={colors.typography.secondaryText} />
            </button>

            <button
              type="button"
              onClick={() => openModalFor("performance")}
              title="Course Performance"
              style={{
                ...iconButtonStyle,
                ...(openModal === "performance"
                  ? activeIconButtonStyle("#22C55E")
                  : {}),
              }}
            >
              <BarChart2
                size={14}
                color={
                  openModal === "performance"
                    ? "#22C55E"
                    : colors.typography.secondaryText
                }
              />
            </button>

            <button
              type="button"
              ref={moreButtonRef}
              onClick={handleToggleMoreMenu}
              title="More Actions"
              style={{
                ...iconButtonStyle,
                ...(openModal === "more"
                  ? activeIconButtonStyle("#8B5CF6")
                  : {}),
              }}
            >
              <MoreHorizontal
                size={14}
                color={
                  openModal === "more"
                    ? "#8B5CF6"
                    : colors.typography.secondaryText
                }
              />
            </button>
          </div>
        </td>
      </tr>

      {/* ===== MODAL 1: Student View Preview ===== */}
      {openModal === "preview" && (
        <Modal
          color="#3B82F6"
          icon={<Eye size={18} color="#3B82F6" />}
          title="User View Preview"
          width={380}
          onClose={() => setOpenModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                width: "100%",
                borderRadius: 16,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16 / 10",
                  position: "relative",
                  backgroundColor: "#F8FAFC",
                  backgroundImage: thumbnail ? `url(${thumbnail})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              <div
                style={{
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0F172A",
                    lineHeight: 1.3,
                  }}
                >
                  {title || "Course Title"}
                </h3>

                <div
                  style={{
                    display: "inline-block",
                    fontSize: 14,
                    fontWeight: 700,
                    marginTop: 8,
                    background:
                      "linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  by {displayCourse?.creator?.name || "Creator"}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 10,
                    marginBottom: 16,
                    fontSize: 13,
                    color: "#64748B",
                  }}
                >
                  {displayCourse?.level && (
                    <span style={{ fontWeight: 700, color: "#1E293B" }}>
                      {displayCourse.level}
                    </span>
                  )}

                  {(() => {
                    const totalSecs =
                      displayCourse?.total_duration ||
                      videos.reduce(
                        (acc, v) => acc + (Number(v.duration) || 0),
                        0
                      );
                    const mins = Math.round(totalSecs / 60);
                    return mins > 0 ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Clock size={14} color="#64748B" />
                        {mins} min
                      </span>
                    ) : null;
                  })()}

                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <BookOpen size={14} color="#64748B" />
                    {lessons} Videos
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onView?.(displayCourse);
                    setOpenModal(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 14,
                    border: "none",
                    background: "#22C55E",
                    color: "#FFFFFF",
                    fontSize: 17,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.25)",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#16A34A")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#22C55E")
                  }
                >
                  {(displayCourse?.price ?? 0) === 0
                    ? "Free"
                    : formatCurrency(displayCourse.price)}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ===== MODAL 3: Course Performance ===== */}
      {openModal === "performance" && (
        <Modal
          color="#22C55E"
          icon={<BarChart2 size={18} color="#22C55E" />}
          title="Course Performance"
          width={360}
          onClose={() => setOpenModal(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <PerformanceStat
              icon={<IndianRupee size={16} color="#22C55E" />}
              bg="rgba(34,197,94,0.08)"
              label="Total Revenue"
              value={revenue != null ? formatCurrency(revenue) : "--"}
            />
            <PerformanceStat
              icon={<Users size={16} color="#3B82F6" />}
              bg="rgba(59,130,246,0.08)"
              label="Users"
              value={students}
            />
            <PerformanceStat
              icon={<RotateCcw size={16} color="#EF4444" />}
              bg="rgba(239,68,68,0.08)"
              label="Refunds"
              value={refunds != null ? refunds : "--"}
              note={
                refunds == null
                  ? "Needs backend: refunds-per-course aggregation"
                  : null
              }
            />
          </div>
        </Modal>
      )}

      {/* View Enrollments modal */}
      {showEnrollments && (
        <div
          onClick={() => setShowEnrollments(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2100,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              maxHeight: "70vh",
              background: colors.base.cardBackground,
              borderRadius: 16,
              border: `1px solid ${colors.base.border}`,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: `1px solid ${colors.base.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: colors.typography.primaryText,
                }}
              >
                Users — {title}
              </span>
              <button
                type="button"
                onClick={() => setShowEnrollments(false)}
                style={smallIconButtonStyle}
              >
                <X size={14} color={colors.typography.secondaryText} />
              </button>
            </div>
            <div style={{ padding: 16, overflowY: "auto" }}>
              {enrollmentsLoading && (
                <div
                  style={{
                    fontSize: 13,
                    color: colors.typography.secondaryText,
                  }}
                >
                  Loading...
                </div>
              )}
              {!enrollmentsLoading && enrollmentsError && (
                <div
                  style={{ fontSize: 13, color: "#EF4444", lineHeight: 1.5 }}
                >
                  {enrollmentsError}
                </div>
              )}
              {!enrollmentsLoading &&
                !enrollmentsError &&
                enrollments?.length === 0 && (
                  <div
                    style={{
                      fontSize: 13,
                      color: colors.typography.secondaryText,
                    }}
                  >
                    No students enrolled yet.
                  </div>
                )}
              {!enrollmentsLoading &&
                !enrollmentsError &&
                enrollments?.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: `1px solid ${colors.base.border}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: colors.typography.primaryText,
                      }}
                    >
                      {e.user?.name || e.user?.email || "Unknown"}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: colors.typography.secondaryText,
                      }}
                    >
                      {e.progress != null ? `${Math.round(e.progress)}%` : ""}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Add User modal */}
      {isAddUserModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (!addUserSubmitting) {
              setIsAddUserModalOpen(false);
              setAddUserValue("");
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2100,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              background: colors.base.cardBackground,
              borderRadius: 18,
              border: `1px solid ${colors.base.border}`,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${colors.base.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus
                  size={18}
                  color={colors.brand?.primaryOrange || "#FF6B00"}
                />
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: colors.typography.primaryText,
                  }}
                >
                  Add User
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!addUserSubmitting) {
                    setIsAddUserModalOpen(false);
                    setAddUserValue("");
                  }
                }}
                style={iconButtonStyle}
              >
                <X size={16} color={colors.typography.secondaryText} />
              </button>
            </div>

            <div
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: colors.typography.secondaryText,
                  lineHeight: 1.5,
                }}
              >
                Grant access to <strong>{title}</strong> without a payment. The
                user is notified once added.
              </p>
              <div>
                <label style={modalLabelStyle}>User's phone or email</label>
                <input
                  type="text"
                  value={addUserValue}
                  onChange={(e) => setAddUserValue(e.target.value)}
                  placeholder="Phone number or email"
                  disabled={addUserSubmitting}
                  style={{ ...modalInputStyle, marginTop: 6 }}
                />
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 11.5,
                    color: colors.typography.secondaryText,
                  }}
                >
                  The user must already have a Manchly account with this phone
                  or email.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: "14px 20px",
                borderTop: `1px solid ${colors.base.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                background: "rgba(0,0,0,0.02)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsAddUserModalOpen(false);
                  setAddUserValue("");
                }}
                disabled={addUserSubmitting}
                style={{
                  ...modalActionButtonStyle,
                  background: "transparent",
                  color: colors.typography.secondaryText,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddUserSubmit}
                disabled={!addUserIsValid || addUserSubmitting}
                style={{
                  ...modalActionButtonStyle,
                  background: colors.brand?.primaryOrange || "#FF6B00",
                  color: "#FFF",
                  opacity: !addUserIsValid || addUserSubmitting ? 0.6 : 1,
                  cursor:
                    !addUserIsValid || addUserSubmitting
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {addUserSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                Grant Access
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PerformanceStat({ icon, bg, label, value, note }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderRadius: 12,
        background: bg,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#FFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: 12,
              color: colors.typography.secondaryText,
              fontWeight: 600,
            }}
          >
            {label}
          </div>
          {note && (
            <div
              style={{
                fontSize: 9.5,
                color: colors.typography.secondaryText,
                marginTop: 1,
              }}
            >
              {note}
            </div>
          )}
        </div>
      </div>
      <span
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: colors.typography.primaryText,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ----- styles -----
function activeIconButtonStyle(color) {
  return { borderColor: color, background: `${color}12` };
}

const enhanceButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "3px 10px",
  borderRadius: 20,
  border: "1px solid #FFE0C2",
  backgroundColor: "#FFF8F2",
  color: "#C05200",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  outline: "none",
};

const uploadPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 16px",
  borderRadius: 9999,
  border: "1.5px solid #E2C8A4",
  backgroundColor: "#FFFFFF",
  color: "#C05200",
  fontWeight: 700,
  cursor: "pointer",
  outline: "none",
};

const iconButtonStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: `1px solid ${colors.base.border}`,
  background: colors.base.cardBackground,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const smallIconButtonStyle = {
  width: 26,
  height: 26,
  borderRadius: 7,
  border: "none",
  background: "rgba(0,0,0,0.04)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  background: "transparent",
  fontSize: 13,
  fontWeight: 600,
  color: colors.typography.primaryText,
  cursor: "pointer",
  textAlign: "left",
};

const modalLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: colors.typography.primaryText,
};

const modalInputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${colors.base.border}`,
  fontSize: 13,
  outline: "none",
  color: colors.typography.primaryText,
  background: "#FFF",
  width: "100%",
  boxSizing: "border-box",
};

const toggleButtonStyle = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const modalActionButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 18px",
  borderRadius: 10,
  border: "none",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};