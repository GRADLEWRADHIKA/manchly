import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  BookOpen,
  PlayCircle,
  Users,
  UsersRound,
  Bookmark,
  LifeBuoy,
  Settings,
  LogOut,
  Star,
  Clapperboard
} from "lucide-react";
import colors from "../../utils/colors";
import { Modal } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: HomeIcon, path: "/app/home", accentColor: colors.user?.accent || "#22C55E" },
  { key: "explore", label: "Explore", icon: BookOpen, path: "/app/explore", accentColor: colors.navItems?.explore || "#22C55E" },
  { key: "reels", label: "Reels", icon: Clapperboard, path: "/app/reels", accentColor: colors.navItems?.reels || "#EC4899" },
  { key: "learning", label: "My Learning", icon: PlayCircle, path: "/app/learning", accentColor: colors.navItems?.myLearning || "#2B52F6" },
  { key: "sessions", label: "1:1 Sessions", icon: Users, path: "/app/sessions", accentColor: colors.navItems?.sessions || "#1C9DA6" },
  { key: "communities", label: "Community", icon: UsersRound, path: "/app/communities", accentColor: colors.navItems?.communities || "#6B5CF6" },
  //{ key: "saved", label: "Saved", icon: Bookmark, path: "/app/saved", accentColor: colors.navItems?.saved || "#F59E0B" },
  { key: "userhub", label: "User Hub", icon: Star, path: "/app/useHub", accentColor: colors.navItems?.saved || "#F59E0B" },
];

const ACCOUNT_ITEMS = [
  { key: "settings", label: "Settings", icon: Settings, path: "/app/settings" },
  { key: "help", label: "Help Center", icon: LifeBuoy, path: "/app/help" },
];

function NavButton({ item, isActive, onClick }) {
  const Icon = item.icon;
  const accent = item.accentColor || colors.user?.accent || "#22C55E";
  const [hover, setHover] = useState(false);

  const background = isActive
    ? colors.user?.accentSoft || "#ECFDF5"
    : hover
    ? colors.user?.cardSoft || "#F1F5F9"
    : "transparent";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: "none",
        background,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "11px 16px",
        borderRadius: 12,
        borderLeft: isActive ? `4px solid ${accent}` : "4px solid transparent",
        color: isActive ? colors.user?.text || "#1F2937" : colors.user?.subHeading || "#64748B",
        fontSize: 14.5,
        fontWeight: isActive ? 700 : 500,
        fontFamily: "Inter, sans-serif",
        textAlign: "left",
        transition: "all 0.15s ease",
        width: "100%",
      }}
    >
      <Icon size={20} color={isActive ? accent : colors.user?.icon || "#475569"} strokeWidth={2} />
      {item.label}
    </button>
  );
}

export default function UserSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const activePath = location.pathname;
  const isItemActive = (path) => activePath === path || (path !== "/app/home" && activePath.startsWith(path));

  return (
    <>
      <aside
        style={{
          width: 260,
          minHeight: "100vh",
          background: colors.user?.nav || "#FFFFFF",
          borderRight: `1px solid ${colors.user?.border || "#E2E8F0"}`,
          display: "flex",
          flexDirection: "column",
          justify: "space-between",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          maxHeight: "100vh",
          overflowY: "auto",
        }}
      >
        <div>
          <div style={{ padding: "24px 20px 18px" }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: colors.brand?.actionBlue || "#2B52F6", fontFamily: "Inter, sans-serif", letterSpacing: -0.5 }}>
              Manchly
            </h1>
            <p style={{ margin: "4px 0 0", color: colors.user?.subHeading || "#64748B", fontSize: 13, fontWeight: 600 }}>
              Learner Portal
            </p>
          </div>

          {/* Main navigation */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 12px" }}>
            {NAV_ITEMS.map((item) => (
              <NavButton key={item.key} item={item} isActive={isItemActive(item.path)} onClick={() => navigate(item.path)} />
            ))}
          </nav>

          {/* Section separator */}
          <div style={{ height: 1, background: colors.user?.border || "#E2E8F0", margin: "14px 20px" }} />

          {/* Account section */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 12px 12px" }}>
            {ACCOUNT_ITEMS.map((item) => (
              <NavButton key={item.key} item={item} isActive={isItemActive(item.path)} onClick={() => navigate(item.path)} />
            ))}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div style={{ borderTop: `1px solid ${colors.user?.border || "#E2E8F0"}`, padding: 16 }}>
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
              color: colors.user?.logout || "#EF4444",
              borderRadius: 10,
              transition: "background 0.2s ease",
            }}
          >
            <LogOut size={19} color={colors.user?.logout || "#EF4444"} strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Portal — unchanged */}
      {confirmLogout &&
        typeof document !== "undefined" &&
        createPortal(
          <Modal
            open={confirmLogout}
            onClose={() => setConfirmLogout(false)}
            title="Log out?"
            width={380}
            dark={false}
            style={{
              background: colors.user?.card || "#FFFFFF",
              color: colors.user?.text || "#1F2937",
              border: `1px solid ${colors.user?.border || "#E2E8F0"}`,
            }}
          >
            <p style={{ margin: "0 0 20px", color: colors.user?.subHeading || "#64748B", fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to log out of your Manchly account?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmLogout(false)}
                style={{
                  flex: 1, border: `1px solid ${colors.user?.border || "#E2E8F0"}`,
                  background: colors.user?.cardSoft || "#F1F5F9", color: colors.user?.text || "#1F2937",
                  borderRadius: 12, padding: "11px 16px", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmLogout(false); logout?.(); }}
                style={{
                  flex: 1, border: "none", background: colors.user?.logout || "#EF4444", color: "#FFFFFF",
                  borderRadius: 12, padding: "11px 16px", fontSize: 14, fontWeight: 800, cursor: "pointer",
                  fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
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