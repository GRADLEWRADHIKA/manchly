import React, { useState } from "react";
import S from "./authStyles";
import { API_BASE as API } from "../../utils/api";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export default function SignupForm({ onAuthSuccess, switchToLogin }) {
  // Form Data State
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  // Status & UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Input Handler
  const handleInput = (key) => (e) => {
    setError(""); // clear errors when the user starts typing
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // Validation Check
  const validate = () => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (!/^\d{10}$/.test(form.phone.trim())) return "Please enter a valid 10-digit phone number.";
    return null;
  };

  // Submission Handler
  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);

    // Generate unique device fingerprint to send to backend for device tracking / signup limits
    let deviceId = "";
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      deviceId = result.visitorId;
    } catch (_) {
      // Fallback if fingerprinting is blocked by client
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
      deviceId, // Pass browser/hardware fingerprint to backend
    };

    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {}

      if (!res.ok) {
        const msg =
          data?.error?.message ||
          data?.message ||
          (typeof data?.error === "string" ? data.error : null) ||
          (data?.errors ? JSON.stringify(data.errors) : null) ||
          `Server error ${res.status} — check console for details`;
        throw new Error(msg);
      }

      const token = data?.data?.token || data?.token || data?.access_token || "";
      const user =
        data?.data?.user || data?.user || (typeof data?.data === "object" ? data.data : null) || {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        };

      // Store auth token in localStorage on successful signup
      if (token) {
        localStorage.setItem("manchly_token", token);
      }

      onAuthSuccess?.({ ...user, token });
    } catch (err) {
      console.error("[Signup] error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSignup}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Error Banner */}
      {error && <div style={S.errorBox}>⚠️ {error}</div>}

      {/* Full Name */}
      <div>
        <label style={S.label}>Full Name</label>
        <input
          type="text"
          placeholder="John Doe"
          value={form.name}
          onChange={handleInput("name")}
          style={S.input}
          autoComplete="name"
        />
      </div>

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
            placeholder="Create a password"
            value={form.password}
            onChange={handleInput("password")}
            style={{
              ...S.input,
              paddingRight: 44,
            }}
            autoComplete="new-password"
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

      {/* Phone Number */}
      <div>
        <label style={S.label}>Phone Number</label>
        <input
          type="tel"
          placeholder="9876543210"
          value={form.phone}
          onChange={handleInput("phone")}
          style={S.input}
          autoComplete="tel"
        />
      </div>

      {/* Submit Button */}
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
        {loading ? "Creating account..." : "Create Account"}
      </button>

      {/* Footer */}
      <p style={S.switchHint}>
        Already have an account?{" "}
        <button type="button" onClick={switchToLogin} style={S.switchLink}>
          Log in
        </button>
      </p>
    </form>
  );
}