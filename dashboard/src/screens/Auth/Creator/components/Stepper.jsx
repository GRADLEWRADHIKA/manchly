import React from "react";
import colors from "../../../../utils/colors";

// steps: [{ key, label, icon }]
export default function Stepper({ steps, activeIndex }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 40px", marginBottom: 32 }}>
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === activeIndex;
        return (
          <React.Fragment key={step.key}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? colors.brand.primaryOrange : "transparent",
                  border: isActive ? "none" : `1px solid ${colors.base.border}`,
                }}
              >
                <Icon size={20} color={isActive ? colors.typography.white : colors.typography.secondaryText} />
              </div>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? colors.typography.primaryText : colors.typography.secondaryText, whiteSpace: "nowrap" }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: colors.base.border, marginTop: 22, marginLeft: 12, marginRight: 12 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}