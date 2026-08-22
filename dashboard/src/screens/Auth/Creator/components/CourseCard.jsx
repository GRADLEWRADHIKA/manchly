import React, { useState } from "react";
import {
  BookOpen,
  Users,
  Star,
  BarChart2,
  Eye,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import colors from "../../../../utils/colors";
import { formatCurrency, timeAgo } from "../../../../utils/formatters";

export default function CourseCard({
  course,
  onEdit,
  onView,
  onDuplicate,
  onMore,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const title = course?.title || course?.name || "Untitled course";
  const category = course?.category || course?.tags?.[0] || null;
  const isPublished =
    String(course?.status || "").toLowerCase() === "published" ||
    course?.is_published === true;
  const price = course?.price ?? 0;
  const lessons =
    course?.lessons_count ??
    course?.total_lessons ??
    course?.videos?.length ??
    0;
  const students =
    course?.enrolled_count ??
    course?.students_count ??
    course?.total_students ??
    0;
  const rating = course?.rating ?? course?.average_rating ?? null;
  const reviewCount = course?.reviews_count ?? course?.rating_count ?? null;
  const progress =
    course?.completion_percentage ?? course?.setup_progress ?? null;
  const updated = timeAgo(course?.updated_at || course?.updatedAt);
  const thumbnail =
    course?.thumbnail_url || course?.thumbnail || course?.cover_image || null;

    return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${
          isHovered ? colors.brand?.primaryOrange : colors.base.border
        }`,
        borderRadius: 16,
        background: colors.base.cardBackground,
        overflow: "hidden",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isHovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: isHovered
          ? "0 12px 28px rgba(255,107,0,0.14)"
          : "0 2px 4px rgba(0,0,0,0.02)",
      }}
    >
      {/* Thumbnail banner */}
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
        }}
      >
        {!thumbnail && (
          <BookOpen size={24} color={colors.typography.secondaryText} />
        )}

        {/* Badges overlaid on the thumbnail */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            right: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {category && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  color: colors.charts?.blue || "#3B82F6",
                  background: "rgba(255,255,255,0.92)",
                  borderRadius: 6,
                  padding: "2px 8px",
                }}
              >
                {category}
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              color: isPublished
                ? colors.brand?.successGreen || "#22C55E"
                : colors.typography.secondaryText,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 6,
              padding: "2px 8px",
            }}
          >
            {isPublished ? "● Published" : "● Draft"}
          </span>
        </div>
      </div>

      {/* Content */}
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

        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: colors.typography.secondaryText,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <BookOpen size={13} /> {lessons} Lessons
          </span>
          <span
            style={{
              fontSize: 12,
              color: colors.typography.secondaryText,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Users size={13} /> {students} Students
          </span>
          {rating != null ? (
            <span
              style={{
                fontSize: 12,
                color: colors.typography.secondaryText,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 600,
              }}
            >
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              {rating} {reviewCount != null ? `(${reviewCount})` : ""}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: colors.typography.secondaryText }}>
              No ratings yet
            </span>
          )}
        </div>

        {progress != null && (
          <div>
            <div
              style={{
                width: "100%",
                height: 5,
                borderRadius: 3,
                background: "rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, progress))}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: isPublished
                    ? colors.brand?.successGreen || "#22C55E"
                    : colors.brand?.primaryOrange || "#FF6B00",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom bar — price, actions, timestamp — pinned to card bottom */}
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
                whiteSpace: "nowrap",
              }}
            >
              {price > 0 ? formatCurrency(price) : "Free"}
            </span>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => onEdit?.(course)}
                title="Analytics"
                style={iconButtonStyle}
              >
                <BarChart2 size={14} color={colors.typography.secondaryText} />
              </button>
              <button
                type="button"
                onClick={() => onView?.(course)}
                title="Preview"
                style={iconButtonStyle}
              >
                <Eye size={14} color={colors.typography.secondaryText} />
              </button>
              <button
                type="button"
                onClick={() => onDuplicate?.(course)}
                title="Duplicate"
                style={iconButtonStyle}
              >
                <Copy size={14} color={colors.typography.secondaryText} />
              </button>
              <button
                type="button"
                onClick={() => onMore?.(course)}
                title="More Options"
                style={iconButtonStyle}
              >
                <MoreHorizontal size={14} color={colors.typography.secondaryText} />
              </button>
            </div>
          </div>

          {updated && (
            <span style={{ fontSize: 11, color: colors.typography.secondaryText }}>
              Updated {updated}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

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
  transition: "background 0.15s ease",
};