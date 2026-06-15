import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  Wallet,
  BookOpen,
  Users,
  CalendarClock,
  Video,
  Film,
  Trophy,
  Star,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  RefreshCw,
  Loader2,
  Sparkles,
  IndianRupee,
} from "lucide-react";
import { apiFetch, unwrap } from "./api";

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

const inr = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

// settle the result of an allSettled call into the unwrapped payload (or null)
function val(result) {
  if (result.status !== "fulfilled") return null;
  return unwrap(result.value);
}

export default function CreatorOverview({ user, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [dash, setDash] = useState(null); // /sessions/dashboard
  const [wallet, setWallet] = useState(null); // /settlements/wallet -> .wallet
  const [courseStats, setCourseStats] = useState(null); // .statistics
  const [webinarStats, setWebinarStats] = useState(null); // .statistics
  const [sales, setSales] = useState([]); // /payments/creator-sales -> .transactions

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    const [d, w, cs, ws, sl] = await Promise.allSettled([
      apiFetch("/sessions/dashboard"),
      apiFetch("/settlements/wallet"),
      apiFetch("/courses/stats/creator"),
      apiFetch("/webinars/stats/creator"),
      apiFetch("/payments/creator-sales?page=1&limit=6"),
    ]);

    setDash(val(d));
    const wd = val(w);
    setWallet(wd?.wallet || wd || null);
    setCourseStats(val(cs)?.statistics || null);
    setWebinarStats(val(ws)?.statistics || null);
    const sd = val(sl);
    setSales(Array.isArray(sd?.transactions) ? sd.transactions : []);

    // Only surface an error if literally everything failed (backend down / not logged in)
    if ([d, w, cs, ws, sl].every((r) => r.status === "rejected")) {
      setErr(
        d.reason?.message ||
          "Couldn't reach the backend. Make sure it's running on the configured API base."
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---- derived numbers (defensive across whichever endpoints answered) ----
  const totalRevenue =
    dash?.total_revenue ??
    (courseStats && webinarStats
      ? 0 // we don't have raw revenue from stats; dashboard is the source
      : 0);
  const courseRev = dash?.course?.revenue ?? 0;
  const webinarRev = dash?.webinar?.revenue ?? 0;
  const sessionRev = dash?.session?.revenue ?? 0;

  const totalStudents =
    dash?.total_enrolled ??
    (courseStats?.total_enrollments || 0) + (webinarStats?.total_enrollments || 0);

  const courseCount = courseStats?.total_courses ?? dash?.course?.count ?? 0;
  const publishedCourses = courseStats?.published_courses ?? 0;
  const webinarCount = webinarStats?.total_webinars ?? dash?.webinar?.count ?? 0;
  const upcomingWebinars = webinarStats?.upcoming_webinars ?? 0;
  const sessionCount = dash?.session?.count ?? 0;
  const totalVideos = courseStats?.total_videos ?? 0;

  const available = wallet?.available_balance ?? 0;
  const withdrawn = wallet?.withdrawn_amount ?? 0;
  const kycVerified = !!(user?.kyc_verified);

  // ---- gamification: a simple, transparent creator score ----
  const score = Math.round(
    totalStudents * 5 +
      totalRevenue / 50 +
      courseCount * 20 +
      webinarCount * 15 +
      sessionCount * 10 +
      (kycVerified ? 100 : 0)
  );
  const LEVELS = [
    { name: "Rookie", at: 0 },
    { name: "Rising", at: 250 },
    { name: "Established", at: 750 },
    { name: "Pro Creator", at: 2000 },
    { name: "Elite", at: 5000 },
  ];
  let levelIdx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (score >= LEVELS[i].at) levelIdx = i;
  const curLevel = LEVELS[levelIdx];
  const nextLevel = LEVELS[levelIdx + 1];
  const levelProgress = nextLevel
    ? Math.min(
        100,
        Math.round(
          ((score - curLevel.at) / (nextLevel.at - curLevel.at)) * 100
        )
      )
    : 100;

  // ---- milestones ----
  const milestones = [
    { label: "Complete KYC", done: kycVerified, hint: "Unlock payouts" },
    { label: "Publish first course", done: publishedCourses > 0, hint: "Go live" },
    { label: "First sale", done: (courseStats?.courses_sold || 0) + (webinarStats?.webinars_sold || 0) > 0, hint: "Make money" },
    { label: "Reach 10 users", done: totalStudents >= 10, cur: totalStudents, goal: 10 },
    { label: "Host a webinar", done: webinarCount > 0, hint: "Go live" },
    { label: "₹10,000 in revenue", done: totalRevenue >= 10000, cur: totalRevenue, goal: 10000, money: true },
  ];
  const doneCount = milestones.filter((m) => m.done).length;

  if (loading) {
    return (
      <div style={center}>
        <Loader2 size={28} className="spin" color={T.orange} />
        <p style={{ color: T.textSec, marginTop: 10 }}>Loading your dashboard…</p>
        <style>{spinCss}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      {/* greeting */}
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
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
            Welcome back, {user?.name || "Creator"} 👋
          </h2>
          <p style={{ margin: "4px 0 0", color: T.textSec, fontSize: 13.5 }}>
            Here's how your creator business is doing.
          </p>
        </div>
        <button onClick={load} style={ghostBtn}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {err && <div style={errorBox}>⚠️ {err}</div>}

      {/* HERO: revenue + score */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
        className="ov-hero"
      >
        {/* revenue */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255,193,7,0.16), rgba(255,193,7,0.02))",
            border: `1px solid rgba(255,193,7,0.35)`,
            borderRadius: 18,
            padding: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.orange }}>
            <TrendingUp size={18} />
            <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: 0.3 }}>
              TOTAL REVENUE
            </span>
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, marginTop: 8 }}>
            {inr(totalRevenue)}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <RevChip label="Courses" value={inr(courseRev)} color={T.orange} />
            <RevChip label="Webinars" value={inr(webinarRev)} color={T.purple} />
            <RevChip label="Sessions" value={inr(sessionRev)} color={T.blue} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 18,
              paddingTop: 16,
              borderTop: `1px solid ${T.border}`,
            }}
          >
            <div>
              <div style={{ color: T.textSec, fontSize: 12 }}>Available to withdraw</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: T.green }}>
                {inr(available)}
              </div>
            </div>
            <button
              onClick={() => onNavigate && onNavigate("settlements")}
              style={{ ...primaryBtn, padding: "10px 18px" }}
            >
              <Wallet size={16} /> Withdraw
            </button>
          </div>
        </div>

        {/* creator score */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: 22,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.textSec }}>
            <Trophy size={18} color={T.orange} />
            <span style={{ fontWeight: 800, fontSize: 13 }}>CREATOR SCORE</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 38, fontWeight: 900 }}>{score}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: T.orange,
                background: "rgba(255,193,7,0.12)",
                padding: "3px 10px",
                borderRadius: 999,
              }}
            >
              {curLevel.name}
            </span>
          </div>

          <div style={{ marginTop: "auto", paddingTop: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11.5,
                color: T.textSec,
                marginBottom: 6,
              }}
            >
              <span>{nextLevel ? `Next: ${nextLevel.name}` : "Max level reached"}</span>
              <span>{nextLevel ? `${levelProgress}%` : "★"}</span>
            </div>
            <Bar pct={levelProgress} color={T.orange} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, color: T.textSec, fontSize: 12 }}>
              <Star size={13} color={T.orange} /> {doneCount}/{milestones.length} milestones done
            </div>
          </div>
        </div>
      </div>

      {/* STAT GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Stat icon={BookOpen} color={T.orange} label="Courses"
          value={courseCount} sub={`${publishedCourses} published`} />
        <Stat icon={Users} color={T.green} label="Total Users"
          value={totalStudents} sub="across all products" />
        <Stat icon={CalendarClock} color={T.purple} label="Webinars"
          value={webinarCount} sub={`${upcomingWebinars} upcoming`} />
        <Stat icon={Video} color={T.blue} label="1-on-1 Sessions"
          value={sessionCount} sub="completed" />
        <Stat icon={Film} color="#06B6D4" label="Videos"
          value={totalVideos} sub="uploaded" />
        <Stat icon={IndianRupee} color={T.green} label="Withdrawn"
          value={inr(withdrawn)} sub="to bank" isMoney />
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ marginBottom: 16 }}>
        <SectionTitle icon={Sparkles}>Quick actions</SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Action onClick={() => onNavigate?.("courses")} icon={Plus} label="New course" />
          <Action onClick={() => onNavigate?.("webinars")} icon={Plus} label="New webinar" />
          <Action onClick={() => onNavigate?.("sessions")} icon={Video} label="Manage sessions" />
          <Action onClick={() => onNavigate?.("ai")} icon={Sparkles} label="Faah-AI" highlight />
          {!kycVerified && (
            <Action onClick={() => onNavigate?.("kyc")} icon={ShieldCheck} label="Finish KYC" warn />
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="ov-hero">
        {/* MILESTONES */}
        <div style={panel}>
          <SectionTitle icon={Trophy}>Milestones</SectionTitle>
          <div style={{ display: "grid", gap: 10 }}>
            {milestones.map((m) => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    flexShrink: 0,
                    background: m.done ? T.green : "transparent",
                    border: `2px solid ${m.done ? T.green : T.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000",
                    fontWeight: 900,
                    fontSize: 14,
                  }}
                >
                  {m.done ? "✓" : ""}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: m.done ? T.textPri : T.textSec,
                    }}
                  >
                    {m.label}
                  </div>
                  {!m.done && m.goal ? (
                    <div style={{ marginTop: 5 }}>
                      <Bar
                        pct={Math.min(100, ((m.cur || 0) / m.goal) * 100)}
                        color={T.orange}
                        h={5}
                      />
                      <span style={{ fontSize: 10.5, color: T.textSec }}>
                        {m.money ? inr(m.cur) : m.cur || 0} / {m.money ? inr(m.goal) : m.goal}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: T.textSec }}>
                      {m.done ? "Unlocked" : m.hint}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT SALES */}
        <div style={panel}>
          <SectionTitle icon={ArrowUpRight}>Recent sales</SectionTitle>
          {sales.length === 0 ? (
            <p style={{ color: T.textSec, fontSize: 13, margin: "8px 0" }}>
              No sales yet. Share a course or webinar link to get your first one.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {sales.map((tx, i) => {
                const buyer = tx.user?.name || tx.customer_name || tx.buyer_name || "A user";
                const product =
                  tx.course?.title || tx.webinar?.title || tx.product_title || "Purchase";
                const when = tx.completed_at || tx.created_at;
                return (
                  <div
                    key={tx.id || i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "9px 0",
                      borderBottom:
                        i < sales.length - 1 ? `1px solid ${T.border}` : "none",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {product}
                      </div>
                      <div style={{ fontSize: 11.5, color: T.textSec }}>
                        {buyer}
                        {when ? ` · ${new Date(when).toLocaleDateString()}` : ""}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: T.green, fontSize: 14 }}>
                      {inr(tx.amount)}
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => onNavigate?.("payments")}
                style={{ ...ghostBtn, justifyContent: "center", marginTop: 4 }}
              >
                View all payments
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        ${spinCss}
        @media (max-width: 760px) { .ov-hero { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

/* ---------- small presentational helpers ---------- */

function RevChip({ label, value, color }) {
  return (
    <div
      style={{
        background: T.elevated,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: "7px 11px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
        <span style={{ fontSize: 11, color: T.textSec }}>{label}</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 14, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Stat({ icon: Icon, color, label, value, sub, isMoney }) {
  return (
    <div style={{ ...panel, padding: 16 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: `${color}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Icon size={18} color={color} />
      </div>
      <div style={{ fontSize: isMoney ? 20 : 24, fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>
    </div>
  );
}

function Action({ onClick, icon: Icon, label, highlight, warn }) {
  const c = warn ? T.red : highlight ? T.orange : null;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: highlight ? T.orange : T.card,
        border: `1px solid ${c || T.border}`,
        color: highlight ? "#000" : warn ? T.red : T.textPri,
        padding: "11px 16px",
        borderRadius: 12,
        cursor: "pointer",
        fontWeight: 800,
        fontSize: 13,
      }}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function Bar({ pct, color, h = 7 }) {
  return (
    <div
      style={{
        height: h,
        background: "rgba(255,255,255,0.08)",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height: "100%",
          background: color,
          borderRadius: 999,
          transition: "width .4s ease",
        }}
      />
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <Icon size={16} color={T.orange} />
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{children}</h3>
    </div>
  );
}

const panel = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  padding: 18,
};

const ghostBtn = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  background: T.card,
  border: `1px solid ${T.border}`,
  color: T.textPri,
  padding: "9px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const primaryBtn = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  background: T.orange,
  border: "none",
  color: "#000",
  padding: "9px 16px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 13,
};

const errorBox = {
  background: "rgba(239,68,68,0.1)",
  border: `1px solid ${T.red}`,
  color: T.red,
  borderRadius: 10,
  padding: "10px 14px",
  marginBottom: 14,
  fontSize: 13,
};

const center = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "80px 20px",
};

const spinCss = `.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`;
