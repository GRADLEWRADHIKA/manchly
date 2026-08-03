// App-parity auth: role selection → phone/email + OTP → signup.
// Mirrors manApp NewLoginScreen (ChooseType → VerifyLogin → SignUp) with the
// gold-gradient onboarding design, plus a resend cooldown the app lacked.
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MoveRight, ShieldCheck, ArrowLeft, User, Star, Building2 } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { GradientButton, OtpInput, TextInput, Field, Badge } from "../../components/ui";
import { toast } from "../../utils/toast";
import { useAuth, roleOf } from "../../context/AuthContext";
import { LegalFooter } from "../../components/LegalModals";
import LoginForm from "./LoginForm";

const isPhone = (v) => /^\d{10}$/.test(v);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const sheet = {
  width: "100%",
  maxWidth: 460,
  background: "#141414",
  borderRadius: 24,
  padding: "34px 30px",
  border: "1px solid rgba(243,195,107,0.18)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
  color: "#fff",
};

export default function AuthFlow() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [phase, setPhase] = useState(1); // 1 choose role, 2 verify, 3 signup, 4 password
  const [selectedType, setSelectedType] = useState(null); // CREATOR | USER
  const [identifier, setIdentifier] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  // signup form
  const [form, setForm] = useState({ name: "", dob: "", email: "", phone: "", isBusiness: false, businessRole: "BRAND", company: "" });

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const idPayload = () => ({
    email: isEmail(identifier) ? identifier.trim() : "",
    phone: isPhone(identifier) ? identifier.trim() : "",
  });

  const finishLogin = (data) => {
    const payload = unwrap(data) || data;
    const u = payload?.user || payload;
    const token = payload?.token || "";
    if (!token) throw new Error("No token returned");
    login({ user: u, token });
    toast.success("Login successful");
    // pending deep link (saved when an unauthenticated visitor hit /course/:id etc.)
    const pending = localStorage.getItem("manchly_pending_link");
    if (pending) {
      localStorage.removeItem("manchly_pending_link");
      navigate(pending, { replace: true });
      return;
    }
    const from = location.state?.from;
    if (from) return navigate(from, { replace: true });
    navigate(roleOf(u) === "CREATOR" ? "/creator" : roleOf(u) === "ADMIN" ? "/admin" : "/app", { replace: true });
  };

  const sendOtp = async () => {
    setError("");
    const id = identifier.trim();
    if (!isPhone(id) && !isEmail(id)) {
      setError("Enter a valid 10-digit phone number or email address");
      return;
    }
    setLoading(true);
    try {
      const { email, phone } = idPayload();
      const check = await apiFetch("/auth/check-user", { method: "POST", body: JSON.stringify({ email, phone }) });
      const exists = unwrap(check)?.exists;
      if (!exists) {
        setForm((f) => ({ ...f, email: email || f.email, phone: phone || f.phone }));
        setPhase(3);
        toast.info("No account found — create one below");
        return;
      }
      const path = phone ? "/auth/send-otp/sms" : "/auth/send-otp/email";
      await apiFetch(path, {
        method: "POST",
        body: JSON.stringify({ phone_number: phone, email, purpose: "login", tab: selectedType }),
      });
      setOtpSent(true);
      setCooldown(30);
      toast.success(`OTP sent to your ${phone ? "phone" : "email"}`);
    } catch (err) {
      if (err?.body?.error?.code === "OTP_ALREADY_SENT") {
        setOtpSent(true);
        setCooldown(30);
      } else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown) return;
    const { email, phone } = idPayload();
    try {
      await apiFetch("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify(phone ? { phone_number: phone, channel: "sms" } : { email, channel: "email" }),
      });
      setCooldown(30);
      toast.success("OTP resent");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) return setError("OTP must be 6 digits");
    setError("");
    setLoading(true);
    try {
      const { email, phone } = idPayload();
      const res = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, phone_number: phone, code: otp, purpose: "login", user_type: selectedType }),
      });
      finishLogin(res);
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSignup = async () => {
    setError("");
    const { name, dob, email, phone, isBusiness, businessRole, company } = form;
    if (!name.trim()) return setError("Full name is required");
    if (!dob) return setError("Date of birth is required");
    if (!isEmail(email)) return setError("Valid email is required");
    if (!isPhone(phone)) return setError("Valid 10-digit phone is required");
    if (isBusiness && !company.trim()) return setError("Company name is required");
    const effectiveRole = isBusiness ? businessRole : selectedType;
    setLoading(true);
    try {
      const res = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), dob, user_type: effectiveRole, company_name: isBusiness ? company.trim() : undefined }),
      });
      const payload = unwrap(res);
      if (payload?.token) {
        finishLogin(res);
      } else {
        toast.success("Account created — sign in with OTP");
        setIdentifier(phone || email);
        setPhase(2);
        setOtpSent(false);
      }
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ type, icon: Icon, title, subtitle }) => (
    <button
      onClick={() => { setSelectedType(type); setPhase(2); }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
        background: colors.gradients.gold, border: "none", borderRadius: 16, padding: "18px 20px",
        cursor: "pointer", color: "#1A1205", textAlign: "left",
        boxShadow: "0 8px 24px rgba(212,154,61,0.35)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} color="#fff" />
        </span>
        <span>
          <div style={{ fontSize: 17, fontWeight: 800, textTransform: "capitalize" }}>{title}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.75 }}>{subtitle}</div>
        </span>
      </span>
      <MoveRight size={22} />
    </button>
  );

  const legal = <LegalFooter linkColor="#F3C36B" />;

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: colors.gradients.heroGold, padding: 20,
        backgroundColor: "#0c0a06",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, fontFamily: "Montserrat, Inter, sans-serif", background: colors.gradients.gold, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Manchly
        </h1>
        <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 14 }}>Create. Connect. Grow.</p>
      </div>

      {/* Phase 1 — role selection */}
      {phase === 1 && (
        <div style={sheet}>
          <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800 }}>Welcome</h2>
          <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,0.55)", fontSize: 14 }}>Choose how you want to use Manchly</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <RoleCard type="CREATOR" icon={Star} title="Creator" subtitle="Create & publish content" />
            <RoleCard type="USER" icon={User} title="User" subtitle="Browse & consume content" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginTop: 22, color: "rgba(255,255,255,0.5)", fontSize: 12.5 }}>
            <span>🇮🇳 Made in India</span>
            <ShieldCheck size={14} color="#F3C36B" />
            <span>100% Free &amp; Secure</span>
          </div>
          {legal}
        </div>
      )}

      {/* Phase 2 — identifier + OTP */}
      {phase === 2 && (
        <div style={sheet}>
          <button onClick={() => { setPhase(1); setOtpSent(false); setOtp(""); setError(""); }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 14, padding: 0, fontSize: 13 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{otpSent ? "Enter Code" : "Welcome Back"}</h2>
            <Badge color="#F3C36B">{selectedType}</Badge>
          </div>
          <p style={{ margin: "4px 0 22px", color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
            {otpSent ? `We sent a 6-digit code to ${identifier}` : "Let's get started with your phone or email"}
          </p>

          {!otpSent ? (
            <>
              <Field label="Phone number or email">
                <TextInput
                  dark
                  placeholder="Enter phone number or email"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                  style={{ borderColor: "rgba(243,195,107,0.4)" }}
                />
              </Field>
              {error && <p style={{ color: "#F87171", fontSize: 13, margin: "10px 0 0" }}>⚠ {error}</p>}
              <GradientButton full size="lg" loading={loading} onClick={sendOtp} style={{ marginTop: 20 }}>
                Send Verification Code
              </GradientButton>
            </>
          ) : (
            <>
              <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(""); }} />
              {error && <p style={{ color: "#F87171", fontSize: 13, margin: "12px 0 0", textAlign: "center" }}>⚠ {error}</p>}
              <GradientButton full size="lg" loading={loading} onClick={verifyOtp} style={{ marginTop: 22 }}>
                Verify OTP
              </GradientButton>
              <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 16 }}>
                Didn't receive the code?{" "}
                <button onClick={resendOtp} disabled={!!cooldown} style={{ background: "transparent", border: "none", color: cooldown ? "rgba(255,255,255,0.35)" : "#F3C36B", cursor: cooldown ? "default" : "pointer", fontWeight: 700, padding: 0 }}>
                  {cooldown ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </p>
            </>
          )}

          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 18 }}>
            Don't have an account?{" "}
            <button onClick={() => setPhase(3)} style={{ background: "transparent", border: "none", color: "#F3C36B", cursor: "pointer", fontWeight: 700, padding: 0 }}>Create one now</button>
            {" · "}
            <button onClick={() => setPhase(4)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontWeight: 600, padding: 0 }}>Use password</button>
          </p>
          {legal}
        </div>
      )}

      {/* Phase 3 — signup */}
      {phase === 3 && (
        <div style={sheet}>
          <button onClick={() => setPhase(2)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 14, padding: 0, fontSize: 13 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800 }}>Sign Up</h2>
          <p style={{ margin: "0 0 18px", color: "rgba(255,255,255,0.55)", fontSize: 14 }}>Join Manchly as a {form.isBusiness ? form.businessRole.toLowerCase() : (selectedType || "user").toLowerCase()}</p>

          {selectedType === "CREATOR" && (
            <div style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.35)", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: "#F5C36B", marginBottom: 18 }}>
              ⚠ Enter your exact <b>Full Name</b> and <b>Date of Birth</b> as per your PAN card. These cannot be changed later.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Full Name"><TextInput dark value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" /></Field>
            <Field label="Date of Birth"><TextInput dark type="date" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field>
            <Field label="Email Address"><TextInput dark type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></Field>
            <Field label="Phone Number"><TextInput dark inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} placeholder="10-digit phone" /></Field>

            {selectedType === "CREATOR" && (
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "rgba(255,255,255,0.75)", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isBusiness} onChange={(e) => setForm({ ...form, isBusiness: e.target.checked })} />
                <Building2 size={15} /> Are you a Brand or Agency?
              </label>
            )}
            {form.isBusiness && (
              <>
                <Field label="Business Role">
                  <select value={form.businessRole} onChange={(e) => setForm({ ...form, businessRole: e.target.value })} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.14)", fontSize: 14.5 }}>
                    <option value="BRAND" style={{ color: "#111" }}>Brand</option>
                    <option value="AGENCY" style={{ color: "#111" }}>Agency</option>
                  </select>
                </Field>
                <Field label="Company Name"><TextInput dark value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" /></Field>
              </>
            )}
          </div>

          {error && <p style={{ color: "#F87171", fontSize: 13, margin: "12px 0 0" }}>⚠ {error}</p>}
          <GradientButton full size="lg" loading={loading} onClick={submitSignup} style={{ marginTop: 20 }}>
            Create Account
          </GradientButton>
          {legal}
        </div>
      )}

      {/* Phase 4 — password login (legacy backend route) */}
      {phase === 4 && (
        <div style={sheet}>
          <button onClick={() => setPhase(2)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 14, padding: 0, fontSize: 13 }}>
            <ArrowLeft size={16} /> Back to OTP login
          </button>
          <h2 style={{ margin: "0 0 18px", fontSize: 24, fontWeight: 800 }}>Password Login</h2>
          <div className="mn-light-form" style={{ background: "#fff", borderRadius: 14, padding: 18 }}>
            <LoginForm
              onAuthSuccess={(authUser) => {
                const { token, ...u } = authUser || {};
                try { finishLogin({ data: { user: u, token } }); } catch (e) { toast.error(e.message); }
              }}
              switchSignup={() => setPhase(3)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
