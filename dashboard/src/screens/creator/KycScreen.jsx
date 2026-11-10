// KYC Verification — light creator-suite redesign, fully dynamic.
// PAN-based verification (name + DOB locked from profile, matched against PAN
// records server-side), live status, verified state with unlocked benefits,
// bank verification pointer to Wallet & Payouts. Automatically detects DOB/Name changes
// to require re-KYC.
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Lock, IndianRupee, MonitorPlay, Phone, Pencil, CheckCircle2, Landmark, RefreshCw } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { Badge } from "../../components/ui";
import { GoldBtn, lbl } from "../../components/creatorUi";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../utils/toast";

const G = colors.gradients;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const card = { background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 18, padding: 24 };

export default function KycScreen() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pan, setPan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState("");

  const load = useCallback(() =>
    apiFetch("/kyc/status")
      .then((r) => setStatus(unwrap(r)))
      .catch(() => {})
      .finally(() => setLoading(false)), []);

  useEffect(() => { load(); }, [load]);

  const dob = user?.dob ? String(user.dob).slice(0, 10) : "";
  const profileIncomplete = !user?.name || !dob;
  const panValid = PAN_RE.test(pan);

  // Compare verified details stored on backend vs current profile values
  const verifiedDob = status?.verified_dob || status?.user_dob ? String(status?.verified_dob || status?.user_dob).slice(0, 10) : null;
  const verifiedName = status?.verified_name || status?.user_name || null;

  const dobChanged = !!(status?.kyc_verified && verifiedDob && verifiedDob !== dob);
  const nameChanged = !!(status?.kyc_verified && verifiedName && verifiedName.trim().toLowerCase() !== (user?.name || "").trim().toLowerCase());
  const requiresReverification = status?.requires_reverification || dobChanged || nameChanged;

  // Fully verified only if verified on server AND profile details haven't changed since
  const verified = !!(status?.kyc_verified ?? user?.kyc_verified) && !requiresReverification;

  const submit = async () => {
    if (!panValid) return toast.error("Enter a valid PAN (e.g. ABCDE1234F)");
    setFailure("");
    setSubmitting(true);
    try {
      const res = unwrap(
        await apiFetch("/kyc/verify", {
          method: "POST",
          body: JSON.stringify({ pan_number: pan, user_name: user?.name, user_dob: dob }),
        })
      );
      const ok = res?.kyc_verified ?? res?.verified ?? res?.success ?? true;
      if (ok) {
        toast.success("KYC verified 🎉 Withdrawals unlocked");
        updateUser({ kyc_verified: true });
        load();
      } else {
        setFailure(res?.failure_reason || "Verification failed — check your details");
      }
    } catch (e) {
      setFailure(e?.body?.data?.failure_reason || e.message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const BENEFITS = [
    { icon: IndianRupee, text: "Withdraw earnings to your bank" },
    { icon: MonitorPlay, text: "Publish courses & go live with webinars" },
    { icon: Phone, text: "Offer paid 1:1 video sessions" },
  ];

  return (
    <div style={{ padding: 32, color: colors.typography.primaryText, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 27, fontWeight: 900 }}>
        KYC <span style={{ background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Verification</span>
      </h1>
      <p style={{ margin: "0 0 24px", color: colors.typography.secondaryText, fontSize: 14 }}>
        One-time PAN verification, required by Indian regulations before payouts.
      </p>

      {loading ? (
        <div className="mn-shimmer" style={{ height: 260, borderRadius: 18, opacity: 0.3 }} />
      ) : verified ? (
        /* ---------- VERIFIED ---------- */
        <div>
          <div style={{ background: "linear-gradient(135deg, #14532D, #16A34A)", borderRadius: 22, padding: "34px 36px", color: "#fff", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", marginBottom: 22 }}>
            <span style={{ width: 76, height: 76, borderRadius: "50%", background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShieldCheck size={38} />
            </span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>You're KYC Verified</div>
              <div style={{ opacity: 0.85, fontSize: 14, marginTop: 6 }}>
                {user?.name}
                {status?.pan_number && <> · PAN {status.pan_number}</>}
                {status?.kyc_verified_at && <> · verified {new Date(status.kyc_verified_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>}
              </div>
            </div>
            <Badge color="#fff" bg="rgba(255,255,255,0.18)">All features unlocked</Badge>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 22 }}>
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: 18 }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color="#16A34A" />
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>{text}</span>
              </div>
            ))}
          </div>

          <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Landmark size={19} color="#B45309" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>Next: verify your bank account</div>
                <div style={{ fontSize: 12.5, color: colors.typography.secondaryText }}>Needed once so settlements reach the right account.</div>
              </div>
            </div>
            <GoldBtn onClick={() => navigate("/creator/wallet")}>Go to Wallet & Payouts</GoldBtn>
          </div>

          <p style={{ fontSize: 12.5, color: colors.typography.secondaryText, marginTop: 18, lineHeight: 1.6 }}>
            ⚠ Changing your name or date of birth in Profile & Settings resets KYC — you'd need to verify again.
          </p>
        </div>
      ) : (
        /* ---------- NOT VERIFIED / RE-VERIFICATION REQUIRED ---------- */
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, alignItems: "start" }}>
          {/* Form */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, background: requiresReverification ? "#FEF2F2" : "#FFF8EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {requiresReverification ? <RefreshCw size={20} color="#DC2626" /> : <ShieldAlert size={20} color="#B45309" />}
              </span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16.5 }}>
                  {requiresReverification ? "Re-Verify your PAN" : "Verify your PAN"}
                </div>
                <div style={{ fontSize: 12.5, color: colors.typography.secondaryText }}>Instant verification against income-tax records</div>
              </div>
            </div>

            {/* Re-verification trigger alert */}
            {requiresReverification && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "start", gap: 10 }}>
                <ShieldAlert size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12.5, color: "#991B1B", lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 800 }}>Re-verification required: </span>
                  {dobChanged && nameChanged
                    ? "Your Name and Date of Birth were modified in Profile Settings. Please re-verify your PAN."
                    : dobChanged
                    ? "Your Date of Birth was modified in Profile Settings. Please re-verify your PAN to match your updated profile."
                    : "Your Full Name was modified in Profile Settings. Please re-verify your PAN."}
                </div>
              </div>
            )}

            {profileIncomplete && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "11px 14px", marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#92400E", fontWeight: 700 }}>Add your full name & date of birth first</span>
                <GoldBtn ghost style={{ padding: "6px 12px", fontSize: 12.5 }} onClick={() => navigate("/creator/settings")}><Pencil size={13} /> Complete Profile</GoldBtn>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Full Name <Lock size={10} style={{ verticalAlign: -1 }} /></label>
                  <input className="cs-input" value={user?.name || ""} disabled style={{ background: "#F9FAFB", color: "#6B7280" }} />
                </div>
                <div>
                  <label style={lbl}>Date of Birth <Lock size={10} style={{ verticalAlign: -1 }} /></label>
                  <input className="cs-input" value={dob || "—"} disabled style={{ background: "#F9FAFB", color: "#6B7280" }} />
                </div>
              </div>
              <p style={{ margin: "-6px 0 0", fontSize: 12, color: colors.typography.secondaryText }}>
                These come from your profile and must match your PAN card exactly.
              </p>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label style={lbl}>PAN Number</label>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: pan.length === 10 ? (panValid ? "#16A34A" : "#DC2626") : colors.typography.secondaryText }}>
                    {pan.length}/10
                  </span>
                </div>
                <input
                  className="cs-input"
                  style={{ letterSpacing: 4, fontWeight: 900, fontSize: 17, textTransform: "uppercase" }}
                  maxLength={10}
                  value={pan}
                  onChange={(e) => { setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setFailure(""); }}
                  onKeyDown={(e) => e.key === "Enter" && panValid && submit()}
                  placeholder="ABCDE1234F"
                />
                {pan.length === 10 && !panValid && (
                  <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700 }}>Format: 5 letters + 4 digits + 1 letter</span>
                )}
              </div>

              {failure && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 13px", fontSize: 13, color: "#B91C1C" }}>
                  ⚠ {failure}
                </div>
              )}

              <GoldBtn loading={submitting} disabled={!panValid || profileIncomplete} onClick={submit} style={{ justifyContent: "center", padding: "13px 18px" }}>
                <ShieldCheck size={16} /> {requiresReverification ? "Re-Verify PAN" : "Verify PAN"}
              </GoldBtn>
            </div>
          </div>

          {/* Why KYC */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...card, background: G.heroGold, border: "none", color: "#fff" }}>
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 14 }}>What KYC unlocks</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {BENEFITS.map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 13.5, fontWeight: 600 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} />
                    </span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: colors.typography.secondaryText, lineHeight: 1.6 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <CheckCircle2 size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span><b style={{ color: colors.typography.primaryText }}>Instant & one-time.</b> Verification happens in seconds against government records.</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Lock size={15} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span><b style={{ color: colors.typography.primaryText }}>Private & secure.</b> Your PAN is stored masked (ABCDE••••F) and never shown publicly.</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Pencil size={15} color="#6B7280" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Name or DOB wrong? <button onClick={() => navigate("/creator/settings")} style={{ background: "transparent", border: "none", color: "#B45309", fontWeight: 800, cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>Update your profile</button> before verifying.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}