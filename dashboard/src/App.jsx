import React, { useState } from "react";

import AuthPage from "./AuthPage";
import StudentDashboard from "./StudentDasboard.jsx";
import CourseStudio from "./CourseStudio";
import WebinarManager from "./WebinarManager";
import PaymentsDashboard from "./PaymentsDashboard";
import CreatorSettlementPortal from "./CreatorSettlementsPortal";
import CreateKycDashboard from "./CreateKycDashboard.jsx";
import SessionHub from "./SessionHub";

export default function App() {

  // USER STATE
  const [user, setUser] = useState(() => {
    const savedUser =
      localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  // ROLE NORMALIZER
  const role =
    user?.user_type ||
    user?.role ||
    user?.tab;
  // THEME

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

  // ACTIVE PAGE
  const [activePage, setActivePage] =
    useState("dashboard");
  // NOT LOGGED IN

  if (!user) {
    return (
      <AuthPage
        onAuthSuccess={(authData) => {
          console.log(
            "AUTH SUCCESS:",
            authData
          );

          const finalUser =
            authData?.user || authData;

          localStorage.setItem(
            "user",
            JSON.stringify(finalUser)
          );

          setUser(finalUser);

          const finalRole =
            finalUser?.user_type ||
            finalUser?.role ||
            finalUser?.tab;

          if (
            finalRole === "CREATOR"
          ) {
            setActivePage("kyc");
          } else {
            setActivePage("dashboard");
          }
        }}
      />
    );
  }

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
        fontFamily:
          "system-ui, -apple-system, sans-serif",
      }}
    >
  
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
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
              fontSize: 32,
              fontWeight: 900,
            }}
          >
            Manchly Platform
          </h1>

          <p
            style={{
              color: B.textSec,
              marginTop: 8,
            }}
          >
            Welcome,{" "}
            {user?.name || "User"}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: B.sidebar,
              border: `1px solid ${B.border}`,
              padding: "12px 18px",
              borderRadius: 12,
              color: B.orange,
              fontWeight: 800,
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
              padding: "12px 18px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Logout
          </button>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 24,
          flexWrap: "wrap",
        }}
      >
        {role === "USER" && (
          <>
            <NavButton
              label="Dashboard"
              active={
                activePage === "dashboard"
              }
              onClick={() =>
                setActivePage(
                  "dashboard"
                )
              }
              B={B}
            />

            <NavButton
              label="Payments"
              active={
                activePage === "payments"
              }
              onClick={() =>
                setActivePage(
                  "payments"
                )
              }
              B={B}
            />

            <NavButton
              label="1-on-1 Sessions"
              active={
                activePage === "sessions"
              }
              onClick={() =>
                setActivePage(
                  "sessions"
                )
              }
              B={B}
            />
          </>
        )}

        {role === "CREATOR" && (
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
              label="Payments"
              active={
                activePage === "payments"
              }
              onClick={() =>
                setActivePage(
                  "payments"
                )
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

            <NavButton
              label="Courses"
              active={
                activePage === "courses"
              }
              onClick={() =>
                setActivePage(
                  "courses"
                )
              }
              B={B}
            />

            <NavButton
              label="Webinars"
              active={
                activePage ===
                "webinars"
              }
              onClick={() =>
                setActivePage(
                  "webinars"
                )
              }
              B={B}
            />

            <NavButton
              label="1-on-1 Sessions"
              active={
                activePage === "sessions"
              }
              onClick={() =>
                setActivePage(
                  "sessions"
                )
              }
              B={B}
            />
          </>
        )}
      </div>

      <div style={{ padding: 24 }}>
        {activePage === "dashboard" &&
          role === "USER" && (
            <StudentDashboard />
          )}
        {activePage === "payments" && (
          <PaymentsDashboard
            user_type={role}
          />
        )}
        {activePage === "kyc" &&
          role === "CREATOR" && (
            <CreateKycDashboard />
          )}

        {activePage ===
          "settlements" &&
          role === "CREATOR" && (
            <CreatorSettlementPortal />
          )}

        {activePage === "courses" &&
          role === "CREATOR" && (
            <CourseStudio
              B={B}
              userProfile={{
                user_type:
                  "CREATOR",
                name:
                  user?.name ||
                  "Creator",
              }}
            />
          )}

        {activePage ===
          "webinars" &&
          role === "CREATOR" && (
            <WebinarManager
              B={B}
              userProfile={{
                user_type:
                  "CREATOR",
                name:
                  user?.name ||
                  "Creator",
              }}
            />
          )}

        {activePage === "sessions" && (
          <SessionHub
            user_type={role}
            user={user}
          />
        )}
      </div>
    </div>
  );
}

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
        color:
          active ? "#000" : "#fff",
        border: `1px solid ${B.border}`,
        padding: "12px 20px",
        borderRadius: 12,
        cursor: "pointer",
        fontWeight: 700,
        transition: "0.2s ease",
      }}
    >
      {label}
    </button>
  );
}