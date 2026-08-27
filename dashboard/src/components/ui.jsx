// Shared UI kit — gradient buttons, modals, badges, inputs, OTP boxes, toasts.
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import colors from "../utils/colors";

/* ---------------- Gradient button ---------------- */
export function GradientButton({
  children,
  gradient = colors.gradients.gold,
  onClick,
  disabled,
  loading,
  style = {},
  full = false,
  size = "md",
}) {
  const pad = size === "lg" ? "16px 28px" : size === "sm" ? "8px 16px" : "12px 22px";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: disabled ? "#D1D5DB" : gradient,
        color: "#fff",
        border: "none",
        borderRadius: 12,
        padding: pad,
        fontSize: size === "lg" ? 16 : 14,
        fontWeight: 700,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        width: full ? "100%" : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: disabled ? "none" : "0 4px 14px rgba(0,0,0,0.18)",
        opacity: loading ? 0.75 : 1,
        transition: "transform 0.12s ease, opacity 0.12s ease",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {loading ? <Spinner size={16} light /> : null}
      {children}
    </button>
  );
}

/* ---------------- Spinner ---------------- */
export function Spinner({ size = 24, light = false, style = {} }) {
  return (
    <span
      className="mn-spin"
      style={{
        width: size,
        height: size,
        border: `${Math.max(2, size / 10)}px solid ${light ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.12)"}`,
        borderTopColor: light ? "#fff" : colors.brand.primaryOrange,
        borderRadius: "50%",
        display: "inline-block",
        ...style,
      }}
    />
  );
}

export function FullLoader({ label = "Loading..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 80 }}>
      <Spinner size={34} />
      <span style={{ color: colors.typography.secondaryText, fontSize: 14 }}>{label}</span>
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, width = 520, dark = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(6,8,20,0.62)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: width, maxHeight: "88vh", overflowY: "auto",
          background: dark ? colors.user.card : "#fff",
          color: dark ? "#fff" : colors.typography.primaryText,
          borderRadius: 18, padding: 24,
          border: dark ? `1px solid ${colors.user.border}` : "none",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({ children, color = colors.brand.primaryOrange, bg }) {
  return (
    <span
      style={{
        display: "inline-block", padding: "3px 10px", borderRadius: 999,
        background: bg || `${color}1A`, color, fontSize: 11.5, fontWeight: 700,
        letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/* ---------------- Inputs ---------------- */
export function Field({ label, hint, children, style = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "inherit", opacity: 0.75 }}>
          {label}
        </label>
      )}
      {children}
      {hint && <span style={{ fontSize: 12, opacity: 0.6 }}>{hint}</span>}
    </div>
  );
}

export const inputStyle = (dark = false) => ({
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${dark ? "rgba(255,255,255,0.14)" : colors.base.border}`,
  background: dark ? "rgba(255,255,255,0.06)" : "#fff",
  color: dark ? "#fff" : colors.typography.primaryText,
  fontSize: 14.5,
  outline: "none",
  fontFamily: "inherit",
});

export function TextInput({ dark, style, ...props }) {
  return <input {...props} style={{ ...inputStyle(dark), ...style }} />;
}

export function TextArea({ dark, style, ...props }) {
  return <textarea {...props} style={{ ...inputStyle(dark), minHeight: 90, resize: "vertical", ...style }} />;
}

/* ---------------- OTP boxes ---------------- */
export function OtpInput({ length = 6, value, onChange, dark = true }) {
  const refs = useRef([]);
  const chars = Array.from({ length }, (_, i) => value[i] || "");

  const handle = (i, ch) => {
    const clean = ch.replace(/\D/g, "");
    if (!clean) return;
    const next = (value.slice(0, i) + clean + value.slice(i + clean.length)).slice(0, length);
    onChange(next);
    const target = Math.min(i + clean.length, length - 1);
    refs.current[target]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (chars[i]) onChange(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        refs.current[i - 1]?.focus();
      }
    }
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={c}
          inputMode="numeric"
          autoFocus={i === 0}
          onChange={(e) => handle(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={(e) => {
            e.preventDefault();
            handle(0, e.clipboardData.getData("text"));
          }}
          style={{
            width: 46, height: 54, textAlign: "center", fontSize: 22, fontWeight: 800,
            borderRadius: 12,
            border: `2px solid ${c ? "#F3C36B" : dark ? "rgba(255,255,255,0.18)" : colors.base.border}`,
            background: dark ? "rgba(255,255,255,0.06)" : "#fff",
            color: dark ? "#fff" : colors.typography.primaryText,
            outline: "none",
          }}
        />
      ))}
    </div>
  );
}

/* ---------------- Star rating ---------------- */
export function StarRating({ value, onChange, size = 34 }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange?.(s)}
          style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: size, lineHeight: 1, padding: 0, color: s <= value ? "#F0C040" : "rgba(150,150,170,0.4)" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({ icon = "🗂️", title, subtitle, action }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 20px", opacity: 0.9 }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 14, opacity: 0.65, maxWidth: 380, margin: "0 auto 16px" }}>{subtitle}</div>}
      {action}
    </div>
  );
}

/* ---------------- Progress bar ---------------- */
export function ProgressBar({ percent = 0, gradient = colors.gradients.greenButton, height = 8, track = "rgba(120,130,160,0.22)" }) {
  return (
    <div style={{ width: "100%", height, borderRadius: 99, background: track, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, percent))}%`, height: "100%", borderRadius: 99, background: gradient, transition: "width 0.5s ease" }} />
    </div>
  );
}

/* ---------------- Toaster ---------------- */
export function Toaster() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail;
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3800);
    };
    window.addEventListener("manchly:toast", onToast);
    return () => window.removeEventListener("manchly:toast", onToast);
  }, []);

  const palette = {
    success: { bar: colors.status.success, icon: "✓" },
    error: { bar: colors.status.error, icon: "✕" },
    info: { bar: colors.status.info, icon: "i" },
  };

  return (
    <div style={{ position: "fixed", top: 18, left: 0, right: 0, zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, pointerEvents: "none" }}>
      {toasts.map((t) => {
        const p = palette[t.type] || palette.info;
        return (
          <div
            key={t.id}
            className="mn-toast-in"
            style={{
              display: "flex", alignItems: "center", gap: 12, minWidth: 260, maxWidth: 460,
              background: "#141428", color: "#fff", borderRadius: 12, padding: "12px 16px",
              borderLeft: `4px solid ${p.bar}`, border: `1px solid rgba(214,156,64,0.3)`,
              borderLeftColor: p.bar, borderLeftWidth: 4,
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)", pointerEvents: "auto",
            }}
          >
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: `${p.bar}33`, color: p.bar, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>{p.icon}</span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({ src, name = "", size = 40, online }) {
  const [broken, setBroken] = useState(false);
  const initials = name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0, overflow: "visible" }}>
      {src && !broken ? (
        <img
          src={src}
          alt=""
          onError={() => setBroken(true)}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{ width: size, height: size, borderRadius: "50%", background: colors.gradients.greenButtonDark, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.38 }}>
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span style={{ position: "absolute", bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, borderRadius: "50%", background: online ? colors.status.success : "#6B7280", border: "2px solid #fff" }} />
      )}
    </div>
  );
}
