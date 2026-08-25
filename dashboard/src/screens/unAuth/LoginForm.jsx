import React, { useState, useEffect } from "react";
import S from "./authStyles";
import { API_BASE as API } from "../../utils/api";
import { getDeviceId } from "../../utils/deviceId";


export default function LoginForm({ onAuthSuccess, switchSignup }) {
  // Form Data State
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionNotice, setSessionNotice] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Detect session invalidation from URL redirect (e.g., logged in on another device)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "session_expired") {
      setSessionNotice(
        "You were logged out because your account was accessed from another device."
      );
    }
  }, []);

  // Input Handler
  const handleInput = (key) => (e) => {
    setError("");
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  // Validation
  const validate = () => {
    if (!form.email.trim()) return "Email is required";
    if (!form.password) return "Password is required";
    return null;
  };

  // Login Handler
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);

    // Use persistent deviceId from localStorage (with fingerprint fallback)
    const deviceId = getDeviceId();

    const payload = {
      email: form.email.trim(),
      password: form.password,
      deviceId, // camelCase
      device_id: deviceId, // snake_case
      platform: "web",
    };

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = {};

      try {
        data = await res.json();
      } catch (_) {
        // Ignore JSON parsing errors
      }

      if (!res.ok) {
        const msg =
          data?.error?.message ||
          data?.message ||
          (typeof data?.error === "string" ? data.error : null) ||
          (data?.errors ? JSON.stringify(data.errors) : null) ||
          `Server error ${res.status}`;

        throw new Error(msg);
      }

      const token =
        data?.data?.token ||
        data?.token ||
        data?.access_token ||
        "";

      const user =
        data?.data?.user ||
        data?.user ||
        (typeof data?.data === "object" ? data.data : null) || {
          email: form.email.trim(),
        };

      // Store token in localStorage
      if (token) {
        localStorage.setItem("manchly_token", token);
      }

      // Clear any session notice from URL
      if (window.location.search.includes("reason=session_expired")) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Notify parent component
      onAuthSuccess?.({
        ...user,
        token,
      });
    } catch (err) {
      console.error("[Login] Error:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Forced Logout Notice */}
      {sessionNotice && (
        <div
          style={
            S.noticeBox || {
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              border: "1px solid #f59e0b",
              color: "#b45309",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
            }
          }
        >
          ⚠️ {sessionNotice}
        </div>
      )}

      {/* Error Message */}
      {error && <div style={S.errorBox}>⚠️ {error}</div>}

      {/* Email */}
      <div>
        <label style={S.label}>Email Address</label>
        <input
          type="email"
          placeholder="user@example.com"
          value={form.email}
          onChange={handleInput("email")}
          style={S.input}
          autoComplete="email"
        />
      </div>

      {/* Password */}
      <div>
        <label style={S.label}>Password</label>

        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            placeholder="Your password"
            value={form.password}
            onChange={handleInput("password")}
            style={{
              ...S.input,
              paddingRight: 44,
            }}
            autoComplete="current-password"
          />

          <button
            type="button"
            onClick={() => setShowPass((prev) => !prev)}
            style={S.eyeBtn}
            tabIndex={-1}
          >
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {/* Login Button */}
      <button
        type="submit"
        disabled={loading}
        style={{
          ...S.btn,
          marginTop: 20,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      {/* Signup Link */}
      <p style={S.switchHint}>
        Don't have an account?{" "}
        <button type="button" onClick={switchSignup} style={S.switchLink}>
          Sign up
        </button>
      </p>
    </form>
  );
}