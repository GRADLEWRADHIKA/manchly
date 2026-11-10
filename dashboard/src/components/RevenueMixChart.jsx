import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import colors from "../utils/colors";

export default function RevenueMixChart({
  courseRev = 0,
  webinarRev = 0,
  sessionRev = 0,
  totalRevenue = 0,
}) {
  const data = [
    {
      name: "Courses",
      value: courseRev,
      color: colors.charts.blue,
    },
    {
      name: "Webinars",
      value: webinarRev,
      color: colors.charts.purple,
    },
    {
      name: "1:1 Sessions",
      value: sessionRev,
      color: colors.charts.teal,
    },
  ];

  return (
    <div
      style={{
        background: colors.base.cardBackground,
        border: `1px solid ${colors.base.border}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            color: colors.typography.primaryText,
          }}
        >
          Revenue mix
        </h3>

        <p
          style={{
            color: colors.typography.secondaryText,
          }}
        >
          Share by product type
        </p>
      </div>

      <div
        style={{
          height: 280,
          position: "relative",
        }}
      >
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              innerRadius={70}
              outerRadius={100}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            ₹{totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {data.map((item) => {
          const percent =
            totalRevenue === 0
              ? 0
              : ((item.value / totalRevenue) * 100).toFixed(1);

          return (
            <div
              key={item.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 10,
                    background: item.color,
                  }}
                />

                <span>{item.name}</span>
              </div>

              <strong>{percent}%</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}