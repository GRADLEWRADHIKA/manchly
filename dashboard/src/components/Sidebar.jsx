import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  MonitorPlay,
  Users,
  CreditCard,
  UsersRound,
  Settings,
  LogOut,
  Sparkles,
  Wallet,
  ShieldCheck,
  MessageCircle,
  Bell,
  Landmark,
  LifeBuoy,
  Clapperboard,
} from "lucide-react";

import colors from "../utils/colors";

const MENU_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "studio", label: "Course Studio", icon: Clapperboard },
  { key: "webinars", label: "Webinars", icon: MonitorPlay },
  { key: "sessions", label: "1:1 Sessions", icon: Users },
  { key: "ai", label: "AI Assistant", icon: Sparkles },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "wallet", label: "Wallet & Payouts", icon: Wallet },
  { key: "kyc", label: "KYC", icon: ShieldCheck },
  { key: "chat", label: "Messages", icon: MessageCircle },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "community", label: "Community", icon: UsersRound },
  { key: "telegram", label: "Telegram", icon: Landmark },
  { key: "help", label: "Help Center", icon: LifeBuoy },
  { key: "settings", label: "Profile & Settings", icon: Settings },
];

export default function Sidebar({
  active = "dashboard",
  onNavigate,
  onLogout,
}) {
  return (
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
            const isActive = item.key === active;

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
          onClick={onLogout}
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
  );
}
