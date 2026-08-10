import React from "react";
import { Outlet } from "react-router-dom";
import colors from "../utils/colors";
import UserSidebar from "../screens/user/UserSidebar";
import UserTopbar from "../screens/user/UserTopbar";

export default function UserLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.user?.bg || "#0B0F2A", color: "#fff" }}>
      {/* Left Sidebar */}
      <UserSidebar />

      {/* Right Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <UserTopbar />
        <main style={{ flex: 1, padding: "28px 24px 80px", width: "100%", boxSizing: "border-box" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}