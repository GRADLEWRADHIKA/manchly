import React from "react";
import {
  Users,
  IndianRupee,
  Eye,
  Edit,
  MoreVertical,
} from "lucide-react";

import colors from "../../utils/colors";
import { formatCurrency } from "../../utils/formatters";

export default function CourseCard({
  course,
  onView,
  onEdit,
  onMenu,
}) {
  return (
    <div
      style={{
        background: colors.base.cardBackground,
        border: `1px solid ${colors.base.border}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Thumbnail */}

      <div
        style={{
          height: 180,
          background: "#ECECEC",
          overflow: "hidden",
        }}
      >
        <img
          src={
            course.thumbnail ||
            "https://placehold.co/600x400?text=Course"
          }
          alt={course.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Content */}

      <div
        style={{
          padding: 18,
        }}
      >
        {/* Title */}

        <h3
          style={{
            margin: 0,
            fontSize: 18,
            color: colors.typography.primaryText,
          }}
        >
          {course.title}
        </h3>

        {/* Description */}

        <p
          style={{
            marginTop: 8,
            color: colors.typography.secondaryText,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {course.description || "No description available"}
        </p>

        {/* Stats */}

        <div
          style={{
            display: "flex",
            gap: 18,
            marginTop: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Users size={16} color={colors.charts.blue} />

            <span>
              {course.students || 0}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <IndianRupee
              size={16}
              color={colors.brand.successGreen}
            />

            <span>
              {formatCurrency(course.revenue)}
            </span>
          </div>
        </div>

        {/* Footer */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 22,
          }}
        >
          <button
            onClick={() => onView?.(course)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: colors.brand.actionBlue,
            }}
          >
            <Eye size={18} />

            View
          </button>

          <button
            onClick={() => onEdit?.(course)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: colors.brand.primaryOrange,
            }}
          >
            <Edit size={18} />

            Edit
          </button>

          <button
            onClick={() => onMenu?.(course)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <MoreVertical
              size={18}
              color={colors.typography.secondaryText}
            />
          </button>
        </div>
      </div>
    </div>
  );
}