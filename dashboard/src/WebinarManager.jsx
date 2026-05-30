import React, { useEffect, useState } from "react";

const API_BASE = "https://server.manchly.com";

const getToken = () => {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("manchly_token");
  return t && t.trim().length > 0 ? t.trim() : null;
};

async function apiCall(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.error?.message || data?.message || `Error ${res.status}`
    );
  }
  return data;
}

const CATEGORIES = [
  "Trading", "Business", "Marketing",
  "Finance", "Design", "Tech", "General",
];
const TIMEZONES = ["Asia/Kolkata", "UTC", "America/New_York"];

export default function WebinarManager() {
  const B = {
    bg:      "#000000",
    card:    "#111111",
    sidebar: "#0A0A0A",
    orange:  "#FFC107",
    orangeD: "#FFB300",
    border:  "rgba(255,255,255,0.1)",
    textSec: "#A1A1AA",
    textMut: "#71717A",
    green:   "#22C55E",
    red:     "#EF4444",
  };

  const [loading,    setLoading]    = useState(false);
  const [webinars,   setWebinars]   = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  const [form, setForm] = useState({
    title:       "",
    description: "",
    date:        "",       // combined with time → scheduled_at
    time:        "",
    price:       "",
    duration:    60,
    timezone:    "Asia/Kolkata",
    category:    "General",
  });

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // ─────────────────────────────────────────────────────
  // FETCH WEBINARS
  // ─────────────────────────────────────────────────────
  const fetchWebinars = async () => {
  try {
    setLoading(true);
    setError("");

    const data = await apiCall(
      "/webinars"
    );

    console.log(
      "WEBINARS:",
      data
    );

    setWebinars(
      Array.isArray(data?.data)
        ? data.data
        : []
    );
  } catch (err) {
    console.error(
      "[WebinarManager] fetch:",
      err.message
    );

    setError(err.message);
    setWebinars([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchWebinars(); }, []);

  // ─────────────────────────────────────────────────────
  // CREATE WEBINAR
  // Payload matches Postman schema exactly:
  // { title, description, price, scheduled_at,
  //   duration, timezone, category }
  // ─────────────────────────────────────────────────────
  const createWebinar = async () => {
    setError("");
    setSuccess("");

    if (!form.title.trim())       { setError("Title is required.");       return; }
    if (!form.date || !form.time) { setError("Date and time are required."); return; }
    if (form.price === "")        { setError("Price is required (0 for free)."); return; }

    try {
      setLoading(true);

      // Combine date + time fields → ISO 8601 scheduled_at
      const scheduled_at = new Date(
        `${form.date}T${form.time}:00`
      ).toISOString();

      // ── Exact Postman schema ──────────────────────────
      const payload = {
        title:        form.title.trim(),
        description:  form.description.trim(),
        price:        Number(form.price),
        scheduled_at,
        duration:     Number(form.duration),
        timezone:     form.timezone,
        category:     form.category,
      };

      const response = await apiCall("/webinars", {
        method: "POST",
        body:   JSON.stringify(payload),
      });

      if (response.success || response.webinar || response.data) {
        setSuccess("Webinar created successfully!");
        setShowCreate(false);
        setForm({
          title: "", description: "", date: "", time: "",
          price: "", duration: 60, timezone: "Asia/Kolkata", category: "General",
        });
        fetchWebinars();
      } else {
        throw new Error(response.message || "Failed to create webinar");
      }
    } catch (err) {
      console.error("[WebinarManager] create:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // BUG 5 FIX — helper to display scheduled_at correctly.
  // Cards were reading webinar.date / webinar.time which
  // don't exist on the API response. scheduled_at is an
  // ISO string — format it for human display.
  // ─────────────────────────────────────────────────────
  const formatScheduled = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      const date = d.toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      });
      const time = d.toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit",
      });
      return `${date} · ${time}`;
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ background: B.bg, minHeight: "100vh", color: "white",
      fontFamily: "system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: B.orange, margin: 0 }}>Webinar Manager</h1>
          <p style={{ color: B.textSec, marginTop: 8 }}>Manage your webinars</p>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setError(""); setSuccess(""); }}
          style={{ background: B.orange, color: "#000", border: "none",
            padding: "12px 20px", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>
          {showCreate ? "Close" : "Create Webinar"}
        </button>
      </div>

      {/* ── ALERTS ── */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
          color: B.red, padding: "12px 16px", borderRadius: 12, marginBottom: 16,
          fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)",
          color: B.green, padding: "12px 16px", borderRadius: 12, marginBottom: 16,
          fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}>
          ✅ {success}
        </div>
      )}

      {/* ── CREATE FORM ── */}
      {showCreate && (
        <div style={{ background: B.card, border: `1px solid ${B.border}`,
          borderRadius: 20, padding: 24, marginBottom: 24 }}>

          {/* API badge */}
          <p style={{ fontSize: 10.5, color: B.textMut, fontFamily: "monospace",
            marginBottom: 18 }}>
            POST /webinars · schema: title, description, price, scheduled_at, duration, timezone, category
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Title — full width */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle(B)}>Title <span style={{ color: B.red }}>*</span></label>
              <input placeholder="e.g. Live Options Trading Masterclass"
                value={form.title} onChange={set("title")} style={inputStyle(B)}/>
            </div>

            {/* Description — full width */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle(B)}>Description</label>
              <textarea placeholder="What will attendees learn?" rows={3}
                value={form.description} onChange={set("description")}
                style={{ ...inputStyle(B), resize: "vertical" }}/>
            </div>

            {/* Date */}
            <div>
              <label style={labelStyle(B)}>Date <span style={{ color: B.red }}>*</span></label>
              <input type="date" value={form.date} onChange={set("date")} style={inputStyle(B)}/>
            </div>

            {/* Time */}
            <div>
              <label style={labelStyle(B)}>Time <span style={{ color: B.red }}>*</span></label>
              <input type="time" value={form.time} onChange={set("time")} style={inputStyle(B)}/>
              {form.date && form.time && (
                <p style={{ fontSize: 10.5, color: B.textMut, marginTop: 4, fontFamily: "monospace" }}>
                  scheduled_at: {new Date(`${form.date}T${form.time}:00`).toISOString()}
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label style={labelStyle(B)}>Price (₹) <span style={{ color: B.red }}>*</span></label>
              <input type="number" placeholder="499  (0 for free)"
                value={form.price} onChange={set("price")} style={inputStyle(B)}/>
            </div>

            {/* Duration */}
            <div>
              <label style={labelStyle(B)}>Duration (minutes)</label>
              <input type="number" placeholder="60"
                value={form.duration} onChange={set("duration")} style={inputStyle(B)}/>
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle(B)}>Category</label>
              <select value={form.category} onChange={set("category")} style={inputStyle(B)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label style={labelStyle(B)}>Timezone</label>
              <select value={form.timezone} onChange={set("timezone")} style={inputStyle(B)}>
                {TIMEZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>

            {/* Submit — full width */}
            <div style={{ gridColumn: "1/-1" }}>
              <button onClick={createWebinar} disabled={loading}
                style={{ background: B.orange, color: "#000", border: "none",
                  padding: "16px", borderRadius: 12, fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer", width: "100%",
                  fontSize: 15, opacity: loading ? 0.75 : 1 }}>
                {loading ? "Creating…" : "Create Webinar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIST ── */}
      {loading && !showCreate ? (
        <div style={{ color: B.textSec, textAlign: "center", padding: 40 }}>Loading…</div>
      ) : webinars.length === 0 ? (
        <div style={{ background: B.card, border: `1px solid ${B.border}`,
          borderRadius: 20, padding: 40, textAlign: "center", color: B.textSec }}>
          No webinars yet. Create your first one!
        </div>
      ) : (
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {webinars.map((webinar) => (
            <div key={webinar.id} style={{ background: B.card,
              border: `1px solid ${B.border}`, borderRadius: 20, overflow: "hidden" }}>

              {/* Thumbnail or gradient placeholder */}
              {webinar.thumbnail_url || webinar.thumbnail ? (
                <img src={webinar.thumbnail_url || webinar.thumbnail} alt=""
                  style={{ width: "100%", height: 180, objectFit: "cover" }}/>
              ) : (
                <div style={{ width: "100%", height: 180,
                  background: "linear-gradient(135deg,#1a0f00,#3D1F00)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 40 }}>
                  🎥
                </div>
              )}

              <div style={{ padding: 20 }}>
                <h3 style={{ color: B.orange, marginBottom: 8 }}>{webinar.title}</h3>
                <p style={{ color: B.textSec, fontSize: 13, lineHeight: 1.6,
                  marginBottom: 14 }}>{webinar.description}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* BUG 5 FIX — use scheduled_at not webinar.date / webinar.time */}
                  <div style={{ fontSize: 13, color: B.textSec, display: "flex",
                    alignItems: "center", gap: 6 }}>
                    📅 {formatScheduled(webinar.scheduled_at)}
                  </div>
                  <div style={{ fontSize: 13, color: B.textSec, display: "flex",
                    alignItems: "center", gap: 6 }}>
                    ⏱ {webinar.duration || "—"} min
                  </div>
                  <div style={{ fontSize: 13, color: B.textSec, display: "flex",
                    alignItems: "center", gap: 6 }}>
                    📂 {webinar.category || "—"}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: B.orange, marginTop: 4 }}>
                    {webinar.price === 0 ? "FREE" : `₹${Number(webinar.price).toLocaleString()}`}
                  </div>
                </div>

                {/* Status badge */}
                {webinar.status && (
                  <div style={{ marginTop: 12, display: "inline-block",
                    background: webinar.status === "PUBLISHED"
                      ? "rgba(34,197,94,0.12)" : "rgba(255,193,7,0.12)",
                    color: webinar.status === "PUBLISHED" ? B.green : B.orange,
                    borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                    {webinar.status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function labelStyle(B) {
  return { display: "block", fontSize: 12, fontWeight: 600,
    color: B.textSec, marginBottom: 6 };
}

function inputStyle(B) {
  return {
    background:  B.sidebar,
    border:      `1px solid ${B.border}`,
    padding:     "14px",
    borderRadius: 12,
    color:       "white",
    outline:     "none",
    fontSize:    14,
    width:       "100%",
    boxSizing:   "border-box",
    fontFamily:  "inherit",
  };
}