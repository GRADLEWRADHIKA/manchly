import React from "react";
import colors from "../../../../utils/colors";

export default function StatCard({ icon: Icon, label, value, subtext, iconColor, highlight = false }) {
  return (
    <div
      style={{
        background: highlight ? "#FFF7EC" : colors.base.cardBackground,
        border: `1px solid ${highlight ? "#FFD9A6" : colors.base.border}`,
        borderRadius: 20,
        padding: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${iconColor}1F`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={iconColor} />
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: colors.typography.secondaryText,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: highlight ? colors.brand.primaryOrange : colors.typography.primaryText,
        }}
      >
        {value}
      </div>

      {subtext && (
        <div style={{ fontSize: 12.5, color: colors.typography.secondaryText, marginTop: 6 }}>
          {subtext}
        </div>
      )}
    </div>
  );
}