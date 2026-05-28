import React, { useState } from "react";

const API = "https://server.manchly.com";

export default function AuthPage({ onAuthSuccess }) {
  const [step, setStep] = useState("signup");
  const [loading, setLoading] = useState(false);
  const [otpMethod, setOtpMethod] = useState("email");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "STUDENT",
    otp: "",
  });
  // SIGNUP
  const handleSignup = async () => {
    try {
      setLoading(true);
      const backendRole = form.role === "creator" || form.role === "creator" ? "creator" : "USER";
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: backendRole,
      };
      console.log("SIGNUP PAYLOAD:", payload);
      const response = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("SIGNUP RESPONSE:", data);
      if (!response.ok) {
        throw new Error(data?.error?.message || "Signup failed");
      }
      await sendOtp();
      setStep("otp");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };
  // SEND OTP
  const sendOtp = async () => {
    try {
      let endpoint = "";
      let payload = {};
      // IMPORTANT:
      // backend expects USER not STUDENT
      const backendTab =
        form.role === "creator" || form.role === "creator" ? "creator" : "USER";
      if (otpMethod === "email") {
        endpoint = "/auth/send-otp/email";
        payload = {
          email: form.email,
          tab: backendTab,
        };
      } else {
        endpoint = "/auth/send-otp/sms";
        payload = {
          phone_number: form.phone,
          tab: backendTab,
        };
      }
      console.log("OTP PAYLOAD:", payload);
      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("OTP RESPONSE:", data);
      if (!response.ok) {
        throw new Error(
          data?.error?.message || data?.message || "OTP send failed",
        );
      }
      alert("OTP sent successfully");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
  // VERIFY OTP
  const handleVerifyOtp = async () => {
    try {
      setLoading(true);

      let payload = {};
      const backendTab =
        form.role === "creator" || form.role === "creator" ? "creator" : "USER";
      if (otpMethod === "email") {
        payload = {
          email: form.email,
          code: form.otp,
          tab: backendTab,
        };
      } else {
        payload = {
          phone_number: form.phone,
          code: form.otp,
          tab: backendTab,
        };
      }
      console.log("VERIFY OTP PAYLOAD:", payload);
      const response = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("VERIFY OTP RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data?.error?.message || data?.message || "OTP verification failed",
        );
      }
      // TOKEN EXTRACTION
      const token =
        data?.data?.token || data?.token || data?.access_token || "";
      // USER
      const user = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
      };
      console.log("FINAL USER:", user);
      // STORE
      localStorage.setItem("manchly_token", token);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("role", form.role);
      // CALLBACK
      if (onAuthSuccess) {
        onAuthSuccess(response.data.user);
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };
  // =====================================
  // UI
  // =====================================

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
        <h1
          style={{
            color: "#FFC107",
            marginBottom: 24,
          }}
        >
          Manchly
        </h1>

        {step === "signup" ? (
          <>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              style={input}
            />

            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              style={input}
            />

            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
              style={input}
            />

            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                })
              }
              style={input}
            >
              <option value="STUDENT">STUDENT</option>

              <option value="CREATOR">CREATOR</option>
            </select>

            <select
              value={otpMethod}
              onChange={(e) => setOtpMethod(e.target.value)}
              style={input}
            >
              <option value="email">OTP via Email</option>

              <option value="sms">OTP via SMS</option>
            </select>

            <button onClick={handleSignup} style={button} disabled={loading}>
              {loading ? "Loading..." : "Continue"}
            </button>
          </>
        ) : (
          <>
            <input
              placeholder="Enter OTP"
              value={form.otp}
              onChange={(e) =>
                setForm({
                  ...form,
                  otp: e.target.value,
                })
              }
              style={input}
            />

            <button onClick={handleVerifyOtp} style={button}>
              Verify OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const input = {
  width: "100%",
  padding: 14,
  marginBottom: 14,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#1A1A1A",
  color: "white",
  boxSizing: "border-box",
};

const button = {
  width: "100%",
  padding: 14,
  background: "#FFC107",
  color: "#000",
  border: "none",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};
