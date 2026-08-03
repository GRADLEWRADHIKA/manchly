import React from "react";
import colors from "../utils/colors";

export default function ProductPerformanceChart({
  data = [],
  maxValue = 1,
}) {
  return (
    <div
      style={{
        background: colors.base.cardBackground,
        border: `1px solid ${colors.base.border}`,
        borderRadius: 16,
        padding: 24,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h3
          style={{
            margin: 0,
            color: colors.typography.primaryText,
          }}
        >
          Product performance
        </h3>

        <p
          style={{
            marginTop: 6,
            color: colors.typography.secondaryText,
            fontSize: 14,
          }}
        >
          Revenue by product
        </p>
      </div>

      {/* Bars */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {data.map((item) => {
          const width = `${(item.value / maxValue) * 100}%`;

          return (
            <div key={item.name}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: colors.typography.primaryText,
                  }}
                >
                  {item.name}
                </span>

                <span
                  style={{
                    color: colors.brand.successGreen,
                    fontWeight: 700,
                  }}
                >
                  ₹{item.value.toLocaleString()}
                </span>
              </div>

              <div
                style={{
                  width: "100%",
                  height: 10,
                  background: colors.base.border,
                  borderRadius: 999,
                }}
              >
                <div
                  style={{
                    width,
                    height: "100%",
                    background: colors.brand.primaryOrange,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}