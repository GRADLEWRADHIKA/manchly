import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  BellRing,
  CheckCheck,
  Check,
  RefreshCw,
  Loader2,
  ShoppingBag,
  Video,
  CalendarClock,
  GraduationCap,
  UserCheck,
  Settings as SettingsIcon,
  Inbox,
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
  border: "rgba(255,255,255,0.1)",
  textPri: "#FFFFFF",
  textSec: "#A1A1AA",
};

// type → { icon, color } so each notification reads at a glance
const TYPE_META = {
  sale: { icon: ShoppingBag, color: T.green, label: "Sale" },
  session: { icon: Video, color: T.blue, label: "Session" },
  webinar: { icon: CalendarClock, color: "#A855F7", label: "Webinar" },
  course: { icon: GraduationCap, color: T.orange, label: "Course" },
  expert: { icon: UserCheck, color: "#06B6D4", label: "Expert" },
  system: { icon: SettingsIcon, color: T.textSec, label: "System" },
};

const FILTERS = ["ALL", "SALE", "SESSION", "WEBINAR", "COURSE", "EXPERT", "SYSTEM"];

function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.floor((Date.now() - then) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Resolve which list endpoint to hit from the role. Both endpoints filter by the
// authenticated user_id on the backend, so the choice is mostly cosmetic.
function listPath(role) {
  return String(role).toUpperCase() === "CREATOR"
    ? "/notifications/creator"
    : "/notifications/user";
}

/**
 * Header bell with a live unread badge. Polls /notifications/unread-count.
 * `refreshKey` lets a parent force an immediate re-count (e.g. after mark-all-read).
 */
export function NotificationBell({ onOpen, active, refreshKey }) {
  const [count, setCount] = useState(0);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const body = await apiFetch("/notifications/unread-count");
      const data = unwrap(body) || {};
      setCount(Number(data.count || 0));
    } catch {
      /* silent — the bell shouldn't nag if the backend is down */
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 30000);
    return () => clearInterval(timer.current);
  }, [load, refreshKey]);

  const has = count > 0;
  return (
    <button
      onClick={onOpen}
      title="Notifications"
      style={{
        position: "relative",
        background: active ? T.orange : T.card,
        border: `1px solid ${active ? T.orange : T.border}`,
        color: active ? "#000" : T.textPri,
        width: 44,
        height: 44,
        borderRadius: 12,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {has ? <BellRing size={19} /> : <Bell size={19} />}
      {has && (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            background: T.red,
            color: "#fff",
            fontSize: 10.5,
            fontWeight: 800,
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${T.bg}`,
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export default function NotificationsPanel({ role = "USER", onChanged }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const base = listPath(role);

  const fetchPage = useCallback(
    async (pageNum, type) => {
      const qs = new URLSearchParams({ page: String(pageNum) });
      if (type && type !== "ALL") qs.set("type", type);
      const body = await apiFetch(`${base}?${qs.toString()}`);
      const arr = unwrap(body);
      return Array.isArray(arr) ? arr : [];
    },
    [base]
  );

  const load = useCallback(
    async (type = filter) => {
      setLoading(true);
      setError("");
      try {
        const arr = await fetchPage(1, type);
        setItems(arr);
        setPage(1);
        setHasMore(arr.length >= 20); // backend page size is 20
      } catch (e) {
        setError(e.message || "Failed to load notifications");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, filter]
  );

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const arr = await fetchPage(next, filter);
      setItems((prev) => [...prev, ...arr]);
      setPage(next);
      setHasMore(arr.length >= 20);
    } catch (e) {
      setError(e.message || "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  const markRead = async (id) => {
    setBusyId(id);
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PUT" });
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
      );
      onChanged && onChanged();
    } catch (e) {
      setError(e.message || "Failed to mark as read");
    } finally {
      setBusyId(null);
    }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await apiFetch("/notifications/read-all", { method: "PUT" });
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      onChanged && onChanged();
    } catch (e) {
      setError(e.message || "Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "rgba(255,193,7,0.12)",
              border: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={22} color={T.orange} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
              Notifications
            </h2>
            <p style={{ margin: "3px 0 0", color: T.textSec, fontSize: 13 }}>
              {unreadCount > 0
                ? `${unreadCount} unread on this page`
                : "You're all caught up"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => load(filter)}
            disabled={loading}
            style={ghostBtn}
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button
            onClick={markAll}
            disabled={markingAll}
            style={{ ...primaryBtn, opacity: markingAll ? 0.6 : 1 }}
          >
            {markingAll ? <Loader2 size={15} className="spin" /> : <CheckCheck size={15} />}
            Mark all read
          </button>
        </div>
      </div>

      {/* filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => {
          const on = filter === f;
          const meta = TYPE_META[f.toLowerCase()];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: on ? T.orange : T.card,
                color: on ? "#000" : T.textSec,
                border: `1px solid ${on ? T.orange : T.border}`,
                padding: "7px 14px",
                borderRadius: 999,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 12,
                textTransform: "capitalize",
              }}
            >
              {f === "ALL" ? "All" : meta?.label || f}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={errorBox}>⚠️ {error}</div>
      )}

      {/* list */}
      {loading ? (
        <div style={centerBox}>
          <Loader2 size={26} className="spin" color={T.orange} />
          <p style={{ color: T.textSec, marginTop: 10 }}>Loading notifications…</p>
        </div>
      ) : items.length === 0 ? (
        <div style={centerBox}>
          <Inbox size={34} color={T.textSec} />
          <p style={{ color: T.textSec, marginTop: 10, fontWeight: 600 }}>
            No notifications {filter !== "ALL" ? `for "${filter.toLowerCase()}"` : "yet"}.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.system;
            const Icon = meta.icon;
            return (
              <div
                key={n._id}
                style={{
                  display: "flex",
                  gap: 14,
                  background: n.is_read ? T.card : "rgba(255,193,7,0.06)",
                  border: `1px solid ${n.is_read ? T.border : "rgba(255,193,7,0.35)"}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: 10,
                    background: `${meta.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={19} color={meta.color} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: 14.5 }}>
                      {n.title || meta.label}
                    </span>
                    {!n.is_read && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          background: T.orange,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: T.textSec,
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {n.message}
                  </p>
                  <span style={{ fontSize: 11.5, color: "#71717A" }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => markRead(n._id)}
                    disabled={busyId === n._id}
                    title="Mark as read"
                    style={{
                      alignSelf: "center",
                      background: "transparent",
                      border: `1px solid ${T.border}`,
                      color: T.textSec,
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {busyId === n._id ? (
                      <Loader2 size={15} className="spin" />
                    ) : (
                      <Check size={15} />
                    )}
                  </button>
                )}
              </div>
            );
          })}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{ ...ghostBtn, justifyContent: "center", padding: "12px" }}
            >
              {loadingMore ? <Loader2 size={15} className="spin" /> : null}
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

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

const centerBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "60px 20px",
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 16,
};
