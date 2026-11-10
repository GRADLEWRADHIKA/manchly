import React from "react";
import { Check } from "lucide-react";
import colors from "../../../../utils/colors";

export default function AccessOptionCard({ label, description, selected, onSelect }) {
  const accentColor = colors.charts?.blue || "#3b82f6";

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: "left",
        padding: 16,
        borderRadius: 12,
        border: `2px solid ${selected ? accentColor : colors.base.border}`,
        background: selected ? "rgba(59,130,246,0.05)" : colors.base.cardBackground,
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.typography.primaryText, marginBottom: 4 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: colors.typography.secondaryText }}>{description}</div>
        )}
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          flexShrink: 0,
          border: `2px solid ${selected ? accentColor : colors.base.border}`,
          background: selected ? accentColor : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && <Check size={13} color={colors.typography.white} />}
      </div>
    </button>
  );
}