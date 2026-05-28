import React, { useState } from "react";

const API = "https://server.manchly.com";

export default function AuthPage({ onAuthSuccess }) {
  const [step,      setStep]      = useState("signup");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");        // replaces alert()
  const [otpMethod, setOtpMethod] = useState("email");

  const [form, setForm] = useState({
    name:  "",
    email: "",
    phone: "",
    role:  "STUDENT",
    otp:   "",
  });

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  /*
   * BUG 1 FIX — backendTab helper.
   *
   * Old sendOtp had: form.role === "creator" || form.role === "creator"
   *   → same condition checked twice (copy-paste typo)
   *   → "CREATOR" (uppercase from the select) never matched
   *   → backendTab was always "USER" even for creators
   *   → produced tab:"creator" (lowercase) anyway, but Postman shows "CREATOR"
   *
   * Old handleVerifyOtp had the condition right but still produced "creator"
   * (lowercase) which doesn't match the Postman spec of "CREATOR".
   *
   * Fix: one shared helper, correct uppercase output.
   */
  const backendTab = form.role === "CREATOR" ? "CREATOR" : "USER";

  // =====================================
  // SIGNUP
  // =====================================

  const handleSignup = async () => {
    setError("");

    // BUG 5 FIX — basic validation before hitting the network
    if (!form.name.trim())  { setError("Name is required.");   return; }
    if (!form.email.trim()) { setError("Email is required.");  return; }
    if (!form.phone.trim()) { setError("Phone is required.");  return; }

    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/signup`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:  form.name,
          email: form.email,
          phone: form.phone,
          role:  backendTab,   // "CREATOR" or "USER"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || "Signup failed");
      }

      /*
       * BUG 2 FIX — sendOtp used to swallow its own error (its own try/catch
       * caught + alerted but never re-threw), so handleSignup's try block saw
       * no exception and always called setStep("otp") even when OTP sending
       * had failed.
       *
       * Fix: sendOtp now throws on failure; setStep only runs on success.
       */
      await sendOtp();

      setStep("otp");    // ← only reached if sendOtp() did NOT throw

    } catch (err) {
      console.error("[handleSignup]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // SEND OTP
  // =====================================

  const sendOtp = async () => {
    /*
     * BUG 1 FIX — backendTab now comes from the shared helper above.
     * Old code: form.role === "creator" || form.role === "creator"
     *   → duplicate condition, never matched uppercase "CREATOR"
     *   → always fell through to "USER"
     *
     * BUG 3 FIX — SMS payload field was "phone_number" in the code but
     * Postman confirms it is "phone_number" ✓ — kept correct.
     * Tab value was "creator" (lowercase); Postman shows "CREATOR" → fixed
     * by using the shared backendTab helper.
     *
     * BUG 2 FIX — removed the internal try/catch so errors propagate up
     * to handleSignup's catch, which decides whether to show the error and
     * whether to advance the step.
     */
    let endpoint, payload;

    if (otpMethod === "email") {
      endpoint = "/auth/send-otp/email";
      payload  = {
        email: form.email,
        tab:   backendTab,   // "CREATOR" or "USER"  ← Postman confirmed
      };
    } else {
      endpoint = "/auth/send-otp/sms";
      payload  = {
        phone_number: form.phone,  // ← Postman uses phone_number for SMS
        tab:          backendTab,  // "CREATOR" or "USER"
      };
    }

    console.log("OTP PAYLOAD:", payload);

    const response = await fetch(`${API}${endpoint}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("OTP RESPONSE:", data);

    if (!response.ok) {
      // throws → caught by handleSignup → step NOT advanced
      throw new Error(
        data?.error?.message || data?.message || "OTP send failed"
      );
    }
  };

  // =====================================
  // VERIFY OTP
  // =====================================

  const handleVerifyOtp = async () => {
    setError("");

    if (!form.otp.trim()) { setError("Please enter the OTP."); return; }

    setLoading(true);
    try {
      /*
       * BUG 4 FIX — verify-otp payload used wrong field names.
       *
       * Old:  { email, code, tab }  /  { phone_number, code, tab }
       * From Postman collection: { identifier, otp }
       * "identifier" accepts either email or phone interchangeably.
       * Field for the code is "otp", not "code".
       * No "tab" field on this endpoint.
       */
      const identifier = otpMethod === "email" ? form.email : form.phone;

      const payload = {
        identifier,        // email or phone — server accepts either
        otp: form.otp,     // field name is "otp", not "code"
      };

      console.log("VERIFY OTP PAYLOAD:", payload);

      const response = await fetch(`${API}/auth/verify-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("VERIFY OTP RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data?.error?.message || data?.message || "OTP verification failed"
        );
      }

      // ── Token extraction ──────────────────────────────────────────────
      const token =
        data?.data?.token  ||
        data?.token        ||
        data?.access_token ||
        "";

      // ── Persist ───────────────────────────────────────────────────────
      localStorage.setItem("manchly_token", token); // used by all API helpers
      localStorage.setItem("token",         token); // legacy fallback
      localStorage.setItem("user",          JSON.stringify({
        name:  form.name,
        email: form.email,
        phone: form.phone,
        role:  form.role,
      }));
      localStorage.setItem("role", form.role);

      // ── Callback ──────────────────────────────────────────────────────
      if (onAuthSuccess) {
        onAuthSuccess({
          name:  form.name,
          email: form.email,
          phone: form.phone,
          role:  form.role,
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

  // =====================================
  // UI
  // =====================================

  return (
    <div style={{
      minHeight: "100vh", background: "#000", color: "white",
      display: "flex", justifyContent: "center", alignItems: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        width: 420, background: "#111", padding: 32,
        borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <h1 style={{ color: "#FFC107", marginBottom: 8 }}>Manchly</h1>

        {/* BUG 5 FIX — error state shown in UI, not alert() */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
            color: "#EF4444", borderRadius: 10, padding: "10px 14px",
            marginBottom: 16, fontSize: 13.5, lineHeight: 1.5,
          }}>
            ⚠️ {error}
          </div>
        )}

        {step === "signup" ? (
          <>
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={setField("name")}
              style={styles.input}
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={setField("email")}
              type="email"
              style={styles.input}
            />
            <input
              placeholder="Phone (10 digits)"
              value={form.phone}
              onChange={setField("phone")}
              type="tel"
              style={styles.input}
            />

            <select
              value={form.role}
              onChange={setField("role")}
              style={styles.input}
            >
              <option value="STUDENT">Student</option>
              <option value="CREATOR">Creator</option>
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
            <p style={{ fontSize: 11, color: "#71717A", marginBottom: 14, fontFamily: "monospace" }}>
              tab: "{backendTab}" → /auth/send-otp/{otpMethod}
            </p>

            <button
              onClick={handleSignup}
              disabled={loading}
              style={styles.button}
            >
              {loading ? "Sending OTP…" : "Continue"}
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
              style={{ ...styles.input, letterSpacing: 6, fontSize: 20, textAlign: "center" }}
            />

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              style={styles.button}
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>

            <button
              onClick={() => { setStep("signup"); setError(""); }}
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
    width: "100%", padding: 14, marginBottom: 14,
    borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
    background: "#1A1A1A", color: "white", boxSizing: "border-box",
    fontFamily: "inherit", fontSize: 15, outline: "none",
  },
  button: {
    width: "100%", padding: 14, background: "#FFC107",
    color: "#000", border: "none", borderRadius: 10,
    fontWeight: 700, cursor: "pointer", fontSize: 15,
    marginBottom: 10,
  },
  ghost: {
    width: "100%", padding: 13, background: "transparent",
    color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, cursor: "pointer", fontSize: 14, fontFamily: "inherit",
  },
};