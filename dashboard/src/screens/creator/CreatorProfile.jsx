// Creator profile & settings — avatar upload, KYC badge, profile-completion %,
// name/DOB (with KYC-reset warning), social links, 90/10 Hissa calculator,
// WhatsApp support, logout.
import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ShieldCheck, ShieldAlert, AtSign, Briefcase, Video, Globe, LifeBuoy, LogOut, Megaphone } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar, GradientButton, Field, TextInput, Modal, ProgressBar, Badge } from "../../components/ui";
import { LegalModal } from "../../components/LegalModals";
import { toast } from "../../utils/toast";
import { formatCurrency } from "../../utils/formatters";

const SUPPORT_WA = "916363790659";

export default function CreatorProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: user?.name || "",
    dob: user?.dob ? String(user.dob).slice(0, 10) : "",
    instagram_link: user?.instagram_link || "",
    linkedin_link: user?.linkedin_link || "",
    youtube_link: user?.youtube_link || "",
    facebook_link: user?.facebook_link || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [kycWarn, setKycWarn] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null);
  const [hissa, setHissa] = useState(10000);

  const completion = useMemo(() => {
    const checks = [
      user?.name, user?.dob, user?.email, user?.phone, user?.profile_image,
      form.instagram_link, form.linkedin_link, form.youtube_link, form.facebook_link,
      user?.kyc_verified,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [user, form]);

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = unwrap(await apiFetch("/upload", { method: "POST", body: fd }));
      const url = res?.url;
      if (!url) throw new Error("Upload failed");
      await apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify({ profile_image: url }) });
      updateUser({ profile_image: url });
      toast.success("Photo updated");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const identityChanged = () =>
    (form.name.trim() && form.name.trim() !== user?.name) ||
    (form.dob && form.dob !== String(user?.dob || "").slice(0, 10));

  const doSave = async (resetKyc = false) => {
    setSaving(true);
    try {
      if (resetKyc) {
        await apiFetch("/kyc/reset", { method: "POST", body: JSON.stringify({}) }).catch(() => {});
      }
      const payload = {
        name: form.name.trim(),
        dob: form.dob || undefined,
        instagram_link: form.instagram_link.trim(),
        linkedin_link: form.linkedin_link.trim(),
        youtube_link: form.youtube_link.trim(),
        facebook_link: form.facebook_link.trim(),
      };
      await apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify(payload) });
      updateUser({ ...payload, ...(resetKyc ? { kyc_verified: false } : {}) });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
      setKycWarn(false);
    }
  };

  const save = () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (user?.kyc_verified && identityChanged()) setKycWarn(true);
    else doSave(false);
  };

  const socials = [
    ["instagram_link", "Instagram", AtSign, "#E1306C"],
    ["linkedin_link", "LinkedIn", Briefcase, "#0A66C2"],
    ["youtube_link", "YouTube", Video, "#FF0000"],
    ["facebook_link", "Facebook", Globe, "#1877F2"],
  ];

  const creatorCut = Math.round(hissa * 0.9);

  return (
    <div style={{ padding: 32, maxWidth: 860, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 22px", fontSize: 26, fontWeight: 900, color: colors.typography.primaryText }}>Profile & Settings</h1>

      {/* Header card */}
      <div style={{ background: colors.gradients.heroGold, borderRadius: 18, padding: 26, color: "#fff", marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Avatar src={user?.profile_image} name={user?.name || "C"} size={86} />
            <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%", background: colors.gradients.gold, border: "2px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {uploading ? "…" : <Camera size={13} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadAvatar(e.target.files?.[0])} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 21, fontWeight: 900 }}>{user?.name}</span>
              {user?.kyc_verified ? (
                <Badge color="#22C55E" bg="rgba(34,197,94,0.2)"><ShieldCheck size={11} style={{ marginRight: 4 }} />KYC Verified</Badge>
              ) : (
                <span onClick={() => navigate("/creator/kyc")} style={{ cursor: "pointer" }}>
                  <Badge color="#FCA5A5" bg="rgba(239,68,68,0.22)"><ShieldAlert size={11} style={{ marginRight: 4 }} />Not Verified — verify now</Badge>
                </span>
              )}
            </div>
            <div style={{ opacity: 0.85, fontSize: 13, marginTop: 4 }}>{user?.email} · {user?.phone}</div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                <span>Profile completion</span><span>{completion}%</span>
              </div>
              <ProgressBar percent={completion} gradient="linear-gradient(90deg,#fff,#F3C36B)" track="rgba(255,255,255,0.25)" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {/* Personal info */}
        <div style={{ background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 16, padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Personal Information</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Full Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Date of Birth" hint={user?.kyc_verified ? "Changing name/DOB resets your KYC" : undefined}>
              <TextInput type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </Field>
            <Field label="Email"><TextInput value={user?.email || ""} disabled style={{ opacity: 0.6 }} /></Field>
            <Field label="Phone"><TextInput value={user?.phone || ""} disabled style={{ opacity: 0.6 }} /></Field>
          </div>
        </div>

        {/* Social links */}
        <div style={{ background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 16, padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Social Links</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {socials.map(([key, label, Icon, color]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon size={18} color={color} style={{ flexShrink: 0 }} />
                <TextInput placeholder={`${label} URL`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <GradientButton size="lg" loading={saving} onClick={save} gradient={colors.gradients.gold}>Save Changes</GradientButton>
      </div>

      {/* Hissa 90/10 */}
      <div style={{ marginTop: 26, background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 16, padding: 22 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>Aapki Kamaai ka Hissa</h3>
        <p style={{ margin: "0 0 14px", color: colors.typography.secondaryText, fontSize: 13.5 }}>
          You keep <b>90%</b> of every sale — Manchly keeps 10%. Slide to see your cut:
        </p>
        <div style={{ display: "flex", height: 14, borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ width: "90%", background: colors.gradients.gold }} />
          <div style={{ width: "10%", background: "#E5E7EB" }} />
        </div>
        <input type="range" min={1000} max={100000} step={100} value={hissa} onChange={(e) => setHissa(Number(e.target.value))} style={{ width: "100%", accentColor: colors.brand.primaryOrange }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 14 }}>
          <span>If you earn <b>{formatCurrency(hissa)}</b></span>
          <span>You keep <b style={{ color: colors.brand.successGreen }}>{formatCurrency(creatorCut)}</b> · Manchly {formatCurrency(hissa - creatorCut)}</span>
        </div>
      </div>

      {/* Support & logout */}
      <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
        <GradientButton gradient={colors.gradients.teal} onClick={() => window.open(`https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent("Hello, I am a Creator, I need help.")}`, "_blank")}>
          <LifeBuoy size={15} /> Help & Support
        </GradientButton>
        <GradientButton gradient={colors.gradients.purple} onClick={() => window.open(`https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent("Hello, I want help with marketing my products on Manchly.")}`, "_blank")}>
          <Megaphone size={15} /> Marketing Help
        </GradientButton>
        <GradientButton gradient={colors.gradients.danger} onClick={() => setConfirmLogout(true)}>
          <LogOut size={15} /> Logout
        </GradientButton>
      </div>

      {/* Legal */}
      <div style={{ display: "flex", gap: 18, marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: colors.typography.secondaryText }}>Legal</span>
        {[["terms", "Terms of Service"], ["privacy", "Privacy Policy"], ["refund", "Refund Policy"]].map(([key, label]) => (
          <button key={key} onClick={() => setLegalDoc(key)} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: colors.brand.actionBlue, fontWeight: 700, fontSize: 13.5, textDecoration: "underline", textUnderlineOffset: 2 }}>
            {label}
          </button>
        ))}
      </div>

      {legalDoc && <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />}

      {/* KYC reset warning */}
      <Modal open={kycWarn} onClose={() => setKycWarn(false)} title="KYC Will Be Reset" width={420}>
        <p style={{ color: colors.typography.secondaryText, fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>
          You changed your <b>name or date of birth</b>. These must match your PAN card, so saving will reset your KYC verification and you'll need to verify again.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <GradientButton full gradient={colors.gradients.danger} loading={saving} onClick={() => doSave(true)}>Reset KYC & Save</GradientButton>
          <GradientButton full gradient="linear-gradient(135deg,#9CA3AF,#6B7280)" onClick={() => setKycWarn(false)}>Cancel</GradientButton>
        </div>
      </Modal>

      <Modal open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Log out?" width={380}>
        <p style={{ color: colors.typography.secondaryText, fontSize: 14, marginTop: 0 }}>Are you sure you want to log out?</p>
        <div style={{ display: "flex", gap: 10 }}>
          <GradientButton full gradient={colors.gradients.danger} onClick={() => { logout(); navigate("/auth", { replace: true }); }}>Logout</GradientButton>
          <GradientButton full gradient="linear-gradient(135deg,#9CA3AF,#6B7280)" onClick={() => setConfirmLogout(false)}>Cancel</GradientButton>
        </div>
      </Modal>
    </div>
  );
}
