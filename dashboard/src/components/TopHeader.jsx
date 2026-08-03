// Thin wrapper kept for Radhika's Dashboard/Courses screens — renders the
// unified CreatorTopbar with the data those screens already fetch.
import React from "react";
import CreatorTopbar from "./CreatorTopbar";

export default function TopHeader({
  totalRevenue = 0,
  walletBalance = 0, // eslint-disable-line no-unused-vars — superseded by the unified bar
  hasUnreadNotifications = false,
  onWithdraw,
  onNotifications,
}) {
  return (
    <CreatorTopbar
      totalRevenue={totalRevenue}
      hasUnreadNotifications={hasUnreadNotifications}
      onWithdraw={onWithdraw}
      onNotifications={onNotifications}
      style={{ margin: "-32px -32px 24px" }}
    />
  );
}
