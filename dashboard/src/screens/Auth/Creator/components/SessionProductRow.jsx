import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Pencil,
  Trash2,
  Package,
  MoreHorizontal,
  FileText,
  Globe,
  UserPlus,
  Users,
  Eye,
  Link as LinkIcon,
} from "lucide-react";
import colors from "../../../../utils/colors";
import { Badge } from "../../../../components/ui";
import { toast } from "../../../../utils/toast";
import { formatCurrency } from "../../../../utils/formatters";

const PUBLIC_APP_URL = "https://manchly.com";
const SESSION_LINK_PATH = "/sessions";

const DROPDOWN_WIDTH = 230;
const DROPDOWN_EST_HEIGHT = 240;

const td = { padding: "12px 8px", fontSize: 13, verticalAlign: "middle" };

const iconButtonStyle = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: `1px solid ${colors.base.border}`,
  background: colors.base.cardBackground || "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const activeIconButtonStyle = (color) => ({
  borderColor: color,
  background: `${color}12`,
});

function MenuItem({ icon: Icon, label, onClick, danger }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "none",
        background: hover ? (danger ? "#FEF2F2" : "#F9FAFB") : "transparent",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        color: danger ? "#EF4444" : colors.typography.primaryText,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <Icon
        size={15}
        color={danger ? "#EF4444" : colors.typography.secondaryText}
      />
      <span>{label}</span>
    </button>
  );
}

export default function SessionProductRow({
  p,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddUsers,
  onViewUsers,
  onPreview,
}) {
  const active = p.is_active !== false;

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const moreButtonRef = useRef(null);
  const moreDropdownRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(e.target) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // close on scroll / resize
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menuOpen]);

  const handleToggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }

    const rect = moreButtonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward =
      spaceBelow < DROPDOWN_EST_HEIGHT && rect.top > DROPDOWN_EST_HEIGHT;

    setMenuPos({
      left: Math.max(10, rect.right - DROPDOWN_WIDTH),
      top: openUpward
        ? Math.max(10, rect.top - DROPDOWN_EST_HEIGHT - 6)
        : rect.bottom + 6,
    });
    setMenuOpen(true);
  };

  const handleCopyLink = async () => {
    const url = `${PUBLIC_APP_URL}${SESSION_LINK_PATH}/${p.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Session link copied to clipboard.");
    } catch {
      toast.error("Couldn't copy link. Copy manually: " + url);
    }
    setMenuOpen(false);
  };

  const handleToggleStatus = () => {
    onToggleStatus?.(p);
    setMenuOpen(false);
  };

  const handleAddUsers = () => {
    onAddUsers?.(p);
    setMenuOpen(false);
  };

  const handleViewUsers = () => {
    onViewUsers?.(p);
    setMenuOpen(false);
  };

  return (
    <tr style={{ borderBottom: `1px solid ${colors.base.border}` }}>
      <td style={td}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {p.thumbnail_url ? (
            <img
              src={p.thumbnail_url}
              alt=""
              style={{
                width: 52,
                height: 40,
                borderRadius: 8,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 40,
                borderRadius: 8,
                background: "#FFF1DC",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Package size={18} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>
              {p.title}
            </div>
            {p.description && (
              <div
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  maxWidth: 220,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.description}
              </div>
            )}
          </div>
        </div>
      </td>
      <td style={td}>{p.duration || 30} min</td>
      <td
        style={{
          ...td,
          fontWeight: 800,
          color: Number(p.price) > 0 ? "#111827" : "#16A34A",
        }}
      >
        {Number(p.price) > 0 ? formatCurrency(p.price) : "Free"}
      </td>
      <td style={td}>
        <Badge color={active ? "#16A34A" : "#6B7280"}>
          {active ? "Active" : "Draft"}
        </Badge>
      </td>

      <td style={{ ...td, textAlign: "right" }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={() => onPreview?.(p)}
            title="User View Preview"
            style={iconButtonStyle}
          >
            <Eye size={14} color={colors.typography.secondaryText} />
          </button>
          <button
            type="button"
            onClick={() => onEdit?.(p)}
            title="Edit Session"
            style={iconButtonStyle}
          >
            <Pencil size={14} color={colors.typography.secondaryText} />
          </button>

          <button
            type="button"
            ref={moreButtonRef}
            onClick={handleToggleMenu}
            title="More Actions"
            style={{
              ...iconButtonStyle,
              ...(menuOpen ? activeIconButtonStyle("#8B5CF6") : {}),
            }}
          >
            <MoreHorizontal
              size={14}
              color={menuOpen ? "#8B5CF6" : colors.typography.secondaryText}
            />
          </button>
        </div>
      </td>

      {menuOpen &&
        menuPos &&
        createPortal(
          <div
            ref={moreDropdownRef}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: DROPDOWN_WIDTH,
              background: "#FFFFFF",
              border: `1px solid ${colors.base.border}`,
              borderRadius: 14,
              boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
              zIndex: 2200,
              padding: 6,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <MenuItem
              icon={LinkIcon}
              label="Copy Link"
              onClick={handleCopyLink}
            />
            <MenuItem
              icon={active ? FileText : Globe}
              label={active ? "Move to Draft" : "Publish Session"}
              onClick={handleToggleStatus}
            />
            <MenuItem
              icon={UserPlus}
              label="Add Users"
              onClick={handleAddUsers}
            />
            <MenuItem
              icon={Users}
              label="View Users"
              onClick={handleViewUsers}
            />
            <MenuItem
              icon={Trash2}
              label="Delete Session"
              danger
              onClick={() => {
                setMenuOpen(false);
                onDelete?.(p);
              }}
            />
          </div>,
          document.body,
        )}
    </tr>
  );
}
