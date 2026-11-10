// Shared creator-suite UI atoms (light theme + gold gradients) used by the
// Studio and Webinars screens: gold button, stat card, AI-enhance widget.
import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { apiFetch, unwrap } from "../utils/api";
import colors from "../utils/colors";
import { Spinner } from "./ui";
import { toast } from "../utils/toast";

const G = colors.gradients;

export const lbl = {
  display: "block", fontSize: 11.5, fontWeight: 800, letterSpacing: 0.7,
  textTransform: "uppercase", color: colors.typography.secondaryText, marginBottom: 6,
};

export function GoldBtn({ children, onClick, loading, disabled, ghost, danger, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        border: ghost ? `1.5px solid ${danger ? "#FCA5A5" : "#E2C58A"}` : "none",
        background: ghost ? "#fff" : danger ? G.danger : G.orange,
        color: ghost ? (danger ? "#DC2626" : "#B45309") : "#fff",
        borderRadius: 12, padding: "10px 18px", fontSize: 14, fontWeight: 800,
        cursor: loading || disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
        display: "inline-flex", alignItems: "center", gap: 8,
        boxShadow: ghost ? "none" : "0 6px 16px rgba(245,166,35,0.3)",
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}
    >
      {loading ? <Spinner size={14} light={!ghost} /> : null}
      {children}
    </button>
  );
}

export function StatCard({ icon: Icon, label, value, tint, subtext, highlight = false }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 170,
        background: highlight ? "#FFF7EC" : "#fff",
        border: `1px solid ${highlight ? "#FFD9A6" : colors.base.border}`,
        borderRadius: 20,
        padding: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${tint}1F`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={tint} />
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: colors.typography.secondaryText,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: highlight ? colors.brand.primaryOrange : colors.typography.primaryText,
        }}
      >
        {value}
      </div>

      {subtext && (
        <div style={{ fontSize: 12.5, color: colors.typography.secondaryText, marginTop: 6 }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

// "Enhance with AI" — posts {text, kind, tone} to the given endpoint and shows
// the suggestion with Use / Keep controls.
export function AiEnhance({ text, kind, tone, onUse, endpoint = "/ai/course/enhance" }) {
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const run = async () => {
    if (!text?.trim()) return toast.info("Write something first, then enhance it");
    setBusy(true);
    try {
      const res = unwrap(await apiFetch(endpoint, { method: "POST", body: JSON.stringify({ text, kind, tone }) }));
      setSuggestion(res?.enhanced || res?.text || null);
      if (!res?.enhanced) toast.info("No suggestion returned");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <button onClick={run} disabled={busy} style={{ background: "transparent", border: "none", color: colors.navItems.communities, fontWeight: 800, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, padding: 0, fontFamily: "inherit" }}>
        {busy ? <Spinner size={12} /> : <Sparkles size={13} />} Enhance
      </button>
      {suggestion && (
        <div style={{ marginTop: 8, background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, color: "#4C1D95" }}>
          {suggestion}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={() => { onUse(suggestion); setSuggestion(null); }} style={{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Use this</button>
            <button onClick={() => setSuggestion(null)} style={{ background: "transparent", border: "none", color: "#6D28D9", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Keep original</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Cover image drag-drop uploader (16:9-ish) with change-on-hover overlay.
export function CoverUpload({ value, uploading, onPick, inputRef }) {
  const [drag, setDrag] = useState(false);
  return (
    <>
      <div
        className={`cs-cover ${value ? "has-img" : ""} ${drag ? "drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(e.dataTransfer.files?.[0]); }}
        style={value ? { background: `url(${value}) center/cover` } : undefined}
      >
        {uploading ? (
          <><Spinner size={22} /><span style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>Uploading…</span></>
        ) : value ? (
          <span className="cs-cover-overlay">Change cover</span>
        ) : (
          <>
            <span style={{ fontSize: 24 }}>🖼️</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#92400E" }}>Add a cover image</span>
            <span style={{ fontSize: 12, color: "#B45309" }}>Drop an image or click · 16:9 recommended</span>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }} />
    </>
  );
}
