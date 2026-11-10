import React from "react";
import colors from "../../../../utils/colors";

export default function InsightRow({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
      <span style={{ fontSize: 13, color: colors.typography.secondaryText }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: colors.typography.primaryText }}>{value ?? "--"}</span>
    </div>
  );
}