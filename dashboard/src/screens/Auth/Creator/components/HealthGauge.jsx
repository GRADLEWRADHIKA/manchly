import React from "react";
import colors from "../../../../utils/colors";

export default function HealthGauge({ score }) {
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const offset = circumference * (1 - pct / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.base.border} strokeWidth={stroke} />
      {score != null && (
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={colors.brand.primaryOrange} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text x="50%" y="46%" textAnchor="middle" fontSize="26" fontWeight="700" fill={colors.typography.primaryText}>
        {score != null ? score : "--"}
      </text>
      <text x="50%" y="62%" textAnchor="middle" fontSize="11" fill={colors.typography.secondaryText}>/100</text>
    </svg>
  );
}