import React from "react";
import { ArrowUpRight } from "lucide-react";
import colors from "../utils/colors";

export default function TopProducts({
  products = [],
}) {
  const maxRevenue = Math.max(
    ...products.map((p) => p.revenue),
    1
  );

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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
            }}
          >
            Top products by revenue
          </h3>

          <p
            style={{
              marginTop: 6,
              color: colors.typography.secondaryText,
            }}
          >
            Ranked by earnings
          </p>
        </div>

        <button
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1px solid ${colors.base.border}`,
            background: colors.base.cardBackground,
          }}
        >
          <ArrowUpRight size={18} />
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        {products.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#FFF4E7",
                color: colors.brand.primaryOrange,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontWeight: 700,
              }}
            >
              {index + 1}
            </div>

            <div
              style={{
                flex: 1,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  marginTop: 8,
                  width: "100%",
                  height: 6,
                  borderRadius: 999,
                  background: colors.base.border,
                }}
              >
                <div
                  style={{
                    width: `${(item.revenue / maxRevenue) * 100}%`,
                    height: "100%",
                    background: colors.brand.primaryOrange,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                fontWeight: 700,
                minWidth: 90,
                textAlign: "right",
              }}
            >
              ₹{item.revenue.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}