// AI Course Planner — niche → full go-to-market plan (10 sections).
// Restyled to match the light Creator Suite theme. Calls the backend's
// POST /ai/course/plan (aiController.coursePlan) — no API key or prompt
// logic lives on the client; the backend owns the system prompt, schema,
// and the "mock"-provider fallback when no AI key is configured.
import { useState, useRef, useEffect } from "react";
import { Sparkles, Rocket } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";

const G = colors.gradients;

// ─── DEMO DATA (client-side only — "View demo plan" needs no network call) ───
const DEMO = {
  niche: "Instagram Reels for Coaches & Consultants",
  course_idea: {
    title: "Reels Se Revenue: Instagram Growth Masterclass for Indian Coaches",
    tagline: "Learn how to create viral Reels in 30 mins/day and turn followers into paying clients — even if you have zero editing skills.",
    why_it_sells: "India now has 3.5 Crore+ coaches, consultants, and knowledge entrepreneurs but 94% of them make less than ₹50,000/month because they don't have a consistent content engine. Instagram Reels is the #1 organic distribution channel in India right now — with 3x the reach of feed posts — yet most coaches still post static images and wonder why nobody's buying. The course taps into a proven emotional trigger: coaches already KNOW they need content but feel overwhelmed, under-skilled, and embarrassed to appear on camera. This course removes every barrier (scripting, editing, confidence, strategy) in a step-by-step system that matches the Indian creator's workflow, bandwidth, and budget."
  },
  course_structure: {
    total_modules: 6,
    total_lessons: 24,
    modules: [
      { module_number: 1, module_title: "The Reels Mindset: From Coach to Creator", lessons: ["Why 90% of coaches fail at content (and the 3-shift fix)", "The Creator-Coach Identity: You're a brand, not just a service", "Setting your Content North Star — niche, audience, transformation promise", "Your 30-day content commitment framework"] },
      { module_number: 2, module_title: "Scripting Reels That Stop the Scroll", lessons: ["The 3-second hook formula that works for Indian audiences", "5 viral Reels formats every coach must master (hook-teach-CTA)", "Scripting in Hinglish: How to write naturally and authentically", "Building your swipe file: 50 hooks you can steal and adapt"] },
      { module_number: 3, module_title: "Shoot Like a Pro (with Your Phone)", lessons: ["Zero-budget studio setup: lighting, sound, background on ₹2,000", "Camera confidence: On-camera presence training for introverted coaches", "Shoot 7 Reels in one sitting — the batch creation system", "B-roll, talking head, text-overlay: when to use which format"] },
      { module_number: 4, module_title: "Edit Fast, Look Professional", lessons: ["CapCut masterclass: edit a Reel in under 15 minutes", "Trending audio strategy: how to find viral sounds in India", "Captions, subtitles, and text overlays that boost watch time", "Thumbnail, cover image, and grid aesthetic for authority positioning"] },
      { module_number: 5, module_title: "The Distribution & Growth Engine", lessons: ["The Instagram algorithm decoded for coaches in 2024", "Hashtag strategy: niche vs. broad — what actually works in India", "Collaboration & shoutout strategy to 10x reach without paid ads", "Converting views to DMs: the CTA system that brings warm leads daily"] },
      { module_number: 6, module_title: "Monetise Your Audience with Manchly", lessons: ["Turning followers into a paid community on Manchly", "Launching your first digital product using Reels as traffic", "Setting up automated lead magnets and WhatsApp funnels", "Building a ₹1L/month content-to-client system: the full stack"] }
    ]
  },
  content_creation: {
    lessons: [
      { lesson_number: 1, title: "Why 90% of Coaches Fail at Content (And the 3-Shift Fix)", hook: "Aapne last month kitne Reels banaye? Ek? Shayad do? Aur kitne clients aaye unse?\nMost coaches treat content like homework. We're going to make it your #1 sales machine.", key_points: ["The 3 false beliefs killing your content: 'I need fancy equipment', 'I'm not interesting enough', 'I don't have time'", "Content is a leverage tool, not a task — one Reel can sell to 10,000 people simultaneously while you sleep", "The only metric that matters in month 1: consistency score — not views, not likes, just shipping frequency"], retention_mechanism: "End with a live audit: share your last Reel in the community and get feedback within 24 hours. Creates immediate investment in completing Module 2." },
      { lesson_number: 2, title: "The 3-Second Hook Formula That Works for Indian Audiences", hook: "Maine ek Reel banaya — 14 words in the caption, 3-second hook, zero paid promotion. 2.3 lakh views.\nYour hook is 70% of your Reel's success. Get this wrong, nothing else matters.", key_points: ["The PAIN-PATTERN-PROMISE hook structure: open with a pain statement your audience says to themselves at 2am", "Indian-specific hooks that go viral: 'Mujhe pehle kisi ne nahi bataya', 'Ye galti mat karna', 'Agar aap [profession] ho toh...'", "The curiosity gap technique: say exactly enough to force the viewer to watch till the end"], retention_mechanism: "Assignment: write 5 hook variations for your best-performing post. Share in Manchly community for peer scoring. Top 3 hooks get featured in the next live session." },
      { lesson_number: 3, title: "Zero-Budget Studio Setup: Lighting, Sound & Background on ₹2,000", hook: "Mera pehla viral Reel ek ₹0 setup mein shoot hua tha — bedroom wall, phone on a glass, afternoon sunlight. 80,000 views.\nEquipment is the last reason you should delay posting.", key_points: ["Natural light beats ring lights every time — the window-to-face 45° angle formula that costs ₹0", "The ₹599 mic hack (Maono lavalier on Amazon) that makes you sound like a studio recording vs. the hollow echo of built-in mics", "Background psychology: a clean wall with a single plant communicates 'expert' better than a branded banner"], retention_mechanism: "Post a before/after setup photo in the community. Reaction voting creates social proof momentum and gamifies the learning experience." }
    ]
  },
  offer_creation: {
    headline: "Reels Se Revenue — India's First Course for Coaches Who Want Clients, Not Just Followers",
    subheadline: "A 6-module, 24-lesson system to go from 'posting randomly' to a content engine that brings 5–10 warm leads every week.",
    description: "You're an amazing coach. You have the knowledge, the results, the testimonials. But your Instagram is either dead or growing painfully slowly — and you know that if you could just crack content, your entire business would transform. Every day you delay, your competitor is posting Reels and taking the clients that should be yours. Reels Se Revenue is a hands-on, India-specific system that takes you from camera-shy and inconsistent to confident, strategic, and converting — in 30 days. You'll get the exact scripts, editing workflows, growth strategies, and Manchly monetisation playbook that top Indian coaches are using to cross ₹1 lakh/month from content alone.",
    pricing_strategy: {
      low_ticket: { price: "₹2,999", what_included: "Full 6-module recorded course, community access for 3 months, 50-hook swipe file PDF, CapCut template pack (10 templates), lifetime updates", psychology: "Priced below the ₹3,000 psychological barrier — impulse-buy territory. No spousal approval needed. Recoverable with just one new client, which kills the ROI objection entirely." },
      high_ticket: { price: "₹12,999", what_included: "Everything in base + 4 live group coaching calls/month, personal Reel audit by instructor, Manchly setup done-with-you session, priority community support, 1-year access + all future modules", psychology: "Anchored at 4x base price but positioned as 'done-with-you', not just a course. Live calls create accountability and dramatically improve completion rate. Targets coaches earning ₹30k+/month who clearly see the opportunity cost." }
    }
  },
  target_audience: {
    age_group: "24–42 years",
    gender_split: "62% Female, 38% Male (female coaches over-index on self-development content and Instagram vs. male coaches who lean YouTube)",
    top_cities: ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Ahmedabad"],
    meta_interests: ["Online coaching / life coaching", "Digital marketing (broad)", "Personal development & self-improvement", "Entrepreneurship India / StartupIndia", "Instagram marketing / social media marketing", "Yoga, fitness, and wellness (for health coaches)"],
    google_audiences: ["In-market: Online education & e-learning", "In-market: Business services (coaching/consulting)", "Affinity: Social media enthusiasts", "Custom intent: 'how to grow Instagram as a coach India'"],
    pain_points: ["Posting consistently but getting only 200–500 views per Reel with zero inbound DMs", "Camera shy and not confident appearing on video — feel like 'big influencers' are a different breed", "Spending 3+ hours making one Reel and still not happy with the output", "No clear system — posting randomly, no content calendar, no funnel from content to paid offer"]
  },
  ad_strategy: {
    meta: {
      creatives: [
        { angle: "Pain", hook: "Agar aap roz post kar rahe ho aur phir bhi ek bhi DM nahi aa raha — toh problem content ki nahi, STRATEGY ki hai.", copy: "Maine 6 mahine tak daily post kiya. Views aate the, likes aate the — clients? Zero.\n\nFir maine ek cheez badli: mera hook.\n\nAgle 30 din mein 11 coaches ne mujhse direct message kiya.\n\nReels Se Revenue course mein main aapko exactly woh 3-second hook formula de raha hoon jo Indian audiences ke saath work karta hai.\n\n📌 ₹2,999 mein. Ek client se recover hota hai.", cta: "Join Now — ₹2,999" },
        { angle: "Aspiration", hook: "Imagine karo: subah uthke phone uthao aur 7 DMs dekho — sab coaches jo aapka next program join karna chahte hain. Yeh possible hai.", copy: "Top Indian coaches jo aaj Instagram se ₹1–3L/month kama rahe hain — unka ek common secret hai.\n\nWoh Reels ko 'content' ki tarah nahi treat karte. Woh isko ek SALES SYSTEM ki tarah treat karte hain.\n\nReels Se Revenue mein aap seekhoge:\n✅ 30 min/day mein Reel banao\n✅ Aisa hook likho jo scroll rokke\n✅ DMs ko clients mein convert karo\n✅ Manchly pe paid community launch karo\n\nLimited seats — batch closes Sunday.", cta: "Enroll Today" },
        { angle: "Authority", hook: "Maine 200+ Indian coaches ko sikhaya hai Reels se ₹50,000–₹2,00,000/month kaise kamaya jaata hai. Aaj aapki baari hai.", copy: "Priya Sharma, a Delhi-based relationship coach, had 1,200 Instagram followers when she joined Reels Se Revenue.\n\n60 days later: 8,400 followers. 22 new coaching clients. ₹1.8L in course sales.\n\nEvery lesson comes with templates, real Indian examples, and a community of 1,000+ coaches doing this live.\n\n📲 Course opens this week. ₹2,999 only.", cta: "See Full Course" }
      ],
      funnel: {
        tof: "Run Pain + Aspiration angle Reels as video ads (6–15 sec hook versions). Objective: Video Views. Target: Interest-based — coaches, self-help, digital marketing in IN. Budget: 60% of Meta spend. Goal: build a 95% video-view custom audience for MOF retargeting within 7–10 days.",
        mof: "Retarget 95% video viewers + Instagram profile visitors (last 60 days) with Authority angle + free lead magnet ('50 Viral Reel Hooks for Coaches' PDF). Objective: Lead Generation via Meta Lead Form. Budget: 25% of spend. Expected CPL: ₹80–₹150.",
        bof: "Retarget lead magnet downloaders + website visitors (last 14 days) + DM'd but not converted. Run direct offer ad with scarcity ('Batch closes Sunday / 50 seats left'). Objective: Purchase or WhatsApp message. Budget: 15% of spend. Expected ROAS: 4–6x."
      }
    },
    google: {
      keyword_clusters: [
        { cluster_name: "Problem-Aware (High Intent)", keywords: ["how to grow instagram as a coach india", "instagram reels for coaches", "how to get clients through instagram reels", "instagram marketing for consultants india"] },
        { cluster_name: "Solution-Aware (Course Seekers)", keywords: ["instagram reels course india", "social media marketing course for coaches", "online course instagram growth india", "best instagram course for consultants"] },
        { cluster_name: "Competitor + Brand Adjacent", keywords: ["nas.io india alternative", "manchly course platform", "creator monetization india course", "instagram coaching program india"] }
      ],
      intent_strategy: "Focus exclusively on bottom-of-funnel Search campaigns with exact match + phrase match only — no broad match. Budget: ₹15,000/month on Google (Phase 1). Run YouTube pre-roll using the Pain angle creative to capture coaches watching 'how to grow Instagram' content. Skip Display until ₹50k+/month budget — too broad for this niche. Google captures intent; Meta creates it."
    }
  },
  audience_sizing: {
    tam: "~3.5 Crore (35M)",
    sam: "~42 Lakh (4.2M)",
    som: "~2.1 Lakh (210K) — Year 1",
    estimated_reachable: "80,000–1,20,000 unique users reachable in Year 1 via Manchly's paid + organic mix",
    meta_estimated_reach: "18M–24M on Meta (interest-based, India)",
    logic: "TAM = All active coaches, consultants, and knowledge entrepreneurs in India (~35M per IIM/coaching reports). SAM = Those active on Instagram AND showing intent to monetize expertise (Meta Audience Insights: 'online coaching' + 'digital marketing' interests IN = ~22M, filtered by income bracket and age = ~4.2M). SOM = Realistically reachable in Year 1 with ₹3–5L annual marketing budget = ~5% of SAM = 2.1L. At 0.5% conversion, that's 1,050 course sales at ₹2,999 = ₹31.4L in Year 1 from paid alone — conservative baseline."
  },
  revenue_forecast: {
    assumed_ctr: "2.8% (Meta Reels ad, India)",
    assumed_cvr: "3.2% (landing page to purchase — Indian edtech benchmark)",
    cost_per_lead: "₹90–₹130",
    cost_per_sale: "₹800–₹1,400 (blended, low-ticket)",
    budget_scenarios: [
      { budget: "₹30,000/mo", leads: "230–330", sales: "18–25", revenue: "₹54,000–₹74,000", roas: "1.8–2.5x" },
      { budget: "₹75,000/mo", leads: "575–830", sales: "46–64", revenue: "₹1,38,000–₹1,92,000", roas: "1.8–2.6x" },
      { budget: "₹1,50,000/mo", leads: "1,150–1,650", sales: "92–128", revenue: "₹2,76,000–₹3,84,000", roas: "1.8–2.6x" }
    ]
  },
  scaling_plan: {
    scale_trigger: "Scale ad spend by 20–30% every 7 days ONLY when: (1) ROAS holds above 1.8x for 5 consecutive days, (2) CPL stays below ₹150, (3) landing page CVR is above 2.5%. Never scale more than 30% in a single step — Meta's algorithm needs 3–4 days to re-optimize. If ROAS drops below 1.5x for 3 straight days, pause and rotate creative before touching budget.",
    budget_allocation: "Meta 70% / Google Search 20% / YouTube Pre-roll 10% at launch. Shift to Meta 60% / Google 15% / YouTube 10% / Retargeting 15% once you have 10,000+ monthly website visitors. Always maintain minimum 3 active creatives per ad set and rotate every 14–21 days to prevent ad fatigue.",
    retargeting_logic: "3-layer stack — Layer 1 (7-day): Hottest — website visitors + checkout abandoners → direct offer with urgency. Layer 2 (14-day): Warm — lead magnet downloaders + 95% video viewers → testimonial/social proof creative. Layer 3 (30-day): Cool — Instagram engagers + 50% video viewers → value content Reel to re-warm. Frequency cap: max 3 impressions per person per 7 days. Always exclude existing buyers via custom audience upload.",
    ltv_optimization: "Base LTV = ₹2,999. Increase to ₹8,000–₹15,000 per customer via: (1) Upsell to ₹12,999 VIP at checkout via order bump, (2) Monthly Manchly community at ₹499/month post-completion, (3) Advanced 'Reels to Revenue 2.0' at ₹5,999 in Month 4 via email + WhatsApp sequence, (4) Affiliate program — 20% commission for referrals tracked via Manchly, (5) Annual cohort live program at ₹24,999 for top performers. Target blended LTV: ₹6,500 within 12 months of first purchase."
  },
  growth_hacks: [
    { hack: "WhatsApp Broadcast as a Free Lead Magnet Funnel", mechanism: "Offer '50 Viral Reel Hooks for Coaches' PDF free in exchange for WhatsApp number. Deliver via WhatsApp (not email — 4x open rates in India). Run a 5-day nurture sequence ending with the course pitch. Use Manchly CRM or Interakt to automate. Zero ad cost when done via organic bio link.", expected_impact: "CPL drops to ₹0 for organic traffic. WhatsApp leads convert at 6–9% vs. 3% for email. Expected 200–400 warm leads/month from organic alone with consistent Reels posting." },
    { hack: "Collaboration Reel Series with 5 Micro-Coach Influencers", mechanism: "Partner with 5 coaches (10K–50K followers, complementary niches — fitness, parenting, finance). Each creates a Reel: 'The one thing I wish I knew about Instagram 2 years ago' tagging your account. No money exchanged — you promote their service to your list in return. Each collab Reel typically drives 500–2,000 new followers.", expected_impact: "2,500–10,000 new targeted followers in 30 days at ₹0 ad spend. Minimum 50–150 new course leads from collaboration traffic per month." },
    { hack: "Student Testimonial Reel Factory", mechanism: "At Day 7 and Day 30 of the course, prompt students with an exact script: 'Record a 30-second Reel on what changed — we'll feature you on Manchly's account and send a free 1:1 audit.' Collect 10–20 UGC testimonial Reels per cohort and use as both organic content AND ad creatives. UGC ads outperform brand ads by 4x in India.", expected_impact: "Free ad creative pipeline forever. UGC testimonial ads expected to cut CPL by 35–50% vs. brand-produced creatives. Social proof flywheel accelerates with every new cohort." },
    { hack: "Manchly Community 7-Day Reel Challenge (Virality Loop)", mechanism: "Every student who completes the course joins a '7-Day Reel Challenge' inside Manchly. Daily prompt + peer accountability + a leaderboard (most views wins a free 1:1 session). Students post publicly tagging Manchly. Winning Reel gets featured on Manchly's main Instagram — guaranteed 10,000+ views as prize.", expected_impact: "30–50% course completion rate vs. 5% industry average due to gamification. Each cohort generates 50–100 public Reels tagging Manchly = 5L–20L combined organic impressions at zero ad spend." }
  ]
};

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
      const val = 99 * (1 - Math.exp(-elapsed / 10));
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
      // Backend owns the system prompt + JSON schema + AI key.
      // Response is { provider, data, latency_ms } — unwrap() returns `data`,
      // which is already the fully-parsed plan object (or the server's
      // fallback plan if no AI provider is configured).
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

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button
              onClick={() => { setPlan(DEMO); setPlanNiche(DEMO.niche); setSection("course_idea"); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: colors.typography.secondaryText, fontSize: 12, textDecoration: "underline" }}
            >
              View demo plan (Instagram Reels for Coaches) →
            </button>
          </div>
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
            {plan === DEMO && (
              <div style={{ margin: "10px 4px 0", fontSize: 11, color: colors.brand.successGreen, background: `${colors.brand.successGreen}14`, border: `1px solid ${colors.brand.successGreen}33`, borderRadius: 8, padding: "7px 10px" }}>
                ✦ Demo Plan
              </div>
            )}
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