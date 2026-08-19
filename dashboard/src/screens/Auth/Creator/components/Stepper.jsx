import React from "react";
import colors from "../../../../utils/colors";

// steps: [{ key, label, icon }]
export default function Stepper({ steps, activeIndex, onStepClick }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 40px", marginBottom: 32 }}>
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === activeIndex;
        const isCompleted = i < activeIndex;

        return (
          <React.Fragment key={step.key}>
            <div
              onClick={() => onStepClick?.(i, step)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isActive
                    ? colors.brand.primaryOrange
                    : isCompleted
                    ? "#FFF8EC"
                    : "transparent",
                  border: isActive
                    ? "none"
                    : isCompleted
                    ? `1px solid ${colors.brand.primaryOrange}`
                    : `1px solid ${colors.base.border}`,
                  transition: "all 0.2s ease",
                }}
              >
                <Icon
                  size={20}
                  color={
                    isActive
                      ? colors.typography.white
                      : isCompleted
                      ? colors.brand.primaryOrange
                      : colors.typography.secondaryText
                  }
                />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? colors.typography.primaryText : colors.typography.secondaryText,
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: i < activeIndex ? colors.brand.primaryOrange : colors.base.border,
                  marginTop: 22,
                  marginLeft: 12,
                  marginRight: 12,
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}