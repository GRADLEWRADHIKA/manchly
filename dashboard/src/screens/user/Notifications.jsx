import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, BellOff } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { onSocket } from "../../utils/socket";
import colors from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { FullLoader } from "../../components/ui";
import { timeAgo } from "../../utils/formatters";


const G = colors.gradients;

const TYPE_META = {
  course: { icon: "📚", color: "#3B82F6" },
  webinar: { icon: "📡", color: "#8B5CF6" },
  session: { icon: "📞", color: "#10B981" },
  sale: { icon: "💰", color: "#D69C3F" },
  expert: { icon: "🧑‍🏫", color: "#60A5FA" },
  system: { icon: "⚙️", color: "#6B7280" },
};
const TABS = ["All", "Courses", "Sessions", "Webinars", "System"];

const matchTab = (n, tab) => {
  const t = String(n.type || "").toLowerCase();
  if (tab === "All") return true;
  if (tab === "Courses") return t === "course";
  if (tab === "Sessions") return t === "session" || t === "expert";
  if (tab === "Webinars") return t === "webinar";
  return t === "system" || t === "sale";
};

export default function Notifications({ role = "user" }) {
  const navigate = useNavigate();
  const { role: authRole } = useAuth();
  const effRole = role || (authRole === "CREATOR" ? "creator" : "user");
  const dark = effRole === "user";
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("All");
  const [loading, setLoading] = useState(true);

  const load = () =>
    apiFetch(`/notifications/${effRole}`)
      .then((r) => {
        const d = unwrap(r);
        setItems(d?.notifications || (Array.isArray(d) ? d : []));
      })
      .catch(() => {});

  useEffect(() => {
    load().finally(() => setLoading(false));
    const off = onSocket("new_notification", (n) => setItems((prev) => [n, ...prev]));
    return () => {
      off();
      window.dispatchEvent(new Event("manchly:notifications-read"));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const parseData = (n) => {
    let d = n.data;
    if (typeof d === "string") { try { d = JSON.parse(d); } catch { d = {}; } }
    return d || {};
  };

  const open = async (n) => {
    const id = n.id || n._id;
    try { await apiFetch(`/notifications/${id}/read`, { method: "PUT", body: JSON.stringify({}) }); } catch { /* ignore */ }
    setItems((prev) => prev.map((x) => ((x.id || x._id) === id ? { ...x, is_read: true } : x)));
    const d = parseData(n);
    const base = effRole === "creator" ? "/creator" : "/app";
    if (d.courseId) navigate(effRole === "creator" ? "/creator/studio" : `/app/course/${d.courseId}`);
    else if (d.webinarId) navigate(effRole === "creator" ? "/creator/webinars" : `/app/webinar/${d.webinarId}`);
    else if (d.sessionId) navigate(`${base}/sessions`);
  };

  const markAll = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PUT", body: JSON.stringify({}) });
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
      window.dispatchEvent(new Event("manchly:notifications-read"));
    } catch { /* ignore */ }
  };

  const unreadCount = items.filter((n) => !n.is_read).length;
  const filtered = items.filter((n) => matchTab(n, tab));

  /* ---- role theme ---- */
  const T = dark
    ? {
        pageColor: colors.user.text,
        cardBg: colors.user.card,
        cardBorder: colors.user.border,
        unreadBg: "rgba(90,104,243,0.1)",
        unreadBorder: "rgba(90,104,243,0.55)",
        sub: colors.user.subHeading,
        pillOn: G.indigo,
        pillOnColor: "#FFFFFF",
        pillOff: "transparent",
        pillOffColor: colors.user.subHeading,
        pillBorder: colors.user.border,
        markColor: colors.user.accent,
        countBg: G.heroWarm,
        iconBgAlpha: "22",
      }
    : {
        pageColor: colors.typography.primaryText,
        cardBg: "#FFFFFF",
        cardBorder: colors.user.border,
        unreadBg: "#FFFBF2",
        unreadBorder: "#E2C58A",
        sub: colors.typography.secondaryText,
        pillOn: G.orange,
        pillOnColor: "#FFFFFF",
        pillOff: "#FFFFFF",
        pillOffColor: colors.typography.secondaryText,
        pillBorder: colors.user.border,
        markColor: "#B45309",
        countBg: G.orange,
        iconBgAlpha: "1A",
      };

  if (loading) return <FullLoader label="Loading notifications..." />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: dark ? colors.user.bg : "transparent", color: T.pageColor }}>
      <main style={{ flex: 1, padding: dark ? "28px 32px" : 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", color: T.pageColor, padding: dark ? 0 : 32 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: 25, fontWeight: 900, color: T.pageColor }}>Notifications</h1>
              {unreadCount > 0 && (
                <span style={{ background: T.countBg, color: "#FFFFFF", borderRadius: 99, padding: "3px 12px", fontSize: 12.5, fontWeight: 900 }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1.5px solid ${T.pillBorder}`, borderRadius: 99, padding: "7px 16px", color: T.markColor, fontWeight: 800, cursor: "pointer", fontSize: 12.5, fontFamily: "inherit" }}
              >
                <CheckCheck size={14} /> Mark all as read
              </button>
            )}
          </div>

          {/* Filter tabs with counts */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {TABS.map((t) => {
              const count = items.filter((n) => matchTab(n, t) && !n.is_read).length;
              const on = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                    border: `1.5px solid ${on ? "transparent" : T.pillBorder}`,
                    background: on ? colors.user.accent : T.pillOff,
                    color: on ? colors.user.text : T.pillOffColor,
                    boxShadow: on ? "0 4px 14px rgba(0,0,0,0.15)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {t}
                  {count > 0 && (
                    <span style={{ background: on ? "rgba(255,255,255,0.3)" : `${dark ? colors.user.accent : "#F5A623"}22`, color: on ? "#FFFFFF" : dark ? colors.user.accent : "#B45309", borderRadius: 99, padding: "1px 8px", fontSize: 11, fontWeight: 900 }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "70px 20px", background: colors.user.card, border: `1px solid ${colors.user1.Border}`, borderRadius: 18 }}>
              <BellOff size={36} color={T.sub} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 17, fontWeight: 900, color: T.pageColor }}>All caught up!</div>
              <div style={{ color: T.sub, fontSize: 13.5, marginTop: 5 }}>
                {tab === "All" ? "New sales, bookings and updates will appear here." : `No ${tab.toLowerCase()} notifications.`}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((n) => {
                const meta = TYPE_META[String(n.type || "system").toLowerCase()] || TYPE_META.system;
                const d = parseData(n);
                const action = d.courseId ? "View Course" : d.webinarId ? "View Webinar" : d.sessionId ? "View Session" : null;
                const unread = !n.is_read;
                return (
                  <div
                    key={n.id || n._id}
                    onClick={() => open(n)}
                    className="mn-lift"
                    style={{
                      display: "flex", gap: 14, alignItems: "flex-start",
                      background: unread ? T.unreadBg : T.cardBg,
                      border: `1px solid ${unread ? T.unreadBorder : T.cardBorder}`,
                      borderLeft: `4px solid ${unread ? meta.color : "transparent"}`,
                      borderRadius: 14, padding: "15px 18px", cursor: "pointer",
                    }}
                  >
                    <span style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: `${meta.color}${T.iconBgAlpha}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>
                      {meta.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                        <span style={{ fontWeight: unread ? 900 : 700, fontSize: 14.5, display: "flex", alignItems: "center", gap: 8, color: T.pageColor }}>
                          {n.title}
                          {unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />}
                        </span>
                        <span style={{ color: T.sub, fontSize: 11.5, whiteSpace: "nowrap", fontWeight: 600 }}>{timeAgo(n.createdAt || n.created_at)}</span>
                      </div>
                      <div style={{ color: T.sub, fontSize: 13.5, marginTop: 4, lineHeight: 1.55 }}>{n.message}</div>
                      {action && (
                        <span style={{ display: "inline-block", marginTop: 9, color: meta.color, fontWeight: 800, fontSize: 12.5 }}>
                          {action} →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}