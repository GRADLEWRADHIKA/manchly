import React, { useState } from "react";

import AuthPage from "./AuthPage";
import StudentDashboard from "./StudentDasboard";
import WebinarManager from "./WebinarManager";
import CourseStudio from "./CourseStudio";
import PaymentsDashboard from "./PaymentsDashboard";
import CreatorSettlementsPortal from "./CreatorSettlementsPortal";
import CreatorKycDashboard from "./CreatorKycDashboard";

export default function App() {
  const [user, setUser] = useState(null);

  const [activePage, setActivePage] =
    useState("dashboard");

  // =========================================
  // THEME
  // =========================================

  const B = {
    bg: "#000000",
    card: "#111111",
    sidebar: "#0A0A0A",
    orange: "#FFC107",
    border: "rgba(255,255,255,0.1)",
    textPrimary: "#FFFFFF",
    textSec: "#A1A1AA",
    red: "#EF4444",
  };

  // =========================================
  // AUTH
  // =========================================

  if (!user) {
    return (
      <AuthPage
        onAuthSuccess={(authUser) => {
          console.log(
            "AUTH SUCCESS USER:",
            authUser
          );

          setUser(authUser);

          if (
            authUser?.role === "CREATOR"
          ) {
            setActivePage("kyc");
          } else {
            setActivePage("dashboard");
          }
        }}
      />
    );
  }

  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  // =========================================
  // MAIN UI
  // =========================================

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: B.bg,
        fontFamily:
          "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div
        style={{
          background: B.card,
          borderBottom: `1px solid ${B.border}`,
        }}
        className="sticky top-0 z-50"
      >
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h1
              style={{
                color: B.orange,
              }}
              className="text-3xl font-black"
            >
              Manchly Platform
            </h1>

            <p
              style={{
                color: B.textSec,
              }}
              className="mt-2"
            >
              Welcome,{" "}
              {user?.name || "User"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div
              style={{
                background: B.sidebar,
                border: `1px solid ${B.border}`,
                color: B.orange,
              }}
              className="px-4 py-2 rounded-xl font-bold"
            >
              {user?.role}
            </div>

            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 transition-all px-5 py-2 rounded-xl font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* NAVIGATION */}
      {/* ========================================= */}

      <div className="p-6 flex flex-wrap gap-3">
        {/* ========================================= */}
        {/* STUDENT NAV */}
        {/* ========================================= */}

        {user?.role === "STUDENT" && (
          <>
            <NavButton
              label="Dashboard"
              active={
                activePage === "dashboard"
              }
              onClick={() =>
                setActivePage("dashboard")
              }
              B={B}
            />

            <NavButton
              label="Payments"
              active={
                activePage === "payments"
              }
              onClick={() =>
                setActivePage("payments")
              }
              B={B}
            />
          </>
        )}

        {/* ========================================= */}
        {/* CREATOR NAV */}
        {/* ========================================= */}

        {user?.role === "CREATOR" && (
          <>
            <NavButton
              label="KYC"
              active={
                activePage === "kyc"
              }
              onClick={() =>
                setActivePage("kyc")
              }
              B={B}
            />

            <NavButton
              label="Courses"
              active={
                activePage === "courses"
              }
              onClick={() =>
                setActivePage("courses")
              }
              B={B}
            />

            <NavButton
              label="Webinars"
              active={
                activePage === "webinars"
              }
              onClick={() =>
                setActivePage("webinars")
              }
              B={B}
            />

            <NavButton
              label="Payments"
              active={
                activePage === "payments"
              }
              onClick={() =>
                setActivePage("payments")
              }
              B={B}
            />

            <NavButton
              label="Settlements"
              active={
                activePage ===
                "settlements"
              }
              onClick={() =>
                setActivePage(
                  "settlements"
                )
              }
              B={B}
            />
          </>
        )}
      </div>

      {/* ========================================= */}
      {/* CONTENT */}
      {/* ========================================= */}

      <div className="p-6">
        {/* ========================================= */}
        {/* STUDENT */}
        {/* ========================================= */}

        {activePage ===
          "dashboard" &&
          user?.role ===
            "STUDENT" && (
            <StudentDashboard />
          )}

        {activePage ===
          "payments" &&
          user?.role ===
            "STUDENT" && (
            <PaymentsDashboard
              role="STUDENT"
            />
          )}

        {/* ========================================= */}
        {/* CREATOR */}
        {/* ========================================= */}

        {activePage === "kyc" &&
          user?.role ===
            "CREATOR" && (
            <CreatorKycDashboard />
          )}

        {activePage ===
          "courses" &&
          user?.role ===
            "CREATOR" && (
            <CourseStudio
              userProfile={{
                role: "CREATOR",
                name:
                  user?.name ||
                  "Creator",
              }}
            />
          )}

        {activePage ===
          "webinars" &&
          user?.role ===
            "CREATOR" && (
            <WebinarManager
              userProfile={{
                role: "CREATOR",
                name:
                  user?.name ||
                  "Creator",
              }}
            />
          )}

        {activePage ===
          "payments" &&
          user?.role ===
            "CREATOR" && (
            <PaymentsDashboard
              role="CREATOR"
            />
          )}

        {activePage ===
          "settlements" &&
          user?.role ===
            "CREATOR" && (
            <CreatorSettlementsPortal />
          )}
      </div>
    </div>
  );
}

// =========================================
// NAV BUTTON
// =========================================

function NavButton({
  label,
  active,
  onClick,
  B,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active
          ? B.orange
          : B.card,

        color: active
          ? "#000"
          : "#fff",

        border: `1px solid ${B.border}`,
      }}
      className="px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.02]"
    >
      {label}
    </button>
  );
}