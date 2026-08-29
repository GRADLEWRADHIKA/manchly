import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  Users,
  Star,
  BarChart2,
  Eye,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
  UploadCloud,
  Sparkles,
  Loader2,
  UserPlus,
} from "lucide-react";
import colors from "../../../../utils/colors";
import { formatCurrency, timeAgo } from "../../../../utils/formatters";

const ADD_USER_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADD_USER_PHONE_RE = /^\d{10}$/;

export default function CourseCard({
  course,
  onEdit,
  onSave,
  onView,
  onDuplicate,
  onDelete,
  onAnalytics,
  onEnhanceTitle,
  onEnhanceDescription,
  onAddUser,
}) {
  // Local state to track course details for immediate UI updates
  const [displayCourse, setDisplayCourse] = useState(course);
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false); // was missing
  const [addUserValue, setAddUserValue] = useState("");
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isFree: true,
    price: 0,
    thumbnail: "",
    status: "draft",
  });

  // AI Loading States
  const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
  const [isEnhancingDesc, setIsEnhancingDesc] = useState(false);

  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isModalOpen) {
      setDisplayCourse(course);
    }
  }, [course, isModalOpen]);

  useEffect(() => {
    if (isModalOpen) {
      setFormData({
        title: displayCourse?.title || displayCourse?.name || "",
        description: displayCourse?.description || "",
        isFree: (displayCourse?.price ?? 0) === 0,
        price: displayCourse?.price ?? 0,
        thumbnail:
          displayCourse?.thumbnail_url ||
          displayCourse?.thumbnail ||
          displayCourse?.cover_image ||
          "",
        status:
          displayCourse?.status ||
          (displayCourse?.is_published ? "published" : "draft"),
      });
    }
  }, [isModalOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, thumbnail: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Enhance Title Handler
  const handleEnhanceTitle = async () => {
    setIsEnhancingTitle(true);
    try {
      if (onEnhanceTitle) {
        const enhanced = await onEnhanceTitle(formData.title);
        if (enhanced) setFormData((prev) => ({ ...prev, title: enhanced }));
      } else {
        // Fallback simulation
        await new Promise((res) => setTimeout(res, 800));
        setFormData((prev) => ({
          ...prev,
          title: prev.title.trim()
            ? `Masterclass: ${prev.title.replace(/^masterclass:\s*/i, "")}`
            : "Complete Professional Training Guide",
        }));
      }
    } finally {
      setIsEnhancingTitle(false);
    }
  };

  // Enhance Description Handler
  const handleEnhanceDescription = async () => {
    setIsEnhancingDesc(true);
    try {
      if (onEnhanceDescription) {
        const enhanced = await onEnhanceDescription(
          formData.description,
          formData.title
        );
        if (enhanced) setFormData((prev) => ({ ...prev, description: enhanced }));
      } else {
        // Fallback simulation
        await new Promise((res) => setTimeout(res, 800));
        setFormData((prev) => ({
          ...prev,
          description: `Gain comprehensive hands-on experience with ${
            formData.title || "this course"
          }. Master core concepts, real-world practical workflows, and industry standards through step-by-step guidance.`,
        }));
      }
    } finally {
      setIsEnhancingDesc(false);
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
        addUserIsEmail ? { email: trimmedAddUserValue } : { phone: trimmedAddUserValue }
      );
      setAddUserValue("");
      setIsAddUserModalOpen(false);
    } catch {
      // Error toast is handled by the parent's apiFetch call; keep modal open.
    } finally {
      setAddUserSubmitting(false);
    }
  };

  const handleSave = (e) => {
    e?.stopPropagation();
    const updatedCourse = {
      ...displayCourse,
      title: formData.title,
      name: formData.title,
      description: formData.description,
      price: formData.isFree ? 0 : Number(formData.price),
      thumbnail_url: formData.thumbnail,
      thumbnail: formData.thumbnail,
      cover_image: formData.thumbnail,
      status: formData.status,
      is_published: formData.status === "published",
    };

    // Update local card state immediately
    setDisplayCourse(updatedCourse);

    // Notify parent component
    if (onSave) {
      onSave(updatedCourse);
    }
    setIsModalOpen(false);
  };

  // Derived variables from local display state
  const title = displayCourse?.title || displayCourse?.name || "Untitled course";
  const category = displayCourse?.category || displayCourse?.tags?.[0] || null;
  const isPublished =
    String(displayCourse?.status || "").toLowerCase() === "published" ||
    displayCourse?.is_published === true;
  const lessons =
    displayCourse?.lessons_count ??
    displayCourse?.total_lessons ??
    displayCourse?.videos?.length ??
    0;
  const students =
    displayCourse?.enrolled_count ??
    displayCourse?.students_count ??
    displayCourse?.total_students ??
    0;
  const rating = displayCourse?.rating ?? displayCourse?.average_rating ?? null;
  const reviewCount = displayCourse?.reviews_count ?? displayCourse?.rating_count ?? null;
  const updated = timeAgo(displayCourse?.updated_at || displayCourse?.updatedAt);
  const thumbnail =
    displayCourse?.thumbnail_url ||
    displayCourse?.thumbnail ||
    displayCourse?.cover_image ||
    null;

  return (
    <>
      {/* Course Card Container */}
      <div
        onClick={() => onEdit?.(displayCourse)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${
            isHovered
              ? colors.brand?.primaryOrange || "#FF6B00"
              : colors.base.border
          }`,
          borderRadius: 16,
          background: colors.base.cardBackground,
          overflow: "visible",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: isHovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: isHovered
            ? "0 12px 28px rgba(255,107,0,0.14)"
            : "0 2px 4px rgba(0,0,0,0.02)",
          cursor: "pointer",
          position: "relative",
        }}
      >
        {/* Thumbnail Banner */}
        <div
          style={{
            width: "100%",
            height: 156,
            flexShrink: 0,
            display: "flex",
            backgroundColor: "rgba(0,0,0,0.04)",
            backgroundImage: thumbnail ? `url(${thumbnail})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            overflow: "hidden",
          }}
        >
          {!thumbnail && (
            <BookOpen size={24} color={colors.typography.secondaryText} />
          )}

          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              right: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 6,
            }}
          >
            {category && <span style={badgeStyle}>{category}</span>}
            <span
              style={{
                ...badgeStyle,
                color: isPublished
                  ? colors.brand?.successGreen || "#22C55E"
                  : colors.typography.secondaryText,
              }}
            >
              {isPublished ? "● Published" : "● Draft"}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flex: 1,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: colors.typography.primaryText,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>

          {displayCourse?.description && (
            <p
              style={{
                fontSize: 12,
                color: colors.typography.secondaryText,
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {displayCourse.description}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={statStyle}>
              <BookOpen size={13} /> {lessons} Lessons
            </span>
            <span style={statStyle}>
              <Users size={13} /> {students} Students
            </span>
            {rating != null ? (
              <span style={{ ...statStyle, fontWeight: 600 }}>
                <Star size={13} color="#F59E0B" fill="#F59E0B" />
                {rating} {reviewCount != null ? `(${reviewCount})` : ""}
              </span>
            ) : (
              <span style={statStyle}>No ratings yet</span>
            )}
          </div>

          {/* Card Footer Bar */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 12,
              borderTop: `1px solid ${colors.base.border}`,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: colors.brand?.primaryOrange || "#FF6B00",
                }}
              >
                {(displayCourse?.price ?? 0) === 0
                  ? "Free"
                  : formatCurrency(displayCourse.price)}
              </span>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnalytics?.(displayCourse) || onEdit?.(displayCourse);
                  }}
                  title="Analytics"
                  style={iconButtonStyle}
                >
                  <BarChart2 size={14} color={colors.typography.secondaryText} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView?.(displayCourse);
                  }}
                  title="Preview"
                  style={iconButtonStyle}
                >
                  <Eye size={14} color={colors.typography.secondaryText} />
                </button>

                <div style={{ position: "relative" }} ref={menuRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen((prev) => !prev);
                    }}
                    title="More Options"
                    style={{
                      ...iconButtonStyle,
                      background: isMenuOpen
                        ? "rgba(0,0,0,0.06)"
                        : colors.base.cardBackground,
                    }}
                  >
                    <MoreHorizontal size={14} color={colors.typography.secondaryText} />
                  </button>

                  {isMenuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 6px)",
                        right: 0,
                        width: 150,
                        background: "#FFFFFF",
                        border: `1px solid ${colors.base.border}`,
                        borderRadius: 12,
                        boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                        zIndex: 100,
                        padding: "4px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          setIsModalOpen(true);
                        }}
                        style={menuItemStyle}
                      >
                        <Pencil size={13} color={colors.typography.secondaryText} />
                        <span>Edit Course</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onDuplicate?.(displayCourse);
                        }}
                        style={menuItemStyle}
                      >
                        <Copy size={13} color={colors.typography.secondaryText} />
                        <span>Duplicate</span>
                      </button>

                      {onAddUser && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            setIsAddUserModalOpen(true);
                          }}
                          style={menuItemStyle}
                        >
                          <UserPlus size={13} color={colors.typography.secondaryText} />
                          <span>Add User</span>
                        </button>
                      )}

                      {onDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            onDelete?.(displayCourse);
                          }}
                          style={{ ...menuItemStyle, color: "#EF4444" }}
                        >
                          <Trash2 size={13} color="#EF4444" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {updated && (
              <span
                style={{
                  fontSize: 11,
                  color: colors.typography.secondaryText,
                }}
              >
                Updated {updated}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ADD USER MODAL */}
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
            zIndex: 1000,
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
                <UserPlus size={18} color={colors.brand?.primaryOrange || "#FF6B00"} />
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
                Grant access to <strong>{title}</strong> without a payment. The user is
                notified once added.
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
                  The user must already have a Manchly account with this phone or email.
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
                  cursor: !addUserIsValid || addUserSubmitting ? "not-allowed" : "pointer",
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

      {/* EDIT COURSE POPUP MODAL */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              background: colors.base.cardBackground,
              borderRadius: 18,
              border: `1px solid ${colors.base.border}`,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
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
                <Pencil size={18} color={colors.brand?.primaryOrange || "#FF6B00"} />
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: colors.typography.primaryText,
                  }}
                >
                  Edit Course Details
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={iconButtonStyle}
              >
                <X size={16} color={colors.typography.secondaryText} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                maxHeight: "75vh",
                overflowY: "auto",
              }}
            >
              {/* Title Input with Enhance Button */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label style={modalLabelStyle}>Course Title</label>
                  <button
                    type="button"
                    onClick={handleEnhanceTitle}
                    disabled={isEnhancingTitle}
                    style={enhanceButtonStyle}
                  >
                    {isEnhancingTitle ? (
                      <Loader2 size={12} className="animate-spin" color={colors.navItems.communities} />
                    ) : (
                      <Sparkles size={12} color={colors.navItems.communities} />
                    )}
                    <span>{isEnhancingTitle ? "Enhancing..." : "Enhance"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter course name"
                  style={modalInputStyle}
                />
              </div>

              {/* Description Input with Enhance Button */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label style={modalLabelStyle}>Description</label>
                  <button
                    type="button"
                    onClick={handleEnhanceDescription}
                    disabled={isEnhancingDesc}
                    style={enhanceButtonStyle}
                  >
                    {isEnhancingDesc ? (
                      <Loader2 size={12} className="animate-spin" color={colors.navItems.communities} />
                    ) : (
                      <Sparkles size={12} color={colors.navItems.communities} />
                    )}
                    <span>{isEnhancingDesc ? "Enhancing..." : "Enhance"}</span>
                  </button>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="Brief summary of the course..."
                  style={{ ...modalInputStyle, resize: "vertical" }}
                />
              </div>

              {/* Thumbnail Image Upload Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={modalLabelStyle}>Thumbnail Image</label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={uploadPillStyle}
                  >
                    <UploadCloud size={15} color="#C05200" strokeWidth={2.3} />
                    <span>Upload</span>
                  </button>

                  {formData.thumbnail ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img
                        src={formData.thumbnail}
                        alt="Thumbnail Preview"
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          objectFit: "cover",
                          border: `1px solid ${colors.base.border}`,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, thumbnail: "" }))}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 12,
                          color: "#EF4444",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: colors.typography.secondaryText }}>
                      No image selected
                    </span>
                  )}
                </div>
              </div>

              {/* Price Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={modalLabelStyle}>Pricing Type</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isFree: true, price: 0 }))}
                    style={{
                      ...toggleButtonStyle,
                      background: formData.isFree
                        ? colors.brand?.primaryOrange || "#FF6B00"
                        : "rgba(0,0,0,0.05)",
                      color: formData.isFree ? "#FFF" : colors.typography.primaryText,
                    }}
                  >
                    Free Course
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isFree: false }))}
                    style={{
                      ...toggleButtonStyle,
                      background: !formData.isFree
                        ? colors.brand?.primaryOrange || "#FF6B00"
                        : "rgba(0,0,0,0.05)",
                      color: !formData.isFree ? "#FFF" : colors.typography.primaryText,
                    }}
                  >
                    Paid Course
                  </button>

                  {!formData.isFree && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: colors.typography.secondaryText,
                        }}
                      >
                        Price :
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                        style={{ ...modalInputStyle, width: 90 }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Status Select */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={modalLabelStyle}>Publishing Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  style={modalInputStyle}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Modal Footer Actions */}
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
                onClick={() => setIsModalOpen(false)}
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
                onClick={handleSave}
                style={{
                  ...modalActionButtonStyle,
                  background: colors.brand?.primaryOrange || "#FF6B00",
                  color: "#FFF",
                }}
              >
                <Check size={15} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Styling definitions
const enhanceButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "3px 10px",
  borderRadius: 20,
  border: "1px solid #FFE0C2",
  backgroundColor: "#FFF8F2",
  color: colors.navItems.communities,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.15s ease",
  outline: "none",
};

const uploadPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "9px 28px",
  borderRadius: 9999,
  border: "1.5px solid #E2C8A4",
  backgroundColor: "#FFFFFF",
  color: "#C05200",
  fontSize: 18,
  fontWeight: 800,
  fontFamily: "sans-serif",
  cursor: "pointer",
  transition: "all 0.15s ease",
  outline: "none",
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
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

const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  fontSize: 12.5,
  fontWeight: 600,
  color: colors.typography.primaryText,
  cursor: "pointer",
  textAlign: "left",
};

const badgeStyle = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  background: "rgba(255,255,255,0.92)",
  borderRadius: 6,
  padding: "2px 8px",
};

const statStyle = {
  fontSize: 12,
  color: colors.typography.secondaryText,
  display: "flex",
  alignItems: "center",
  gap: 4,
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
  transition: "all 0.15s ease",
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