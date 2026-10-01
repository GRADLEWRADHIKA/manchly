import React, { useState, useRef } from "react";
import {
  MonitorPlay,
  CalendarClock,
  Eye,
  Check,
  ChevronRight,
  Upload,
  Clock,
} from "lucide-react";
import { apiFetch, unwrap } from "../../../../../src/utils/api";
import colors from "../../../../utils/colors";
import { toast } from "../../../../utils/toast";
import { formatCurrency } from "../../../../utils/formatters";
import { CATEGORIES } from "../../../../utils/categories";
import { GoldBtn, AiEnhance, lbl } from "../../../../components/creatorUi";

const STEPS = [
  { id: 1, label: "Session Details", icon: MonitorPlay },
  { id: 2, label: "Schedule & Pricing", icon: CalendarClock },
  { id: 3, label: "Preview & Publish", icon: Eye },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "",
  thumbnail: "",
  duration: 30,
  paid: true,
  price: "",
};

const DURATIONS = [15, 30, 45, 60];

const productToForm = (p) => ({
  title: p.title || "",
  // strips the old "Platform:/Availability:" hack text from legacy products
  description: (p.description || "").split("\nPlatform:")[0].trim(),
  category: p.categories?.[0] || "",
  thumbnail: p.thumbnail_url || "",
  duration: Number(p.duration) || 30,
  paid: Number(p.price) > 0,
  price: Number(p.price) > 0 ? String(p.price) : "",
});

export default function CreateSessionForm({ onClose, onSaved, product }) {
  const isEdit = !!product;
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(() =>
    product ? productToForm(product) : EMPTY_FORM,
  );
  const [thumbUploading, setThumbUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const thumbRef = useRef(null);

  const uploadThumb = async (file) => {
    if (!file) return;
    setThumbUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = unwrap(
        await apiFetch("/upload", { method: "POST", body: fd }),
      );
      if (!res?.url) throw new Error("Upload failed");
      setForm((f) => ({ ...f, thumbnail: res.url }));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setThumbUploading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) {
      setCurrentStep(1);
      return toast.error("Title is required");
    }
    if (!form.category) {
      setCurrentStep(1);
      return toast.error("Please select a category");
    }
    if (
      form.paid &&
      (form.price === "" ||
        isNaN(Number(form.price)) ||
        Number(form.price) <= 0)
    ) {
      setCurrentStep(2);
      return toast.error("Set a valid price, or switch to Free");
    }

    setSaving(true);
    try {
      await apiFetch(
        isEdit ? `/sessions/products/${product.id}` : "/sessions/products",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            duration: Number(form.duration),
            price: form.paid ? Number(form.price) : 0,
            mode: "video",
            thumbnail_url: form.thumbnail || null,
            categories: [form.category],
          }),
        },
      );
      toast.success(isEdit ? "Session updated" : "Session created");
      onSaved();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px" }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: colors.typography.secondaryText,
          marginBottom: 8,
        }}
      >
        <span style={{ cursor: "pointer" }} onClick={onClose}>
          Sessions
        </span>
        <ChevronRight size={14} />
        <span style={{ fontWeight: 600, color: colors.typography.primaryText }}>
          {isEdit ? "Edit Session" : "New Session"}
        </span>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{ fontSize: 26, fontWeight: 900, margin: 0, color: "#111827" }}
        >
          {isEdit ? "Edit Session" : "Create New Session"}
        </h1>
        <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>
          {isEdit
            ? "Update the details users see when booking."
            : "Set up a 1:1 video session that users can book."}
        </p>
      </div>

      {/* Stepper */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          maxWidth: 700,
          margin: "0 auto 36px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "15%",
            right: "15%",
            height: 2,
            background: "#E5E7EB",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "15%",
            width: currentStep === 1 ? "0%" : currentStep === 2 ? "35%" : "70%",
            height: 2,
            background: "#F59E0B",
            zIndex: 0,
            transition: "all 0.3s ease",
          }}
        />

        {STEPS.map((step) => {
          const Icon = step.icon;
          const active = currentStep === step.id;
          const completed = currentStep > step.id;
          return (
            <div
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 1,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active || completed ? "#F59E0B" : "#F3F4F6",
                  color: active || completed ? "#fff" : "#9CA3AF",
                  boxShadow: active
                    ? "0 4px 12px rgba(245,158,11,0.3)"
                    : "none",
                  transition: "all 0.2s",
                }}
              >
                {completed ? <Check size={20} /> : <Icon size={20} />}
              </div>
              <span
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#111827" : "#6B7280",
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* White card */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${colors.base.border}`,
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        {/* ---------- STEP 1 ---------- */}
        {currentStep === 1 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 32,
              alignItems: "start",
            }}
          >
            {/* LEFT: fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label style={lbl}>SESSION TITLE *</label>
                  <AiEnhance
                    endpoint="/ai/session/enhance"
                    text={form.title}
                    kind="title"
                    tone="punchy"
                    onUse={(t) => setForm((f) => ({ ...f, title: t }))}
                  />
                </div>
                <input
                  className="cs-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 30-min Portfolio Review Call"
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label style={lbl}>DESCRIPTION</label>
                  <AiEnhance
                    endpoint="/ai/session/enhance"
                    text={form.description}
                    kind="description"
                    tone="conversational"
                    onUse={(t) => setForm((f) => ({ ...f, description: t }))}
                  />
                </div>
                <textarea
                  className="cs-input"
                  style={{ minHeight: 110, resize: "vertical" }}
                  maxLength={300}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="What will users get out of this 1:1 session?"
                />
              </div>

              <div>
                <label style={lbl}>CATEGORY *</label>
                <select
                  className="cs-input"
                  style={{ background: "#fff" }}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* RIGHT: thumbnail */}
            <div>
              <label style={lbl}>SESSION THUMBNAIL</label>
              <div
                onClick={() => thumbRef.current?.click()}
                style={{
                  border: "2px dashed #E5E7EB",
                  borderRadius: 16,
                  background: "#FAFAFA",
                  height: 290,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  textAlign: "center",
                  padding: 20,
                }}
              >
                <input
                  ref={thumbRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => uploadThumb(e.target.files?.[0])}
                />
                {form.thumbnail ? (
                  <>
                    <img
                      src={form.thumbnail}
                      alt="Cover"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Click to Change
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#FFFBEB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#D97706",
                        marginBottom: 14,
                      }}
                    >
                      <Upload size={26} />
                    </div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 15,
                        color: "#111827",
                      }}
                    >
                      {thumbUploading
                        ? "Uploading..."
                        : "Upload Session Thumbnail"}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}
                    >
                      JPG, PNG, or WebP (Recommended 16:9)
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------- STEP 2 ---------- */}
        {currentStep === 2 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              maxWidth: 700,
              margin: "0 auto",
            }}
          >
            <div>
              <label style={lbl}>SESSION DURATION</label>
              <div className="cs-seg">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    className={Number(form.duration) === d ? "on" : ""}
                    onClick={() => setForm({ ...form, duration: d })}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>PRICING</label>
              <div className="cs-seg">
                <button
                  className={form.paid ? "on" : ""}
                  onClick={() => setForm({ ...form, paid: true })}
                >
                  Paid
                </button>
                <button
                  className={!form.paid ? "on green" : ""}
                  onClick={() => setForm({ ...form, paid: false, price: "" })}
                >
                  Free
                </button>
              </div>
            </div>

            {form.paid && (
              <div>
                <label style={lbl}>PRICE (INR) *</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontWeight: 900,
                      color: "#92400E",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    className="cs-input"
                    style={{ paddingLeft: 30, fontWeight: 800 }}
                    inputMode="numeric"
                    value={form.price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: e.target.value.replace(/[^\d.]/g, ""),
                      })
                    }
                    placeholder="e.g. 999"
                  />
                </div>
              </div>
            )}

            <p style={{ margin: 0, fontSize: 12.5, color: "#6B7280" }}>
              Users book this session into the time slots from your Availability
              settings.
            </p>
          </div>
        )}

        {/* ---------- STEP 3 ---------- */}
        {currentStep === 3 && (
          <div style={{ maxWidth: 360, margin: "0 auto" }}>
            <p
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "#6B7280",
                margin: "0 0 16px",
              }}
            >
              This is how your session will look to users.
            </p>

            <div
              style={{
                borderRadius: 16,
                background: "#fff",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16 / 10",
                  position: "relative",
                  backgroundColor: "#F8FAFC",
                  backgroundImage: form.thumbnail
                    ? `url(${form.thumbnail})`
                    : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {form.category && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "#fff",
                      color: "#0F172A",
                      padding: "4px 12px",
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 700,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    }}
                  >
                    {form.category}
                  </span>
                )}
              </div>

              <div style={{ padding: 16 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0F172A",
                    lineHeight: 1.3,
                  }}
                >
                  {form.title || "Untitled Session"}
                </h3>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: "#64748B",
                    lineHeight: 1.5,
                  }}
                >
                  {form.description || "No description provided."}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    margin: "12px 0 16px",
                    fontSize: 13,
                    color: "#64748B",
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Clock size={14} color="#64748B" /> {form.duration} min
                  </span>
                  <span>· 1:1 Video</span>
                </div>

                <div
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 14,
                    background: "#22C55E",
                    color: "#fff",
                    fontSize: 17,
                    fontWeight: 800,
                    textAlign: "center",
                    boxShadow: "0 4px 12px rgba(34,197,94,0.25)",
                  }}
                >
                  {form.paid && Number(form.price) > 0
                    ? formatCurrency(form.price)
                    : "Free"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------- FOOTER ---------- */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #E5E7EB",
            marginTop: 32,
            paddingTop: 20,
          }}
        >
          <GoldBtn
            ghost
            onClick={() =>
              currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()
            }
            style={{ padding: "12px 28px" }}
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </GoldBtn>

          {currentStep < 3 ? (
            <GoldBtn
              onClick={() => setCurrentStep(currentStep + 1)}
              style={{ padding: "12px 32px" }}
            >
              Continue <ChevronRight size={16} />
            </GoldBtn>
          ) : (
            <GoldBtn
              loading={saving}
              onClick={save}
              style={{ padding: "12px 36px" }}
            >
              {isEdit ? "Save Changes" : "Create Session"}
            </GoldBtn>
          )}
        </div>
      </div>
    </div>
  );
}