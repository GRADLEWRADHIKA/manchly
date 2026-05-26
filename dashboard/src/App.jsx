import React, { useState } from "react";
import StudentDashboard from "./StudentDasboard";
import WebinarManager from "./WebinarManager";
import CourseStudio from "./CourseStudio";
import PaymentsDashboard from "./PaymentsDashboard";

export default function App() {
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
  // AUTH STATE
  const [authenticated, setAuthenticated] = useState(false);
  const [step, setStep] = useState("signup");
  const [activePage, setActivePage] = useState("dashboard");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    otp: "",
    role: "STUDENT",
  });
  // AUTH SCREEN
  if (!authenticated) {
    return (
      <div
        style={{
          background: B.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 20,
        }}
      >
        <div
          style={{
            width: 430,
            background: B.card,
            border: `1px solid ${B.border}`,
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 0 40px rgba(255,193,7,0.12)",
          }}
        >
          {/* LOGO */}

          <div
            style={{
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                margin: "0 auto 18px",
                borderRadius: 20,
                background: B.orange,
                color: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 32,
              }}
            >
              M
            </div>
            <h1
              style={{
                color: B.orange,
                margin: 0,
                fontSize: 34,
                fontWeight: 900,
              }}
            >
              Manchly
            </h1>
            <p
              style={{
                color: B.textSec,
                marginTop: 10,
                fontSize: 14,
              }}
            >
              Creator & Student Learning Platform
            </p>
          </div>
          {/* SIGNUP */}
          {step === "signup" ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                style={inputStyle(B)}
              />
              <input
                placeholder="Email Address"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                style={inputStyle(B)}
              />
              <input
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                style={inputStyle(B)}
              />
              {/* ROLE SELECTOR */}
              <div style={{ marginTop: 6 }}>
                <div
                  style={{
                    color: B.textSec,
                    marginBottom: 10,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Select Account Type
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                  }}
                >
                  {/* STUDENT */}
                  <button
                    onClick={() =>
                      setForm({
                        ...form,
                        role: "STUDENT",
                      })
                    }
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: 14,
                      border:
                        form.role === "STUDENT"
                          ? `2px solid ${B.orange}`
                          : `1px solid ${B.border}`,
                      background:
                        form.role === "STUDENT"
                          ? "rgba(255,193,7,0.12)"
                          : B.sidebar,
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    Student
                  </button>
                  {/* CREATOR */}
                  <button
                    onClick={() =>
                      setForm({
                        ...form,
                        role: "CREATOR",
                      })
                    }
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: 14,
                      border:
                        form.role === "CREATOR"
                          ? `2px solid ${B.orange}`
                          : `1px solid ${B.border}`,
                      background:
                        form.role === "CREATOR"
                          ? "rgba(255,193,7,0.12)"
                          : B.sidebar,
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    Creator
                  </button>
                </div>
              </div>
              {/* CONTINUE */}
              <button onClick={() => setStep("otp")} style={buttonStyle(B)}>
                Continue
              </button>
            </div>
          ) : (
            // OTP SCREEN
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <input
                placeholder="Enter OTP"
                value={form.otp}
                onChange={(e) =>
                  setForm({
                    ...form,
                    otp: e.target.value,
                  })
                }
                style={inputStyle(B)}
              />
              <button
                onClick={() => setAuthenticated(true)}
                style={buttonStyle(B)}
              >
                Verify OTP
              </button>
              <button
                onClick={() => setStep("signup")}
                style={{
                  background: "transparent",
                  border: `1px solid ${B.border}`,
                  color: B.textSec,
                  padding: "14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  // MAIN PLATFORM
  return (
    <div
      style={{
        background: B.bg,
        minHeight: "100vh",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* HEADER */}
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
            Welcome, {form.name || "User"}
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
            {form.role}
          </div>
          <button
            onClick={() => {
              setAuthenticated(false);
              setStep("signup");
            }}
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
      {/* NAVIGATION */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 24,
          flexWrap: "wrap",
        }}
      >
        {form.role === "STUDENT" && (
          <NavButton
            label="Dashboard"
            active={activePage === "dashboard"}
            onClick={() => setActivePage("dashboard")}
            B={B}
          />
        )}
        {form.role === "CREATOR" && (
          <NavButton
            label="Payments"
            active={activePage === "payments"}
            onClick={() => setActivePage("payments")}
            B={B}
          />
        )}
        {form.role === "CREATOR" && (
          <>
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
          </>
        )}
      </div>
      {/* PAGE CONTENT */}
      <div style={{ padding: 24 }}>
        {/* STUDENT DASHBOARD */}
        {activePage === "dashboard" && <StudentDashboard />}
        {/* PAYMENTS */}
        {activePage === "payments" && form.role === "CREATOR" && (
          <PaymentsDashboard role={form.role} />
        )}
        {/* CREATOR COURSES */}
        {activePage === "courses" && form.role === "CREATOR" && (
          <CourseStudio
            B={B}
            userProfile={{
              role: "CREATOR",
              name: form.name,
            }}
          />
        )}
        {/* CREATOR WEBINARS */}
        {activePage === "webinars" && form.role === "CREATOR" && (
          <WebinarManager
            B={B}
            userProfile={{
              role: "CREATOR",
              name: form.name,
            }}
          />
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
// INPUT STYLE
function inputStyle(B) {
  return {
    background: B.sidebar,
    border: `1px solid ${B.border}`,
    padding: "16px",
    borderRadius: 12,
    color: "white",
    outline: "none",
    fontSize: 15,
    width: "100%",
    boxSizing: "border-box",
  };
}
// BUTTON STYLE
function buttonStyle(B) {
  return {
    background: B.orange,
    color: "#000",
    border: "none",
    padding: "16px",
    borderRadius: 12,
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 15,
    width: "100%",
  };
}
