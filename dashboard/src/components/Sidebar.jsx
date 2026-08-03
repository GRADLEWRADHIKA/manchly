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
} from "lucide-react";

import colors from "../utils/colors";

const MENU_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "courses",
    label: "Courses",
    icon: BookOpen,
  },
  {
    key: "webinars",
    label: "Webinars",
    icon: MonitorPlay,
  },
  {
    key: "sessions",
    label: "1:1 Sessions",
    icon: Users,
  },
  {
    key: "payments",
    label: "Payments",
    icon: CreditCard,
  },
  {
    key: "community",
    label: "Community",
    icon: UsersRound,
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
  },
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
      }}
    >
      {/* Top Section */}
      <div>
        {/* Logo */}

        <div
          style={{
            padding: 24,
          }}
        >
          <h1
            style={{
              margin: 0,
              color: colors.brand.primaryOrange,
              fontSize: 28,
              fontWeight: 800,
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
            gap: 6,
            padding: "0 12px",
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
                  background: isActive
                    ? "#FFF4EA"
                    : "transparent",
                  cursor: "pointer",

                  display: "flex",
                  alignItems: "center",
                  gap: 14,

                  padding: "14px 16px",

                  borderRadius: 10,

                  borderLeft: isActive
                    ? `4px solid ${colors.brand.primaryOrange}`
                    : "4px solid transparent",

                  color: isActive
                    ? colors.brand.primaryOrange
                    : colors.typography.primaryText,

                  fontSize: 15,
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <Icon
                  size={20}
                  color={
                    isActive
                      ? colors.brand.primaryOrange
                      : colors.typography.primaryText
                  }
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