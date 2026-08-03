import React from "react";
import colors from "../utils/colors";

export default function ProductStatCard({
  value,
  title,
  activeCount,
  activeLabel,
  inactiveCount,
  inactiveLabel,
  themeColor,
}) {
  return (
    <div
      style={{
        background: colors.base.cardBackground,
        border: `1px solid ${colors.base.border}`,
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Top Metric */}
      <div
        style={{
          fontSize: 34,
          fontWeight: 700,
          color: colors.typography.primaryText,
        }}
      >
        {value}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: colors.typography.secondaryText,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {title}
      </div>

      {/* Split Bar */}
      <div
        style={{
          width: "100%",
          height: 6,
          background: `${themeColor}25`,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "70%",
            height: "100%",
            background: themeColor,
          }}
        />
      </div>

      {/* Bottom Text */}
      <div
        style={{
          fontSize: 13,
          color: colors.typography.secondaryText,
        }}
      >
        <span
          style={{
            color: themeColor,
            fontWeight: 700,
          }}
        >
          {activeCount}
        </span>{" "}
        {activeLabel}
        {inactiveCount !== undefined && (
          <>
            {" "}
            -{" "}
            <span
              style={{
                color: colors.typography.secondaryText,
                fontWeight: 600,
              }}
            >
              {inactiveCount}
            </span>{" "}
            {inactiveLabel}
          </>
        )}
      </div>
    </div>
  );
}
