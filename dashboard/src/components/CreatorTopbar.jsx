// Unified creator-suite top bar shown on every /creator page.
// Left: greeting + date. Right: lifetime earnings chip · Withdraw · bell with
// live unread badge · avatar. Self-fetches wallet + unread count unless the
// host screen supplies them (Radhika's Dashboard/Courses pass their own).
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowDownToLine } from "lucide-react";
import { apiFetch, unwrap } from "../utils/api";
import { onSocket } from "../utils/socket";
import colors from "../utils/colors";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./ui";
import { formatCurrency } from "../utils/formatters";

const G = colors.gradients;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function CreatorTopbar({
  totalRevenue = null,
  hasUnreadNotifications = null,
  onWithdraw,
  onNotifications,
  style = {},
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const selfFetch = totalRevenue === null;
  const [earnings, setEarnings] = useState(totalRevenue ?? 0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!selfFetch) return;
    apiFetch("/settlements/wallet")
      .then((r) => {
        const d = unwrap(r);
        const w = d?.wallet || d;
        setEarnings(Number(w?.total_net_earnings ?? w?.lifetime_earnings ?? w?.balance ?? 0));
      })
      .catch(() => {});
    const refresh = () =>
      apiFetch("/notifications/unread-count")
        .then((r) => {
          const d = unwrap(r);
          setUnread(Number(d?.count ?? d?.unread_count ?? d ?? 0) || 0);
        })
        .catch(() => {});
    refresh();
    const off = onSocket("new_notification", () => setUnread((u) => u + 1));
    window.addEventListener("manchly:notifications-read", refresh);
    return () => {
      off();
      window.removeEventListener("manchly:notifications-read", refresh);
    };
  }, [selfFetch]);

  const showDot = hasUnreadNotifications ?? unread > 0;
  const firstName = String(user?.name || "Creator").split(" ")[0];

  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
        padding: "14px 32px", background: "#fff", borderBottom: `1px solid ${colors.base.border}`,
        position: "sticky", top: 0, zIndex: 90,
        ...style,
      }}
    >
      {/* Greeting */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 900, color: colors.typography.primaryText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {greeting()}, {firstName} 👋
        </div>
        <div style={{ fontSize: 12, color: colors.typography.secondaryText, marginTop: 1 }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ textAlign: "right", paddingRight: 12, borderRight: `1px solid ${colors.base.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: colors.typography.secondaryText }}>
            Lifetime Earnings
          </div>
          <div style={{ fontSize: 16.5, fontWeight: 900, color: colors.typography.primaryText, lineHeight: 1.2 }}>
            {formatCurrency(selfFetch ? earnings : totalRevenue)}
          </div>
        </div>

        <button
          onClick={onWithdraw || (() => navigate("/creator/wallet"))}
          style={{
            border: "none", cursor: "pointer", borderRadius: 11, padding: "9px 16px",
            fontWeight: 800, fontSize: 13, fontFamily: "inherit", color: "#fff",
            background: G.orange, display: "inline-flex", alignItems: "center", gap: 7,
            boxShadow: "0 4px 12px rgba(245,166,35,0.3)",
          }}
        >
          <ArrowDownToLine size={14} /> Withdraw
        </button>

        <button
          onClick={onNotifications || (() => navigate("/creator/notifications"))}
          title="Notifications"
          style={{
            position: "relative", width: 38, height: 38, borderRadius: "50%",
            border: `1px solid ${colors.base.border}`, background: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: colors.typography.primaryText,
          }}
        >
          <Bell size={17} />
          {showDot && (
            <span style={{ position: "absolute", top: 5, right: 6, minWidth: 9, height: 9, borderRadius: 99, background: G.danger, border: "2px solid #fff" }} />
          )}
        </button>

        <div onClick={() => navigate("/creator/settings")} style={{ cursor: "pointer", display: "flex" }} title="Profile & Settings">
          <Avatar src={user?.profile_image} name={user?.name || "C"} size={30} />
        </div>
      </div>
    </div>
  );
}
