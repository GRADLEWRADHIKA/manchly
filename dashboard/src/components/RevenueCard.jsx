import React from "react";
import colors from "../utils/colors";

export default function RevenueCard({
  title,
  amount,
  percentage,
  icon: Icon,
  themeColor,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: colors.base.cardBackground,
        border: `1px solid ${colors.base.border}`,
        borderRadius: 16,
        padding: 20,
        minHeight: 210,
      }}
    >
      {/* Top Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${themeColor}20`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {Icon && (
            <Icon
              size={24}
              color={themeColor}
              strokeWidth={2}
            />
          )}
        </div>

        {/* Growth Badge */}
        <div
          style={{
            padding: "6px 12px",
            borderRadius: 9999,
            background: "rgba(34,197,94,0.12)",
            color: colors.brand.successGreen,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {percentage}
        </div>
      </div>

      {/* Middle Row */}
      <div
        style={{
          marginTop: 16,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: colors.typography.primaryText,
          }}
        >
          {amount}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: colors.typography.secondaryText,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}