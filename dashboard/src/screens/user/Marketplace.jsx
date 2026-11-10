// Brand Marketplace — creator discovery for BRAND/AGENCY accounts.
// Freemium: 5 free profile views then paywall; contact gated for >10k-follower
// creators unless premium. Premium upgrade via Cashfree subscriptions.
import React, { useEffect, useRef, useState } from "react";
import { Search, Lock, BadgeCheck, AtSign, MessageCircle } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { openCheckout, pollVerify } from "../../utils/payments";
import colors from "../../utils/colors";
import { useAuth, canAccessMarketplace } from "../../context/AuthContext";
import { Avatar, GradientButton, Modal, EmptyState, FullLoader, Badge } from "../../components/ui";
import { toast } from "../../utils/toast";

const NICHES = ["All", "Finance", "AI", "Beauty", "Fitness", "SaaS"];
const HIGH_FOLLOWERS = 10000;

const fmt = (n) => {
  const v = Number(n) || 0;
  if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
};

export default function Marketplace() {
  const { user } = useAuth();
  const [creators, setCreators] = useState([]);
  const [niche, setNiche] = useState("All");
  const [sebiOnly, setSebiOnly] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [drawer, setDrawer] = useState(null); // full profile
  const debounce = useRef(null);

  const load = (n = niche, s = sebiOnly, query = q) => {
    const params = new URLSearchParams();
    if (n && n !== "All") params.set("niche", n);
    if (s) params.set("sebiOnly", "true");
    if (query) params.set("q", query);
    return apiFetch(`/api/marketplace/creators?${params}`)
      .then((r) => {
        const d = unwrap(r);
        setCreators(d?.creators || (Array.isArray(d) ? d : []));
      })
      .catch((e) => {
        setCreators([]);
        if (e.status === 401 || e.status === 403) toast.error("Marketplace access requires a Brand/Agency account");
      });
  };

  useEffect(() => {
    Promise.allSettled([
      load(),
      apiFetch("/subscriptions/me").then((r) => {
        const d = unwrap(r);
        setPremium(!!(d?.is_premium || d?.premium || d?.active));
      }),
    ]).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearch = (v) => {
    setQ(v);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(niche, sebiOnly, v), 300);
  };

  const inspect = async (c) => {
    try {
      const view = unwrap(await apiFetch(`/api/marketplace/creators/${c.id}/view`, { method: "POST", body: JSON.stringify({}) }));
      if (view?.limitReached && !premium) {
        setPaywall(true);
        return;
      }
      const full = unwrap(await apiFetch(`/api/marketplace/creators/${c.id}`));
      setDrawer(full?.creator || full || c);
    } catch (e) {
      if (e.status === 403) setPaywall(true);
      else toast.error(e.message);
    }
  };

  const contact = async (c, channel) => {
    const followers = Number(c.followers) || 0;
    if (followers > HIGH_FOLLOWERS && !premium) {
      setPaywall(true);
      return;
    }
    try {
      const info = unwrap(await apiFetch(`/api/marketplace/creators/${c.id}/contact`));
      if (channel === "whatsapp" && info?.phone) {
        const msg = encodeURIComponent(`Hi ${c.name}! We found your profile on Manchly Marketplace and would love to discuss a campaign collaboration.`);
        window.open(`https://wa.me/${String(info.phone).replace(/\D/g, "")}?text=${msg}`, "_blank");
      } else if (channel === "instagram" && info?.instagram) {
        window.open(`https://instagram.com/${String(info.instagram).replace("@", "")}`, "_blank");
      } else toast.info("Contact info not available");
    } catch (e) {
      if (e.status === 403) setPaywall(true);
      else toast.error(e.message);
    }
  };

  const upgrade = async () => {
    try {
      const res = unwrap(await apiFetch("/subscriptions/checkout", { method: "POST", body: JSON.stringify({ plan: "premium" }) }));
      const cf = res?.cashfree_order || res;
      if (cf?.payment_session_id) {
        await openCheckout({ payment_session_id: cf.payment_session_id, env: res?.cashfree_env });
        await pollVerify("/subscriptions/verify", { order_id: cf.order_id, payment_session_id: cf.payment_session_id });
      }
      setPremium(true);
      setPaywall(false);
      toast.success("Welcome to Premium ⭐");
    } catch (e) {
      toast.error(e.message || "Upgrade failed");
    }
  };

  if (!canAccessMarketplace(user)) {
    return <EmptyState icon="🔒" title="Marketplace is for Brands & Agencies" subtitle="Sign up with a Brand or Agency account to discover creators." />;
  }
  if (loading) return <FullLoader label="Loading marketplace..." />;

  return (
    <div>
      <div style={{ background: colors.gradients.heroDusk, borderRadius: 18, padding: "24px 26px", marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Creator Marketplace</h1>
        <p style={{ margin: "6px 0 0", opacity: 0.8, fontSize: 14 }}>Discover and contact influencers for your next campaign {premium && <Badge color="#F0C040">⭐ Premium</Badge>}</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 12, padding: "10px 14px", flex: 1, minWidth: 240 }}>
          <Search size={16} color={colors.user.subHeading} />
          <input value={q} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name, niche or city..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14 }} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: colors.user.subHeading, cursor: "pointer" }}>
          <input type="checkbox" checked={sebiOnly} onChange={(e) => { setSebiOnly(e.target.checked); load(niche, e.target.checked, q); }} />
          SEBI Registered only
        </label>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {NICHES.map((n) => (
          <button key={n} onClick={() => { setNiche(n); load(n, sebiOnly, q); }} style={{ padding: "7px 18px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: `1px solid ${niche === n ? "transparent" : colors.user.border}`, background: niche === n ? colors.gradients.indigo : "transparent", color: niche === n ? "#fff" : colors.user.subHeading }}>
            {n}
          </button>
        ))}
      </div>

      {creators.length === 0 ? (
        <EmptyState icon="🧲" title="No creators found" subtitle="Try different filters." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {creators.map((c) => {
            const locked = (Number(c.followers) || 0) > HIGH_FOLLOWERS && !premium;
            return (
              <div key={c.id} style={{ background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 16, padding: 18 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }} onClick={() => inspect(c)}>
                  <Avatar name={c.name || "C"} src={c.avatar || c.profile_image} size={52} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15.5, display: "flex", alignItems: "center", gap: 6 }}>
                      {c.name}
                      {(c.sebiRegistered || c.sebi_registered) && <BadgeCheck size={15} color="#22C55E" title="SEBI Registered" />}
                    </div>
                    <div style={{ color: colors.user.subHeading, fontSize: 12.5 }}>{c.niche} · {c.city}</div>
                  </div>
                </div>
                {c.bio && <p style={{ margin: "12px 0 0", fontSize: 13, color: "rgba(255,255,255,0.72)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.bio}</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  {[[fmt(c.followers), "Followers"], [`${c.engagementRate ?? c.engagement_rate ?? 0}%`, "Engagement"], [fmt(c.avgViews ?? c.avg_views), "Avg Views"]].map(([v, l]) => (
                    <div key={l} style={{ flex: 1, background: colors.user.cardSoft, borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontWeight: 900, fontSize: 14 }}>{v}</div>
                      <div style={{ fontSize: 10, color: colors.user.subHeading, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <GradientButton size="sm" full gradient={colors.gradients.teal} onClick={() => contact(c, "whatsapp")}>
                    {locked ? <Lock size={13} /> : <MessageCircle size={13} />} WhatsApp
                  </GradientButton>
                  <GradientButton size="sm" full gradient={colors.gradients.purple} onClick={() => contact(c, "instagram")}>
                    {locked ? <Lock size={13} /> : <AtSign size={13} />} Instagram
                  </GradientButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile drawer */}
      <Modal open={!!drawer} onClose={() => setDrawer(null)} title={drawer?.name || "Creator"} dark width={560}>
        {drawer && (
          <div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <Avatar name={drawer.name || "C"} src={drawer.avatar} size={60} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 17 }}>{drawer.name} {(drawer.sebiRegistered || drawer.sebi_registered) && <BadgeCheck size={15} color="#22C55E" />}</div>
                <div style={{ color: colors.user.subHeading, fontSize: 13 }}>{drawer.niche} · {drawer.city}</div>
              </div>
            </div>
            {drawer.bio && <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>{drawer.bio}</p>}
            {Array.isArray(drawer.audience) && drawer.audience.length > 0 && (
              <>
                <h4 style={{ margin: "16px 0 8px", fontSize: 14, fontWeight: 800 }}>Target Audience Demographics</h4>
                {drawer.audience.map((a, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: colors.user.subHeading }}>{a.segment || a.label || a.range}</span><span style={{ fontWeight: 700 }}>{a.percent || a.value}%</span>
                  </div>
                ))}
              </>
            )}
            {Array.isArray(drawer.packages) && drawer.packages.length > 0 && (
              <>
                <h4 style={{ margin: "16px 0 8px", fontSize: 14, fontWeight: 800 }}>Commercial Rate Packages</h4>
                {drawer.packages.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: colors.user.subHeading }}>{p.name || p.title}</span><span style={{ fontWeight: 700 }}>₹{Number(p.price || p.rate || 0).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Paywall */}
      <Modal open={paywall} onClose={() => setPaywall(false)} title="Upgrade to Premium" dark width={440}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 40 }}>⭐</div>
          <p style={{ color: colors.user.subHeading, fontSize: 13.5, margin: "6px 0 0" }}>You've used your 5 free profile views</p>
        </div>
        {["Unlimited creator profile views", "Contact high-reach creators (10k+ followers)", "Full audience demographics & rate cards", "Priority support"].map((b) => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 13.5 }}>
            <span style={{ color: "#22C55E", fontWeight: 900 }}>✓</span> {b}
          </div>
        ))}
        <GradientButton full size="lg" gradient={colors.gradients.gold} onClick={upgrade} style={{ marginTop: 14 }}>
          Upgrade to Premium
        </GradientButton>
      </Modal>
    </div>
  );
}
