import React from "react";
import colors from "../../../../utils/colors";

export default function HealthMetricRow({ label, value, dotColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
        <span style={{ fontSize: 13, color: colors.typography.secondaryText }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: colors.typography.primaryText }}>
        {value != null ? `${value}/100` : "--"}
      </span>
    </div>
  );
}