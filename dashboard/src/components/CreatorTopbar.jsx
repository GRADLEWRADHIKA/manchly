import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowDownToLine, CheckCheck, ExternalLink } from "lucide-react";
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
  const [openDropdown, setOpenDropdown] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const dropdownRef = useRef(null);

  // ---------- Meta Pixel Initialization ----------
  useEffect(() => {
    if (!window.fbq) {
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

      window.fbq("init", "1934937467197429");
    }
    window.fbq("track", "PageView");
  }, []);

  // ---------- Unread Count & Socket ----------
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch recent notifications when dropdown opens
  const fetchRecentNotifications = async () => {
    setLoadingList(true);
    try {
      const res = await apiFetch("/notifications?limit=5");
      const data = unwrap(res);
      setNotificationsList(Array.isArray(data) ? data : data?.notifications || []);
    } catch (err) {
      console.warn("Failed to fetch notifications list", err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleBellClick = (e) => {
    e.stopPropagation();

    // If custom callback is provided, run it
    if (typeof onNotifications === "function") {
      onNotifications(e);
      return;
    }

    // Toggle local popover menu
    const nextState = !openDropdown;
    setOpenDropdown(nextState);
    if (nextState) {
      fetchRecentNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "POST" });
      setUnread(0);
      window.dispatchEvent(new Event("manchly:notifications-read"));
    } catch (err) {
      console.error(err);
    }
  };

  const showDot = hasUnreadNotifications ?? unread > 0;
  const firstName = String(user?.name || "Creator").split(" ")[0];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: "14px 32px",
        background: "#fff",
        borderBottom: `1px solid ${colors.base.border}`,
        position: "sticky",
        top: 0,
        zIndex: 90,
        ...style,
      }}
    >
      {/* Greeting */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 15.5,
            fontWeight: 900,
            color: colors.typography.primaryText,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {greeting()}, {firstName} 👋
        </div>
        <div style={{ fontSize: 12, color: colors.typography.secondaryText, marginTop: 1 }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div style={{ textAlign: "right", paddingRight: 12, borderRight: `1px solid ${colors.base.border}` }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: colors.typography.secondaryText,
            }}
          >
            Lifetime Earnings
          </div>
          <div style={{ fontSize: 16.5, fontWeight: 900, color: colors.typography.primaryText, lineHeight: 1.2 }}>
            {formatCurrency(selfFetch ? earnings : totalRevenue)}
          </div>
        </div>

        <button
          type="button"
          onClick={onWithdraw || (() => navigate("/creator/wallet"))}
          style={{
            border: "none",
            cursor: "pointer",
            borderRadius: 11,
            padding: "9px 16px",
            fontWeight: 800,
            fontSize: 13,
            fontFamily: "inherit",
            color: "#fff",
            background: G.orange,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            boxShadow: "0 4px 12px rgba(245,166,35,0.3)",
          }}
        >
          <ArrowDownToLine size={14} /> Withdraw
        </button>

        {/* Notification Bell Container */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            type="button"
            onClick={handleBellClick}
            title="Notifications"
            style={{
              background: openDropdown ? "rgba(0,0,0,0.06)" : "transparent",
              border: "none",
              cursor: "pointer",
              padding: 8,
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              color: colors.typography.primaryText,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!openDropdown) e.currentTarget.style.background = "rgba(0,0,0,0.05)";
            }}
            onMouseLeave={(e) => {
              if (!openDropdown) e.currentTarget.style.background = "transparent";
            }}
          >
            <Bell size={21} strokeWidth={2.2} />
            {showDot && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 7,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  backgroundColor: "#F5A623",
                  border: "2px solid #fff",
                }}
              />
            )}
          </button>

          {/* Popover Dropdown Menu */}
          {openDropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                width: 320,
                background: "#ffffff",
                borderRadius: 16,
                boxShadow: "0 12px 32px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.08)",
                padding: "16px",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: colors.typography.primaryText }}>
                  Notifications {unread > 0 && `(${unread})`}
                </div>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    style={{
                      background: "none",
                      border: "none",
                      color: colors.typography.secondaryText,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <CheckCheck size={14} /> Mark read
                  </button>
                )}
              </div>

              {/* List Content */}
              <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {loadingList ? (
                  <div style={{ fontSize: 13, color: colors.typography.secondaryText, textAlign: "center", padding: "16px 0" }}>
                    Loading...
                  </div>
                ) : notificationsList.length > 0 ? (
                  notificationsList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: item.read ? "#fafafa" : "rgba(245,166,35,0.08)",
                        fontSize: 13,
                        lineHeight: 1.4,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: colors.typography.primaryText }}>
                        {item.title || "Notification"}
                      </div>
                      <div style={{ color: colors.typography.secondaryText, fontSize: 12, marginTop: 2 }}>
                        {item.message || item.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 13, color: colors.typography.secondaryText, textAlign: "center", padding: "16px 0" }}>
                    No notifications yet
                  </div>
                )}
              </div>

              {/* Footer View All */}
              <button
                type="button"
                onClick={() => {
                  setOpenDropdown(false);
                  navigate("/creator/notifications");
                }}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  background: "#f5f5f7",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: colors.typography.primaryText,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                View all notifications <ExternalLink size={13} />
              </button>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div
          onClick={() => navigate("/creator/settings")}
          style={{ cursor: "pointer", display: "flex" }}
          title="Profile & Settings"
        >
          <Avatar src={user?.profile_image} name={user?.name || "C"} size={32} />
        </div>
      </div>
    </div>
  );
}