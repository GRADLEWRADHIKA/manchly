/**
 * Manchly — CreatorCenter.jsx
 * 👑 CREATOR side only.
 *
 * No role check inside — parent (App.jsx) mounts
 * this component only when role === "CREATOR".
 *
 * Usage:
 *   import CreatorCenter from "./CreatorCenter";
 *   {role === "CREATOR" && <CreatorCenter />}
 */

import { useState } from "react";
import {
  WalletCards, Terminal, Play, ExternalLink,
} from "lucide-react";

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
const T = {
  bg:       "#000000",
  card:     "#111111",
  elevated: "#0A0A0A",
  orange:   "#FFC107",
  orangeD:  "#E6AC00",
  orangeL:  "rgba(255,193,7,0.13)",
  green:    "#10B981",
  greenL:   "rgba(16,185,129,0.13)",
  red:      "#EF4444",
  blue:     "#3B82F6",
  blueL:    "rgba(59,130,246,0.13)",
  purple:   "#A855F7",
  border:   "rgba(255,255,255,0.1)",
  borderHi: "rgba(255,193,7,0.4)",
  textPri:  "#FFFFFF",
  textSec:  "#A1A1AA",
  textMut:  "#71717A",
};

/* ─────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────── */
const INITIAL_LINKS = {
  education:  "https://rigi.link/wealth-sprint",
  collabs:    "brand@creator.studio",
  consulting: "https://cal.com/rigi-growth",
  ugc:        "https://rigi.link/ugc-kit",
};

const LINK_LABELS = {
  education:  "Education",
  collabs:    "Brand Collabs",
  consulting: "Consulting",
  ugc:        "UGC",
};

/* ─────────────────────────────────────────
   MAIN EXPORT — CREATOR CENTER
───────────────────────────────────────── */
export default function CreatorCenter() {
  const [links,       setLinks]       = useState(INITIAL_LINKS);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [comment,     setComment]     = useState("send me webinar bonus");
  const [termLines,   setTermLines]   = useState([
    "$ waiting for webhook payload",
    "Graph API sandbox connected",
  ]);

  const updateLink = (field, value) =>
    setLinks(prev => ({ ...prev, [field]: value }));

  const runHook = () => {
    const stamp = new Date().toLocaleTimeString();
    setTermLines([
      `$ rigi-meta hook --comment "${comment}"`,
      `[${stamp}] received instagram.comment.created`,
      "[auth] permissions ok",
      "[match] keyword intent",
      "[dm] fulfillment delivered",
      "[status] 200 OK",
    ]);
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.textPri,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <p style={{
            fontSize: 11, fontWeight: 800, color: T.orange,
            letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4,
          }}>
            Creator Tools
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: T.textPri, margin: 0 }}>
            Creator Center
          </h1>
          <p style={{ fontSize: 13.5, color: T.textSec, marginTop: 4 }}>
            Manage your link-in-bio and automate Instagram DMs.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Link-in-Bio Builder */}
            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: 22,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: T.orangeL,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <WalletCards size={16} style={{ color: T.orange }} />
                </div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: T.textPri, margin: 0 }}>
                  Link-In-Bio Builder
                </h2>
              </div>

              {Object.entries(links).map(([field, value]) => (
                <div key={field} style={{ marginBottom: 10 }}>
                  <label style={{
                    fontSize: 10.5, fontWeight: 600, color: T.textMut,
                    textTransform: "uppercase", letterSpacing: 0.8,
                    display: "block", marginBottom: 5,
                  }}>
                    {LINK_LABELS[field] || field}
                  </label>
                  <input
                    value={value}
                    onChange={e => updateLink(field, e.target.value)}
                    style={{
                      width: "100%", background: T.elevated,
                      border: `1px solid ${T.border}`, borderRadius: 9,
                      padding: "10px 12px", color: T.textPri, fontSize: 13,
                      outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                    }}
                    onFocus={e => e.target.style.borderColor = T.orange}
                    onBlur={e  => e.target.style.borderColor = T.border}
                  />
                </div>
              ))}

              <button
                onClick={() => setPreviewOpen(p => !p)}
                style={{
                  width: "100%", background: T.orange, color: "#000",
                  border: "none", borderRadius: 10, padding: "12px 0",
                  fontWeight: 800, fontSize: 14, cursor: "pointer", marginTop: 6,
                }}>
                {previewOpen ? "Hide Preview" : "Show Preview"}
              </button>
            </div>

            {/* Meta Automation */}
            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: 22,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, background: T.blueL,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Terminal size={16} style={{ color: T.blue }} />
                </div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: T.textPri, margin: 0 }}>
                  Meta Automation
                </h2>
                <span style={{
                  fontSize: 10, background: "rgba(59,130,246,0.15)", color: T.blue,
                  borderRadius: 20, padding: "2px 8px", fontWeight: 700, marginLeft: "auto",
                }}>
                  LIVE
                </span>
              </div>

              <label style={{
                fontSize: 11, fontWeight: 600, color: T.textMut,
                textTransform: "uppercase", letterSpacing: 0.8,
                display: "block", marginBottom: 6,
              }}>
                Trigger keyword
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                style={{
                  width: "100%", background: T.elevated,
                  border: `1px solid ${T.border}`, borderRadius: 9,
                  padding: "10px 12px", color: T.textPri, fontSize: 13,
                  outline: "none", resize: "none", fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = T.blue}
                onBlur={e  => e.target.style.borderColor = T.border}
              />

              <button
                onClick={runHook}
                style={{
                  width: "100%", background: T.blue, color: "#fff",
                  border: "none", borderRadius: 10, padding: "12px 0", marginTop: 10,
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                <Play size={15} />Run Hook
              </button>

              {/* Terminal output */}
              <div style={{
                marginTop: 14, background: T.elevated,
                border: `1px solid ${T.border}`, borderRadius: 10, padding: 14,
              }}>
                {termLines.map((line, i) => (
                  <p key={i} style={{
                    fontFamily: "monospace", color: "#4ade80",
                    fontSize: 12, margin: 0, lineHeight: 1.8,
                  }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN — Live Preview ── */}
          {previewOpen && (
            <div style={{
              background: "#FFFFFF", borderRadius: 16, padding: 28,
              boxShadow: "0 0 40px rgba(255,255,255,0.06)",
              alignSelf: "start",
            }}>
              {/* Brand mark */}
              <div style={{
                width: 60, height: 60, background: T.bg, color: "#fff",
                borderRadius: 14, display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 900, fontSize: 18, marginBottom: 16,
              }}>
                RC
              </div>

              <h3 style={{ fontSize: 22, fontWeight: 900, color: "#000", margin: "0 0 6px" }}>
                Rigi Creator Studio
              </h3>
              <p style={{ fontSize: 13.5, color: "#52525b", marginBottom: 20 }}>
                Courses, consults, collabs and UGC
              </p>

              {Object.entries(links).map(([key, value]) => (
                <a
                  key={key} href={value} target="_blank" rel="noreferrer"
                  style={{
                    display: "block", background: "#000", color: "#fff",
                    borderRadius: 12, padding: "14px 16px", marginBottom: 10,
                    textDecoration: "none", transition: "opacity 0.18s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <p style={{
                        fontWeight: 700, fontSize: 13.5,
                        margin: "0 0 2px", textTransform: "capitalize",
                      }}>
                        {LINK_LABELS[key] || key}
                      </p>
                      <p style={{
                        fontSize: 11.5, color: "#a1a1aa", margin: 0,
                        maxWidth: 280, overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {value}
                      </p>
                    </div>
                    <ExternalLink size={14} style={{ color: "#a1a1aa", flexShrink: 0 }} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#0A0A0A; }
        ::-webkit-scrollbar-thumb { background:#222; border-radius:4px; }
        input::placeholder, textarea::placeholder { color:#52525b; }
      `}</style>
    </div>
  );
}