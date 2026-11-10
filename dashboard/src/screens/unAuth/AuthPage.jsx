import React, { useState } from "react";
import S from "./authStyles";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

export default function AuthPage() {
  // Current mode
  const [mode, setMode] = useState("login");

  // Save authentication data
  const persistAuth = (user) => {
    try {
      localStorage.setItem("auth", JSON.stringify(user));
    } catch (err) {
      console.error("Failed to save auth:", err);
    }

    console.log("Authenticated User:", user);

    // Optional: redirect after login/signup
    // window.location.href = "/";
  };

  // Toggle login/signup mode
  const switchMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={S.brand}>Manchly</h1>

          <p style={S.subtitle}>
            {mode === "login"
              ? "Welcome back! Sign in to continue."
              : "Create your account to get started."}
          </p>
        </div>

        {/* Toggle */}
        <div style={S.toggleWrap}>
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{
              ...S.toggleBtn,
              ...(mode === "login" ? S.toggleBtnActive : {}),
            }}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            style={{
              ...S.toggleBtn,
              ...(mode === "signup" ? S.toggleBtnActive : {}),
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Forms */}
        {mode === "login" ? (
          <LoginForm
            onAuthSuccess={persistAuth}
            switchSignup={() => setMode("signup")}
          />
        ) : (
          <SignupForm
            onAuthSuccess={persistAuth}
            switchToLogin={() => setMode("login")}
          />
        )}
      </div>
    </div>
  );
}