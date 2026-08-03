import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import colors from "../utils/colors";

export default function RevenueOverviewChart({
  data = [],
  onTimeframeChange,
}) {
  const [active, setActive] = useState("7M");

  const handleChange = (value) => {
    setActive(value);
    onTimeframeChange?.(value);
  };

  return (
    <div
      style={{
        background: colors.base.cardBackground,
        border: `1px solid ${colors.base.border}`,
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: colors.typography.primaryText,
            }}
          >
            Revenue overview
          </h3>

          <p
            style={{
              marginTop: 6,
              color: colors.typography.secondaryText,
            }}
          >
            Revenue trend across products
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          {["7M", "1Y", "All"].map((item) => (
            <button
              key={item}
              onClick={() => handleChange(item)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                background:
                  active === item
                    ? colors.brand.primaryOrange
                    : colors.base.background,
                color:
                  active === item
                    ? colors.typography.white
                    : colors.typography.primaryText,
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}

      <div
        style={{
          height: 320,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={colors.base.border} />

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Line
              dataKey="courses"
              stroke={colors.charts.blue}
              strokeWidth={3}
              dot={false}
            />

            <Line
              dataKey="webinars"
              stroke={colors.charts.purple}
              strokeWidth={3}
              dot={false}
            />

            <Line
              dataKey="sessions"
              stroke={colors.charts.teal}
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 30,
          marginTop: 20,
        }}
      >
        {[
          ["Courses", colors.charts.blue],
          ["Webinars", colors.charts.purple],
          ["1:1 Sessions", colors.charts.teal],
        ].map(([label, color]) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                background: color,
              }}
            />

            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}