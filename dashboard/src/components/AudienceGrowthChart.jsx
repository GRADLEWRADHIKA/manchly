import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import colors from "../utils/colors";

export default function AudienceGrowthChart({ data = [] }) {
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
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{
            margin: 0,
            color: colors.typography.primaryText,
          }}
        >
          Audience growth
        </h3>

        <p
          style={{
            marginTop: 6,
            color: colors.typography.secondaryText,
            fontSize: 14,
          }}
        >
          Learners reached vs. new enrollments
        </p>
      </div>

      {/* Chart */}
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={colors.base.border} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />

            <Line
              dataKey="enrollments"
              stroke={colors.brand.primaryOrange}
              strokeWidth={3}
              dot={{
                fill: colors.brand.primaryOrange,
                strokeWidth: 0,
                r: 5,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}