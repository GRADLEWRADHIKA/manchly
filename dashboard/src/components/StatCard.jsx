import React from "react";
import colors from "../../utils/colors";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  children,
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
        justifyContent: "space-between",
        minHeight: 170,
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
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: `${color}15`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {Icon && <Icon size={22} color={color} />}
        </div>

        {children}
      </div>

      {/* Middle */}
      <div style={{ marginTop: 18 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: colors.typography.primaryText,
          }}
        >
          {value}
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            fontWeight: 600,
            color: colors.typography.secondaryText,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {title}
        </div>
      </div>

      {/* Bottom */}
      {subtitle && (
        <div
          style={{
            marginTop: 18,
            fontSize: 13,
            color: colors.typography.secondaryText,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}