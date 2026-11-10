import React from "react";
import { ArrowUpRight } from "lucide-react";
import colors from "../utils/colors";

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default function RecentEnrollments({
  enrollments = [],
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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: colors.typography.primaryText,
            }}
          >
            Recent enrollments
          </h3>

          <p
            style={{
              marginTop: 6,
              color: colors.typography.secondaryText,
            }}
          >
            Students who joined recently
          </p>
        </div>

        <button
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1px solid ${colors.base.border}`,
            background: colors.base.cardBackground,
            cursor: "pointer",
          }}
        >
          <ArrowUpRight size={18} />
        </button>
      </div>

      {/* List */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {enrollments.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "#ECECEC",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: 700,
                }}
              >
                {getInitials(item.student_name)}
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 600,
                    color: colors.typography.primaryText,
                  }}
                >
                  {item.student_name}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: colors.typography.secondaryText,
                  }}
                >
                  {item.product_name}
                </div>
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#EFE7FF",
                  color: colors.charts.purple,
                  fontSize: 11,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                {item.product_type}
              </div>

              <div
                style={{
                  fontWeight: 700,
                }}
              >
                ₹{item.amount}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}