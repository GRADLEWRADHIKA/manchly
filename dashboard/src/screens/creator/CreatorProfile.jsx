import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  MapPin,
  Upload,
  X as XIcon,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Badge, Modal } from "../../components/ui";
import { toast } from "../../utils/toast";

const EXPERIENCE_OPTIONS = [
  "0-1 Years",
  "1-3 Years",
  "3-5 Years",
  "5+ Years",
  "10+ Years",
];

export default function CreatorProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);


  const [form, setForm] = useState({
    firstName: user?.first_name || user?.name?.split(" ")[0] || "",
    lastName: user?.last_name || user?.name?.split(" ").slice(1).join(" ") || "",
    displayName: user?.display_name || user?.name || "",
    proBio: user?.pro_bio || "",
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

  // Storefront state — saves to /creator/storefront/me (new, separate table)
  const [storefront, setStorefront] = useState({
    tagline: "",
    bio: "",
    expertise: [],
    experienceYears: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    twitter: "",
    website: "",
    isPublished: false,
  });
  const [creatorHandle, setCreatorHandle] = useState(user?.handle || "");
  const [expertiseInput, setExpertiseInput] = useState("");
  const [loadingStorefront, setLoadingStorefront] = useState(true);

  // Sync user updates if auth hydrates after initial mount
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        firstName: prev.firstName || user.first_name || user.name?.split(" ")[0] || "",
        lastName: prev.lastName || user.last_name || user.name?.split(" ").slice(1).join(" ") || "",
        displayName: prev.displayName || user.display_name || user.name || "",
        proBio: prev.proBio || user.pro_bio || "",
        email: user.email || prev.email || "",
        phone: prev.phone || user.phone || "",
        addressLine1: prev.addressLine1 || user.address_line1 || "",
        addressLine2: prev.addressLine2 || user.address_line2 || "",
        city: prev.city || user.city || "",
        state: prev.state || user.state || "",
        country: prev.country || user.country || "India",
        pincode: prev.pincode || user.pincode || "",
        gstin: prev.gstin || user.gstin || "",
        supportEmail: prev.supportEmail || user.support_email || "",
        supportPhone: prev.supportPhone || user.support_phone || "",
      }));
      if (user.handle) {
        setCreatorHandle(user.handle);
      }
    }
  }, [user]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPasswordReset, setConfirmPasswordReset] = useState(false);

  // Load the creator's storefront data on mount
  useEffect(() => {
    let isMounted = true;

    const loadStorefront = async () => {
      try {
        const res = unwrap(await apiFetch("/creator/storefront/me"));
        const s = res?.storefront;
        if (isMounted && s) {
          setStorefront({
            tagline: s.tagline || "",
            bio: s.bio || "",
            expertise: Array.isArray(s.expertise) ? s.expertise : [],
            experienceYears: s.experience_years || "",
            instagram: s.instagram || "",
            linkedin: s.linkedin || "",
            youtube: s.youtube || "",
            twitter: s.twitter || "",
            website: s.website_url || "",
            isPublished: Boolean(s.is_published),
          });
        }

        if (isMounted && res?.handle) {
          setCreatorHandle(res.handle);
        }
      } catch (e) {
        toast.error(e.message || "Failed to load storefront details");
      } finally {
        if (isMounted) setLoadingStorefront(false);
      }
    };

    loadStorefront();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Expertise tag helpers
  const addExpertiseTag = () => {
    const value = expertiseInput.trim();
    if (!value) return;
    if (storefront.expertise.includes(value)) {
      setExpertiseInput("");
      return;
    }
    setStorefront((prev) => ({ ...prev, expertise: [...prev.expertise, value] }));
    setExpertiseInput("");
  };

  const removeExpertiseTag = (tag) => {
    setStorefront((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((t) => t !== tag),
    }));
  };

  // Main Save Handler — saves /auth/profile fields AND /creator/storefront/me fields
  const handleSave = async () => {
    setSaving(true);
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      const profilePayload = {
        name: fullName || form.displayName,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        display_name: form.displayName.trim(),
        pro_bio: form.proBio.trim(),
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

      const storefrontPayload = {
        tagline: storefront.tagline.trim(),
        bio: storefront.bio.trim(),
        expertise: storefront.expertise,
        experience_years: storefront.experienceYears || null,
        instagram: storefront.instagram.trim(),
        linkedin: storefront.linkedin.trim(),
        youtube: storefront.youtube.trim(),
        twitter: storefront.twitter.trim(),
        website_url: storefront.website.trim(),
         is_published: storefront.isPublished
      };

      await Promise.all([
        apiFetch("/auth/profile", {
          method: "PUT",
          body: JSON.stringify(profilePayload),
        }),
        apiFetch("/creator/storefront/me", {
          method: "PUT",
          body: JSON.stringify(storefrontPayload),
        }),
      ]);

      updateUser(profilePayload);
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

  const handleStorefrontChange = (field, value) => {
    setStorefront((prev) => ({ ...prev, [field]: value }));
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

           {/* Storefront Visibility */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
                Public Storefront
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
                {storefront.isPublished
                  ? "Your storefront is live. Anyone with your link can view it."
                  : "Your storefront is hidden. Publish it so learners can find you."}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {creatorHandle && (
                <button
                  onClick={() => window.open(`/app/creator/${creatorHandle}`, "_blank")}
                  style={{
                    background: "transparent",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  View Public Profile
                </button>
              )}
              <button
                onClick={() => handleStorefrontChange("isPublished", !storefront.isPublished)}
                disabled={loadingStorefront}
                style={{
                  width: 46,
                  height: 26,
                  borderRadius: 999,
                  border: "none",
                  cursor: loadingStorefront ? "not-allowed" : "pointer",
                  background: storefront.isPublished ? "#22C55E" : "#D1D5DB",
                  position: "relative",
                  transition: "background 0.2s",
                }}
                aria-label={storefront.isPublished ? "Unpublish storefront" : "Publish storefront"}
              >
                <span
                  style={{
                   position: "absolute",
                    top: 3,
                    left: storefront.isPublished ? 23 : 3,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
              </button>
            </div>
          </div>
       </div>

        {/* Section 1: Professional Details (now backed by /creator/storefront/me) */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Pencil size={18} color="#374151" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Professional Details
            </h3>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280" }}>
            Tell visitors about yourself and what you do. This section powers your public profile.
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
                Tagline / Short Bio
              </label>
              <input
                type="text"
                placeholder="e.g. Helping people learn, grow and build wealth"
                value={storefront.tagline}
                onChange={(e) => handleStorefrontChange("tagline", e.target.value)}
                maxLength={150}
                disabled={loadingStorefront}
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
              <div style={{ textAlign: "right", fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                {storefront.tagline.length}/150
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                About Me
              </label>
              <textarea
                rows={3}
                placeholder="Tell your story. This will be visible on your public profile."
                value={storefront.bio}
                onChange={(e) => handleStorefrontChange("bio", e.target.value)}
                maxLength={500}
                disabled={loadingStorefront}
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
              <div style={{ textAlign: "right", fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                {storefront.bio.length}/500
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Your Expertise / Niche
              </label>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6B7280" }}>
                Add the topics you teach or are an expert in.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {storefront.expertise.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#EFF6FF",
                      color: "#2563EB",
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: 999,
                    }}
                  >
                    {tag}
                    <XIcon
                      size={13}
                      style={{ cursor: "pointer" }}
                      onClick={() => removeExpertiseTag(tag)}
                    />
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. Stock Market, Personal Finance"
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addExpertiseTag();
                    }
                  }}
                  disabled={loadingStorefront}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    background: "#FAFAFA",
                    fontSize: 13.5,
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={addExpertiseTag}
                  style={{
                    background: "#F3F4F6",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    padding: "0 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Experience (Years)
              </label>
              <select
                value={storefront.experienceYears}
                onChange={(e) => handleStorefrontChange("experienceYears", e.target.value)}
                disabled={loadingStorefront}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FAFAFA",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              >
                <option value="">Select experience</option>
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Social Links (now backed by /creator/storefront/me) */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Pencil size={18} color="#374151" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Social Links
            </h3>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280" }}>
            Connect your social media profiles. These show on your public profile.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Instagram URL
              </label>
              <input
                type="text"
                placeholder="https://instagram.com/username"
                value={storefront.instagram}
                onChange={(e) => handleStorefrontChange("instagram", e.target.value)}
                disabled={loadingStorefront}
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
                value={storefront.linkedin}
                onChange={(e) => handleStorefrontChange("linkedin", e.target.value)}
                disabled={loadingStorefront}
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
                YouTube URL
              </label>
              <input
                type="text"
                placeholder="https://youtube.com/@channel"
                value={storefront.youtube}
                onChange={(e) => handleStorefrontChange("youtube", e.target.value)}
                disabled={loadingStorefront}
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
                X (Twitter) URL
              </label>
              <input
                type="text"
                placeholder="https://x.com/username"
                value={storefront.twitter}
                onChange={(e) => handleStorefrontChange("twitter", e.target.value)}
                disabled={loadingStorefront}
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

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Website URL
              </label>
              <input
                type="text"
                placeholder="https://yourdomain.com"
                value={storefront.website}
                onChange={(e) => handleStorefrontChange("website", e.target.value)}
                disabled={loadingStorefront}
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