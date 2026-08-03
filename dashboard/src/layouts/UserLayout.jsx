// User shell — dark navy top navbar with indigo gradient accents, mirroring
// the mobile app's user theme (Home / Explore / Sessions / Learning tabs).
import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Bell, Search, Store } from "lucide-react";
import colors from "../utils/colors";
import { useAuth, canAccessMarketplace } from "../context/AuthContext";
import { apiFetch, unwrap } from "../utils/api";
import { onSocket } from "../utils/socket";
import { Avatar } from "../components/ui";

const TABS = [
  { to: "/app", label: "Home", end: true },
  { to: "/app/explore", label: "Explore" },
  { to: "/app/sessions", label: "Sessions" },
  { to: "/app/learning", label: "Learning" },
];

export default function UserLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const refreshUnread = () =>
    apiFetch("/notifications/unread-count")
      .then((r) => {
        const d = unwrap(r);
        setUnread(Number(d?.count ?? d?.unread_count ?? d ?? 0) || 0);
      })
      .catch(() => {});

  useEffect(() => {
    refreshUnread();
    const off = onSocket("new_notification", () => setUnread((u) => u + 1));
    const onRead = () => refreshUnread();
    window.addEventListener("manchly:notifications-read", onRead);
    return () => {
      off();
      window.removeEventListener("manchly:notifications-read", onRead);
    };
  }, []);

  const tabStyle = ({ isActive }) => ({
    padding: "8px 18px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    color: isActive ? "#fff" : colors.user.subHeading,
    background: isActive ? colors.gradients.indigo : "transparent",
    boxShadow: isActive ? "0 4px 14px rgba(90,104,243,0.4)" : "none",
    transition: "all 0.15s ease",
  });

  const iconBtn = {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: `1px solid ${colors.user.border}`,
    background: colors.user.card,
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.user.bg, color: "#fff" }}>
      <header
        style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(8,12,37,0.92)", backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${colors.user.border}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 18 }}>
          <h1
            onClick={() => navigate("/app")}
            style={{ margin: 0, fontSize: 24, fontWeight: 900, cursor: "pointer", fontFamily: "Montserrat, Inter, sans-serif", background: colors.gradients.indigo, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Manchly
          </h1>

          <nav style={{ display: "flex", gap: 6, flex: 1, marginLeft: 8 }}>
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} style={tabStyle}>
                {t.label}
              </NavLink>
            ))}
            {canAccessMarketplace(user) && (
              <NavLink to="/app/marketplace" style={tabStyle}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Store size={14} /> Marketplace</span>
              </NavLink>
            )}
          </nav>

          <button style={iconBtn} onClick={() => navigate("/app/explore")} title="Search">
            <Search size={18} />
          </button>
          <button style={iconBtn} onClick={() => navigate("/app/notifications")} title="Notifications">
            <Bell size={18} />
            {unread > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, padding: "0 4px", borderRadius: 9, background: colors.gradients.danger, color: "#fff", fontSize: 10.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
          <div onClick={() => navigate("/app/profile")} style={{ cursor: "pointer" }}>
            <Avatar src={user?.profile_image} name={user?.name || "U"} size={40} />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 80px" }}>
        <Outlet />
      </main>
    </div>
  );
}
