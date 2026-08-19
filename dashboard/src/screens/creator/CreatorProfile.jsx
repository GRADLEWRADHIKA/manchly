import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  MapPin,
  Upload,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Badge, Modal } from "../../components/ui";
import { toast } from "../../utils/toast";

export default function CreatorProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // Form state incorporating profile, contact, address, tax & support data
  const [form, setForm] = useState({
    firstName: user?.first_name || user?.name?.split(" ")[0] || "",
    lastName: user?.last_name || user?.name?.split(" ").slice(1).join(" ") || "",
    displayName: user?.display_name || user?.name || "",
    headline: user?.headline || "",
    proBio: user?.pro_bio || "",
    bio: user?.bio || "",
    instagram: user?.instagram_link || "",
    twitter: user?.twitter_link || "",
    linkedin: user?.linkedin_link || "",
    website: user?.website_link || "",
    email: user?.email || "",
    phone: user?.phone || "",
    addressLine1: user?.address_line1 || "",
    addressLine2: user?.address_line2 || "",
    city: user?.city || "",
    state: user?.state || "",
    country: user?.country || "India",
    pincode: user?.pincode || "",
    gstin: user?.gstin || "",
    supportEmail: user?.support_email || "",
    supportPhone: user?.support_phone || "",
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPasswordReset, setConfirmPasswordReset] = useState(false);

  // Avatar Upload Logic
  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = unwrap(await apiFetch("/upload", { method: "POST", body: fd }));
      const url = res?.url;
      if (!url) throw new Error("Upload failed");
      await apiFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ profile_image: url }),
      });
      updateUser({ profile_image: url });
      toast.success("Photo updated successfully");
    } catch (e) {
      toast.error(e.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Avatar Remove Logic
  const removeAvatar = async () => {
    try {
      await apiFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ profile_image: null }),
      });
      updateUser({ profile_image: null });
      toast.success("Photo removed");
    } catch (e) {
      toast.error(e.message || "Failed to remove image");
    }
  };

  // Main Save Handler
  const handleSave = async () => {
    setSaving(true);
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      const payload = {
        name: fullName || form.displayName,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        display_name: form.displayName.trim(),
        headline: form.headline.trim(),
        pro_bio: form.proBio.trim(),
        bio: form.bio.trim(),
        instagram_link: form.instagram.trim(),
        twitter_link: form.twitter.trim(),
        linkedin_link: form.linkedin.trim(),
        website_link: form.website.trim(),
        address_line1: form.addressLine1.trim(),
        address_line2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        pincode: form.pincode.trim(),
        gstin: form.gstin.trim(),
        support_email: form.supportEmail.trim(),
        support_phone: form.supportPhone.trim(),
      };

      await apiFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      updateUser(payload);
      toast.success("Profile saved successfully!");
    } catch (e) {
      toast.error(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Send Password Reset Link
  const handlePasswordReset = async () => {
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: user?.email }),
      });
      toast.success("Password reset link sent to your email!");
      setConfirmPasswordReset(false);
    } catch (e) {
      toast.error(e.message || "Failed to send reset link");
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    try {
      await apiFetch("/auth/account", { method: "DELETE" });
      toast.success("Account deleted");
      logout();
      navigate("/auth", { replace: true });
    } catch (e) {
      toast.error(e.message || "Failed to delete account");
    }
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ backgroundColor: "#F3F4F6", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Sticky Top Header Bar */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>
          Profile Settings
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: colors.brand.primaryOrange,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "9px 20px",
            fontWeight: 700,
            fontSize: 13.5,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={{ maxWidth: 880, margin: "24px auto 0", padding: "0 16px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Banner Header Card */}
        <div
          style={{
            background:  colors.gradients.gold,
            borderRadius: 16,
            padding: 28,
            color: "#ffff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Avatar src={user?.profile_image} name={form.firstName || "U"} size={88} />
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#ffff",
                    border: "none",
                    color: "#111827",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  <Pencil size={13} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => uploadAvatar(e.target.files?.[0])}
                />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
                  {form.firstName || "Your Name"}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.8 }}>
                  This will be displayed on your public profile
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#ffff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
              <Upload size={13} /> {uploading ? "Uploading..." : "Upload new"}
              </button>
              <button
                onClick={removeAvatar}
                style={{
                  background: "transparent",
                  color: "#ffff",
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: 0.85,
                }}
              >
                Remove
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <input
                type="text"
                placeholder="First Name"
                value={form.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(255,255,255,0.9)",
                  color: "#111827",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Last Name"
                value={form.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(255,255,255,0.9)",
                  color: "#111827",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 1: Professional Details */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Pencil size={18} color="#374151" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Professional Details
            </h3>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280" }}>
            Tell visitors about yourself and what you do
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Display Name
              </label>
              <input
                type="text"
                placeholder="Enter your display name"
                value={form.displayName}
                onChange={(e) => handleInputChange("displayName", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Professional Headline
              </label>
              <input
                type="text"
                placeholder="Enter your professional headline"
                value={form.headline}
                onChange={(e) => handleInputChange("headline", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Professional Bio
              </label>
              <textarea
                rows={3}
                placeholder="Tell us about yourself professionally..."
                value={form.proBio}
                onChange={(e) => handleInputChange("proBio", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Bio
              </label>
              <textarea
                rows={3}
                placeholder="Tell us about yourself..."
                value={form.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Social Links */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Pencil size={18} color="#374151" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Social Links
            </h3>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280" }}>
            Connect your social media profiles
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Instagram URL
              </label>
              <input
                type="text"
                placeholder="https://instagram.com/username"
                value={form.instagram}
                onChange={(e) => handleInputChange("instagram", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Twitter URL
              </label>
              <input
                type="text"
                placeholder="https://twitter.com/username"
                value={form.twitter}
                onChange={(e) => handleInputChange("twitter", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                LinkedIn URL
              </label>
              <input
                type="text"
                placeholder="https://linkedin.com/in/username"
                value={form.linkedin}
                onChange={(e) => handleInputChange("linkedin", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Website URL
              </label>
              <input
                type="text"
                placeholder="https://dashboard.manchly.app"
                value={form.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Contact Information */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Pencil size={18} color="#374151" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Contact Information
            </h3>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280" }}>
            Your primary contact details
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Email Subcard */}
            <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 18, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Pencil size={15} color="#4B5563" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Email Address</span>
                </div>
                <Badge color="#22C55E" bg="#F0FDF4">Verified</Badge>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    background: "#FAFAFA",
                    fontSize: 13.5,
                    color: "#6B7280",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <span style={{ fontSize: 12, color: "#2563EB", cursor: "pointer", fontWeight: 500 }}>
                Verified
              </span>
            </div>

            {/* Phone Subcard */}
            <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 18, background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <Pencil size={15} color="#4B5563" />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Phone Number</span>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Enter your phone number"
                  value={form.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    background: "#FAFAFA",
                    fontSize: 13.5,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: "#6B7280" }}>
                Add a number first, then save your profile if required, before verifying.
              </p>
              <button
                onClick={() => toast.info("Verification SMS requested")}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  fontSize: 12,
                  color: "#2563EB",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Verify Phone
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Address */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <MapPin size={18} color="#374151" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Address
            </h3>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280" }}>
            Your saved address
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Address line 1
              </label>
              <input
                type="text"
                placeholder="e.g. 123 Main St"
                value={form.addressLine1}
                onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Address line 2 (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Apt 4, Building name"
                value={form.addressLine2}
                onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={form.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                State
              </label>
              <input
                type="text"
                placeholder="e.g. Maharashtra"
                value={form.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Country
              </label>
              <input
                type="text"
                placeholder="e.g. India"
                value={form.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Pincode
              </label>
              <input
                type="text"
                placeholder="e.g. 400001"
                value={form.pincode}
                onChange={(e) => handleInputChange("pincode", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 5: Tax Details */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Pencil size={18} color="#374151" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Tax details
            </h3>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280" }}>
            GST number for invoices and billing
          </p>

          <div style={{ maxWidth: 440, marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              GST number (GSTIN)
            </label>
            <input
              type="text"
              placeholder="e.g. 29XXXXXXXXXX1Z5"
              value={form.gstin}
              onChange={(e) => handleInputChange("gstin", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                background: "#FAFAFA",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6B7280" }}>
            Optional. 15-character GSTIN. Leave empty if not applicable.
            <br />
            GST rate: 18% (set by platform)
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, background: "#F3F4F6", color: "#6B7280", padding: "4px 10px", borderRadius: 99 }}>
              Not allowed by admin
            </span>
            <span style={{ fontSize: 11.5, background: "#F3F4F6", color: "#6B7280", padding: "4px 10px", borderRadius: 99 }}>
              GSTIN missing
            </span>
            <span style={{ fontSize: 11.5, background: "#F3F4F6", color: "#6B7280", padding: "4px 10px", borderRadius: 99 }}>
              Courses: not ready
            </span>
            <span style={{ fontSize: 11.5, background: "#F3F4F6", color: "#6B7280", padding: "4px 10px", borderRadius: 99 }}>
              Digital products: not ready
            </span>
          </div>
        </div>

        {/* Section 6: Support Channels */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Pencil size={18} color="#374151" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Support Channels
            </h3>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280" }}>
            Set up how customers can reach you for support
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Support Email Subcard */}
            <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 18, background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <Pencil size={15} color="#4B5563" />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Support Email</span>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                  Support Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your support email"
                  value={form.supportEmail}
                  onChange={(e) => handleInputChange("supportEmail", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    background: "#FAFAFA",
                    fontSize: 13.5,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <p style={{ margin: "0 0 10px", fontSize: 11, color: "#6B7280" }}>
                Add a support email, save your profile, then send a code.
              </p>

              <button
                onClick={() => toast.success("Verification code sent to support email")}
                style={{
                  background: "#F3F4F6",
                  color: "#6B7280",
                  border: "1px solid #E5E7EB",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Send verification code
              </button>
            </div>

            {/* Support Phone Subcard */}
            <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 18, background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <Pencil size={15} color="#4B5563" />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Support Phone</span>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                  Support Phone
                </label>
                <input
                  type="text"
                  placeholder="Enter your support phone number"
                  value={form.supportPhone}
                  onChange={(e) => handleInputChange("supportPhone", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    background: "#FAFAFA",
                    fontSize: 13.5,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <p style={{ margin: "0 0 10px", fontSize: 11, color: "#6B7280" }}>
                Add a number first, then save your profile if required, before verifying.
              </p>

              <button
                onClick={() => toast.success("Verification SMS sent")}
                style={{
                  background: "#F3F4F6",
                  color: "#6B7280",
                  border: "1px solid #E5E7EB",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Verify
              </button>
            </div>
          </div>
        </div>

        {/* Section 7: Security (Change Password) */}
        <div style={{ background: "#fff", border: "1px solid #3B82F6", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Pencil size={18} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2563EB" }}>
                  Change Password
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
                Send a password reset link to your email to change your password
              </p>
            </div>

            <button
              onClick={() => setConfirmPasswordReset(true)}
              style={{
                background: "#2563EB",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "9px 18px",
                fontWeight: 600,
                fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <Modal open={confirmPasswordReset} onClose={() => setConfirmPasswordReset(false)} title="Reset Password?" width={400}>
        <p style={{ color: "#4B5563", fontSize: 14, margin: "0 0 16px" }}>
          We will send a password reset link to <b>{user?.email}</b>.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handlePasswordReset}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            Send Link
          </button>
          <button
            onClick={() => setConfirmPasswordReset(false)}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Account Permanently?" width={420}>
        <p style={{ color: "#DC2626", fontSize: 14, margin: "0 0 16px", fontWeight: 500 }}>
          This action is irreversible. All your courses, data, and settings will be permanently erased.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleDeleteAccount}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            Yes, Delete Account
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}