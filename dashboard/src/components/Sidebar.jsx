import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  BookOpen,
  MonitorPlay,
  Users,
  Settings,
  LogOut,
  Sparkles,
  Wallet,
  //ShieldCheck,
  //Bell,
  LifeBuoy,
  //Clapperboard,
  StarIcon,
  Rocket
} from "lucide-react";

import colors from "../utils/colors";
import { Modal } from "./ui";

const MENU_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "courses", label: "Courses", icon: BookOpen },
  //{ key: "studio", label: "Courses", icon: Clapperboard },
  { key: "webinars", label: "Webinars", icon: MonitorPlay },
  { key: "sessions", label: "1:1 Sessions", icon: Users },
  { key: "creator-hub", label: "Creator Hub", icon: StarIcon },
  { key: "ai", label: "AI Assistant", icon: Sparkles },
  //{ key: "course-planner", label: "Course Planner", icon: Rocket },
  { key: "wallet", label: "Payouts", icon: Wallet },
  //{ key: "kyc", label: "KYC", icon: ShieldCheck },
  { key: "community", label: "Community", icon: Users },
  //{ key: "notifications", label: "Notifications", icon: Bell },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "help", label: "Help Center", icon: LifeBuoy },
];

export default function Sidebar({
  active = "dashboard",
  onNavigate,
  onLogout,
}) {
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <>
      <aside
        style={{
          width: 260,
          minHeight: "100vh",
          background: colors.base.cardBackground,
          borderRight: `1px solid ${colors.base.border}`,
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
          {/* Logo */}
          <div style={{ padding: 24 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                background: colors.gradients.orange,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "Montserrat, Inter, sans-serif",
              }}
            >
              Manchly
            </h1>

            <p
              style={{
                marginTop: 6,
                color: colors.typography.secondaryText,
                fontSize: 14,
              }}
            >
              Creator Suite
            </p>
          </div>

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "0 12px 12px",
            }}
          >
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active || (item.key === "creator-hub" && active === "creator");

              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate?.(item.key)}
                  style={{
                    border: "none",
                    background: isActive ? colors.gradients.goldSoft : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 16px",
                    borderRadius: 10,
                    borderLeft: isActive
                      ? `4px solid ${colors.brand.primaryOrange}`
                      : "4px solid transparent",
                    color: isActive ? "#6B4A0E" : colors.typography.primaryText,
                    fontSize: 14.5,
                    fontWeight: isActive ? 800 : 500,
                    boxShadow: isActive ? "0 4px 12px rgba(214,156,63,0.28)" : "none",
                    textAlign: "left",
                  }}
                >
                  <Icon
                    size={19}
                    color={isActive ? "#6B4A0E" : colors.typography.primaryText}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: `1px solid ${colors.base.border}`,
            padding: 20,
          }}
        >
          <button
            onClick={() => setConfirmLogout(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 600,
              color: "#D32F2F",
            }}
          >
            <LogOut size={20} />
            Log out
          </button>
        </div>
      </aside>

      {/* Render logout modal outside the sidebar stacking context using createPortal */}
      {confirmLogout &&
        typeof document !== "undefined" &&
        createPortal(
          <Modal
            open={confirmLogout}
            onClose={() => setConfirmLogout(false)}
            title="Log out?"
            width={380}
          >
            <p style={{ margin: "0 0 18px", color: colors.typography.secondaryText, fontSize: 14, lineHeight: 1.6 }}>
              You'll be signed out of Manchly Creator Suite on this device.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmLogout(false)}
                style={{
                  flex: 1,
                  border: `1.5px solid ${colors.base.border}`,
                  background: "#fff",
                  color: colors.typography.primaryText,
                  borderRadius: 12,
                  padding: "11px 16px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmLogout(false);
                  onLogout?.();
                }}
                style={{
                  flex: 1,
                  border: "none",
                  background: colors.gradients.danger,
                  color: "#fff",
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
                  boxShadow: "0 6px 16px rgba(220,38,38,0.3)",
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