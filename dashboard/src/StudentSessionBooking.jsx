import React, { useEffect, useState } from "react";
import {
  Video, Mic, Calendar, Clock, Star, Search, ChevronLeft,
  CheckCircle2, Loader, Send,
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
  purple: "#A855F7",
  purpleL: "rgba(168,85,247,0.12)",
  blue: "#3B82F6",
  blueL: "rgba(59,130,246,0.12)",
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
  listExperts:        (q = "")              => apiCall("GET",  `/sessions/experts${q}`),
  getExpertDetail:    (id)                  => apiCall("GET",  `/sessions/experts/${id}`),
  getExpertAvailability: (id, date)         => apiCall("GET",  `/sessions/availability/${id}?date=${date}`),
  getBookedSlots:     (id, date)            => apiCall("GET",  `/sessions/experts/${id}/booked-slots?date=${date}`),
  bookSession:        (b)                   => apiCall("POST", "/sessions/book", b),
  verifyPayment:      (b)                   => apiCall("POST", "/sessions/verify-payment", b),
  rateSession:        (b)                   => apiCall("POST", "/sessions/rate", b),
  getMySessions:      ()                    => apiCall("GET",  "/sessions"),
};

export default function StudentSessionBooking({ currentUser }) {
  const [tab, setTab] = useState("browse");  // browse | bookings

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.textPri,
      padding: 30, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 38, fontWeight: 900, marginBottom: 6 }}>
          Book a Session
        </h1>
        <p style={{ color: T.textSec }}>
          1-on-1 calls with expert creators · pay & schedule via Manchly
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <TabBtn label="Browse Experts" active={tab === "browse"} onClick={() => setTab("browse")} />
        <TabBtn label="My Bookings"   active={tab === "bookings"} onClick={() => setTab("bookings")} />
      </div>

      {tab === "browse" ? <BrowseExperts currentUser={currentUser} /> : <MyBookings currentUser={currentUser} />}
    </div>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ background: active ? T.orange : T.card, color: active ? "#000" : T.textPri,
        border: `1px solid ${active ? T.orange : T.border}`,
        padding: "11px 20px", borderRadius: 12, cursor: "pointer",
        fontWeight: 700, fontSize: 13 }}>
      {label}
    </button>
  );
}

/* ─── BROWSE ─────────────────────────────────────────────── */

function BrowseExperts({ currentUser }) {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [activeExpert, setActiveExpert] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      const data = await API.listExperts(params.toString() ? `?${params}` : "");
      const list = data?.data?.experts || data?.experts || data?.data || [];
      setExperts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("[BrowseExperts]", err.message);
      setExperts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (activeExpert) {
    return <ExpertDetailView
      expert={activeExpert}
      onBack={() => setActiveExpert(null)}
      currentUser={currentUser}
    />;
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 14, top: "50%",
            transform: "translateY(-50%)", color: T.textMut }}/>
          <input placeholder="Search experts by name, headline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load(); }}
            style={{ width: "100%", padding: "12px 14px 12px 38px",
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 12, color: T.textPri, outline: "none",
              fontSize: 14, boxSizing: "border-box" }}/>
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); }}
          style={{ background: T.card, border: `1px solid ${T.border}`,
            color: T.textPri, padding: "12px 16px", borderRadius: 12,
            outline: "none", fontSize: 14, minWidth: 160 }}>
          <option value="">All Categories</option>
          <option value="Trading">Trading</option>
          <option value="Business">Business</option>
          <option value="Marketing">Marketing</option>
          <option value="Finance">Finance</option>
          <option value="Design">Design</option>
          <option value="Tech">Tech</option>
        </select>
        <button onClick={load}
          style={{ background: T.orange, color: "#000", border: "none",
            padding: "12px 20px", borderRadius: 12, fontWeight: 700,
            cursor: "pointer", fontSize: 13 }}>
          Search
        </button>
      </div>

      {loading ? (
        <Centered text="Loading experts from GET /sessions/experts…" />
      ) : experts.length === 0 ? (
        <Centered text="No experts found." />
      ) : (
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          {experts.map((exp) => (
            <ExpertCard key={exp.id} expert={exp} onSelect={setActiveExpert} />
          ))}
        </div>
      )}
    </>
  );
}

function ExpertCard({ expert, onSelect }) {
  const user = expert.user || {};
  const name = user.name || expert.name || "Expert";
  return (
    <div onClick={() => onSelect(expert)}
      style={{ background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: 18, cursor: "pointer",
        transition: "border-color 0.2s" }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = T.borderHi}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%",
          background: T.orangeL, display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0, fontSize: 18,
          fontWeight: 800, color: T.orange }}>
          {String(name).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.textPri }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: T.orange, marginTop: 3 }}>
            {expert.headline || expert.profession || "Expert"}
          </div>
          {expert.bio && (
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 8,
              lineHeight: 1.5 }}>
              {expert.bio.slice(0, 100)}{expert.bio.length > 100 && "…"}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 14,
        paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
        {expert.video_rate != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 4,
            fontSize: 12, color: T.blue }}>
            <Video size={12}/> ₹{expert.video_rate}/min
          </div>
        )}
        {expert.audio_rate != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 4,
            fontSize: 12, color: T.purple }}>
            <Mic size={12}/> ₹{expert.audio_rate}/min
          </div>
        )}
        {expert.avg_rating != null && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center",
            gap: 4, fontSize: 12, color: T.orange }}>
            <Star size={12}/> {expert.avg_rating}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── EXPERT DETAIL + BOOK ───────────────────────────────── */

function ExpertDetailView({ expert: expertSummary, onBack, currentUser }) {
  const [expert, setExpert] = useState(expertSummary);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [availability, setAvailability] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pickedSlot, setPickedSlot] = useState(null);
  const [bookingOrder, setBookingOrder] = useState(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await API.getExpertDetail(expertSummary.id);
        const full = data?.data || data?.expert || data;
        if (full) setExpert({ ...expertSummary, ...full });
        const prods = full?.products || data?.products || [];
        setProducts(prods);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [expertSummary.id]);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    Promise.allSettled([
      API.getExpertAvailability(expertSummary.id, date),
      API.getBookedSlots(expertSummary.id, date),
    ]).then(([avail, booked]) => {
      if (avail.status === "fulfilled") {
        const list = avail.value?.data?.slots || avail.value?.slots || avail.value?.data || [];
        setAvailability(Array.isArray(list) ? list : []);
      } else {
        setAvailability([]);
      }
      if (booked.status === "fulfilled") {
        const list = booked.value?.data?.booked_slots || booked.value?.data || booked.value?.booked_slots || [];
        setBookedSlots(Array.isArray(list) ? list : []);
      } else {
        setBookedSlots([]);
      }
    }).finally(() => setLoadingSlots(false));
  }, [date, expertSummary.id]);

  const handleBook = async () => {
    if (!pickedSlot) { setError("Pick a time slot first."); return; }
    if (!selectedProduct) { setError("Pick a product first."); return; }
    setBooking(true);
    setError("");
    try {
      const scheduled_at = new Date(`${date}T${pickedSlot.start}:00`).toISOString();
      const data = await API.bookSession({
        expert_id: expertSummary.id,
        mode: selectedProduct.type || "video",
        duration: selectedProduct.duration,
        scheduled_at,
        product_id: selectedProduct.id,
      });
      const order = data?.data || data;
      setBookingOrder({
        orderId:          order.order_id || order.cashfree_order_id,
        paymentSessionId: order.payment_session_id,
        paymentLink:      order.payment_link || (order.payment_session_id
          ? `/pay.html?session_id=${encodeURIComponent(order.payment_session_id)}&order_id=${encodeURIComponent(order.order_id || order.cashfree_order_id)}&verify_url=${encodeURIComponent("/sessions/verify-payment")}`
          : null),
        session: order.session,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const handleVerifyAfterReturn = async () => {
    if (!bookingOrder?.orderId) return;
    try {
      const data = await API.verifyPayment({ order_id: bookingOrder.orderId });
      const status = data?.data?.status || data?.status;
      if (status === "PAID" || status === "COMPLETED" || data?.success) {
        alert("✅ Booking confirmed!");
        onBack();
      } else {
        setError(`Payment status: ${status || "unknown"}`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const isBooked = (start) => bookedSlots.some((b) => b.start === start || b.start_time === start);

  if (loading) return <Centered text="Loading expert profile…" />;

  const user = expert.user || {};
  const name = user.name || expert.name || "Expert";

  return (
    <div>
      <button onClick={onBack}
        style={{ background: "transparent", border: `1px solid ${T.border}`,
          color: T.textSec, padding: "8px 14px", borderRadius: 10,
          cursor: "pointer", marginBottom: 18, display: "inline-flex",
          alignItems: "center", gap: 6 }}>
        <ChevronLeft size={14}/> Back to experts
      </button>

      <div style={{ display: "grid",
        gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>

        {/* LEFT — expert profile */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 18, padding: 22 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start",
            marginBottom: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%",
              background: T.orangeL, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 22, fontWeight: 800,
              color: T.orange, flexShrink: 0 }}>
              {String(name).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{name}</div>
              <div style={{ fontSize: 13, color: T.orange, marginTop: 4 }}>
                {expert.headline || expert.profession}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                {expert.video_rate != null && (
                  <span style={{ background: T.blueL, color: T.blue,
                    borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                    Video ₹{expert.video_rate}/min
                  </span>
                )}
                {expert.audio_rate != null && (
                  <span style={{ background: T.purpleL, color: T.purple,
                    borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                    Audio ₹{expert.audio_rate}/min
                  </span>
                )}
                {expert.avg_rating != null && (
                  <span style={{ background: T.orangeL, color: T.orange,
                    borderRadius: 8, padding: "3px 10px", fontSize: 12,
                    fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Star size={11}/> {expert.avg_rating}
                  </span>
                )}
              </div>
            </div>
          </div>
          {expert.bio && (
            <p style={{ color: T.textSec, fontSize: 13.5, lineHeight: 1.65 }}>
              {expert.bio}
            </p>
          )}

          {/* Products */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 11, color: T.textMut, textTransform: "uppercase",
              letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>
              Consulting Products ({products.length})
            </div>
            {products.length === 0 ? (
              <div style={{ background: T.sidebar, border: `1px dashed ${T.border}`,
                borderRadius: 12, padding: 22, textAlign: "center",
                color: T.textSec, fontSize: 13 }}>
                This expert has no published products yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {products.map((p) => {
                  const picked = selectedProduct?.id === p.id;
                  return (
                    <div key={p.id} onClick={() => setSelectedProduct(p)}
                      style={{ background: picked ? T.cardHigh : T.sidebar,
                        border: `1px solid ${picked ? T.borderHi : T.border}`,
                        borderRadius: 12, padding: 14, cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "flex-start", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: 11.5, color: T.textMut, marginTop: 4 }}>
                            {p.duration} min · {String(p.type || "video").toUpperCase()}
                          </div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: T.orange }}>
                          ₹{Number(p.price || 0).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — calendar + booking */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 18, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Calendar size={18} color={T.orange}/>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Pick a slot</div>
          </div>

          <input type="date" value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => { setDate(e.target.value); setPickedSlot(null); }}
            style={{ width: "100%", background: T.sidebar, border: `1px solid ${T.border}`,
              padding: "12px 14px", borderRadius: 12, color: T.textPri,
              outline: "none", fontSize: 14, boxSizing: "border-box",
              marginBottom: 14, fontFamily: "inherit" }}/>

          {loadingSlots ? (
            <div style={{ padding: 20, textAlign: "center", color: T.textSec, fontSize: 13 }}>
              <Loader size={14} style={{ animation: "spin 1s linear infinite" }}/> Loading slots…
            </div>
          ) : availability.length === 0 ? (
            <div style={{ background: T.sidebar, border: `1px dashed ${T.border}`,
              borderRadius: 12, padding: 22, textAlign: "center", color: T.textSec, fontSize: 13 }}>
              No availability on this date.
            </div>
          ) : (
            <div style={{ display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(82px,1fr))", gap: 8 }}>
              {availability.map((s) => {
                const start = s.start || s.start_time;
                const end = s.end || s.end_time;
                const taken = isBooked(start);
                const picked = pickedSlot?.start === start;
                return (
                  <button key={s.id || start} disabled={taken}
                    onClick={() => setPickedSlot({ start, end })}
                    style={{ background: picked ? T.orange : (taken ? T.redL : T.sidebar),
                      color: picked ? "#000" : (taken ? T.red : T.textPri),
                      border: `1px solid ${picked ? T.orange : T.border}`,
                      padding: "8px 10px", borderRadius: 10, fontSize: 12,
                      fontWeight: 700, cursor: taken ? "not-allowed" : "pointer",
                      textDecoration: taken ? "line-through" : "none" }}>
                    {start}
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 14, background: T.redL, border: `1px solid ${T.red}`,
              borderRadius: 10, padding: "10px 12px", color: T.red, fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Booking summary + actions */}
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, color: T.textMut, textTransform: "uppercase",
              letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>
              Summary
            </div>
            <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.8 }}>
              <div>Expert: <strong style={{ color: T.textPri }}>{name}</strong></div>
              <div>Product: <strong style={{ color: T.textPri }}>{selectedProduct?.title || "—"}</strong></div>
              <div>When: <strong style={{ color: T.textPri }}>
                {pickedSlot ? `${date} ${pickedSlot.start}–${pickedSlot.end}` : "—"}
              </strong></div>
              <div>Price: <strong style={{ color: T.orange }}>
                {selectedProduct ? `₹${selectedProduct.price}` : "—"}
              </strong></div>
            </div>

            {!bookingOrder ? (
              <button onClick={handleBook}
                disabled={!pickedSlot || !selectedProduct || booking}
                style={{ width: "100%", marginTop: 16,
                  background: (!pickedSlot || !selectedProduct) ? T.sidebar : T.orange,
                  color: (!pickedSlot || !selectedProduct) ? T.textMut : "#000",
                  border: "none", padding: "14px",
                  borderRadius: 12, fontWeight: 800, fontSize: 14,
                  cursor: (!pickedSlot || !selectedProduct || booking) ? "not-allowed" : "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {booking ? "Creating order…" : "Book & Pay"}
              </button>
            ) : (
              <div style={{ marginTop: 16, background: T.sidebar, border: `1px solid ${T.green}`,
                borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: T.green, fontWeight: 700, marginBottom: 8 }}>
                  ✓ Order created
                </div>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: "monospace",
                  marginBottom: 12, wordBreak: "break-all" }}>
                  {bookingOrder.orderId}
                </div>
                {bookingOrder.paymentLink && (
                  <a href={bookingOrder.paymentLink} target="_blank" rel="noreferrer"
                    style={{ display: "block", textAlign: "center", background: T.orange,
                      color: "#000", padding: "12px", borderRadius: 10, fontWeight: 800,
                      textDecoration: "none", marginBottom: 8, fontSize: 13 }}>
                    🔗 Pay with Cashfree
                  </a>
                )}
                <button onClick={handleVerifyAfterReturn}
                  style={{ width: "100%", background: T.green, color: "#000", border: "none",
                    padding: "12px", borderRadius: 10, fontWeight: 800, fontSize: 13,
                    cursor: "pointer" }}>
                  I've paid — verify
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MY BOOKINGS ────────────────────────────────────────── */

function MyBookings({ currentUser }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingFor, setRatingFor] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const myId = currentUser?.id;

  const load = async () => {
    setLoading(true);
    try {
      const data = await API.getMySessions();
      const list = data?.data?.sessions || data?.sessions || data?.data || [];
      const mine = (Array.isArray(list) ? list : [])
        .filter((s) => !myId || s.caller_id === myId || s.user_id === myId);
      setSessions(mine);
    } catch (err) {
      console.warn("[MyBookings]", err.message);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submitRating = async () => {
    try {
      await API.rateSession({ session_id: ratingFor.id, rating, feedback });
      setRatingFor(null);
      setFeedback("");
      setRating(5);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Centered text="Loading your sessions…" />;
  if (sessions.length === 0) return <Centered text="No bookings yet. Browse experts to book your first session." />;

  return (
    <>
      {ratingFor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          backdropFilter: "blur(4px)" }}>
          <div style={{ background: T.card, border: `1px solid ${T.borderHi}`,
            borderRadius: 18, padding: 24, width: 380 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>
              Rate this session
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}
                  style={{ background: "transparent", border: "none",
                    cursor: "pointer", padding: 0 }}>
                  <Star size={26} fill={n <= rating ? T.orange : "transparent"}
                    color={n <= rating ? T.orange : T.textMut}/>
                </button>
              ))}
            </div>
            <textarea placeholder="Feedback (optional)" value={feedback}
              onChange={(e) => setFeedback(e.target.value)} rows={3}
              style={{ width: "100%", background: T.sidebar, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: 10, color: T.textPri, outline: "none",
                fontFamily: "inherit", fontSize: 13, resize: "vertical",
                boxSizing: "border-box", marginBottom: 14 }}/>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setRatingFor(null)}
                style={{ background: "transparent", border: `1px solid ${T.border}`,
                  color: T.textSec, padding: "8px 16px", borderRadius: 10,
                  cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={submitRating}
                style={{ background: T.orange, color: "#000", border: "none",
                  padding: "8px 18px", borderRadius: 10, cursor: "pointer",
                  fontWeight: 700, fontSize: 13 }}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {sessions.map((s) => (
          <div key={s.id}
            style={{ background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: 18, display: "flex",
              justifyContent: "space-between", alignItems: "center",
              gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {s.product_title || s.product?.title || "Session"}
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
                With {s.receiver?.name || s.expert?.name || "Expert"}
              </div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>
                {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : "—"}
                {" · "}
                Status: <span style={{ color: T.orange, fontWeight: 700 }}>{s.status}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.orange }}>
                ₹{Number(s.amount || s.price || 0).toLocaleString("en-IN")}
              </div>
              {s.status === "COMPLETED" && !s.user_rating && (
                <button onClick={() => setRatingFor(s)}
                  style={{ marginTop: 8, background: T.orangeL, border: "none",
                    color: T.orange, padding: "6px 12px", borderRadius: 8,
                    fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  ⭐ Rate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Centered({ text }) {
  return (
    <div style={{ background: T.card, border: `1px dashed ${T.border}`,
      borderRadius: 14, padding: 50, textAlign: "center", color: T.textSec,
      fontSize: 13 }}>
      {text}
    </div>
  );
}
