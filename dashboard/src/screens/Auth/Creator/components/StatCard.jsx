import React from "react";
import colors from "../../../../utils/colors";

export default function StatCard({ icon: Icon, label, value, subtext, iconColor }) {
  return (
    <div style={{ background: colors.base.cardBackground, border: `1px solid ${colors.base.border}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon size={16} color={iconColor} />
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.typography.secondaryText, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: colors.typography.primaryText }}>{value}</div>
      {subtext && <div style={{ fontSize: 12, color: colors.typography.secondaryText, marginTop: 4 }}>{subtext}</div>}
    </div>
  );
}