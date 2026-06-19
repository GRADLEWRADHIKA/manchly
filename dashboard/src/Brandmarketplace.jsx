import { useMemo, useState } from "react";
import {
  Search, ShieldCheck, ChevronDown,
  AtSign, Send, X, BriefcaseBusiness,
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
   BUG FIX — instagram field was named "AtSign"
   (the Lucide icon name) on cr-102 and cr-103.
   All records now use "instagram" consistently.
───────────────────────────────────────── */
const NICHES = [
  "Finance","AI","Beauty","Health","Fitness",
  "Travel","Food","Fashion","Gaming","Education",
];

const CREATORS = [
  {
    id: "cr-101", name: "Aarav Mehta", niche: "Finance", city: "Mumbai",
    bio: "Equity research educator building SEBI-safe learning funnels.",
    phone: "919876543210", instagram: "aaravalpha",          // ✅
    sebiRegistered: true, followers: "486K", er: "6.8%", views: "92K",
    audience: [["Age 22-30","58%"],["Tier 1 investors","44%"],["Hindi + English","81%"],["High intent leads","36K/mo"]],
    packages: [["Reel integration","₹1,20,000"],["Webinar co-host","₹2,75,000"],["Newsletter drop","₹85,000"]],
  },
  {
    id: "cr-102", name: "Nisha Rao", niche: "Beauty", city: "Bengaluru",
    bio: "UGC creator with strong conversion on skincare launches.",
    phone: "919812345670", instagram: "nishaglowlab",        // ✅ was "AtSign"
    sebiRegistered: false, followers: "238K", er: "8.1%", views: "64K",
    audience: [["Women 18-34","71%"],["Metro buyers","49%"],["Repeat viewers","42%"],["Story tap rate","13.4%"]],
    packages: [["UGC Bundle x5","₹70,000"],["Reel + Stories","₹1,10,000"],["Launch Live","₹1,80,000"]],
  },
  {
    id: "cr-103", name: "Kabir Sethi", niche: "AI", city: "Delhi NCR",
    bio: "Operator-led AI automation demos for founders and product teams.",
    phone: "918765432109", instagram: "kabirbuilds",         // ✅ was "AtSign"
    sebiRegistered: true, followers: "312K", er: "7.4%", views: "88K",
    audience: [["Founders","31%"],["Product Teams","26%"],["LinkedIn Overlap","54K"],["Course Buyers","9.8K"]],
    packages: [["Tool Demo Reel","₹1,45,000"],["Workshop Funnel","₹3,20,000"],["Lead Magnet","₹95,000"]],
  },
];

/* ─────────────────────────────────────────
   ATOMS
───────────────────────────────────────── */
function Metric({ label, value }) {
  return (
    <div style={{
      background: T.bg, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: "12px 14px",
    }}>
      <p style={{ fontWeight: 800, fontSize: 16, color: T.textPri, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 11, color: T.textMut, marginTop: 3 }}>{label}</p>
    </div>
  );
}

function ContactBtn({ bg, icon: Icon, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, background: hov ? `${bg}cc` : bg,
        border: "none", color: "#fff", borderRadius: 10, padding: "9px 0",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.18s",
      }}>
      <Icon size={15} />{label}
    </button>
  );
}

function TableBlock({ title, rows }) {
  return (
    <div style={{
      border: `1px solid ${T.border}`, borderRadius: 12,
      overflow: "hidden", marginBottom: 18,
    }}>
      <div style={{
        background: T.elevated, padding: "12px 16px",
        color: T.orange, fontWeight: 700, fontSize: 13,
      }}>
        {title}
      </div>
      {rows.map(([label, value]) => (
        <div key={label} style={{
          display: "flex", justifyContent: "space-between",
          padding: "11px 16px", borderTop: `1px solid ${T.border}`,
        }}>
          <span style={{ fontSize: 13, color: T.textSec }}>{label}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.textPri }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   INSPECTOR DRAWER
───────────────────────────────────────── */
function InspectorDrawer({ creator, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      }} />

      {/* Panel */}
      <div style={{
        position: "absolute", right: 0, top: 0,
        height: "100%", width: "100%", maxWidth: 480,
        background: T.card, overflowY: "auto", padding: 28,
        borderLeft: `1px solid ${T.border}`,
        boxShadow: "-12px 0 40px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 24,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: T.textPri, margin: 0 }}>
                {creator.name}
              </h2>
              {creator.sebiRegistered && (
                <ShieldCheck size={18} style={{ color: T.orange }} />
              )}
            </div>
            <p style={{ fontSize: 13, color: T.textSec }}>
              {creator.niche} · {creator.city}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`,
            color: T.textSec, width: 34, height: 34, borderRadius: 8,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Bio */}
        <p style={{
          fontSize: 13.5, color: T.textSec, lineHeight: 1.65,
          marginBottom: 22, padding: "12px 14px",
          background: T.elevated, borderRadius: 10, border: `1px solid ${T.border}`,
        }}>
          {creator.bio}
        </p>

        <TableBlock title="Audience Demographics" rows={creator.audience} />
        <TableBlock title="Commercial Packages"   rows={creator.packages} />

        {/* CTAs — BUG FIX: uses creator.instagram not creator.AtSign */}
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <ContactBtn
            bg={T.green} icon={Send} label="WhatsApp"
            onClick={() => window.open(`https://wa.me/${creator.phone}`, "_blank")}
          />
          <ContactBtn
            bg={T.blue} icon={AtSign} label="Instagram"
            onClick={() => window.open(`https://instagram.com/${creator.instagram}`, "_blank")}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CREATOR CARD
───────────────────────────────────────── */
function CreatorCard({ creator, onInspect }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.card,
        border: `1.5px solid ${hov ? T.borderHi : T.border}`,
        borderRadius: 16, padding: 20,
        transition: "all 0.22s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? "0 8px 28px rgba(255,193,7,0.08)" : "none",
      }}>

      {/* Top row */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: T.textPri, margin: 0 }}>
              {creator.name}
            </h3>
            {creator.sebiRegistered && (
              <span style={{
                display: "flex", alignItems: "center", gap: 3,
                fontSize: 10, background: T.orangeL, color: T.orange,
                borderRadius: 20, padding: "2px 7px", fontWeight: 700,
              }}>
                <ShieldCheck size={9} /> SEBI
              </span>
            )}
          </div>
          <p style={{ fontSize: 12.5, color: T.textSec }}>
            {creator.niche} · {creator.city}
          </p>
        </div>

        <button
          onClick={onInspect}
          style={{
            background: T.elevated, border: `1px solid ${T.border}`,
            color: T.textSec, width: 32, height: 32, borderRadius: 8,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", transition: "all 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.orangeL; e.currentTarget.style.color = T.orange; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.elevated; e.currentTarget.style.color = T.textSec; }}
        >
          <ChevronDown size={15} />
        </button>
      </div>

      {/* Bio */}
      <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6, marginBottom: 16 }}>
        {creator.bio}
      </p>

      {/* Metrics */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8, marginBottom: 16,
      }}>
        <Metric label="Followers" value={creator.followers} />
        <Metric label="Eng. Rate" value={creator.er} />
        <Metric label="Avg Views" value={creator.views} />
      </div>

      {/* Buttons — BUG FIX: uses creator.instagram not creator.AtSign */}
      <div style={{ display: "flex", gap: 8 }}>
        <ContactBtn
          bg={T.green} icon={Send} label="WhatsApp"
          onClick={() => window.open(`https://wa.me/${creator.phone}`, "_blank")}
        />
        <ContactBtn
          bg={T.blue} icon={AtSign} label="Instagram"
          onClick={() => window.open(`https://instagram.com/${creator.instagram}`, "_blank")}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN EXPORT — BRAND MARKETPLACE
───────────────────────────────────────── */
export default function BrandMarketplace() {
  const [query,           setQuery]           = useState("");
  const [activeNiche,     setActiveNiche]     = useState("Finance");
  const [sebiOnly,        setSebiOnly]        = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);

  const filtered = useMemo(() =>
    CREATORS.filter(c => {
      const hay = `${c.name} ${c.city} ${c.niche} ${c.bio}`.toLowerCase();
      return (
        hay.includes(query.toLowerCase()) &&
        c.niche === activeNiche &&
        (!sebiOnly || c.sebiRegistered)
      );
    }),
    [query, activeNiche, sebiOnly]
  );

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.textPri,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Page title */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{
            background: T.blue, padding: 14, borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BriefcaseBusiness size={22} style={{ color: "#fff" }} />
          </div>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 800, color: T.orange,
              letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4,
            }}>
              Creator Discovery
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: T.textPri, margin: 0 }}>
              Brand Marketplace
            </h1>
            <p style={{ fontSize: 13.5, color: T.textSec, marginTop: 4 }}>
              Discover creators and recruit them directly.
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "12px 16px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Search size={16} style={{ color: T.textMut, flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search creator name, city, niche…"
            style={{
              background: "transparent", border: "none", outline: "none",
              color: T.textPri, fontSize: 14, width: "100%", fontFamily: "inherit",
            }}
          />
        </div>

        {/* Niche chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {NICHES.map(niche => (
            <button key={niche} onClick={() => setActiveNiche(niche)}
              style={{
                padding: "7px 16px", borderRadius: 8, fontSize: 12.5,
                fontWeight: 600, cursor: "pointer",
                border: `1px solid ${activeNiche === niche ? T.orange : T.border}`,
                background: activeNiche === niche ? T.orangeL : T.card,
                color:      activeNiche === niche ? T.orange  : T.textSec,
                transition: "all 0.18s",
              }}>
              {niche}
            </button>
          ))}
        </div>

        {/* SEBI toggle */}
        <label style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 24, cursor: "pointer", fontSize: 13, color: T.textSec,
        }}>
          <input
            type="checkbox" checked={sebiOnly}
            onChange={e => setSebiOnly(e.target.checked)}
            style={{ accentColor: T.orange, width: 15, height: 15 }}
          />
          Show SEBI Registered Only
          <span style={{
            fontSize: 10, background: T.orangeL, color: T.orange,
            borderRadius: 20, padding: "2px 8px", fontWeight: 700,
          }}>
            {CREATORS.filter(c => c.sebiRegistered).length} verified
          </span>
        </label>

        {/* Creator grid */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px", color: T.textMut,
            border: `1px dashed ${T.border}`, borderRadius: 16,
          }}>
            <p style={{ fontSize: 14 }}>No creators match this filter.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 18,
          }}>
            {filtered.map(creator => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                onInspect={() => setSelectedCreator(creator)}
              />
            ))}
          </div>
        )}

        {selectedCreator && (
          <InspectorDrawer
            creator={selectedCreator}
            onClose={() => setSelectedCreator(null)}
          />
        )}
      </main>

      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#0A0A0A; }
        ::-webkit-scrollbar-thumb { background:#222; border-radius:4px; }
        input::placeholder { color:#52525b; }
      `}</style>
    </div>
  );
}