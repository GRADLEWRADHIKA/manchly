import { useState, useRef, useEffect } from "react";
import { Rocket } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";

const G = colors.gradients;


const SECTIONS = [
  { key: "course_idea", label: "Course Idea", icon: "💡" },
  { key: "course_structure", label: "Course Structure", icon: "📚" },
  { key: "content_creation", label: "Content Creation", icon: "🎬" },
  { key: "offer_creation", label: "Offer Creation", icon: "🏷️" },
  { key: "target_audience", label: "Target Audience", icon: "🎯" },
  { key: "ad_strategy", label: "Ad Strategy", icon: "📣" },
  { key: "audience_sizing", label: "Audience Sizing", icon: "📊" },
  { key: "revenue_forecast", label: "Revenue Forecast", icon: "💰" },
  { key: "scaling_plan", label: "Scaling Plan", icon: "🚀" },
  { key: "growth_hacks", label: "Growth Hacks", icon: "⚡" },
];

const EXAMPLES = ["Instagram Reels for Coaches", "Freelance Graphic Design", "Stock Market Basics", "English Speaking for Professionals", "Yoga for Working Women"];

// ─── PROGRESS: runs independently on a fixed timer ─────────────────
function useProgress(loading) {
  const [pct, setPct] = useState(0);
  const raf = useRef(null);
  const start = useRef(null);

  useEffect(() => {
    if (!loading) { setPct(0); return; }
    start.current = performance.now();
    const tick = (now) => {
      const elapsed = (now - start.current) / 1000;
      const val = 99 * (1 - Math.exp(-elapsed / 45));
      setPct(val);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [loading]);

  const finish = () => {
    cancelAnimationFrame(raf.current);
    setPct(100);
  };

  return [pct, finish];
}

// ─── shared style tokens (light Creator Suite theme) ─────────────────
const S = {
  tag: { display: "inline-block", background: colors.brand.noticeBlue, border: `1px solid ${colors.base.border}`, color: colors.brand.actionBlue, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" },
  tagGold: { display: "inline-block", background: `${colors.brand.primaryOrange}1A`, border: `1px solid ${colors.brand.primaryOrange}4D`, color: colors.brand.primaryOrange, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" },
  card: { background: colors.base.cardBackground, border: `1px solid ${colors.base.border}`, borderRadius: 14, padding: 20 },
  pill: { display: "inline-block", background: "rgba(0,0,0,0.04)", borderRadius: 20, padding: "5px 13px", fontSize: 12, margin: 3, border: `1px solid ${colors.base.border}`, color: colors.typography.secondaryText },
  pillGold: { background: `${colors.brand.primaryOrange}1A`, borderColor: `${colors.brand.primaryOrange}4D`, color: colors.brand.primaryOrange },
  lbl: { fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: colors.typography.secondaryText, marginBottom: 5 },
  val: { fontSize: 13.5, lineHeight: 1.72, color: colors.typography.primaryText },
  mbox: { background: `${colors.brand.primaryOrange}0D`, border: `1px solid ${colors.brand.primaryOrange}33`, borderRadius: 12, padding: 16, textAlign: "center" },
  mval: { fontWeight: 800, fontSize: 21, color: colors.brand.primaryOrange },
  mlbl: { fontSize: 10, color: colors.typography.secondaryText, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.6 },
  input: { width: "100%", padding: "13px 17px", borderRadius: 10, border: `1.5px solid ${colors.base.border}`, fontSize: 15, color: colors.typography.primaryText, background: colors.base.cardBackground, outline: "none", boxSizing: "border-box" },
  navBtn: (on) => ({
    background: on ? `${colors.brand.primaryOrange}1A` : "none",
    border: on ? `1px solid ${colors.brand.primaryOrange}38` : "1px solid transparent",
    color: on ? colors.brand.primaryOrange : colors.typography.secondaryText,
    padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
  }),
};

export default function CoursePlannerScreen() {
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planNiche, setPlanNiche] = useState("");
  const [error, setError] = useState("");
  const [section, setSection] = useState("course_idea");
  const [msgIdx, setMsgIdx] = useState(0);
  const [pct, finishProgress] = useProgress(loading);
  const msgTimer = useRef(null);

  const MSGS = ["Analysing market demand…", "Structuring curriculum…", "Writing lesson hooks…", "Crafting ad creatives…", "Forecasting revenue…", "Building scaling plan…", "Finalising growth hacks…"];

  const generate = async (q) => {
    const query = (q || niche).trim();
    if (!query) return;
    setLoading(true);
    setError("");
    setPlan(null);
    setMsgIdx(0);
    msgTimer.current = setInterval(() => setMsgIdx((i) => (i + 1) % MSGS.length), 2500);

    try {
      const body = unwrap(await apiFetch("/ai/course/plan", {
        method: "POST",
        body: JSON.stringify({ niche: query }),
      }));
      if (!body || typeof body !== "object") throw new Error("No plan returned");

      finishProgress();
      clearInterval(msgTimer.current);
      setTimeout(() => {
        setPlan(body);
        setPlanNiche(query);
        setSection("course_idea");
        setLoading(false);
      }, 400);
    } catch (e) {
      clearInterval(msgTimer.current);
      finishProgress();
      setTimeout(() => {
        setError(e.message || "Something went wrong generating your plan.");
        setLoading(false);
      }, 400);
    }
  };

  useEffect(() => () => clearInterval(msgTimer.current), []);

  return (
    <div style={{ padding: 32, color: colors.typography.primaryText }}>
      <style>{`
        @keyframes cp-spin { to { transform: rotate(360deg); } }
        .cp-spin { width: 36px; height: 36px; border: 3px solid ${colors.brand.primaryOrange}26; border-top-color: ${colors.brand.primaryOrange}; border-radius: 50%; animation: cp-spin .7s linear infinite; }
        .cp-chip { background: rgba(0,0,0,0.03); border: 1px solid ${colors.base.border}; border-radius: 20px; padding: 7px 14px; font-size: 12.5px; cursor: pointer; color: ${colors.typography.secondaryText}; }
        .cp-chip:hover { border-color: ${colors.brand.primaryOrange}66; color: ${colors.brand.primaryOrange}; }
        .cp-ghost { background: #fff; border: 1px solid ${colors.base.border}; border-radius: 8px; padding: 8px 16px; color: ${colors.typography.secondaryText}; font-size: 13px; cursor: pointer; }
        .cp-ghost:hover { background: rgba(0,0,0,0.02); color: ${colors.typography.primaryText}; }
      `}</style>

      {/* Header */}
      <div style={{ background: G.heroGold, borderRadius: 22, padding: "30px 34px", color: "#fff", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, display: "flex", alignItems: "center", gap: 10 }}>
              <Rocket size={24} /> AI Course Planner
            </h1>
            <p style={{ margin: "8px 0 0", opacity: 0.85, fontSize: 14, maxWidth: 560 }}>
              Turn any niche into a complete go-to-market plan — curriculum, ad creatives, audience sizing, and a revenue forecast.
            </p>
          </div>
          {plan && (
            <button className="cp-ghost" onClick={() => { setPlan(null); setNiche(""); setError(""); }}>
              + New Plan
            </button>
          )}
        </div>
      </div>

      {/* Landing */}
      {!plan && !loading && (
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={S.card}>
            <div style={S.lbl}>Enter your course niche</div>
            <div style={{ display: "flex", gap: 8, margin: "8px 0 15px" }}>
              <input
                style={S.input}
                placeholder="e.g. Stock Market for Beginners, Freelance Design, Yoga…"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
              <button
                onClick={() => generate()}
                disabled={!niche.trim()}
                style={{
                  background: colors.brand.primaryOrange, color: "#fff", border: "none", borderRadius: 10,
                  padding: "13px 26px", fontSize: 14, fontWeight: 800, cursor: niche.trim() ? "pointer" : "not-allowed",
                  opacity: niche.trim() ? 1 : 0.5, whiteSpace: "nowrap",
                }}
              >
                Generate →
              </button>
            </div>
            <div style={{ ...S.lbl, marginBottom: 7 }}>Quick examples</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EXAMPLES.map((ex) => (
                <button key={ex} className="cp-chip" onClick={() => { setNiche(ex); generate(ex); }}>{ex}</button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ color: "#DC2626", fontSize: 13, marginTop: 14 }}>
              {error} <button className="cp-ghost" style={{ marginLeft: 8 }} onClick={() => generate()}>Retry</button>
            </div>
          )}

        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}><div className="cp-spin" /></div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>Building Your Plan</div>
          <div style={{ fontSize: 13, color: colors.typography.secondaryText, marginBottom: 5 }}>"{niche}"</div>
          <div style={{ fontSize: 13, color: colors.brand.primaryOrange, marginBottom: 2, minHeight: 20 }}>{MSGS[msgIdx]}</div>
          <div style={{ height: 4, background: colors.base.border, borderRadius: 2, overflow: "hidden", marginTop: 14 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: colors.brand.primaryOrange, transition: "width .25s linear" }} />
          </div>
          <div style={{ fontSize: 11, color: colors.typography.secondaryText, marginTop: 6 }}>{Math.round(pct)}%</div>
        </div>
      )}

      {/* Dashboard */}
      {plan && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "202px 1fr", gap: 20, alignItems: "start" }}>
          {/* Section nav */}
          <div style={{ background: colors.base.cardBackground, border: `1px solid ${colors.base.border}`, borderRadius: 14, padding: 10, display: "flex", flexDirection: "column", gap: 2 }}>
            {SECTIONS.map((s) => (
              <button key={s.key} style={S.navBtn(section === s.key)} onClick={() => setSection(s.key)}>
                <span style={{ fontSize: 13 }}>{s.icon}</span><span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={S.tagGold}>{planNiche}</div>
              <h2 style={{ fontSize: 21, fontWeight: 800, marginTop: 9 }}>
                {SECTIONS.find((s) => s.key === section)?.icon} {SECTIONS.find((s) => s.key === section)?.label}
              </h2>
            </div>

            {/* Course Idea */}
            {section === "course_idea" && plan.course_idea && (
              <div>
                <div style={{ ...S.card, background: `${colors.brand.primaryOrange}0D`, border: `1px solid ${colors.brand.primaryOrange}38`, marginBottom: 14 }}>
                  <div style={S.lbl}>Course Title</div>
                  <div style={{ fontSize: 21, fontWeight: 800, color: colors.brand.primaryOrange, lineHeight: 1.3, margin: "5px 0 10px" }}>{plan.course_idea.title}</div>
                  <div style={{ fontSize: 14, color: colors.typography.secondaryText, fontStyle: "italic", lineHeight: 1.65 }}>{plan.course_idea.tagline}</div>
                </div>
                <div style={S.card}>
                  <div style={S.lbl}>Why This Will Sell</div>
                  <div style={{ ...S.val, marginTop: 6 }}>{plan.course_idea.why_it_sells}</div>
                </div>
              </div>
            )}

            {/* Course Structure */}
            {section === "course_structure" && plan.course_structure && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 18 }}>
                  <div style={S.mbox}><div style={S.mval}>{plan.course_structure.total_modules}</div><div style={S.mlbl}>Modules</div></div>
                  <div style={S.mbox}><div style={S.mval}>{plan.course_structure.total_lessons}</div><div style={S.mlbl}>Total Lessons</div></div>
                </div>
                {plan.course_structure.modules?.map((m) => (
                  <div key={m.module_number} style={{ ...S.card, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                      <div style={{ width: 26, height: 26, background: `${colors.brand.primaryOrange}1F`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: colors.brand.primaryOrange, flexShrink: 0 }}>M{m.module_number}</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{m.module_title}</div>
                    </div>
                    {m.lessons?.map((l, i) => (
                      <div key={i} style={{ display: "flex", gap: 9, padding: "6px 0 6px 6px", borderBottom: i < m.lessons.length - 1 ? `1px solid ${colors.base.border}` : "none" }}>
                        <span style={{ fontSize: 11, color: colors.typography.secondaryText, minWidth: 20 }}>{i + 1}.</span>
                        <span style={{ ...S.val, fontSize: 13 }}>{l}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Content Creation */}
            {section === "content_creation" && plan.content_creation?.lessons && (
              <div>
                {plan.content_creation.lessons.map((l) => (
                  <div key={l.lesson_number} style={{ ...S.card, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                      <div style={S.tagGold}>Lesson {l.lesson_number}</div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{l.title}</div>
                    </div>
                    <div style={{ background: `${colors.brand.primaryOrange}0D`, border: `1px solid ${colors.brand.primaryOrange}2E`, borderRadius: 10, padding: "13px 15px", marginBottom: 13 }}>
                      <div style={{ ...S.lbl, marginBottom: 5 }}>Opening Hook</div>
                      <div style={{ fontStyle: "italic", fontSize: 13.5, color: colors.brand.primaryOrange, lineHeight: 1.75, whiteSpace: "pre-line" }}>{l.hook}</div>
                    </div>
                    <div style={S.lbl}>Key Teaching Points</div>
                    <div style={{ marginBottom: 12 }}>
                      {l.key_points?.map((pt, i) => (
                        <div key={i} style={{ display: "flex", gap: 9, padding: "6px 0", borderBottom: i < l.key_points.length - 1 ? `1px solid ${colors.base.border}` : "none" }}>
                          <span style={{ color: colors.brand.primaryOrange, fontSize: 12, marginTop: 2 }}>→</span>
                          <span style={{ ...S.val, fontSize: 13 }}>{pt}</span>
                        </div>
                      ))}
                    </div>
                    <div style={S.lbl}>Retention Mechanism</div>
                    <div style={{ ...S.val, fontSize: 12.5, color: colors.typography.secondaryText, marginTop: 4 }}>{l.retention_mechanism}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Offer Creation */}
            {section === "offer_creation" && plan.offer_creation && (
              <div>
                <div style={{ ...S.card, background: `${colors.brand.primaryOrange}0D`, border: `1px solid ${colors.brand.primaryOrange}33`, textAlign: "center", padding: "26px 22px", marginBottom: 14 }}>
                  <div style={{ ...S.lbl, marginBottom: 9 }}>Course Headline</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: colors.brand.primaryOrange, lineHeight: 1.3, marginBottom: 11 }}>{plan.offer_creation.headline}</div>
                  <div style={{ fontSize: 14, color: colors.typography.secondaryText, lineHeight: 1.65 }}>{plan.offer_creation.subheadline}</div>
                </div>
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={S.lbl}>Sales Description (Pain → Agitate → Solve)</div>
                  <div style={{ ...S.val, marginTop: 6 }}>{plan.offer_creation.description}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                  {["low_ticket", "high_ticket"].map((tier) => {
                    const gold = tier === "high_ticket";
                    return (
                      <div key={tier} style={{ ...S.card, borderColor: gold ? `${colors.brand.primaryOrange}47` : colors.base.border }}>
                        <div style={{ ...(gold ? S.tagGold : S.tag), marginBottom: 11 }}>{gold ? "High Ticket" : "Low Ticket"}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: gold ? colors.brand.primaryOrange : colors.typography.primaryText, marginBottom: 9 }}>{plan.offer_creation.pricing_strategy?.[tier]?.price}</div>
                        <div style={S.lbl}>Included</div>
                        <div style={{ ...S.val, fontSize: 12.5, marginBottom: 9, color: colors.typography.secondaryText }}>{plan.offer_creation.pricing_strategy?.[tier]?.what_included}</div>
                        <div style={S.lbl}>Psychology</div>
                        <div style={{ ...S.val, fontSize: 12, color: colors.typography.secondaryText }}>{plan.offer_creation.pricing_strategy?.[tier]?.psychology}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Target Audience */}
            {section === "target_audience" && plan.target_audience && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 11, marginBottom: 14 }}>
                  <div style={S.mbox}><div style={{ ...S.mval, fontSize: 16 }}>{plan.target_audience.age_group}</div><div style={S.mlbl}>Age Group</div></div>
                  <div style={S.mbox}><div style={{ ...S.mval, fontSize: 15 }}>{plan.target_audience.gender_split}</div><div style={S.mlbl}>Gender Split</div></div>
                </div>
                <div style={{ ...S.card, marginBottom: 13 }}>
                  <div style={S.lbl}>Top Cities</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                    {plan.target_audience.top_cities?.map((c) => <span key={c} style={{ ...S.pill, ...S.pillGold }}>{c}</span>)}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}>
                  <div style={S.card}>
                    <div style={S.lbl}>Meta Interests</div>
                    {plan.target_audience.meta_interests?.map((x, i, a) => (
                      <div key={x} style={{ padding: "5px 0", borderBottom: i < a.length - 1 ? `1px solid ${colors.base.border}` : "none", fontSize: 12.5, color: colors.typography.primaryText }}>• {x}</div>
                    ))}
                  </div>
                  <div style={S.card}>
                    <div style={S.lbl}>Google Audiences</div>
                    {plan.target_audience.google_audiences?.map((x, i, a) => (
                      <div key={x} style={{ padding: "5px 0", borderBottom: i < a.length - 1 ? `1px solid ${colors.base.border}` : "none", fontSize: 12.5, color: colors.typography.primaryText }}>• {x}</div>
                    ))}
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.lbl}>Core Pain Points</div>
                  {plan.target_audience.pain_points?.map((p, i, a) => (
                    <div key={i} style={{ display: "flex", gap: 9, padding: "7px 0", borderBottom: i < a.length - 1 ? `1px solid ${colors.base.border}` : "none" }}>
                      <span style={{ color: colors.brand.primaryOrange, fontSize: 12 }}>⚡</span>
                      <span style={{ ...S.val, fontSize: 13 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ad Strategy */}
            {section === "ad_strategy" && plan.ad_strategy && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: colors.brand.primaryOrange, letterSpacing: 0.6, marginBottom: 13, textTransform: "uppercase" }}>Meta Ads</div>
                {plan.ad_strategy.meta?.creatives?.map((c, i) => (
                  <div key={i} style={{ ...S.card, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={S.tagGold}>{c.angle} Angle</div>
                      <span style={{ fontSize: 11, color: colors.typography.secondaryText }}>Creative #{i + 1}</span>
                    </div>
                    <div style={{ borderLeft: `3px solid ${colors.brand.primaryOrange}73`, paddingLeft: 13 }}>
                      <div style={{ ...S.lbl, marginBottom: 4 }}>Hook Line</div>
                      <div style={{ fontStyle: "italic", fontSize: 13.5, marginBottom: 11, lineHeight: 1.65 }}>{c.hook}</div>
                      <div style={{ ...S.lbl, marginBottom: 4 }}>Ad Copy</div>
                      <div style={{ ...S.val, fontSize: 12.5, marginBottom: 9, whiteSpace: "pre-line" }}>{c.copy}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ ...S.lbl, marginBottom: 0 }}>CTA:</span>
                        <span style={{ ...S.pill, ...S.pillGold, fontSize: 11 }}>{c.cta}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 22 }}>
                  {[["TOF", plan.ad_strategy.meta?.funnel?.tof, colors.brand.primaryOrange], ["MOF", plan.ad_strategy.meta?.funnel?.mof, colors.brand.successGreen], ["BOF", plan.ad_strategy.meta?.funnel?.bof, "#DC2626"]].map(([s, t, col]) => (
                    <div key={s} style={{ ...S.card, borderLeft: `3px solid ${col}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 7 }}>{s}</div>
                      <div style={{ ...S.val, fontSize: 12 }}>{t}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: colors.brand.primaryOrange, letterSpacing: 0.6, marginBottom: 13, textTransform: "uppercase" }}>Google Ads</div>
                {plan.ad_strategy.google?.keyword_clusters?.map((kc, i) => (
                  <div key={i} style={{ ...S.card, marginBottom: 10 }}>
                    <div style={{ ...S.lbl, marginBottom: 7 }}>{kc.cluster_name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {kc.keywords?.map((k) => <span key={k} style={{ ...S.pill, fontSize: 11.5 }}>{k}</span>)}
                    </div>
                  </div>
                ))}
                <div style={{ ...S.card, marginTop: 11 }}>
                  <div style={S.lbl}>Intent Strategy</div>
                  <div style={{ ...S.val, marginTop: 5 }}>{plan.ad_strategy.google?.intent_strategy}</div>
                </div>
              </div>
            )}

            {/* Audience Sizing */}
            {section === "audience_sizing" && plan.audience_sizing && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 11, marginBottom: 16 }}>
                  {[["TAM", plan.audience_sizing.tam, "Total Addressable Market"], ["SAM", plan.audience_sizing.sam, "Serviceable Addressable Market"], ["SOM", plan.audience_sizing.som, "Serviceable Obtainable (Yr 1)"]].map(([k, v, sub]) => (
                    <div key={k} style={S.mbox}>
                      <div style={{ ...S.mval, fontSize: 16 }}>{v}</div>
                      <div style={S.mlbl}>{k}</div>
                      <div style={{ fontSize: 9.5, color: colors.typography.secondaryText, marginTop: 3 }}>{sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ ...S.card, background: `${colors.brand.primaryOrange}0D`, border: `1px solid ${colors.brand.primaryOrange}2E`, marginBottom: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div><div style={S.lbl}>Meta Estimated Reach</div><div style={{ fontSize: 19, fontWeight: 800, color: colors.brand.primaryOrange, marginTop: 4 }}>{plan.audience_sizing.meta_estimated_reach}</div></div>
                    <div style={{ textAlign: "right" }}><div style={S.lbl}>Year 1 Reachable</div><div style={{ ...S.val, marginTop: 4 }}>{plan.audience_sizing.estimated_reachable}</div></div>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.lbl}>Sizing Logic</div>
                  <div style={{ ...S.val, marginTop: 5 }}>{plan.audience_sizing.logic}</div>
                </div>
              </div>
            )}

            {/* Revenue Forecast */}
            {section === "revenue_forecast" && plan.revenue_forecast && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 11, marginBottom: 20 }}>
                  {[["Assumed CTR", plan.revenue_forecast.assumed_ctr], ["Assumed CVR", plan.revenue_forecast.assumed_cvr], ["Cost Per Lead", plan.revenue_forecast.cost_per_lead], ["Cost Per Sale", plan.revenue_forecast.cost_per_sale]].map(([k, v]) => (
                    <div key={k} style={S.mbox}><div style={{ ...S.mval, fontSize: 18 }}>{v}</div><div style={S.mlbl}>{k}</div></div>
                  ))}
                </div>
                <div style={{ ...S.lbl, marginBottom: 9 }}>Budget Scenarios</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, padding: "12px 14px", background: `${colors.brand.primaryOrange}0D`, border: `1px solid ${colors.brand.primaryOrange}2E`, borderRadius: 10, marginBottom: 9 }}>
                  {["Budget", "Leads", "Sales", "Revenue", "ROAS"].map((h) => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: colors.brand.primaryOrange }}>{h}</div>
                  ))}
                </div>
                {plan.revenue_forecast.budget_scenarios?.map((s, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, padding: "12px 14px", background: "rgba(0,0,0,0.015)", border: `1px solid ${colors.base.border}`, borderRadius: 10, marginBottom: 9, alignItems: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{s.budget}</div>
                    <div style={{ ...S.val, fontSize: 12.5 }}>{s.leads}</div>
                    <div style={{ ...S.val, fontSize: 12.5 }}>{s.sales}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: colors.brand.successGreen }}>{s.revenue}</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: colors.brand.primaryOrange }}>{s.roas}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Scaling Plan */}
            {section === "scaling_plan" && plan.scaling_plan && (
              <div>
                {[["🎯 Scale Trigger", plan.scaling_plan.scale_trigger, colors.brand.primaryOrange], ["💸 Budget Allocation", plan.scaling_plan.budget_allocation, colors.brand.successGreen], ["🔄 Retargeting Logic", plan.scaling_plan.retargeting_logic, colors.charts.purple], ["♾️ LTV Optimization", plan.scaling_plan.ltv_optimization, colors.charts.blue]].map(([title, content, col]) => (
                  <div key={title} style={{ ...S.card, marginBottom: 14, borderLeft: `3px solid ${col}` }}>
                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 9, color: col }}>{title}</div>
                    <div style={S.val}>{content}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Growth Hacks */}
            {section === "growth_hacks" && plan.growth_hacks && (
              <div>
                {plan.growth_hacks.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, padding: 15, background: colors.base.cardBackground, borderRadius: 12, border: `1px solid ${colors.base.border}`, marginBottom: 11 }}>
                    <div style={{ width: 30, height: 30, minWidth: 30, background: `${colors.brand.primaryOrange}1F`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: colors.brand.primaryOrange, fontWeight: 800, fontSize: 13 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>{h.hack}</div>
                      <div style={{ ...S.val, fontSize: 13, marginBottom: 8 }}>{h.mechanism}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 10, color: colors.typography.secondaryText, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>Expected Impact:</span>
                        <span style={{ fontSize: 12.5, color: colors.brand.successGreen, fontWeight: 600, lineHeight: 1.5 }}>{h.expected_impact}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}