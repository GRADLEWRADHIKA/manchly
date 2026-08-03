import React from "react";
import { Bell } from "lucide-react";
import colors from "../utils/colors";

export default function TopHeader({
  totalRevenue = 0,
  walletBalance = 0,
  hasUnreadNotifications = false,
  onWithdraw,
  onNotifications,
}) {
  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 16,
        marginBottom: 28,
      }}
    >
      {/* Lifetime Earnings */}

      <div
        style={{
          minWidth: 200,
          padding: "14px 20px",
          borderRadius: 16,
          background: colors.base.cardBackground,
          border: `1px solid ${colors.base.border}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: colors.typography.secondaryText,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          Lifetime Earnings
        </span>

        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: colors.typography.primaryText,
          }}
        >
          {formatCurrency(totalRevenue)}
        </span>
      </div>

      {/* Withdraw */}

      <button
        onClick={onWithdraw}
        style={{
          minWidth: 190,
          padding: "14px 22px",
          border: "none",
          borderRadius: 16,
          cursor: "pointer",
          background: colors.brand.primaryOrange,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.8)",
            fontWeight: 600,
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          Withdraw
        </span>

        <span
          style={{
            color: colors.typography.white,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {formatCurrency(walletBalance)}
        </span>
      </button>

      {/* Notifications */}

      <button
        onClick={onNotifications}
        style={{
          position: "relative",
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: `1px solid ${colors.base.border}`,
          background: colors.base.cardBackground,
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Bell
          size={24}
          color={colors.typography.primaryText}
        />

        {hasUnreadNotifications && (
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 14,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: colors.brand.primaryOrange,
              border: "2px solid white",
            }}
          />
        )}
      </button>
    </div>
  );
}