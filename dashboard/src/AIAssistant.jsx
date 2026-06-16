import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Wand2,
  Loader2,
  Copy,
  Check,
  BookOpen,
  CalendarClock,
  Video,
  MessageSquare,
  ShieldAlert,
  FileText,
  Mail,
  Share2,
  ListChecks,
  UserCircle,
  Lightbulb,
  Zap,
} from "lucide-react";
import { API_BASE, authHeaders } from "./api";

const T = {
  bg: "#000000",
  card: "#111111",
  elevated: "#0A0A0A",
  orange: "#FFC107",
  green: "#10B981",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#A855F7",
  border: "rgba(255,255,255,0.1)",
  textPri: "#FFFFFF",
  textSec: "#A1A1AA",
};

// ── Tool registry ──────────────────────────────────────────────────────────
// Each tool maps a Faah-AI endpoint to a small form. Every /ai endpoint returns
// { provider, data, latency_ms } so one generic result renderer handles them all.
const TOOLS = [
  // COURSE
  {
    id: "course-meta",
    group: "Course",
    icon: BookOpen,
    label: "Course blueprint",
    desc: "Turn a topic into a full course outline.",
    endpoint: "/ai/course/generate-meta",
    fields: [
      { name: "topic", label: "Topic", required: true, placeholder: "e.g. Options trading for beginners" },
      { name: "audience", label: "Audience", placeholder: "general users" },
      { name: "level", label: "Level", type: "select", options: ["Beginner", "Intermediate", "Advanced"] },
    ],
  },
  {
    id: "course-enhance",
    group: "Course",
    icon: Wand2,
    label: "Enhance text",
    desc: "Polish a title, description or outcome.",
    endpoint: "/ai/course/enhance",
    fields: [
      { name: "text", label: "Your text", type: "textarea", required: true },
      { name: "kind", label: "Type", type: "select", options: ["general", "title", "description", "lesson_title", "outcome"] },
      { name: "tone", label: "Tone", placeholder: "conversational" },
    ],
  },
  {
    id: "course-quiz",
    group: "Course",
    icon: ListChecks,
    label: "Quiz generator",
    desc: "Generate MCQs from a topic or lesson.",
    endpoint: "/ai/course/quiz",
    fields: [
      { name: "topic", label: "Topic", placeholder: "Required if no lesson text" },
      { name: "lesson_text", label: "Lesson text (optional)", type: "textarea" },
      { name: "count", label: "How many", type: "number", default: "5" },
    ],
  },
  {
    id: "course-landing",
    group: "Course",
    icon: FileText,
    label: "Landing page copy",
    desc: "High-converting sales copy + FAQ.",
    endpoint: "/ai/course/landing-copy",
    fields: [
      { name: "title", label: "Course title", required: true },
      { name: "description", label: "Description (optional)", type: "textarea" },
      { name: "price", label: "Price (₹)", type: "number" },
      { name: "audience", label: "Audience", placeholder: "professionals" },
    ],
  },

  // WEBINAR
  {
    id: "webinar-describe",
    group: "Webinar",
    icon: CalendarClock,
    label: "Webinar pitch",
    desc: "Description + learning outcomes.",
    endpoint: "/ai/webinar/describe",
    fields: [
      { name: "title", label: "Webinar title", required: true },
      { name: "audience", label: "Audience", placeholder: "professionals" },
      { name: "duration_min", label: "Duration (min)", type: "number", default: "60" },
    ],
  },
  {
    id: "webinar-enhance",
    group: "Webinar",
    icon: Wand2,
    label: "Enhance text",
    desc: "Sharpen a webinar title or blurb.",
    endpoint: "/ai/webinar/enhance",
    fields: [
      { name: "text", label: "Your text", type: "textarea", required: true },
      { name: "kind", label: "Type", type: "select", options: ["general", "title", "description", "outcome", "social_blurb"] },
      { name: "tone", label: "Tone", placeholder: "punchy" },
    ],
  },
  {
    id: "webinar-emails",
    group: "Webinar",
    icon: Mail,
    label: "Email series",
    desc: "Confirmation + reminders + recap.",
    endpoint: "/ai/webinar/email-series",
    fields: [
      { name: "title", label: "Webinar title", required: true },
      { name: "scheduled_at", label: "Scheduled at", type: "datetime-local", required: true },
      { name: "join_url", label: "Join URL", placeholder: "{{join_url}}" },
    ],
  },
  {
    id: "webinar-social",
    group: "Webinar",
    icon: Share2,
    label: "Social posts",
    desc: "Twitter / LinkedIn / IG / WhatsApp.",
    endpoint: "/ai/webinar/social-posts",
    fields: [
      { name: "title", label: "Webinar title", required: true },
      { name: "description", label: "Description (optional)", type: "textarea" },
      { name: "register_url", label: "Register URL", placeholder: "{{register_url}}" },
    ],
  },

  // SESSION
  {
    id: "expert-bio",
    group: "1-on-1",
    icon: UserCircle,
    label: "Expert bio",
    desc: "Headline + bio + categories.",
    endpoint: "/ai/expert/bio",
    fields: [
      { name: "name", label: "Your name", required: true },
      { name: "expertise", label: "Expertise", required: true, placeholder: "e.g. Performance marketing" },
      { name: "years_experience", label: "Years experience", type: "number" },
      { name: "achievements", label: "Achievements (optional)", type: "textarea" },
    ],
  },
  {
    id: "session-enhance",
    group: "1-on-1",
    icon: Wand2,
    label: "Enhance text",
    desc: "Polish a headline, bio or product blurb.",
    endpoint: "/ai/session/enhance",
    fields: [
      { name: "text", label: "Your text", type: "textarea", required: true },
      { name: "kind", label: "Type", type: "select", options: ["general", "headline", "bio", "product_title", "product_blurb", "message"] },
      { name: "tone", label: "Tone", placeholder: "warm" },
    ],
  },
  {
    id: "session-products",
    group: "1-on-1",
    icon: Lightbulb,
    label: "Product ideas",
    desc: "Suggested consulting offers + pricing.",
    endpoint: "/ai/session/product-suggestions",
    fields: [
      { name: "expert_headline", label: "Your headline", required: true },
      { name: "expert_bio", label: "Bio (optional)", type: "textarea" },
      { name: "category", label: "Category", placeholder: "Business" },
      { name: "count", label: "How many", type: "number", default: "4" },
    ],
  },
  {
    id: "session-followup",
    group: "1-on-1",
    icon: Mail,
    label: "Follow-up message",
    desc: "Post-session message to a user.",
    endpoint: "/ai/session/follow-up-message",
    fields: [
      { name: "learner_name", label: "User name", required: true },
      { name: "product_title", label: "Session / product", placeholder: "1-on-1 session" },
      { name: "tone", label: "Tone", placeholder: "warm" },
    ],
  },

  // GENERAL
  {
    id: "lesson-summarize",
    group: "General",
    icon: FileText,
    label: "Summarize lesson",
    desc: "Summary + key points from a transcript.",
    endpoint: "/ai/lesson/summarize",
    fields: [{ name: "text", label: "Transcript / lesson text (80+ chars)", type: "textarea", required: true }],
  },
  {
    id: "moderate",
    group: "General",
    icon: ShieldAlert,
    label: "Moderate text",
    desc: "Flag hate / harassment / scams.",
    endpoint: "/ai/moderate",
    fields: [{ name: "text", label: "Text to moderate", type: "textarea", required: true }],
  },
];

const GROUPS = [
  { key: "Course", icon: BookOpen, color: T.orange },
  { key: "Webinar", icon: CalendarClock, color: T.purple },
  { key: "1-on-1", icon: Video, color: T.blue },
  { key: "General", icon: MessageSquare, color: T.green },
];

export default function AIAssistant() {
  const [activeId, setActiveId] = useState(TOOLS[0].id);
  const [form, setForm] = useState({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState(null); // { provider, latency_ms }
  const [error, setError] = useState("");
  const [health, setHealth] = useState(null);

  const tool = useMemo(() => TOOLS.find((t) => t.id === activeId), [activeId]);

  // reset the form whenever the selected tool changes (seed defaults)
  useEffect(() => {
    const seed = {};
    tool.fields.forEach((f) => {
      seed[f.name] = f.default ?? (f.type === "select" ? f.options[0] : "");
    });
    setForm(seed);
    setResult(null);
    setMeta(null);
    setError("");
  }, [tool]);

  // provider health probe
  useEffect(() => {
    fetch(`${API_BASE}/ai/health`)
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth(null));
  }, []);

  const setField = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const run = async () => {
    // required-field check
    const missing = tool.fields.find((f) => f.required && !String(form[f.name] || "").trim());
    if (missing) {
      setError(`${missing.label} is required`);
      return;
    }
    setRunning(true);
    setError("");
    setResult(null);
    setMeta(null);
    try {
      // build a clean payload (numbers coerced, blanks dropped)
      const payload = {};
      tool.fields.forEach((f) => {
        let v = form[f.name];
        if (v === "" || v == null) return;
        if (f.type === "number") v = Number(v);
        payload[f.name] = v;
      });
      const res = await fetch(`${API_BASE}${tool.endpoint}`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || body?.message || `Request failed (${res.status})`);
      }
      setResult(body?.data ?? body);
      setMeta({ provider: body?.provider, latency_ms: body?.latency_ms });
    } catch (e) {
      setError(e.message || "Generation failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(255,193,7,0.25), rgba(168,85,247,0.2))",
              border: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={22} color={T.orange} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Faah-AI</h2>
            <p style={{ margin: "3px 0 0", color: T.textSec, fontSize: 13 }}>
              AI copilots for your courses, webinars & sessions.
            </p>
          </div>
        </div>
        {health && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 999,
              padding: "7px 13px",
              fontSize: 12,
              fontWeight: 700,
              color: health.configured ? T.green : T.textSec,
            }}
          >
            <Zap size={13} color={health.configured ? T.green : T.textSec} />
            {health.configured ? `Provider: ${health.provider}` : "Demo mode (no AI key)"}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }} className="ai-grid">
        {/* tool sidebar */}
        <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          {GROUPS.map((g) => (
            <div key={g.key}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  color: T.textSec,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  marginBottom: 7,
                }}
              >
                <g.icon size={13} color={g.color} /> {g.key}
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {TOOLS.filter((t) => t.group === g.key).map((t) => {
                  const on = t.id === activeId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveId(t.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        textAlign: "left",
                        background: on ? "rgba(255,193,7,0.12)" : T.card,
                        border: `1px solid ${on ? T.orange : T.border}`,
                        borderRadius: 10,
                        padding: "9px 11px",
                        cursor: "pointer",
                        color: on ? T.orange : T.textPri,
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      <t.icon size={15} /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* form + result */}
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div style={panel}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
              <tool.icon size={18} color={T.orange} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{tool.label}</h3>
            </div>
            <p style={{ margin: "0 0 16px", color: T.textSec, fontSize: 13 }}>{tool.desc}</p>

            <div style={{ display: "grid", gap: 12 }}>
              {tool.fields.map((f) => (
                <Field key={f.name} f={f} value={form[f.name] ?? ""} onChange={setField(f.name)} />
              ))}
            </div>

            {error && <div style={{ ...errorBox, marginTop: 14, marginBottom: 0 }}>⚠️ {error}</div>}

            <button
              onClick={run}
              disabled={running}
              style={{
                ...primaryBtn,
                marginTop: 16,
                width: "100%",
                justifyContent: "center",
                opacity: running ? 0.7 : 1,
                cursor: running ? "not-allowed" : "pointer",
              }}
            >
              {running ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
              {running ? "Generating…" : "Generate"}
            </button>
          </div>

          {result != null && (
            <div style={panel}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Result</h3>
                {meta?.provider && (
                  <span style={{ fontSize: 11, color: T.textSec }}>
                    {meta.provider}
                    {meta.latency_ms != null ? ` · ${meta.latency_ms}ms` : ""}
                  </span>
                )}
              </div>
              <ResultView data={result} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 820px) { .ai-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function Field({ f, value, onChange }) {
  const label = (
    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 5 }}>
      {f.label}
      {f.required && <span style={{ color: T.orange }}> *</span>}
    </label>
  );
  const base = {
    width: "100%",
    background: T.elevated,
    border: `1px solid ${T.border}`,
    color: T.textPri,
    padding: "10px 12px",
    borderRadius: 10,
    outline: "none",
    fontSize: 13,
    boxSizing: "border-box",
    fontFamily: "inherit",
  };
  if (f.type === "textarea") {
    return (
      <div>
        {label}
        <textarea value={value} onChange={onChange} placeholder={f.placeholder || ""} rows={5} style={{ ...base, resize: "vertical" }} />
      </div>
    );
  }
  if (f.type === "select") {
    return (
      <div>
        {label}
        <select value={value} onChange={onChange} style={base}>
          {f.options.map((o) => (
            <option key={o} value={o} style={{ background: T.elevated }}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div>
      {label}
      <input
        type={f.type || "text"}
        value={value}
        onChange={onChange}
        placeholder={f.placeholder || ""}
        style={base}
      />
    </div>
  );
}

/* ── generic recursive result renderer ─────────────────────────────────────── */
function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        try {
          navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* ignore */
        }
      }}
      title="Copy"
      style={{
        background: "transparent",
        border: `1px solid ${T.border}`,
        color: done ? T.green : T.textSec,
        borderRadius: 7,
        padding: "3px 8px",
        cursor: "pointer",
        fontSize: 11,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
      }}
    >
      {done ? <Check size={12} /> : <Copy size={12} />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

const prettyKey = (k) =>
  String(k).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function ResultView({ data, depth = 0 }) {
  if (data == null) return null;

  // primitive
  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    const s = String(data);
    return (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          background: depth === 0 ? T.elevated : "transparent",
          border: depth === 0 ? `1px solid ${T.border}` : "none",
          borderRadius: 10,
          padding: depth === 0 ? "12px 14px" : 0,
        }}
      >
        <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap", color: T.textPri }}>
          {s}
        </span>
        {s.length > 12 && <CopyBtn text={s} />}
      </div>
    );
  }

  // array
  if (Array.isArray(data)) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {data.map((item, i) => (
          <div
            key={i}
            style={{
              background: T.elevated,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: "11px 13px",
            }}
          >
            {typeof item === "object" && item !== null ? (
              <ResultView data={item} depth={depth + 1} />
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: T.orange, fontWeight: 800 }}>{i + 1}.</span>
                <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {String(item)}
                </span>
                <CopyBtn text={String(item)} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // object
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Object.entries(data).map(([k, v]) => (
        <div key={k}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: T.orange,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 6,
            }}
          >
            {prettyKey(k)}
          </div>
          <ResultView data={v} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

const panel = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18 };
const primaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: T.orange,
  border: "none",
  color: "#000",
  padding: "11px 18px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 14,
};
const errorBox = {
  background: "rgba(239,68,68,0.1)",
  border: `1px solid ${T.red}`,
  color: T.red,
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
};
