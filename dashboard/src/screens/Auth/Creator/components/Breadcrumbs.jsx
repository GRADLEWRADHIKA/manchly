import React from "react";
import colors from "../../../../utils/colors";

// items: [{ label, active }]
export default function Breadcrumbs({ items }) {
  return (
    <div style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          <span style={{ color: item.active ? colors.typography.primaryText : colors.typography.secondaryText, fontWeight: item.active ? 700 : 400 }}>
            {item.label}
          </span>
          {i < items.length - 1 && <span style={{ color: colors.typography.secondaryText }}>{">"}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}