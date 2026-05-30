import React, { useState } from "react";

import AuthPage from "./AuthPage";
import StudentDashboard from "./StudentDasboard.jsx"; // keep original spelling
import CourseStudio from "./CourseStudio";
import WebinarManager from "./WebinarManager";
import PaymentsDashboard from "./PaymentsDashboard";
import CreatorSettlementPortal from "./CreatorSettlementsPortal";
import CreateKycDashboard from "./CreateKycDashboard.jsx";
import SessionHub from "./SessionHubCreator.jsx";
import SessionHubCreator from "./SessionHubCreator.jsx";

export default function App() {
  // USER STATE — restored from localStorage
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const rawRole = user?.user_type || user?.role || user?.tab || "";
  const role = (() => {
    const r = rawRole.toUpperCase();
    if (r === "CREATOR") return "CREATOR";
    if (r === "STUDENT" || r === "USER") return "USER";
    return r; // pass through anything unknown
  })();

  const B = {
    bg: "#000000",
    card: "#111111",
    sidebar: "#0A0A0A",
    orange: "#FFC107",
    orangeD: "#FFB300",
    border: "rgba(255,255,255,0.1)",
    textPrimary: "#FFFFFF",
    textSec: "#A1A1AA",
    green: "#10B981",
    red: "#EF4444",
  };
  const [activePage, setActivePage] = useState(() => {
    const r = (user?.user_type || user?.role || user?.tab || "").toUpperCase();
    return r === "CREATOR" ? "kyc" : "dashboard";
  });
  // NOT LOGGED IN
  if (!user) {
    return (
      <AuthPage
        onAuthSuccess={(authData) => {
          console.log("AUTH SUCCESS:", authData);
          const finalUser = authData?.user || authData;
          localStorage.setItem("user", JSON.stringify(finalUser));
          setUser(finalUser);

          const finalRole = (
            finalUser?.user_type ||
            finalUser?.role ||
            finalUser?.tab ||
            ""
          ).toUpperCase();

          setActivePage(finalRole === "CREATOR" ? "kyc" : "dashboard");
        }}
      />
    );
  }

  const logout = () => {
    localStorage.removeItem("manchly_token"); // primary key used by all API helpers
    localStorage.removeItem("token"); // legacy fallback
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    setActivePage("dashboard");
  };
  // MAIN APP
  return (
    <div
      style={{
        background: B.bg,
        minHeight: "100vh",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 32px",
          borderBottom: `1px solid ${B.border}`,
          background: B.card,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div>
          <h1
            style={{
              color: B.orange,
              margin: 0,
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            Manchly Platform
          </h1>
          <p style={{ color: B.textSec, marginTop: 6 }}>
            Welcome, {user?.name || "User"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              background: B.sidebar,
              border: `1px solid ${B.border}`,
              padding: "10px 16px",
              borderRadius: 12,
              color: B.orange,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {role}
          </div>
          <button
            onClick={logout}
            style={{
              background: B.red,
              border: "none",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "20px 24px",
          flexWrap: "wrap",
        }}
      >
        {role === "USER" && (
          <>
            <NavButton
              label="Dashboard"
              active={activePage === "dashboard"}
              onClick={() => setActivePage("dashboard")}
              B={B}
            />
            <NavButton
              label="Payments"
              active={activePage === "payments"}
              onClick={() => setActivePage("payments")}
              B={B}
            />
          </>
        )}

        {/* CREATOR NAV */}
        {role === "CREATOR" && (
          <>
            <NavButton
              label="KYC"
              active={activePage === "kyc"}
              onClick={() => setActivePage("kyc")}
              B={B}
            />
            <NavButton
              label="Payments"
              active={activePage === "payments"}
              onClick={() => setActivePage("payments")}
              B={B}
            />
            <NavButton
              label="Settlements"
              active={activePage === "settlements"}
              onClick={() => setActivePage("settlements")}
              B={B}
            />
            <NavButton
              label="Courses"
              active={activePage === "courses"}
              onClick={() => setActivePage("courses")}
              B={B}
            />
            <NavButton
              label="Webinars"
              active={activePage === "webinars"}
              onClick={() => setActivePage("webinars")}
              B={B}
            />
            <NavButton
              label="1-on-1 Sessions"
              active={activePage === "sessions"}
              onClick={() => setActivePage("sessions")}
              B={B}
            />
          </>
        )}
      </div>

      {/* ── PAGE CONTENT ── */}
      <div style={{ padding: "0 24px 24px" }}>
        {/* USER DASHBOARD */}
        {activePage === "dashboard" && role === "USER" && <StudentDashboard />}
        {/* PAYMENTS — both roles */}
        {activePage === "payments" && <PaymentsDashboard user_type={role} />}
        {/* CREATOR KYC */}
        {activePage === "kyc" && role === "CREATOR" && <CreateKycDashboard />}
        {/* CREATOR SETTLEMENTS */}
        {activePage === "settlements" && role === "CREATOR" && (
          <CreatorSettlementPortal />
        )}
        {/* COURSE STUDIO */}
        {activePage === "courses" && role === "CREATOR" && (
          <CourseStudio
            B={B}
            userProfile={{
              user_type: "CREATOR",
              name: user?.name || "Creator",
            }}
          />
        )}
        {/* WEBINAR MANAGER */}
        {activePage === "webinars" && role === "CREATOR" && (
          <WebinarManager
            B={B}
            userProfile={{
              user_type: "CREATOR",
              name: user?.name || "Creator",
            }}
          />
        )}
        {/* SESSION HUB — CREATOR ONLY */}
        {activePage === "sessions" && role?.toUpperCase() === "CREATOR" && (
          <SessionHubCreator user_type={role} user={user} />
        )}
      </div>
    </div>
  );
}
// NAV BUTTON
function NavButton({ label, active, onClick, B }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? B.orange : B.card,
        color: active ? "#000" : "#fff",
        border: `1px solid ${active ? B.orange : B.border}`,
        padding: "11px 20px",
        borderRadius: 12,
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 13,
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}
