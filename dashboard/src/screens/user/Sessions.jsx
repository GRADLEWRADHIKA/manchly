import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { Avatar, FullLoader, GradientButton, EmptyState, Badge } from "../../components/ui";
import { formatCurrency } from "../../utils/formatters";

const CATEGORIES = ["All", "Business Consulting", "Career Guidance", "Finance & Tax", "Health & Wellness", "Astrology", "Technology", "Life Coach"];

const STATUS_COLORS = { COMPLETED: "#22C55E", ACTIVE: "#3B82F6", PENDING: "#F59E0B", MISSED: "#EF4444" };

export default function Sessions() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/sessions?role=caller&page=1&limit=30").then((r) => {
        const d = unwrap(r);
        setSessions(d?.sessions || (Array.isArray(d) ? d : []));
      }),
      apiFetch("/sessions/stats").then((r) => setStats(unwrap(r))),
      apiFetch("/sessions/products/popular?limit=20").then((r) => {
        const d = unwrap(r);
        setProducts(d?.products || (Array.isArray(d) ? d : []));
      }),
    ]).finally(() => setLoading(false));
  }, []);

  // category + search filtering happens client-side (endpoint has no filters)
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (p.is_active === false) return false;
      if (category !== "All" && !(p.categories || []).includes(category)) return false;
      if (!q) return true;
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (p.creator?.name || "").toLowerCase().includes(q)
      );
    });
  }, [products, category, search]);

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

        {/* Header Banner */}
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
            placeholder="Search by session or creator name..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14 }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
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

        {/* Creator sessions */}
        {filteredProducts.length === 0 ? (
          <EmptyState icon="🗂️" title="No sessions found" subtitle="Try a different category or search." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 34 }}>
            {filteredProducts.map((p) => {
              const price = Number(p.price) || 0;
              const creator = p.creator || {};
              const canBook = !!p.expert_id;
              return (
                <div key={p.id} style={{ background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {/* thumbnail */}
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 9",
                      position: "relative",
                      background: colors.gradients.heroWarm,
                      backgroundImage: p.thumbnail_url ? `url(${p.thumbnail_url})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {p.categories?.[0] && (
                      <span style={{ position: "absolute", top: 10, left: 10, background: "#fff", color: "#0F172A", padding: "4px 12px", borderRadius: 99, fontSize: 11.5, fontWeight: 700 }}>
                        {p.categories[0]}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{p.title}</div>
                      {p.description && (
                        <div style={{ color: colors.user.subHeading, fontSize: 12.5, marginTop: 4, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {p.description}
                        </div>
                      )}
                    </div>

                    {/* creator */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar src={creator.profile_image} name={creator.name || "C"} size={28} />
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>{creator.name || "Creator"}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.user.subHeading }}>
                      <Clock size={12} /> {p.duration || 30} min <span>· 1:1 Video</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                      <span style={{ fontWeight: 900, color: price > 0 ? colors.user.accent : "#22C55E", fontSize: 15 }}>
                        {price > 0 ? formatCurrency(price) : "Free"}
                      </span>
                      <GradientButton
                        size="sm"
                        disabled={!canBook}
                        gradient={canBook ? colors.gradients.greenButtonDark : undefined}
                        onClick={() => navigate(`/app/experts/${p.expert_id}?session=${p.id}`, { state: { product: p } })}
                      >
                        {canBook ? "Book" : "Unavailable"}
                      </GradientButton>
                    </div>
                  </div>
                </div>
              );
            })}
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