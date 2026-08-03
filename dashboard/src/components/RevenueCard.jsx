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

      {/* Bottom Row - Sparkline */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 20,
        }}
      >
        <svg
          width="100%"
          height="60"
          viewBox="0 0 240 60"
          preserveAspectRatio="none"
        >
          <path
            d="M0 45
               C20 40,40 18,60 22
               S100 50,120 34
               S160 12,180 22
               S220 40,240 15"
            fill="none"
            stroke={themeColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}