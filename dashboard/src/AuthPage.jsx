import React, { useState } from "react";
import { API_BASE as API } from "./api";
export default function AuthPage({ onAuthSuccess }) {
  // mode: "login" | "signup"  ·  step: "form" | "otp"
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // replaces alert()
  const [otpMethod, setOtpMethod] = useState("email");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    user_type: "USER",
    otp: "",
  });
  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const backendTab =
    form.user_type === "ADMIN"   ? "ADMIN"   :
    form.user_type === "CREATOR" ? "CREATOR" :
                                   "USER";

  // LOGIN — for existing users. Skips signup, sends OTP directly.
  // The backend send-otp endpoint requires a `tab` (user_type) param,
  // which the user picks below.
  const handleLogin = async () => {
    setError("");
    if (otpMethod === "email" && !form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (otpMethod === "sms" && !form.phone.trim()) {
      setError("Phone is required.");
      return;
    }
    setLoading(true);
    try {
      await sendOtp();
      setStep("otp");
    } catch (err) {
      console.error("[handleLogin]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // SIGNUP
  const handleSignup = async () => {
    setError("");
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone is required.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: (form.phone || "").replace(/\D/g, "").slice(-10),
          user_type: backendTab,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error?.message || data?.message || "Signup failed",
        );
      }
      await sendOtp();
      setStep("otp");
    } catch (err) {
      console.error("[handleSignup]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // SEND OTP
  const sendOtp = async () => {
    let endpoint, payload;
    if (otpMethod === "email") {
      endpoint = "/auth/send-otp/email";
      payload = {
        email: form.email,
        tab: backendTab,
      };
    } else {
      endpoint = "/auth/send-otp/sms";
      payload = {
        // normalize to the bare 10-digit number so the OTP key on send matches
        // verify, and Fast2SMS gets the format it expects (no +91 / spaces).
        phone_number: (form.phone || "").replace(/\D/g, "").slice(-10),
        tab: backendTab,
      };
    }
    console.log("OTP PAYLOAD:", payload);
    const response = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("OTP RESPONSE:", data);
    if (!response.ok) {
      throw new Error(
        data?.error?.message || data?.message || "OTP send failed",
      );
    }
  };
  // VERIFY OTP
  const handleVerifyOtp = async () => {
    setError("");

    if (!form.otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const payload =
        otpMethod === "email"
          ? { email: form.email, code: form.otp }
          : { phone_number: (form.phone || "").replace(/\D/g, "").slice(-10), code: form.otp };
      console.log("VERIFY OTP PAYLOAD:", payload);
      const response = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("VERIFY OTP RESPONSE:", data);
      if (!response.ok) {
        throw new Error(
          data?.error?.message || data?.message || "OTP verification failed",
        );
      }
      // ── Token extraction ──────────────────────────────────────────────
      const token =
        data?.data?.token || data?.token || data?.access_token || "";
      // ── Persist ───────────────────────────────────────────────────────
      localStorage.setItem("manchly_token", token); // used by all API helpers
      localStorage.setItem("token", token); // legacy fallback
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          user_type: form.user_type,
        }),
      );
      localStorage.setItem("user_type", form.user_type);
      // ── Callback ──────────────────────────────────────────────────────
      if (onAuthSuccess) {
        onAuthSuccess({
          name: form.name,
          email: form.email,
          phone: form.phone,
          user_type: form.user_type,
          token,
        });
      }
    } catch (err) {
      console.error("[handleVerifyOtp]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // UI
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 420,
          background: "#111",
          padding: 32,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <h1 style={{ color: "#FFC107", marginBottom: 8 }}>Manchly</h1>
        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "#EF4444",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {step === "form" ? (
          <>
            {/* MODE TOGGLE — Login | Sign up */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18,
              background: "#1A1A1A", borderRadius: 12, padding: 4 }}>
              <button
                onClick={() => { setMode("login"); setError(""); }}
                style={{
                  flex: 1, padding: 11,
                  background: mode === "login" ? "#FFC107" : "transparent",
                  color: mode === "login" ? "#000" : "#A1A1AA",
                  border: "none", borderRadius: 9, cursor: "pointer",
                  fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                }}
              >
                Login
              </button>
              <button
                onClick={() => { setMode("signup"); setError(""); }}
                style={{
                  flex: 1, padding: 11,
                  background: mode === "signup" ? "#FFC107" : "transparent",
                  color: mode === "signup" ? "#000" : "#A1A1AA",
                  border: "none", borderRadius: 9, cursor: "pointer",
                  fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                }}
              >
                Sign up
              </button>
            </div>

            {/* SIGN-UP-ONLY: name field */}
            {mode === "signup" && (
              <input
                placeholder="Full Name"
                value={form.name}
                onChange={setField("name")}
                style={styles.input}
              />
            )}

            {/* Email / Phone — both modes. Phone hidden in login when otpMethod=email,
                and email hidden in login when otpMethod=sms, to keep the form tight. */}
            {(mode === "signup" || otpMethod === "email") && (
              <input
                placeholder="Email"
                value={form.email}
                onChange={setField("email")}
                type="email"
                style={styles.input}
              />
            )}
            {(mode === "signup" || otpMethod === "sms") && (
              <input
                placeholder="Phone (10 digits)"
                value={form.phone}
                onChange={setField("phone")}
                type="tel"
                style={styles.input}
              />
            )}

            <select
              value={form.user_type}
              onChange={setField("user_type")}
              style={styles.input}
            >
              <option value="USER">User</option>
              <option value="CREATOR">Creator</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={otpMethod}
              onChange={(e) => setOtpMethod(e.target.value)}
              style={styles.input}
            >
              <option value="email">OTP via Email</option>
              <option value="sms">OTP via SMS</option>
            </select>

            {/* debug preview of exactly what will be sent */}
            <p
              style={{
                fontSize: 11,
                color: "#71717A",
                marginBottom: 14,
                fontFamily: "monospace",
              }}
            >
              {mode === "login" ? "LOGIN" : "SIGN UP"} · tab:"{backendTab}" → /auth/send-otp/{otpMethod}
            </p>
            <button
              onClick={mode === "login" ? handleLogin : handleSignup}
              disabled={loading}
              style={styles.button}
            >
              {loading
                ? "Sending OTP…"
                : (mode === "login" ? "Send Login OTP" : "Continue")}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: "#A1A1AA", marginBottom: 16, fontSize: 14 }}>
              OTP sent to{" "}
              <strong style={{ color: "#FFC107" }}>
                {otpMethod === "email" ? form.email : form.phone}
              </strong>
            </p>

            <input
              placeholder="Enter OTP"
              value={form.otp}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  otp: e.target.value.replace(/\D/g, "").slice(0, 6),
                }))
              }
              type="text"
              inputMode="numeric"
              style={{
                ...styles.input,
                letterSpacing: 6,
                fontSize: 20,
                textAlign: "center",
              }}
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              style={styles.button}
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>
            <button
              onClick={() => {
                setStep("form");
                setError("");
              }}
              style={styles.ghost}
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
const styles = {
  input: {
    width: "100%",
    padding: 14,
    marginBottom: 14,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#1A1A1A",
    color: "white",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: 15,
    outline: "none",
  },
  button: {
    width: "100%",
    padding: 14,
    background: "#FFC107",
    color: "#000",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 15,
    marginBottom: 10,
  },
  ghost: {
    width: "100%",
    padding: 13,
    background: "transparent",
    color: "#A1A1AA",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
  },
};
