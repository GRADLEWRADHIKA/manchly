import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { onSocket } from "../../utils/socket";
import colors from "../../utils/colors";
import { Avatar, FullLoader, GradientButton, EmptyState, Badge } from "../../components/ui";
import { formatCurrency } from "../../utils/formatters";

const CATEGORIES = ["All", "Business Consulting", "Career Guidance", "Finance & Tax", "Health & Wellness", "Astrology", "Technology", "Life Coach"];

const STATUS_COLORS = { COMPLETED: "#22C55E", ACTIVE: "#3B82F6", PENDING: "#F59E0B", MISSED: "#EF4444" };

export default function Sessions() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [experts, setExperts] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadExperts = (cat = category, q = search) => {
    const params = new URLSearchParams({ page: 1, limit: 30 });
    if (cat && cat !== "All") params.set("category", cat);
    if (q) params.set("search", q);
    return apiFetch(`/sessions/experts?${params}`)
      .then((r) => {
        const d = unwrap(r);
        setExperts(d?.experts || d?.data || (Array.isArray(d) ? d : []));
      })
      .catch(() => {});
  };

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/sessions?role=caller&page=1&limit=30").then((r) => {
        const d = unwrap(r);
        setSessions(d?.sessions || (Array.isArray(d) ? d : []));
      }),
      apiFetch("/sessions/stats").then((r) => setStats(unwrap(r))),
      loadExperts("All", ""),
    ]).finally(() => setLoading(false));

    const off = onSocket("expert_availability_updated", () => loadExperts());
    return off;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <FullLoader label="Loading sessions..." />;

  const statCard = (label, value) => (
    <div style={{ flex: 1, background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 16, padding: 18, textAlign: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 900, background: colors.user.accent, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{value}</div>
      <div style={{ color: colors.user.subHeading, fontSize: 11.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.user.bg, color: colors.user.text }}>
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <h1 style={{ margin: "0 0 18px", fontSize: 26, fontWeight: 900 }}>My Journey</h1>

        {/* Stats */}
        <div style={{ display: "flex", gap: 14, marginBottom: 26 }}>
          {statCard("Sessions", stats?.total_sessions ?? 0)}
          {statCard("Minutes", stats?.total_minutes ?? 0)}
          {statCard("Spent", formatCurrency(stats?.total_earnings ?? 0))}
        </div>

        {/* Experts Header Banner */}
        <div style={{ background: colors.gradients.heroWarm, borderRadius: 18, padding: "22px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 900, color: colors.user.nav }}>Talk to an Expert 1:1</div>
            <div style={{ opacity: 0.8, fontSize: 13.5, marginTop: 4, color: colors.user.accentSoft }}>Live video sessions, billed per minute of actual call</div>
          </div>
        </div>

        {/* Search + categories */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, maxWidth: 480 }}>
          <Search size={16} color={colors.user.subHeading} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadExperts(category, search)}
            placeholder="Search by name or profession..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14 }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); loadExperts(c, search); }}
              style={{
                padding: "7px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${category === c ? "transparent" : colors.user.border}`,
                background: category === c ? colors.gradients.heroWarm : "transparent",
                color: category === c ? "#fff" : colors.user.subHeading,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {experts.length === 0 ? (
          <EmptyState icon="🧑‍🏫" title="No experts found" subtitle="Try a different category or search." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 34 }}>
            {experts.map((e) => (
              <div key={e.id} style={{ background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 16, padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
                <Avatar src={e.user?.profile_image || e.profile_image} name={e.user?.name || e.name || "E"} size={56} online={!!e.is_available} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{e.user?.name || e.name}</div>
                  <div style={{ color: colors.user.subHeading, fontSize: 12.5 }}>{e.profession}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, fontSize: 12, color: colors.user.subHeading }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={11} color="#F0C040" />{e.rating || "New"}</span>
                    <span>· {e.experience || 0} yrs</span>
                    <span>· {e.total_sessions || 0} sessions</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontWeight: 900, color: colors.user.accent, fontSize: 14 }}>₹{e.video_rate || 0}/min</span>
                    
                    {/* BOOK BUTTON WITH GREEN GRADIENT */}
                    <GradientButton 
                      size="sm" 
                      disabled={!e.is_available} 
                      gradient={e.is_available ? colors.gradients.greenButtonDark : undefined}
                      onClick={() => navigate(`/app/experts/${e.id}`, { state: { expert: e } })}
                    >
                      {e.is_available ? "Book" : "Offline"}
                    </GradientButton>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Session history */}
        <h2 style={{ margin: "0 0 14px", fontSize: 19, fontWeight: 800 }}>Session History</h2>
        {sessions.length === 0 ? (
          <EmptyState icon="📞" title="No sessions yet" subtitle="Book your first 1:1 session with an expert above." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sessions.map((s) => {
              const other = s.receiver || s.expert || {};
              const status = String(s.status || "").toUpperCase();
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 14, padding: "14px 18px" }}>
                  <Avatar src={other.profile_image} name={other.name || "E"} size={44} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14.5 }}>{other.name || "Expert"}</div>
                    <div style={{ color: colors.user.subHeading, fontSize: 12.5 }}>
                      Video · {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {s.duration > 0 && <Badge color={colors.user.accent} bg="rgba(189,194,255,0.1)">{s.duration} min</Badge>}
                    {s.amount > 0 && <Badge color="#F0C040" bg="rgba(240,192,64,0.1)">{formatCurrency(s.amount)}</Badge>}
                    <Badge color={STATUS_COLORS[status] || "#9CA3AF"}>{status || "—"}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}