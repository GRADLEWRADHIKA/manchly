// Creator shell — light Creator Suite sidebar (Radhika's design) wrapping all
// creator routes. Navigation keys map 1:1 to /creator/* paths.
import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CreatorTopbar from "../components/CreatorTopbar";
import colors from "../utils/colors";
import { useAuth } from "../context/AuthContext";
import { CREATOR_KEY_TO_PATH, creatorPathFor } from "../utils/creatorNav";

const KEY_TO_PATH = CREATOR_KEY_TO_PATH;

export default function CreatorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const activeKey =
    Object.entries(KEY_TO_PATH).find(
      ([, path]) => path !== "/creator" && location.pathname.startsWith(path)
    )?.[0] || "dashboard";

  return (
    <div style={{ display: "flex", background: colors.base.appBackground, minHeight: "100vh" }}>
      <Sidebar
        active={activeKey}
        onNavigate={(key) => navigate(creatorPathFor(key))}
        onLogout={() => {
          logout();
          navigate("/auth", { replace: true });
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <CreatorTopbar />
        <Outlet />
      </div>
    </div>
  );
}
