// User profile & settings — avatar upload (POST /upload → Supabase URL), name
// edit, WhatsApp support, legal links, logout.
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, LifeBuoy, FileText } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar, GradientButton, Field, TextInput, Modal } from "../../components/ui";
import { toast } from "../../utils/toast";

const SUPPORT_WA = "916363790659";

export default function UserProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const fileRef = useRef(null);

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = unwrap(await apiFetch("/upload", { method: "POST", body: fd }));
      const url = res?.url || res?.data?.url;
      if (!url) throw new Error("Upload failed");
      await apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify({ profile_image: url }) });
      updateUser({ profile_image: url });
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      await apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify({ name: name.trim() }) });
      updateUser({ name: name.trim() });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const row = { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 14, cursor: "pointer", fontSize: 14.5, fontWeight: 600 };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 22px", fontSize: 26, fontWeight: 900 }}>My Profile</h1>

      <div style={{ background: colors.gradients.heroNavy, borderRadius: 18, padding: 26, textAlign: "center", marginBottom: 22 }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <Avatar src={user?.profile_image} name={user?.name || "U"} size={92} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{ position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: "50%", background: colors.gradients.indigo, border: "2px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {uploading ? "…" : <Camera size={14} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadAvatar(e.target.files?.[0])} />
        </div>
        <div style={{ fontWeight: 900, fontSize: 19, marginTop: 10 }}>{user?.name}</div>
        <div style={{ opacity: 0.75, fontSize: 13 }}>{user?.email}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        <Field label="Full Name"><TextInput dark value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Email"><TextInput dark value={user?.email || ""} disabled style={{ opacity: 0.55 }} /></Field>
        <Field label="Phone"><TextInput dark value={user?.phone || ""} disabled style={{ opacity: 0.55 }} /></Field>
        <GradientButton loading={saving} onClick={save}>Save Changes</GradientButton>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={row} onClick={() => window.open(`https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent("Hello, I am a User, I need help.")}`, "_blank")}>
          <LifeBuoy size={18} color={colors.user.accentSoft} /> Help & Support (WhatsApp)
        </div>
        <div style={row} onClick={() => navigate("/app/notifications")}>
          <FileText size={18} color={colors.user.accentSoft} /> Notifications
        </div>
        <div style={{ ...row, color: "#F87171" }} onClick={() => setConfirmLogout(true)}>
          <LogOut size={18} /> Logout
        </div>
      </div>

      <p style={{ textAlign: "center", color: colors.user.subHeading, fontSize: 12, marginTop: 26 }}>
        Manchly Web · Agnivora Digital Pvt Ltd · help@manchly.com
      </p>

      <Modal open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Log out?" dark width={380}>
        <p style={{ color: colors.user.subHeading, fontSize: 14, marginTop: 0 }}>Are you sure you want to log out?</p>
        <div style={{ display: "flex", gap: 10 }}>
          <GradientButton full gradient={colors.gradients.danger} onClick={() => { logout(); navigate("/auth", { replace: true }); }}>Logout</GradientButton>
          <GradientButton full gradient="rgba(255,255,255,0.12)" onClick={() => setConfirmLogout(false)}>Cancel</GradientButton>
        </div>
      </Modal>
    </div>
  );
}
