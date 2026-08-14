import React from "react";
import { BookOpen, Users, Star, BarChart2, Eye, Copy, MoreHorizontal } from "lucide-react";
import colors from "../../../../utils/colors";
import { formatCurrency, timeAgo } from "../../../../utils/formatters";

export default function CourseCard({ course, onEdit, onView, onDuplicate, onMore }) {
  const title = course?.title || course?.name || "Untitled course";
  const category = course?.category || course?.tags?.[0] || null;
  const isPublished =
    String(course?.status || "").toLowerCase() === "published" ||
    course?.is_published === true;
  const price = course?.price ?? 0;
  const lessons = course?.lessons_count ?? course?.total_lessons ?? course?.videos?.length ?? 0;
  const students = course?.enrolled_count ?? course?.students_count ?? course?.total_students ?? 0;
  const rating = course?.rating ?? course?.average_rating ?? null;
  const reviewCount = course?.reviews_count ?? course?.rating_count ?? null;
  const progress = course?.completion_percentage ?? course?.setup_progress ?? null;
  const updated = timeAgo(course?.updated_at || course?.updatedAt);
  const thumbnail = course?.thumbnail_url || course?.thumbnail || course?.cover_image || null;

  return (
    <div style={{ display: "flex", gap: 16, padding: 16, border: `1px solid ${colors.base.border}`, borderRadius: 14, background: colors.base.cardBackground, marginBottom: 12, alignItems: "center" }}>
      {/* Thumbnail */}
      <div style={{ width: 88, height: 64, borderRadius: 10, flexShrink: 0, background: thumbnail ? `url(${thumbnail}) center/cover no-repeat` : "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!thumbnail && <BookOpen size={22} color={colors.typography.secondaryText} />}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          {category && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: colors.charts?.blue || "#3b82f6", background: "rgba(59,130,246,0.1)", borderRadius: 6, padding: "2px 8px" }}>
              {category}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: isPublished ? colors.brand.successGreen : colors.typography.secondaryText, background: isPublished ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.06)", borderRadius: 6, padding: "2px 8px" }}>
            {isPublished ? "Published" : "Draft"}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: colors.typography.primaryText }}>{title}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: colors.brand.primaryOrange, whiteSpace: "nowrap" }}>
            {formatCurrency(price)}
          </span>
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: colors.typography.secondaryText, display: "flex", alignItems: "center", gap: 4 }}>
            <BookOpen size={13} /> {lessons} Lessons
          </span>
          <span style={{ fontSize: 12, color: colors.typography.secondaryText, display: "flex", alignItems: "center", gap: 4 }}>
            <Users size={13} /> {students} Students
          </span>
          {rating != null ? (
            <span style={{ fontSize: 12, color: colors.typography.secondaryText, display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={13} color={colors.brand.primaryOrange} fill={colors.brand.primaryOrange} />
              {rating} {reviewCount != null ? `(${reviewCount})` : ""}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: colors.typography.secondaryText }}>No ratings yet</span>
          )}
        </div>

        {progress != null && (
          <div style={{ marginTop: 10 }}>
            <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)" }}>
              <div style={{ width: `${Math.max(0, Math.min(100, progress))}%`, height: "100%", borderRadius: 3, background: isPublished ? colors.brand.successGreen : colors.brand.primaryOrange }} />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onEdit?.(course)} title="Analytics" style={iconButtonStyle}>
            <BarChart2 size={15} color={colors.typography.secondaryText} />
          </button>
          <button onClick={() => onView?.(course)} title="View" style={iconButtonStyle}>
            <Eye size={15} color={colors.typography.secondaryText} />
          </button>
          <button onClick={() => onDuplicate?.(course)} title="Duplicate" style={iconButtonStyle}>
            <Copy size={15} color={colors.typography.secondaryText} />
          </button>
          <button onClick={() => onMore?.(course)} title="More" style={iconButtonStyle}>
            <MoreHorizontal size={15} color={colors.typography.secondaryText} />
          </button>
        </div>
        {updated && <span style={{ fontSize: 11, color: colors.typography.secondaryText }}>{updated}</span>}
      </div>
    </div>
  );
}

const iconButtonStyle = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "none",
  background: "rgba(0,0,0,0.04)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};