import React from "react";
import { Eye, Pencil, BarChart2, Trash2, Phone } from "lucide-react";
import colors from "../../utils/colors";
import { Avatar, Badge } from "../../components/ui";
import { formatCurrency } from "../../utils/formatters";

export default function SessionRow({ s, onCall, onPreview, onEdit, onPerformance, onDelete }) {
  const caller = s.caller || s.user || {};
  const status = String(s.status || "").toUpperCase();
  const isUpcoming = status === "PENDING" || status === "ACTIVE";

  return (
    <tr style={{ borderBottom: `1px solid ${colors.base.border}` }}>
      <td style={{ padding: "10px 8px" }}>
        <input type="checkbox" style={{ cursor: "pointer" }} />
      </td>

      {/* User */}
      <td style={{ padding: "10px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar src={caller.profile_image} name={caller.name || "U"} size={34} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.typography.primaryText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
              {caller.name || "User"}
            </div>
            {caller.email && (
              <div style={{ fontSize: 11, color: colors.typography.secondaryText, marginTop: 1 }}>
                {caller.email}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Date & Time */}
      <td style={{ padding: "10px 8px" }}>
        <span style={{ fontSize: 12.5, color: colors.typography.primaryText }}>
          {s.scheduled_at
            ? new Date(s.scheduled_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : "Instant"}
        </span>
      </td>

      {/* Duration */}
      <td style={{ padding: "10px 8px" }}>
        <span style={{ fontSize: 13, color: colors.typography.primaryText }}>{s.duration || 30} min</span>
      </td>

      {/* Amount */}
      <td style={{ padding: "10px 8px" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.brand?.successGreen || "#22C55E" }}>
          {s.amount != null ? formatCurrency(s.amount) : "--"}
          {s.rate_per_min ? <span style={{ fontSize: 11, color: colors.typography.secondaryText, fontWeight: 500 }}> (₹{s.rate_per_min}/min)</span> : ""}
        </span>
      </td>

      {/* Status */}
      <td style={{ padding: "10px 8px" }}>
        <Badge color={status === "COMPLETED" ? "#16A34A" : status === "CANCELLED" ? "#DC2626" : status === "MISSED" ? "#DC2626" : "#2563EB"}>
          {status === "PENDING" || status === "ACTIVE" ? "Upcoming" : status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      </td>

      {/* Actions */}
      <td style={{ padding: "10px 8px", textAlign: "right" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
          {isUpcoming && (
            <button
              type="button"
              onClick={() => onCall?.(s)}
              title="Call"
              style={{ ...iconButtonStyle, background: "#F5A623", borderColor: "#F5A623" }}
            >
              <Phone size={13} color="#fff" />
            </button>
          )}
          <button type="button" onClick={() => onPreview?.(s)} title="Preview Session" style={iconButtonStyle}>
            <Eye size={14} color={colors.typography.secondaryText} />
          </button>
          <button type="button" onClick={() => onEdit?.(s)} title="Edit Session" style={iconButtonStyle}>
            <Pencil size={14} color={colors.typography.secondaryText} />
          </button>
          <button type="button" onClick={() => onPerformance?.(s)} title="Session Performance" style={iconButtonStyle}>
            <BarChart2 size={14} color={colors.typography.secondaryText} />
          </button>
          <button type="button" onClick={() => onDelete?.(s)} title="Cancel Session" style={iconButtonStyle}>
            <Trash2 size={14} color="#EF4444" />
          </button>
        </div>
      </td>
    </tr>
  );
}

const iconButtonStyle = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: `1px solid ${colors.base.border}`,
  background: colors.base.cardBackground,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};