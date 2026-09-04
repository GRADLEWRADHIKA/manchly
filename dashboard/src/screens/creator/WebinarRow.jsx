import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  Pencil,
  BarChart2,
  MoreHorizontal,
  FileText,
  UserPlus,
  Link as LinkIcon,
  Users as UsersIcon,
  Trash2,
  X,
} from "lucide-react";
import colors from "../../utils/colors";
import { formatCurrency } from "../../utils/formatters";

export default function WebinarRow({
  w,
  isPastFn,
  isLiveFn,
  startDateFn,
  onEdit,
  onDelete,
  onShare,
  onCopyZoom,
  onPreview,
  onAddUser,
  onViewAttendees,
  onSetDraft,
  onPerformance
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPerfOpen, setIsPerfOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [perfPosition, setPerfPosition] = useState({ top: 0, left: 0 });

  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);
  const perfBtnRef = useRef(null);
  const perfRef = useRef(null);

  const s = startDateFn(w);
  const live = isLiveFn(w);
  const past = isPastFn(w);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && !menuBtnRef.current?.contains(e.target)) {
        setIsMenuOpen(false);
      }
      if (perfRef.current && !perfRef.current.contains(e.target) && !perfBtnRef.current?.contains(e.target)) {
        setIsPerfOpen(false);
      }
    }
    if (isMenuOpen || isPerfOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, isPerfOpen]);

 const openMenu = () => {
  if (menuBtnRef.current) {
    const rect = menuBtnRef.current.getBoundingClientRect();
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow < menuHeight) {
      setMenuPosition({ top: rect.top - menuHeight - 6, left: rect.right - 170 });
    } else {
      setMenuPosition({ top: rect.bottom + 6, left: rect.right - 170 });
    }
  }
  setIsMenuOpen((prev) => !prev);
};


  const attendeeCount = w._count?.enrollments ?? w.enrollment_count ?? 0;
  const revenue = w.revenue ?? null;
  const refundedCount = w.refunded_count ?? 0;

  return (
    <tr style={{ borderBottom: `1px solid ${colors.base.border}` }}>
      <td style={{ padding: "12px 10px" }}>
        <input type="checkbox" style={{ cursor: "pointer" }} />
      </td>

      {/* Webinar thumbnail + title */}
      <td style={{ padding: "12px 10px", cursor: "pointer" }} onClick={() => onEdit?.(w)}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              flexShrink: 0,
              backgroundColor: "rgba(0,0,0,0.04)",
              backgroundImage: w.thumbnail ? `url(${w.thumbnail})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: colors.typography.primaryText,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 220,
              }}
            >
              {w.title}
            </div>
            {w.category && (
              <div style={{ fontSize: 11.5, color: colors.typography.secondaryText, marginTop: 2 }}>
                {w.category}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td style={{ padding: "12px 10px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 999,
            background: live ? "rgba(220,38,38,0.1)" : w.status === "DRAFT" ? "rgba(180,83,9,0.1)" : past ? "rgba(107,114,128,0.1)" : "rgba(22,163,74,0.1)",
            color: live ? "#DC2626" : w.status === "DRAFT" ? "#B45309" : past ? "#6B7280" : "#16A34A",
          }}
        >
          {live ? "● Live" : w.status === "DRAFT" ? "Draft" : past ? "Completed" : "Upcoming"}
        </span>
      </td>

      {/* Date & Time */}
      <td style={{ padding: "12px 10px" }}>
        <span style={{ fontSize: 12.5, color: colors.typography.primaryText }}>
          {s
            ? s.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
              " " +
              s.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
            : "TBA"}
        </span>
      </td>

      {/* Attendees */}
      <td style={{ padding: "12px 10px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: colors.typography.primaryText }}>
          <UsersIcon size={13} color={colors.typography.secondaryText} />
          {attendeeCount}
          {w.max_participants ? ` / ${w.max_participants}` : ""}
        </span>
      </td>

      {/* Revenue */}
      <td style={{ padding: "12px 10px" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.brand?.successGreen || "#22C55E" }}>
          {Number(w.price) === 0 ? "Free" : revenue != null ? formatCurrency(revenue) : "--"}
        </span>
      </td>

      {/* Actions */}
      <td style={{ padding: "12px 10px", textAlign: "right" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => onPreview?.(w)} title="Preview Webinar" style={iconButtonStyle}>
            <Eye size={14} color={colors.typography.secondaryText} />
          </button>
          <button type="button" onClick={() => onEdit?.(w)} title="Edit Webinar" style={iconButtonStyle}>
            <Pencil size={14} color={colors.typography.secondaryText} />
          </button>
         <button type="button" onClick={() => onPerformance?.(w)} title="Performance" style={iconButtonStyle}>
  <BarChart2 size={14} color={colors.typography.secondaryText} />
</button>
          <button ref={menuBtnRef} type="button" onClick={openMenu} title="More" style={{ ...iconButtonStyle, background: isMenuOpen ? "rgba(0,0,0,0.06)" : colors.base.cardBackground }}>
            <MoreHorizontal size={14} color={colors.typography.secondaryText} />
          </button>
        </div>
      </td>

      {/* More menu — portaled */}
      {isMenuOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: 180,
              background: "#FFFFFF",
              border: `1px solid ${colors.base.border}`,
              borderRadius: 12,
              boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
              zIndex: 2000,
              padding: "4px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <button type="button" onClick={() => { setIsMenuOpen(false); onSetDraft?.(w); }} style={menuItemStyle}>
              <FileText size={13} color={colors.typography.secondaryText} />
              <span>Draft Webinar</span>
            </button>
            <button type="button" onClick={() => { setIsMenuOpen(false); onAddUser?.(w); }} style={menuItemStyle}>
              <UserPlus size={13} color={colors.typography.secondaryText} />
              <span>Add User</span>
            </button>
            <button type="button" onClick={() => { setIsMenuOpen(false); onShare?.(w); }} style={menuItemStyle}>
              <LinkIcon size={13} color={colors.typography.secondaryText} />
              <span>Copy Link</span>
            </button>
            <button type="button" onClick={() => { setIsMenuOpen(false); onViewAttendees?.(w); }} style={menuItemStyle}>
              <UsersIcon size={13} color={colors.typography.secondaryText} />
              <span>View Attendees</span>
            </button>
            <button type="button" onClick={() => { setIsMenuOpen(false); onDelete?.(w); }} style={{ ...menuItemStyle, color: "#EF4444" }}>
              <Trash2 size={13} color="#EF4444" />
              <span>Delete Webinar</span>
            </button>
          </div>,
          document.body,
        )}

      {/* Performance popover — portaled */}
      {isPerfOpen &&
        createPortal(
          <div
            ref={perfRef}
            style={{
              position: "fixed",
              top: perfPosition.top,
              left: perfPosition.left,
              width: 280,
              background: "#FFFFFF",
              border: `1px solid ${colors.base.border}`,
              borderRadius: 14,
              boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
              zIndex: 2000,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: colors.typography.primaryText }}>
                Webinar Performance
              </span>
              <button type="button" onClick={() => setIsPerfOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={14} color={colors.typography.secondaryText} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: "rgba(34,197,94,0.08)" }}>
                <span style={{ fontSize: 12.5, color: colors.typography.secondaryText }}>Total Revenue</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}>
                  {revenue != null ? formatCurrency(revenue) : "--"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: "rgba(59,130,246,0.08)" }}>
                <span style={{ fontSize: 12.5, color: colors.typography.secondaryText }}>Attendees / Enrollments</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>{attendeeCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: "rgba(239,68,68,0.08)" }}>
                <span style={{ fontSize: 12.5, color: colors.typography.secondaryText }}>Refunds</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>{refundedCount}</span>
              </div>
            </div>
          </div>,
          document.body,
        )}
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

const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  fontSize: 12.5,
  fontWeight: 600,
  color: colors.typography.primaryText,
  cursor: "pointer",
  textAlign: "left",
};