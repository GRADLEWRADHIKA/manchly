// App-parity auth: role selection → phone/email + OTP → signup.
// Split-screen design: brand hero panel (left) + wizard panel (right) with
// step indicator, animated phase transitions, and gold hover interactions.
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck, ArrowLeft, ArrowRight, User, Star, Building2,
  GraduationCap, Video, IndianRupee, Sparkles,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { OtpInput, Spinner } from "../../components/ui";
import { toast } from "../../utils/toast";
import { useAuth, roleOf } from "../../context/AuthContext";
import { LegalFooter } from "../../components/LegalModals";
import LoginForm from "./LoginForm";
import { getDeviceId } from "../../utils/deviceId";

const isPhone = (v) => /^\d{10}$/.test(v);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const label = { display: "block", fontSize: 12, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 8 };
const sub = { margin: "6px 0 26px", color: "rgba(255,255,255,0.55)", fontSize: 14.5, lineHeight: 1.6 };
const h2 = { margin: 0, fontSize: 27, fontWeight: 900, letterSpacing: -0.4 };

function Cta({ children, loading, ...props }) {
  return (
    <button type="button" className="auth-cta" disabled={loading || props.disabled} {...props}>
      {loading ? <Spinner size={16} light /> : null}
      {children}
    </button>
  );
}

function BackLink({ onClick, children = "Back" }) {
  return (
    <button onClick={onClick} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.55)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18, padding: 0, fontSize: 13.5, fontWeight: 600, fontFamily: "inherit" }}>
      <ArrowLeft size={15} /> {children}
    </button>
  );
}

function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p style={{ color: "#FCA5A5", fontSize: 13, margin: "12px 0 0", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "9px 12px" }}>
      ⚠ {children}
    </p>
  );
}

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
        body: JSON.stringify({ email, phone_number: phone, code: otp, purpose: "login", user_type: selectedType, device_id: getDeviceId() }),
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

  const step = phase === 1 ? 1 : phase === 2 && !otpSent ? 2 : 3;

  const FEATURES = [
    { icon: GraduationCap, title: "Sell courses & webinars", text: "Upload once, earn on every enrollment" },
    { icon: Video, title: "1:1 video sessions", text: "Get booked and paid per minute" },
    { icon: IndianRupee, title: "Keep 90% of every sale", text: "Automatic T+2 settlements to your bank" },
  ];

  return (
    <div className="auth-page">
      {/* ---------- Left hero ---------- */}
      <div className="auth-hero">
        <div className="auth-orb gold" />
        <div className="auth-orb indigo" />
        <div className="auth-hero-content">
          <h1 style={{ margin: 0, fontSize: 40, fontWeight: 900, fontFamily: "Montserrat, Inter, sans-serif", background: "linear-gradient(120deg, #F8DEAE, #F3C36B 45%, #D49A3D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -0.5 }}>
            Manchly
          </h1>
          <p style={{ margin: "18px 0 8px", fontSize: 34, fontWeight: 900, lineHeight: 1.2, letterSpacing: -0.8 }}>
            Create. Connect.<br />
            <span style={{ background: "linear-gradient(90deg, #7B88DD, #5A68F3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Grow.</span>
          </p>
          <p style={{ margin: "0 0 34px", color: "rgba(255,255,255,0.6)", fontSize: 15.5, lineHeight: 1.65, maxWidth: 420 }}>
            The creator platform where knowledge becomes income — courses, live webinars and 1:1 expert sessions, all in one place.
          </p>

          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="auth-feature">
              <span style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(243,195,107,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={21} color="#F3C36B" />
              </span>
              <span>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{title}</div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{text}</div>
              </span>
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 30, color: "rgba(255,255,255,0.55)", fontSize: 13, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ display: "flex" }}>
                {["#5A68F3", "#F3C36B", "#10B981"].map((c, i) => (
                  <span key={c} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: "2px solid #0d0b14", marginLeft: i ? -9 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#fff" }}>
                    {["S", "R", "A"][i]}
                  </span>
                ))}
              </span>
              Trusted by <b style={{ color: "#F3C36B" }}>10,000+ creators</b>
            </span>
            <span>🇮🇳 Made in India</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <ShieldCheck size={14} color="#22C55E" /> 100% Secure
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Right panel ---------- */}
      <div className="auth-panel">
        <div className="auth-card" key={`${phase}-${otpSent}`}>
          {/* Step indicator (hidden on password phase) */}
          {phase !== 4 && (
            <div className="auth-steps">
              {[1, 2, 3].map((s) => (
                <span key={s} className={`auth-step-dot ${step >= s ? "done" : ""}`} />
              ))}
            </div>
          )}

          {/* Phase 1 — role selection */}
          {phase === 1 && (
            <>
              <h2 style={h2}>Welcome 👋</h2>
              <p style={sub}>Choose how you want to use Manchly</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <button className="role-card" onClick={() => { setSelectedType("CREATOR"); setPhase(2); }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span className="role-icon"><Star size={23} /></span>
                    <span>
                      <div style={{ fontSize: 17.5, fontWeight: 800 }}>Creator</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Create & publish content, earn 90% on every sale</div>
                    </span>
                  </span>
                  <span className="role-arrow"><ArrowRight size={17} /></span>
                </button>

                <button className="role-card" onClick={() => { setSelectedType("USER"); setPhase(2); }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span className="role-icon" style={{ background: "linear-gradient(135deg, #7B88DD, #5A68F3)", boxShadow: "0 6px 18px rgba(90,104,243,0.35)", color: "#fff" }}>
                      <User size={23} />
                    </span>
                    <span>
                      <div style={{ fontSize: 17.5, fontWeight: 800 }}>User</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Browse courses, join webinars & book experts</div>
                    </span>
                  </span>
                  <span className="role-arrow"><ArrowRight size={17} /></span>
                </button>
              </div>

              <p style={{ textAlign: "center", fontSize: 13.5, color: "rgba(255,255,255,0.5)", marginTop: 24 }}>
                Already have an account with a password?{" "}
                <button className="auth-ghost-link" onClick={() => setPhase(4)}>Sign in</button>
              </p>
              <LegalFooter linkColor="#F3C36B" />
            </>
          )}

          {/* Phase 2 — identifier + OTP */}
          {phase === 2 && (
            <>
              <BackLink onClick={() => { if (otpSent) { setOtpSent(false); setOtp(""); } else setPhase(1); setError(""); }} children={otpSent ? "Change number / email" : "Back"} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={h2}>{otpSent ? "Enter the code" : "Welcome back"}</h2>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: selectedType === "CREATOR" ? "rgba(243,195,107,0.12)" : "rgba(90,104,243,0.15)", color: selectedType === "CREATOR" ? "#F3C36B" : "#BDC2FF", fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6 }}>
                  {selectedType === "CREATOR" ? <Star size={12} /> : <User size={12} />} {selectedType}
                </span>
              </div>
              <p style={sub}>
                {otpSent ? <>We sent a 6-digit code to <b style={{ color: "#fff" }}>{identifier}</b></> : "Sign in with your phone number or email"}
              </p>

              {!otpSent ? (
                <>
                  <label style={label}>Phone number or email</label>
                  <input
                    className="auth-input"
                    placeholder="e.g. 9876543210 or you@example.com"
                    value={identifier}
                    autoFocus
                    onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                  />
                  <ErrorNote>{error}</ErrorNote>
                  <Cta loading={loading} onClick={sendOtp} style={{ marginTop: 22 }}>
                    Send Verification Code <ArrowRight size={16} />
                  </Cta>
                </>
              ) : (
                <>
                  <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(""); }} />
                  <ErrorNote>{error}</ErrorNote>
                  <Cta loading={loading} onClick={verifyOtp} style={{ marginTop: 24 }}>
                    Verify & Continue
                  </Cta>
                  <p style={{ textAlign: "center", fontSize: 13.5, color: "rgba(255,255,255,0.5)", marginTop: 18 }}>
                    Didn't receive the code?{" "}
                    {cooldown ? (
                      <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>Resend in {cooldown}s</span>
                    ) : (
                      <button className="auth-ghost-link" onClick={resendOtp}>Resend OTP</button>
                    )}
                  </p>
                </>
              )}

              <p style={{ textAlign: "center", fontSize: 13.5, color: "rgba(255,255,255,0.5)", marginTop: 18 }}>
                New to Manchly?{" "}
                <button className="auth-ghost-link" onClick={() => setPhase(3)}>Create an account</button>
              </p>
              <LegalFooter linkColor="#F3C36B" showCompany={false} />
            </>
          )}

          {/* Phase 3 — signup */}
          {phase === 3 && (
            <>
              <BackLink onClick={() => { setPhase(2); setError(""); }} />
              <h2 style={h2}>Create your account</h2>
              <p style={sub}>
                Joining as a <b style={{ color: "#F3C36B", textTransform: "lowercase" }}>{form.isBusiness ? form.businessRole.toLowerCase() : (selectedType || "user").toLowerCase()}</b>
              </p>

              {selectedType === "CREATOR" && (
                <div style={{ display: "flex", gap: 10, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 12, padding: "11px 14px", fontSize: 12.5, color: "#F5C36B", marginBottom: 20, lineHeight: 1.55 }}>
                  <Sparkles size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Enter your exact <b>Full Name</b> and <b>Date of Birth</b> as per your PAN card — they're used for KYC and cannot be changed later.</span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={label}>Full Name</label>
                  <input className="auth-input" value={form.name} autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={label}>Date of Birth</label>
                    <input className="auth-input" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} style={{ colorScheme: "dark" }} />
                  </div>
                  <div>
                    <label style={label}>Phone Number</label>
                    <input className="auth-input" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} placeholder="10-digit phone" />
                  </div>
                </div>
                <div>
                  <label style={label}>Email Address</label>
                  <input className="auth-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                </div>

                {selectedType === "CREATOR" && (
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "rgba(255,255,255,0.75)", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.isBusiness} onChange={(e) => setForm({ ...form, isBusiness: e.target.checked })} style={{ accentColor: "#F3C36B", width: 16, height: 16 }} />
                    <Building2 size={15} /> Are you a Brand or Agency?
                  </label>
                )}
                {form.isBusiness && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12 }}>
                    <div>
                      <label style={label}>Business Role</label>
                      <select className="auth-input" value={form.businessRole} onChange={(e) => setForm({ ...form, businessRole: e.target.value })} style={{ colorScheme: "dark" }}>
                        <option value="BRAND">Brand</option>
                        <option value="AGENCY">Agency</option>
                      </select>
                    </div>
                    <div>
                      <label style={label}>Company Name</label>
                      <input className="auth-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
                    </div>
                  </div>
                )}
              </div>

              <ErrorNote>{error}</ErrorNote>
              <Cta loading={loading} onClick={submitSignup} style={{ marginTop: 22 }}>
                Create Account <ArrowRight size={16} />
              </Cta>
              <LegalFooter linkColor="#F3C36B" showCompany={false} />
            </>
          )}

          {/* Phase 4 — password login (legacy backend route) */}
          {phase === 4 && (
            <>
              <BackLink onClick={() => setPhase(1)} children="Back to OTP login" />
              <h2 style={h2}>Password login</h2>
              <p style={sub}>For accounts that set a password</p>
              <div className="mn-light-form" style={{ background: "#fff", borderRadius: 16, padding: 20 }}>
                <LoginForm
                  onAuthSuccess={(authUser) => {
                    const { token, ...u } = authUser || {};
                    try { finishLogin({ data: { user: u, token } }); } catch (e) { toast.error(e.message); }
                  }}
                  switchSignup={() => setPhase(3)}
                />
              </div>
            </>
          )}
        </div>

        <p style={{ position: "absolute", bottom: 18, fontSize: 11.5, color: "rgba(255,255,255,0.3)" }}>
          Agnivora Digital Pvt Ltd · help@manchly.com
        </p>
      </div>
    </div>
  );
}