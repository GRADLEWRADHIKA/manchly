// Expert detail + booking — 7-day date picker, 30-min slots generated from the
// expert's weekly availability minus booked/past slots, confirm modal, then
// POST /sessions/book (free → done, paid → Cashfree checkout + verify poll).
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Star, Languages, BadgeCheck } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { openCheckout, pollVerify } from "../../utils/payments";
import { onSocket } from "../../utils/socket";
import colors from "../../utils/colors";
import { Avatar, FullLoader, GradientButton, Modal, Badge } from "../../components/ui";
import { toast } from "../../utils/toast";
import { formatCurrency } from "../../utils/formatters";

const DUR = 30; // minutes, app parity

function next7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toSlots(startHHMM = "10:00", endHHMM = "18:00") {
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);
  const out = [];
  for (let t = sh * 60 + (sm || 0); t + DUR <= eh * 60 + (em || 0); t += DUR) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return out;
}

export default function ExpertDetail() {
  const { expertId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [expert, setExpert] = useState(location.state?.expert || null);
  const [availability, setAvailability] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [date, setDate] = useState(next7Days()[0]);
  const [time, setTime] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [booking, setBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch(`/sessions/experts/${expertId}`).then((r) => {
        const d = unwrap(r);
        setExpert(d?.expert || d);
      }),
      apiFetch(`/sessions/availability/${expertId}`).then((r) => setAvailability(unwrap(r))),
    ]).finally(() => setLoading(false));

    const off = onSocket("expert_availability_updated", (data) => {
      if (data?.expert_id === expertId) {
        setExpert((prev) => (prev ? { ...prev, is_available: data.is_available } : prev));
      }
    });
    return off;
  }, [expertId]);

  // booked slots per selected date
  useEffect(() => {
    const iso = date.toISOString().slice(0, 10);
    apiFetch(`/sessions/experts/${expertId}/booked-slots?date=${iso}`)
      .then((r) => {
        const d = unwrap(r);
        const list = d?.booked_slots || d?.slots || (Array.isArray(d) ? d : []);
        setBookedSlots(
          list.map((s) => {
            const raw = s.time || s.start_time || s.scheduled_at || s;
            if (typeof raw === "string" && /^\d{2}:\d{2}/.test(raw)) return raw.slice(0, 5);
            const dt = new Date(raw);
            return isNaN(dt) ? String(raw) : `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
          })
        );
      })
      .catch(() => setBookedSlots([]));
    setTime(null);
  }, [date, expertId]);

  const daySlots = useMemo(() => {
    const dow = date.getDay(); // 0 sun
    // availability may be: flat array of slots, {weekly_schedule:[{day_of_week, slots}]}, {availability: [...]}
    const raw = availability?.weekly_schedule || availability?.availability || availability;
    let ranges = [];
    if (Array.isArray(raw)) {
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      for (const item of raw) {
        const itemDay = item.day_of_week ?? item.day;
        const matches =
          itemDay === undefined ||
          Number(itemDay) === dow ||
          String(itemDay).toLowerCase() === dayNames[dow] ||
          String(itemDay).toLowerCase().slice(0, 3) === dayNames[dow].slice(0, 3);
        if (!matches) continue;
        if (Array.isArray(item.slots)) {
          for (const s of item.slots) ranges.push([s.start_time, s.end_time]);
        } else if (item.start_time && item.end_time) {
          ranges.push([item.start_time, item.end_time]);
        }
      }
    }
    if (ranges.length === 0) ranges = [["10:00", "18:00"]]; // app-parity default grid
    return [...new Set(ranges.flatMap(([s, e]) => toSlots(s, e)))].sort();
  }, [availability, date]);

  if (loading && !expert) return <FullLoader label="Loading expert..." />;
  if (!expert) return <div style={{ padding: 40, textAlign: "center" }}>Expert not found.</div>;

  const rate = Number(expert.video_rate) || 0;
  const total = rate * DUR;
  const name = expert.user?.name || expert.name || "Expert";
  const isToday = date.toDateString() === new Date().toDateString();

  const slotState = (t) => {
    if (bookedSlots.includes(t)) return "booked";
    if (isToday) {
      const [h, m] = t.split(":").map(Number);
      if (h * 60 + m <= new Date().getHours() * 60 + new Date().getMinutes()) return "passed";
    }
    return "open";
  };

  const book = async () => {
    setBooking(true);
    try {
      const [h, m] = time.split(":").map(Number);
      const when = new Date(date);
      when.setHours(h, m, 0, 0);
      if (when.getTime() <= Date.now()) throw new Error("That time has already passed");

      const res = unwrap(
        await apiFetch("/sessions/book", {
          method: "POST",
          body: JSON.stringify({ expert_id: expertId, mode: "video", duration: DUR, scheduled_at: when.toISOString() }),
        })
      );
      if (res?.is_free) {
        toast.success("Session booked 🎉");
        navigate("/app/sessions");
        return;
      }
      const cf = res?.cashfree_order || res;
      if (!cf?.payment_session_id) throw new Error("No payment session returned");
      await openCheckout({ payment_session_id: cf.payment_session_id, env: res?.cashfree_env });
      await pollVerify("/sessions/verify-payment", { order_id: cf.order_id });
      toast.success("Session booked & paid 🎉");
      navigate("/app/sessions");
    } catch (err) {
      toast.error(err.message || "Booking failed");
    } finally {
      setBooking(false);
      setConfirm(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 26, alignItems: "start" }}>
      {/* Profile */}
      <div style={{ background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 18, padding: 24 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Avatar src={expert.user?.profile_image || expert.profile_image} name={name} size={76} online={!!expert.is_available} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{name}</h1>
            <div style={{ color: colors.user.subHeading, fontSize: 14 }}>{expert.profession}</div>
            <Badge color={expert.is_available ? "#22C55E" : "#9CA3AF"}>{expert.is_available ? "Online" : "Offline"}</Badge>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          {[
            [`★ ${expert.rating || "New"}`, "Rating"],
            [`${expert.experience || 0} yrs`, "Experience"],
            [expert.total_sessions || 0, "Sessions"],
          ].map(([v, l]) => (
            <div key={l} style={{ flex: 1, background: colors.user.cardSoft, borderRadius: 12, padding: 12, textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{v}</div>
              <div style={{ color: colors.user.subHeading, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {expert.bio && (
          <>
            <h3 style={{ margin: "18px 0 6px", fontSize: 15, fontWeight: 800 }}>About</h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.78)", fontSize: 13.5, lineHeight: 1.65 }}>{expert.bio}</p>
          </>
        )}
        {Array.isArray(expert.languages) && expert.languages.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: colors.user.subHeading, fontSize: 13 }}>
            <Languages size={15} /> {expert.languages.join(", ")}
          </div>
        )}
        {Array.isArray(expert.categories) && expert.categories.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            {expert.categories.map((c, i) => <Badge key={i} color={colors.user.accentSoft} bg="rgba(189,194,255,0.1)">{c}</Badge>)}
          </div>
        )}

        <div style={{ marginTop: 18, background: "rgba(79,96,250,0.12)", border: "1px solid rgba(79,96,250,0.35)", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, fontSize: 14 }}>📹 Video Call</span>
          <span style={{ fontWeight: 900, fontSize: 16, color: colors.user.accentSoft }}>₹{rate}/min</span>
        </div>
      </div>

      {/* Booking */}
      <div style={{ background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 18, padding: 24 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 900 }}>Book a Video Session</h2>

        {/* Dates */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          {next7Days().map((d) => {
            const sel = d.toDateString() === date.toDateString();
            return (
              <button
                key={d.toISOString()}
                onClick={() => setDate(d)}
                style={{
                  minWidth: 66, padding: "10px 8px", borderRadius: 12, cursor: "pointer",
                  border: `1px solid ${sel ? "transparent" : colors.user.border}`,
                  background: sel ? colors.gradients.indigo : "transparent",
                  color: sel ? "#fff" : colors.user.subHeading, textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{d.toDateString() === new Date().toDateString() ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                <div style={{ fontSize: 17, fontWeight: 900, marginTop: 2 }}>{d.getDate()}</div>
              </button>
            );
          })}
        </div>

        {/* Slots */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 8, marginTop: 16 }}>
          {daySlots.map((t) => {
            const state = slotState(t);
            const sel = time === t;
            return (
              <button
                key={t}
                disabled={state !== "open"}
                onClick={() => setTime(t)}
                style={{
                  padding: "10px 6px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  cursor: state === "open" ? "pointer" : "not-allowed",
                  border: `1px solid ${sel ? "transparent" : colors.user.border}`,
                  background: sel ? colors.gradients.indigo : "rgba(189,194,255,0.05)",
                  color: state === "open" ? "#fff" : "rgba(255,255,255,0.28)",
                  textDecoration: state === "booked" ? "line-through" : "none",
                }}
                title={state === "booked" ? "Booked" : state === "passed" ? "Passed" : t}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22, borderTop: `1px solid ${colors.user.border}`, paddingTop: 16 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17 }}>₹{rate}/min</div>
            <div style={{ color: colors.user.subHeading, fontSize: 12.5 }}>
              {time ? `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${time} · ${DUR} min` : "Pick a time slot"}
            </div>
          </div>
          <GradientButton disabled={!time} onClick={() => setConfirm(true)}>Book Now</GradientButton>
        </div>
      </div>

      {/* Confirm modal */}
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Confirm Booking" dark>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <Avatar name={name} src={expert.user?.profile_image} size={52} />
          <div>
            <div style={{ fontWeight: 900 }}>{name}</div>
            <div style={{ color: colors.user.subHeading, fontSize: 13 }}>{expert.profession}</div>
          </div>
        </div>
        {[
          ["Rate", `₹${rate}/min`],
          ["Date & Time", time ? `${date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}, ${time}` : "—"],
          ["Duration", `${DUR} minutes`],
          ["Total", formatCurrency(total)],
        ].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color: colors.user.subHeading }}>{l}</span>
            <span style={{ fontWeight: 700 }}>{v}</span>
          </div>
        ))}
        <p style={{ fontSize: 12, color: colors.user.subHeading, margin: "12px 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
          <BadgeCheck size={14} color="#22C55E" /> Secure session. Billed per minute of actual call.
        </p>
        <GradientButton full size="lg" loading={booking} onClick={book}>
          Pay {formatCurrency(total)} & Book
        </GradientButton>
      </Modal>
    </div>
  );
}
