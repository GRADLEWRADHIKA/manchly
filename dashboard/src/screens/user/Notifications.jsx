// Notifications — filter tabs, unread styling, mark one/all read, realtime
// prepend via socket, deep-link actions (course/webinar/session).
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, unwrap } from "../../utils/api";
import { onSocket } from "../../utils/socket";
import colors from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { FullLoader, EmptyState, GradientButton } from "../../components/ui";
import { timeAgo } from "../../utils/formatters";

const TYPE_META = {
  course: { icon: "📚", color: "#3B82F6" },
  webinar: { icon: "📡", color: "#8B5CF6" },
  session: { icon: "📞", color: "#10B981" },
  sale: { icon: "💰", color: "#F0C040" },
  expert: { icon: "🧑‍🏫", color: "#60A5FA" },
  system: { icon: "⚙️", color: "#9CA3AF" },
};
const TABS = ["All", "Courses", "Sessions", "Webinars", "System"];

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
    if (d.courseId) navigate(`${effRole === "creator" ? "/creator/courses" : `/app/course/${d.courseId}`}`);
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

  const filtered = tab === "All" ? items : items.filter((n) => {
    const t = String(n.type || "").toLowerCase();
    if (tab === "Courses") return t === "course";
    if (tab === "Sessions") return t === "session" || t === "expert";
    if (tab === "Webinars") return t === "webinar";
    return t === "system" || t === "sale";
  });

  if (loading) return <FullLoader label="Loading notifications..." />;

  const cardBg = dark ? colors.user.card : "#fff";
  const border = dark ? colors.user.border : colors.base.border;
  const subColor = dark ? colors.user.subHeading : colors.typography.secondaryText;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", color: dark ? "#fff" : colors.typography.primaryText, padding: dark ? 0 : 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Notifications</h1>
        <button onClick={markAll} style={{ background: "transparent", border: "none", color: dark ? colors.user.accentSoft : colors.brand.actionBlue, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
          Mark all as read
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: `1px solid ${tab === t ? "transparent" : border}`, background: tab === t ? colors.gradients.indigo : "transparent", color: tab === t ? "#fff" : subColor }}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications" subtitle="You're all caught up!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((n) => {
            const meta = TYPE_META[String(n.type || "system").toLowerCase()] || TYPE_META.system;
            const d = parseData(n);
            const action = d.courseId ? "View Course" : d.webinarId ? "Join Webinar" : d.sessionId ? "View Session" : null;
            return (
              <div
                key={n.id || n._id}
                onClick={() => open(n)}
                style={{ display: "flex", gap: 14, background: cardBg, border: `1px solid ${border}`, borderLeft: `4px solid ${meta.color}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", opacity: n.is_read ? 0.72 : 1 }}
              >
                <span style={{ fontSize: 22 }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontWeight: n.is_read ? 600 : 900, fontSize: 14.5 }}>{n.title}</span>
                    <span style={{ color: subColor, fontSize: 11.5, whiteSpace: "nowrap" }}>{timeAgo(n.createdAt || n.created_at)}</span>
                  </div>
                  <div style={{ color: subColor, fontSize: 13, marginTop: 4 }}>{n.message}</div>
                  {action && <div style={{ marginTop: 8 }}><GradientButton size="sm">{action}</GradientButton></div>}
                </div>
                {!n.is_read && <span style={{ width: 9, height: 9, borderRadius: "50%", background: meta.color, marginTop: 6, flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
