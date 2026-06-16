import React, { useEffect, useState } from "react";
import {
  Users, BookOpen, Video, BarChart3, Trash2, Wallet,
  RefreshCw, AlertCircle, Play, Loader,
} from "lucide-react";

import { API_BASE } from "./api";

const T = {
  bg: "#000000",
  card: "#111111",
  cardHigh: "#161616",
  sidebar: "#0A0A0A",
  orange: "#FFC107",
  orangeL: "rgba(255,193,7,0.12)",
  green: "#22C55E",
  greenL: "rgba(34,197,94,0.12)",
  red: "#EF4444",
  redL: "rgba(239,68,68,0.12)",
  blue: "#3B82F6",
  blueL: "rgba(59,130,246,0.12)",
  purple: "#A855F7",
  purpleL: "rgba(168,85,247,0.12)",
  border: "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,193,7,0.4)",
  textPri: "#FFFFFF",
  textSec: "#A1A1AA",
  textMut: "#71717A",
};

const getToken = () =>
  (typeof window !== "undefined"
    && (localStorage.getItem("manchly_token") || localStorage.getItem("token")))
  || "";

async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || `Error ${res.status}`);
  return data;
}

const API = {
  stats:           ()    => apiCall("GET",  "/admin/stats"),
  users:           ()    => apiCall("GET",  "/admin/users"),
  courses:         ()    => apiCall("GET",  "/admin/courses"),
  webinars:        ()    => apiCall("GET",  "/admin/webinars"),
  deleteUser:      (id)  => apiCall("DELETE", `/admin/users/${id}`),
  allSettlements:  ()    => apiCall("GET",  "/settlements/admin/all"),
  triggerSettlements: () => apiCall("POST", "/settlements/admin/trigger"),
  retrySettlement: (id)  => apiCall("POST", `/settlements/admin/retry/${id}`),
};

export default function AdminPanel() {
  const [tab, setTab] = useState("overview");

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.textPri,
      padding: 30, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 38, fontWeight: 900, marginBottom: 6 }}>
          Admin Panel
        </h1>
        <p style={{ color: T.textSec }}>
          Platform-wide oversight · users · content · settlements
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
        <TabBtn label="Overview"    icon={BarChart3} active={tab === "overview"}    onClick={() => setTab("overview")}/>
        <TabBtn label="Users"       icon={Users}     active={tab === "users"}       onClick={() => setTab("users")}/>
        <TabBtn label="Courses"     icon={BookOpen}  active={tab === "courses"}     onClick={() => setTab("courses")}/>
        <TabBtn label="Webinars"    icon={Video}     active={tab === "webinars"}    onClick={() => setTab("webinars")}/>
        <TabBtn label="Settlements" icon={Wallet}    active={tab === "settlements"} onClick={() => setTab("settlements")}/>
      </div>

      {tab === "overview"    && <Overview />}
      {tab === "users"       && <UsersTab />}
      {tab === "courses"     && <ContentTab kind="courses" />}
      {tab === "webinars"    && <ContentTab kind="webinars" />}
      {tab === "settlements" && <SettlementsTab />}
    </div>
  );
}

function TabBtn({ label, icon: Icon, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ background: active ? T.orange : T.card,
        color: active ? "#000" : T.textPri,
        border: `1px solid ${active ? T.orange : T.border}`,
        padding: "11px 18px", borderRadius: 12, cursor: "pointer",
        fontWeight: 700, fontSize: 13, display: "inline-flex",
        alignItems: "center", gap: 8 }}>
      <Icon size={14}/> {label}
    </button>
  );
}

/* ─── OVERVIEW ───────────────────────────────────────────── */

function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await API.stats();
      setStats(data?.stats || data?.data || data);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Centered text="Loading platform stats…" />;
  if (error)   return <ErrorBanner msg={error} onRetry={load} />;

  const cards = [
    { label: "Total Users",     value: stats?.total_users     ?? "—", icon: Users,     color: T.orange },
    { label: "Total Courses",   value: stats?.total_courses   ?? "—", icon: BookOpen,  color: T.purple },
    { label: "Total Webinars",  value: stats?.total_webinars  ?? "—", icon: Video,     color: T.blue   },
    { label: "Total Revenue",   value: stats?.total_revenue != null
        ? `₹${Number(stats.total_revenue).toLocaleString("en-IN")}` : "—",
      icon: Wallet, color: T.green  },
    { label: "Active Creators", value: stats?.active_creators ?? "—", icon: Users,     color: T.orange },
    { label: "Pending KYC",     value: stats?.pending_kyc     ?? "—", icon: AlertCircle, color: T.red },
  ];

  return (
    <div style={{ display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 14 }}>
              <Icon size={22} color={c.color}/>
              <div style={{ background: `${c.color}1f`, width: 36, height: 36,
                borderRadius: 10 }}/>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>
              {c.value}
            </div>
            <div style={{ color: T.textSec, marginTop: 4, fontSize: 13 }}>
              {c.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── USERS ──────────────────────────────────────────────── */

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await API.users();
      const list = data?.users || data?.data || (Array.isArray(data) ? data : []);
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (u) => {
    if (!confirm(`Delete user ${u.email || u.name}? This is permanent.`)) return;
    setDeleting(u.id);
    try {
      await API.deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) { alert(err.message); }
    finally { setDeleting(null); }
  };

  const filtered = users.filter((u) =>
    !search ||
    String(u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    String(u.name || "").toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Centered text="Loading users…" />;
  if (error)   return <ErrorBanner msg={error} onRetry={load} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14, gap: 12 }}>
        <input placeholder="Search by name or email…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`,
            padding: "10px 14px", borderRadius: 10, color: T.textPri,
            outline: "none", fontSize: 13 }}/>
        <button onClick={load}
          style={{ background: T.card, color: T.textPri, border: `1px solid ${T.border}`,
            padding: "10px 14px", borderRadius: 10, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: T.sidebar }}>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Role</Th>
              <Th>KYC</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: 30, textAlign: "center",
                color: T.textSec }}>No users.</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} style={{ borderTop: `1px solid ${T.border}` }}>
                <Td>{u.name}</Td>
                <Td><span style={{ color: T.textSec }}>{u.email}</span></Td>
                <Td>{u.phone || u.phone_number || "—"}</Td>
                <Td>
                  {Array.isArray(u.user_type) ? u.user_type.join(", ") : u.user_type}
                </Td>
                <Td>
                  <span style={{ background: u.kyc_verified ? T.greenL : T.redL,
                    color: u.kyc_verified ? T.green : T.red,
                    padding: "2px 8px", borderRadius: 20, fontSize: 11,
                    fontWeight: 700 }}>
                    {u.kyc_verified ? "Verified" : "Pending"}
                  </span>
                </Td>
                <Td>
                  <button onClick={() => handleDelete(u)}
                    disabled={deleting === u.id}
                    style={{ background: T.redL, color: T.red, border: "none",
                      padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                      fontSize: 11, fontWeight: 700,
                      display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {deleting === u.id ? <Loader size={11} className="spin"/> : <Trash2 size={11}/>}
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th style={{ padding: "12px 14px", textAlign: "left",
    fontSize: 11, color: T.textMut, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: 1 }}>{children}</th>;
}
function Td({ children }) {
  return <td style={{ padding: "12px 14px", color: T.textPri }}>{children}</td>;
}

/* ─── COURSES / WEBINARS ─────────────────────────────────── */

function ContentTab({ kind }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await (kind === "courses" ? API.courses() : API.webinars());
      const list = data?.[kind] || data?.data || (Array.isArray(data) ? data : []);
      setItems(Array.isArray(list) ? list : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [kind]);

  if (loading) return <Centered text={`Loading ${kind}…`} />;
  if (error)   return <ErrorBanner msg={error} onRetry={load} />;

  return (
    <div>
      <div style={{ marginBottom: 14, color: T.textSec, fontSize: 13 }}>
        Showing <strong style={{ color: T.orange }}>{items.length}</strong> {kind}
      </div>
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        {items.map((item) => (
          <div key={item.id} style={{ background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 11, color: T.textMut }}>
                  by {item.creator?.name || item.creator?.email || "—"}
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: T.orange }}>
                ₹{Number(item.price || 0).toLocaleString("en-IN")}
              </div>
            </div>
            {item.status && (
              <span style={{ background: item.status === "PUBLISHED" ? T.greenL : T.orangeL,
                color: item.status === "PUBLISHED" ? T.green : T.orange,
                padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                {item.status}
              </span>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 30,
            color: T.textSec }}>
            No {kind} found.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SETTLEMENTS ────────────────────────────────────────── */

function SettlementsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [triggering, setTriggering] = useState(false);
  const [retrying, setRetrying] = useState(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await API.allSettlements();
      const list = data?.settlements || data?.data || (Array.isArray(data) ? data : []);
      setItems(Array.isArray(list) ? list : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleTrigger = async () => {
    if (!confirm("Trigger T+2 settlement run for all eligible creators?")) return;
    setTriggering(true);
    try {
      const data = await API.triggerSettlements();
      alert(`Triggered: ${data?.data?.processed ?? data?.processed ?? "?"} settlements queued.`);
      load();
    } catch (err) {
      alert(err.message);
    } finally { setTriggering(false); }
  };

  const handleRetry = async (id) => {
    setRetrying(id);
    try {
      await API.retrySettlement(id);
      load();
    } catch (err) { alert(err.message); }
    finally { setRetrying(null); }
  };

  if (loading) return <Centered text="Loading settlements…" />;
  if (error)   return <ErrorBanner msg={error} onRetry={load} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14, gap: 12 }}>
        <div style={{ color: T.textSec, fontSize: 13 }}>
          Showing <strong style={{ color: T.orange }}>{items.length}</strong> settlements
        </div>
        <button onClick={handleTrigger} disabled={triggering}
          style={{ background: T.orange, color: "#000", border: "none",
            padding: "10px 18px", borderRadius: 12, fontWeight: 700,
            cursor: triggering ? "not-allowed" : "pointer",
            opacity: triggering ? 0.6 : 1,
            display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Play size={13}/> {triggering ? "Triggering…" : "Trigger T+2 settlement"}
        </button>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: T.sidebar }}>
            <tr>
              <Th>Ref</Th>
              <Th>Creator</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: 30, textAlign: "center",
                color: T.textSec }}>No settlements.</td></tr>
            ) : items.map((s) => (
              <tr key={s.id} style={{ borderTop: `1px solid ${T.border}` }}>
                <Td>
                  <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                    {String(s.reference_id || s.id).slice(0, 14)}…
                  </span>
                </Td>
                <Td>{s.creator?.name || s.creator?.email || s.creator_id?.slice(0, 8) || "—"}</Td>
                <Td>
                  <span style={{ color: T.orange, fontWeight: 700 }}>
                    ₹{Number(s.amount || 0).toLocaleString("en-IN")}
                  </span>
                </Td>
                <Td>
                  <span style={{ background:
                      s.status === "SUCCESS" ? T.greenL :
                      s.status === "FAILED"  ? T.redL : T.orangeL,
                    color:
                      s.status === "SUCCESS" ? T.green :
                      s.status === "FAILED"  ? T.red : T.orange,
                    padding: "2px 8px", borderRadius: 20, fontSize: 11,
                    fontWeight: 700 }}>
                    {s.status}
                  </span>
                </Td>
                <Td>
                  {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                </Td>
                <Td>
                  {s.status === "FAILED" && (
                    <button onClick={() => handleRetry(s.id)}
                      disabled={retrying === s.id}
                      style={{ background: T.orangeL, color: T.orange,
                        border: "none", padding: "5px 10px", borderRadius: 8,
                        cursor: "pointer", fontSize: 11, fontWeight: 700,
                        display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {retrying === s.id ? <Loader size={11} className="spin"/> : <RefreshCw size={11}/>}
                      Retry
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

/* ─── SHARED ──────────────────────────────────────────────── */

function Centered({ text }) {
  return (
    <div style={{ background: T.card, border: `1px dashed ${T.border}`,
      borderRadius: 14, padding: 50, textAlign: "center", color: T.textSec,
      fontSize: 13 }}>
      {text}
    </div>
  );
}

function ErrorBanner({ msg, onRetry }) {
  return (
    <div style={{ background: T.redL, border: `1px solid ${T.red}`,
      color: T.red, borderRadius: 12, padding: "12px 16px",
      display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>⚠️ {msg}</span>
      {onRetry && (
        <button onClick={onRetry}
          style={{ background: "transparent", border: `1px solid ${T.red}`,
            color: T.red, padding: "5px 12px", borderRadius: 8,
            cursor: "pointer", fontSize: 12 }}>
          Retry
        </button>
      )}
    </div>
  );
}
