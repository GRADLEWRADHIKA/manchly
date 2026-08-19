// Ask Manchly AI — light creator-suite redesign, fully dynamic.
// Config-driven tool grid: each tool opens a modal with its real form fields,
// posts to the live /ai endpoint, and renders results with copy/regenerate.
// Payload shapes match manBackend aiController exactly.
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, Copy, RefreshCw, ArrowLeft } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { Modal, Badge, Spinner, EmptyState } from "../../components/ui";
import { GoldBtn, lbl } from "../../components/creatorUi";
import { toast } from "../../utils/toast";

const G = colors.gradients;

const TOOLS = [
  {
    id: "meta", icon: "🎓", tint: "#D69C3F", cat: "Courses",
    name: "Course Meta Generator",
    desc: "Title, description, outcomes & a full curriculum from just a topic.",
    endpoint: "/ai/course/generate-meta",
    fields: [
      { key: "topic", label: "Topic", type: "text", required: true, placeholder: "e.g. Options trading for beginners" },
      { key: "audience", label: "Audience", type: "text", placeholder: "general learners" },
      { key: "level", label: "Level", type: "select", options: ["Beginner", "Intermediate", "Advanced"] },
    ],
  },
  {
    id: "enhance", icon: "✨", tint: "#F5A623", cat: "Writing",
    name: "Text Enhancer",
    desc: "Rewrite any title, description, headline or bio to convert better.",
    fields: [
      { key: "context", label: "For", type: "select", options: ["course", "webinar", "session"] },
      { key: "kind", label: "Kind", type: "select", options: ["general", "title", "description", "headline", "bio"] },
      { key: "tone", label: "Tone", type: "select", options: ["conversational", "punchy", "warm", "professional"] },
      { key: "text", label: "Your text", type: "textarea", required: true, placeholder: "Paste the text to improve..." },
    ],
    endpointFor: (v) => `/ai/${v.context || "course"}/enhance`,
    buildPayload: (v) => ({ text: v.text, kind: v.kind || "general", tone: v.tone || "conversational" }),
  },
  {
    id: "quiz", icon: "🧠", tint: "#22C55E", cat: "Courses",
    name: "Quiz Generator",
    desc: "Multiple-choice questions from a topic or your lesson text.",
    endpoint: "/ai/course/quiz",
    fields: [
      { key: "topic", label: "Topic", type: "text", required: true, placeholder: "e.g. Option greeks" },
      { key: "lesson_text", label: "Lesson text (optional)", type: "textarea", placeholder: "Paste lesson content to base questions on" },
      { key: "count", label: "Questions", type: "select", options: ["3", "5", "8", "10"], transform: Number },
    ],
  },
  {
    id: "landing", icon: "📝", tint: "#F97316", cat: "Marketing",
    name: "Landing Page Copy",
    desc: "Headline, subheadline, bullets and CTA for your course page.",
    endpoint: "/ai/course/landing-copy",
    fields: [
      { key: "title", label: "Course title", type: "text", required: true },
      { key: "description", label: "Short description", type: "textarea" },
      { key: "price", label: "Price (₹)", type: "text", placeholder: "999" },
      { key: "audience", label: "Audience", type: "text", placeholder: "professionals" },
    ],
  },
  {
    id: "describe", icon: "📡", tint: "#B45309", cat: "Webinars",
    name: "Webinar Description",
    desc: "A compelling description written from your webinar title.",
    endpoint: "/ai/webinar/describe",
    fields: [
      { key: "title", label: "Webinar title", type: "text", required: true },
      { key: "audience", label: "Audience", type: "text", placeholder: "professionals" },
      { key: "duration_min", label: "Duration (min)", type: "select", options: ["30", "60", "90", "120"], transform: Number },
    ],
  },
  {
    id: "emails", icon: "✉️", tint: "#14B8A6", cat: "Marketing",
    name: "Email Series",
    desc: "Invite, reminder and follow-up emails for a webinar.",
    endpoint: "/ai/webinar/email-series",
    fields: [
      { key: "title", label: "Webinar title", type: "text", required: true },
      { key: "scheduled_at", label: "Date & time (optional)", type: "text", placeholder: "e.g. 12 Aug, 7 PM IST" },
    ],
  },
  {
    id: "social", icon: "📣", tint: "#F43F5E", cat: "Marketing",
    name: "Social Posts",
    desc: "Ready-to-post promos for X, LinkedIn, Instagram & WhatsApp.",
    endpoint: "/ai/webinar/social-posts",
    fields: [
      { key: "title", label: "What are you promoting?", type: "text", required: true },
      { key: "description", label: "Details (optional)", type: "textarea" },
    ],
  },
  {
    id: "bio", icon: "🧑‍🏫", tint: "#16A34A", cat: "Sessions",
    name: "Expert Bio Writer",
    desc: "A trustworthy bio for your 1:1 session profile.",
    endpoint: "/ai/expert/bio",
    fields: [
      { key: "name", label: "Your name", type: "text", required: true },
      { key: "expertise", label: "Expertise", type: "text", required: true, placeholder: "e.g. Equity research & tax planning" },
      { key: "years_experience", label: "Years of experience", type: "text", placeholder: "5" },
      { key: "achievements", label: "Achievements (optional)", type: "textarea" },
    ],
  },
  {
    id: "products", icon: "📦", tint: "#D97706", cat: "Sessions",
    name: "Session Product Ideas",
    desc: "Bookable 1:1 offerings with durations and suggested pricing.",
    endpoint: "/ai/session/product-suggestions",
    fields: [
      { key: "expert_headline", label: "Your headline", type: "text", required: true, placeholder: "e.g. SEBI-registered advisor" },
      { key: "expert_bio", label: "Bio (optional)", type: "textarea" },
      { key: "category", label: "Category (optional)", type: "text", placeholder: "Finance & Tax" },
    ],
    buildPayload: (v) => ({ ...v, count: 4 }),
  },
  {
    id: "summarize", icon: "📄", tint: "#65A30D", cat: "Courses",
    name: "Lesson Summarizer",
    desc: "Key takeaways and a recap from any lesson script.",
    endpoint: "/ai/lesson/summarize",
    fields: [{ key: "text", label: "Lesson text", type: "textarea", required: true, placeholder: "Paste the lesson transcript or notes..." }],
  },
  {
    id: "moderate", icon: "🛡️", tint: "#EF4444", cat: "Safety",
    name: "Content Moderator",
    desc: "Check text for spam, hate or unsafe content before publishing.",
    endpoint: "/ai/moderate",
    fields: [{ key: "text", label: "Text to check", type: "textarea", required: true }],
  },
];

/* ---------- generic result renderer ---------- */

const SKIP_KEYS = new Set(["provider", "latency_ms", "model", "cached"]);
const pretty = (k) => String(k).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function copyText(t) {
  navigator.clipboard.writeText(t);
  toast.success("Copied");
}

function blockToText(v) {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(blockToText).join("\n");
  return Object.entries(v).filter(([k]) => !SKIP_KEYS.has(k)).map(([k, x]) => `${pretty(k)}: ${blockToText(x)}`).join("\n");
}

function ResultBlock({ label, value, tint }) {
  const box = { background: "#FAFAF7", border: `1px solid ${colors.base.border}`, borderRadius: 12, padding: "13px 15px", position: "relative" };
  const copyBtn = (
    <button onClick={() => copyText(blockToText(value))} title="Copy" style={{ position: "absolute", top: 10, right: 10, background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280" }}>
      <Copy size={13} />
    </button>
  );

  if (value == null) return null;

  // Array of objects → cards; array of strings → list
  if (Array.isArray(value)) {
    return (
      <div>
        {label && <div style={{ ...lbl, marginBottom: 8 }}>{label}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {value.map((item, i) =>
            typeof item === "object" && item !== null ? (
              <div key={i} style={box}>
                {copyBtnFor(item)}
                {Object.entries(item).filter(([k]) => !SKIP_KEYS.has(k)).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: tint }}>{pretty(k)}: </span>
                    <span style={{ fontSize: 13.5, color: colors.typography.primaryText, whiteSpace: "pre-wrap" }}>{blockToText(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div key={i} style={{ ...box, fontSize: 13.5, whiteSpace: "pre-wrap" }}>
                {copyBtn}
                {String(item)}
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // Object → nested sections
  if (typeof value === "object") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {label && <div style={{ ...lbl, marginBottom: -4 }}>{label}</div>}
        {Object.entries(value).filter(([k]) => !SKIP_KEYS.has(k)).map(([k, v]) => (
          <ResultBlock key={k} label={pretty(k)} value={v} tint={tint} />
        ))}
      </div>
    );
  }

  // Primitive → paragraph
  return (
    <div>
      {label && <div style={{ ...lbl, marginBottom: 6 }}>{label}</div>}
      <div style={{ ...box, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", paddingRight: 44 }}>
        {copyBtn}
        {String(value)}
      </div>
    </div>
  );

  function copyBtnFor(item) {
    return (
      <button onClick={() => copyText(blockToText(item))} title="Copy" style={{ position: "absolute", top: 10, right: 10, background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280" }}>
        <Copy size={13} />
      </button>
    );
  }
}

/* ---------- main ---------- */

export default function AiScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [provider, setProvider] = useState(null);
  const [active, setActive] = useState(null); // tool
  const [values, setValues] = useState({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    apiFetch("/ai/health").then((r) => setProvider(unwrap(r)?.provider || unwrap(r)?.ai_provider || null)).catch(() => {});
  }, []);

  const cats = ["All", ...new Set(TOOLS.map((t) => t.cat))];
  const shown = useMemo(
    () => TOOLS.filter((t) => (cat === "All" || t.cat === cat) && `${t.name} ${t.desc}`.toLowerCase().includes(search.toLowerCase())),
    [search, cat]
  );

  const openTool = (t) => {
    const init = {};
    t.fields.forEach((f) => { if (f.type === "select") init[f.key] = f.options[0]; });
    setValues(init);
    setResult(null);
    setActive(t);
  };

  const run = async () => {
    for (const f of active.fields) {
      if (f.required && !String(values[f.key] || "").trim()) return toast.error(`${f.label} is required`);
    }
    setRunning(true);
    try {
      const payload = active.buildPayload
        ? active.buildPayload(values)
        : Object.fromEntries(
            active.fields
              .filter((f) => String(values[f.key] ?? "").trim() !== "")
              .map((f) => [f.key, f.transform ? f.transform(values[f.key]) : values[f.key]])
          );
      const endpoint = active.endpointFor ? active.endpointFor(values) : active.endpoint;
      const res = unwrap(await apiFetch(endpoint, { method: "POST", body: JSON.stringify(payload) }));
      setResult(res);
      if (res?.provider === "mock") toast.info("AI provider not configured — showing sample output");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: 32, color: colors.typography.primaryText }}>
      {/* Header */}
      <div style={{ background: G.heroGold, borderRadius: 22, padding: "30px 34px", color: "#fff", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, display: "flex", alignItems: "center", gap: 12 }}>
              <Sparkles size={26} /> Ask Manchly AI
            </h1>
            <p style={{ margin: "8px 0 0", opacity: 0.85, fontSize: 14.5, maxWidth: 560 }}>
              Your creative co-pilot — write titles, descriptions, quizzes, emails and social posts in seconds.
            </p>
          </div>
          {provider && (
            <Badge color="#fff" bg="rgba(255,255,255,0.18)">⚡ {provider === "mock" ? "Sample mode" : `Powered by ${provider}`}</Badge>
          )}
        </div>
      </div>

      {/* Search + categories */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1.5px solid ${colors.base.border}`, borderRadius: 12, padding: "10px 14px", minWidth: 260 }}>
          <Search size={15} color="#9CA3AF" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search AI tools..." style={{ border: "none", outline: "none", fontSize: 14, fontFamily: "inherit", flex: 1, background: "transparent" }} />
        </div>
        <div className="cs-seg">
          {cats.map((c) => (
            <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)} style={{ padding: "8px 16px" }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Tool grid */}
      {shown.length === 0 ? (
        <EmptyState icon="🔍" title="No tools match" subtitle="Try a different search." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {shown.map((t) => (
            <button
              key={t.id}
              onClick={() => openTool(t)}
              className="mn-lift"
              style={{ textAlign: "left", background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 18, padding: 20, cursor: "pointer", fontFamily: "inherit" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ width: 48, height: 48, borderRadius: 14, background: `${t.tint}1A`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23 }}>
                  {t.icon}
                </span>
                <Badge color={t.tint}>{t.cat}</Badge>
              </div>
              <div style={{ fontWeight: 900, fontSize: 15.5, margin: "13px 0 5px", color: colors.typography.primaryText }}>{t.name}</div>
              <div style={{ fontSize: 13, color: colors.typography.secondaryText, lineHeight: 1.55 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* ---------- Tool modal ---------- */}
      <Modal open={!!active} onClose={() => setActive(null)} title="" width={640}>
        {active && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "-6px 0 20px" }}>
              <span style={{ width: 48, height: 48, borderRadius: 13, background: `${active.tint}1A`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>
                {active.icon}
              </span>
              <div>
                <div style={{ fontSize: 19, fontWeight: 900 }}>{active.name}</div>
                <div style={{ fontSize: 13, color: colors.typography.secondaryText }}>{active.desc}</div>
              </div>
            </div>

            {!result ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {active.fields.map((f) => (
                  <div key={f.key}>
                    <label style={lbl}>{f.label}{f.required && <span style={{ color: "#DC2626" }}> *</span>}</label>
                    {f.type === "textarea" ? (
                      <textarea className="cs-input" style={{ minHeight: 90, resize: "vertical" }} value={values[f.key] || ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} placeholder={f.placeholder} />
                    ) : f.type === "select" ? (
                      <div className="cs-seg">
                        {f.options.map((o) => (
                          <button key={o} className={String(values[f.key]) === o ? "on" : ""} onClick={() => setValues({ ...values, [f.key]: o })} style={{ textTransform: "capitalize" }}>{o}</button>
                        ))}
                      </div>
                    ) : (
                      <input className="cs-input" value={values[f.key] || ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} placeholder={f.placeholder} />
                    )}
                  </div>
                ))}
                <GoldBtn loading={running} onClick={run} style={{ justifyContent: "center", padding: "13px 18px", marginTop: 4 }}>
                  <Sparkles size={16} /> Generate
                </GoldBtn>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <button onClick={() => setResult(null)} style={{ background: "transparent", border: "none", color: colors.typography.secondaryText, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: 0, fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
                    <ArrowLeft size={14} /> Edit inputs
                  </button>
                  <div style={{ display: "flex", gap: 8 }}>
                    <GoldBtn ghost style={{ padding: "7px 14px", fontSize: 12.5 }} onClick={() => copyText(blockToText(result))}>
                      <Copy size={13} /> Copy All
                    </GoldBtn>
                    <GoldBtn loading={running} style={{ padding: "7px 14px", fontSize: 12.5 }} onClick={run}>
                      <RefreshCw size={13} /> Regenerate
                    </GoldBtn>
                  </div>
                </div>
                <div style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }}>
                  <ResultBlock value={result} tint={active.tint} />
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
