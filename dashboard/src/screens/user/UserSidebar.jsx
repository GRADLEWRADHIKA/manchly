import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  PlayCircle,
  Users,
  Bell,
  LifeBuoy,
  Settings,
  LogOut,
} from "lucide-react";
import colors from "../../utils/colors";
import { Modal } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const USER_MENU_ITEMS = [
  { key: "home", label: "Home", icon: LayoutDashboard, path: "/app/home" },
  { key: "explore", label: "Explore", icon: BookOpen, path: "/app/explore" },
  { key: "learning", label: "My Learning", icon: PlayCircle, path: "/app/learning" },
  { key: "sessions", label: "1:1 Experts", icon: Users, path: "/app/sessions" },
  { key: "notifications", label: "Notifications", icon: Bell, path: "/app/notifications" },
  { key: "help", label: "Help Center", icon: LifeBuoy, path: "/app/help" },
  { key: "settings", label: "Settings", icon: Settings, path: "/app/settings" },
];

export default function UserSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const activePath = location.pathname;

  return (
    <>
      <aside
        style={{
          width: 260,
          minHeight: "100vh",
          background: colors.user?.nav || "#080C25",
          borderRight: `1px solid ${colors.user?.border || "rgba(255, 255, 255, 0.08)"}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          maxHeight: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Top Section */}
        <div>
          {/* Logo Branding */}
          <div style={{ padding: "24px 20px 18px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 900,
                background: colors.gradients?.indigo || "linear-gradient(135deg, #5A68F3 0%, #7B88DD 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "Montserrat, Inter, sans-serif",
                letterSpacing: -0.5,
              }}
            >
              Manchly
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                color: colors.user?.subHeading || "#73799B",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Learner Portal
            </p>
          </div>

          {/* Navigation Links */}
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "0 12px 12px",
            }}
          >
            {USER_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                activePath === item.path ||
                (item.path !== "/app/home" && activePath.startsWith(item.path));

              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  style={{
                    border: "none",
                    background: isActive
                      ? colors.user?.cardSoft || "#242843"
                      : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "11px 16px",
                    borderRadius: 12,
                    borderLeft: isActive
                      ? `4px solid ${colors.user?.accent || "#4F60FA"}`
                      : "4px solid transparent",
                    color: isActive
                      ? colors.user?.text || "#FFFFFF"
                      : colors.user?.subHeading || "#73799B",
                    fontSize: 14.5,
                    fontWeight: isActive ? 800 : 500,
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon
                    size={19}
                    color={isActive ? colors.user?.accentSoft || "#BDC2FF" : "inherit"}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div
          style={{
            borderTop: `1px solid ${colors.user?.border || "rgba(255, 255, 255, 0.08)"}`,
            padding: 16,
          }}
        >
          <button
            onClick={() => setConfirmLogout(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14.5,
              fontWeight: 600,
              color: colors.status?.error || "#EF4444",
              borderRadius: 10,
              transition: "background 0.2s ease",
            }}
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Portal */}
      {confirmLogout &&
        typeof document !== "undefined" &&
        createPortal(
          <Modal
            open={confirmLogout}
            onClose={() => setConfirmLogout(false)}
            title="Log out?"
            width={380}
            dark={true}
            style={{
              background: colors.user?.card || "#111827",
              color: colors.user?.text || "#FFFFFF",
              border: `1px solid ${colors.user?.border || "rgba(255, 255, 255, 0.12)"}`,
            }}
          >
            <p
              style={{
                margin: "0 0 20px",
                color: colors.user?.subHeading || "rgba(255, 255, 255, 0.65)",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to log out of your Manchly account?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmLogout(false)}
                style={{
                  flex: 1,
                  border: `1px solid ${colors.user?.border || "rgba(255, 255, 255, 0.12)"}`,
                  background: "rgba(255, 255, 255, 0.06)",
                  color: colors.user?.text || "#FFFFFF",
                  borderRadius: 12,
                  padding: "11px 16px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmLogout(false);
                  logout?.();
                }}
                style={{
                  flex: 1,
                  border: "none",
                  background: colors.gradients?.danger || "#EF4444",
                  color: "#FFFFFF",
                  borderRadius: 12,
                  padding: "11px 16px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 6px 16px rgba(239, 68, 68, 0.3)",
                }}
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          </Modal>,
          document.body
        )}
    </>
  );
}