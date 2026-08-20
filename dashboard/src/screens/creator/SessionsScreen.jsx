import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone, Users, Clock, IndianRupee, Pencil, Trash2, Plus, Star,
  CalendarClock, Package, Languages, CheckCircle2, X,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { emitSocket } from "../../utils/socket";
import colors from "../../utils/colors";
import { Modal, Badge, Avatar, EmptyState } from "../../components/ui";
import { GoldBtn, StatCard, AiEnhance, lbl } from "../../components/creatorUi";
import { toast } from "../../utils/toast";
import { formatCurrency } from "../../utils/formatters";

const G = colors.gradients;

const dayNameToNum = (day) => (DAYS.indexOf(day) + 1) % 7; 
const toDayOfWeek = (s) => (s.day_of_week != null ? Number(s.day_of_week) : dayNameToNum(s.day));

const CATEGORIES = ["Business Consulting", "Career Guidance", "Finance & Tax", "Legal Advice", "Health & Wellness", "Fitness Coach", "Astrology", "Education & Tutoring", "Technology", "Marketing", "Design", "Life Coach"];
const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Kannada"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DURATIONS = [15, 30, 45, 60];
const PLATFORMS = ["Zoom", "Google Meet", "Manchly Live"];

const EMPTY_EXPERT = { profession: "", categories: [], experience: "", bio: "", video_rate: "", languages: [] };
const EMPTY_PRODUCT = { title: "", duration: 30, platform: "Manchly Live", description: "", availability: "Available Mon-Fri, 9 AM - 6 PM IST", paid: true, price: "" };

function Chip({ on, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1.5px solid ${on ? "transparent" : colors.base.border}`,
        background: on ? G.orange : "#fff",
        color: on ? "#fff" : colors.typography.secondaryText,
        borderRadius: 99, padding: "7px 14px", fontSize: 12.5, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

const card = { background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 18, padding: 22 };
const h3 = { margin: "0 0 14px", fontSize: 15.5, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 };

export default function SessionsScreen() {
  const navigate = useNavigate();
  const [expert, setExpert] = useState(null);
  const [noProfile, setNoProfile] = useState(false);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [tab, setTab] = useState("Active");
  const [slots, setSlots] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // modals
  const [expertModal, setExpertModal] = useState(false);
  const [expertForm, setExpertForm] = useState(EMPTY_EXPERT);
  const [expertSaving, setExpertSaving] = useState(false);
  const [slotModal, setSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({ day: "Monday", start_time: "10:00", end_time: "18:00" });
  const [slotSaving, setSlotSaving] = useState(false);
  const [productModal, setProductModal] = useState(null); // 'create' | product
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [productSaving, setProductSaving] = useState(false);
  const [toDeleteProduct, setToDeleteProduct] = useState(null);

  const load = useCallback(async () => {
    const [me, st, sess, avail, prods] = await Promise.allSettled([
      apiFetch("/sessions/expert/me"),
      apiFetch("/sessions/stats"),
      apiFetch("/sessions?role=receiver&page=1&limit=50"),
      apiFetch("/sessions/availability/me"),
      apiFetch("/sessions/products/my"),
    ]);
    if (me.status === "fulfilled") {
      const d = unwrap(me.value);
      const prof = d?.expert || d?.profile || (d && d.profession !== undefined ? d : null);
      setExpert(prof);
      setNoProfile(!prof);
    } else setNoProfile(true);
    if (st.status === "fulfilled") setStats(unwrap(st.value));
    if (sess.status === "fulfilled") {
      const d = unwrap(sess.value);
      setSessions(d?.sessions || (Array.isArray(d) ? d : []));
    }
    if (avail.status === "fulfilled") {
      const d = unwrap(avail.value);
      setSlots(d?.availability || d?.slots || (Array.isArray(d) ? d : []));
    }
    if (prods.status === "fulfilled") {
      const d = unwrap(prods.value);
      setProducts(d?.products || (Array.isArray(d) ? d : []));
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  /* ---------- availability toggle ---------- */
  const toggleAvailable = async () => {
    if (!expert) return;
    const next = !expert.is_available;
    setToggling(true);
    try {
      await apiFetch("/sessions/expert/update", { method: "PATCH", body: JSON.stringify({ is_available: next }) });
      setExpert((e) => ({ ...e, is_available: next }));
      emitSocket("expert_availability_changed", { is_available: next, expert_id: expert.id });
      toast.success(next ? "You're now available for calls" : "You're now offline");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setToggling(false);
    }
  };

  /* ---------- expert registration ---------- */
  const openExpertModal = () => {
    setExpertForm(
      expert
        ? { profession: expert.profession || "", categories: expert.categories || [], experience: String(expert.experience ?? ""), bio: expert.bio || "", video_rate: String(expert.video_rate ?? ""), languages: expert.languages || [] }
        : EMPTY_EXPERT
    );
    setExpertModal(true);
  };

  const toggleIn = (key, val) =>
    setExpertForm((f) => ({ ...f, [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val] }));

  const saveExpert = async () => {
    if (!expertForm.profession.trim()) return toast.error("Profession is required");
    if (expertForm.categories.length === 0) return toast.error("Pick at least one category");
    if (!expertForm.video_rate || isNaN(Number(expertForm.video_rate))) return toast.error("Set your ₹/min video rate");
    setExpertSaving(true);
    try {
      const payload = {
        profession: expertForm.profession.trim(),
        categories: expertForm.categories,
        experience: Number(expertForm.experience) || 0,
        bio: expertForm.bio.trim(),
        video_rate: Number(expertForm.video_rate),
        languages: expertForm.languages,
      };
      if (expert) {
        await apiFetch("/sessions/expert/update", { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Expert profile updated");
      } else {
        await apiFetch("/sessions/expert/register", { method: "POST", body: JSON.stringify(payload) });
        toast.success("You're now a session expert 🎉");
      }
      setExpertModal(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExpertSaving(false);
    }
  };

  /* ---------- slots ---------- */
 const saveSlot = async () => {
  if (slotForm.end_time <= slotForm.start_time) {
    return toast.error("End time must be after start time");
  }

  // Parse and validate day_of_week
  const newDayNum = Number(dayNameToNum(slotForm.day));
  if (isNaN(newDayNum)) {
    return toast.error("Invalid day selected");
  }

  setSlotSaving(true);
  try {
    // 1. Clean existing slots
    const existing = (slots || []).map((s) => ({
      day_of_week: Number(toDayOfWeek(s)),
      start_time: String(s.start_time ?? s.start ?? "").slice(0, 5),
      end_time: String(s.end_time ?? s.end ?? "").slice(0, 5),
    })).filter((s) => !isNaN(s.day_of_week) && s.start && s.end);

    // 2. Format new slot
    const newSlot = {
      day_of_week: newDayNum,
      start_time: String(slotForm.start_time).slice(0, 5),
      end_time: String(slotForm.end_time).slice(0, 5),
    };

    const payload = { slots: [...existing, newSlot] };

    // Console log payload before fetch to inspect for NaN or malformed times
    console.log("Sending Availability Payload:", payload);

    await apiFetch("/sessions/availability", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    toast.success("Slot added");
    setSlotModal(false);
    load();
  } catch (e) {
    toast.error(e.message || "Failed to save slot");
  } finally {
    setSlotSaving(false);
  }
};

  /* ---------- products ---------- */
  const parseProduct = (p) => {
    // platform & availability are serialized into description (app parity)
    const desc = p.description || "";
    const platform = desc.match(/\nPlatform:\s*(.+)/)?.[1]?.trim() || "Manchly Live";
    const availability = desc.match(/\nAvailability:\s*(.+)/)?.[1]?.trim() || "";
    const clean = desc.split("\nPlatform:")[0].trim();
    return { platform, availability, clean };
  };
  const openProductModal = (p) => {
    if (p === "create") {
      setProductForm({ ...EMPTY_PRODUCT });
      setProductModal("create");
    } else {
      const { platform, availability, clean } = parseProduct(p);
      setProductForm({ title: p.title || "", duration: Number(p.duration) || 30, platform, description: clean, availability, paid: Number(p.price) > 0, price: String(p.price ?? "") });
      setProductModal(p);
    }
  };
  const saveProduct = async () => {
    if (!productForm.title.trim()) return toast.error("Title is required");
    if (productForm.paid && (!productForm.price || isNaN(Number(productForm.price)))) return toast.error("Set a valid price");
    setProductSaving(true);
    try {
      const description = `${productForm.description.trim()}\nPlatform: ${productForm.platform}\nAvailability: ${productForm.availability.trim()}`;
      const payload = { title: productForm.title.trim(), duration: Number(productForm.duration), description, price: productForm.paid ? Number(productForm.price) : 0, mode: "video" };
      if (productModal === "create") {
        await apiFetch("/sessions/products", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Session product created");
      } else {
        await apiFetch(`/sessions/products/${productModal.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Session product updated");
      }
      setProductModal(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProductSaving(false);
    }
  };
  const confirmDeleteProduct = async () => {
    try {
      await apiFetch(`/sessions/products/${toDeleteProduct.id}`, { method: "DELETE" });
      toast.success("Deleted");
      setToDeleteProduct(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  /* ---------- call ---------- */
  const callUser = (s) => {
    const caller = s.caller || s.user || {};
    const callId = s.call_id || `call_${s.id}`;
    emitSocket("call_user", { receiverId: caller.id, callId, sessionId: s.id, mode: "video" });
    toast.info(`Ringing ${caller.name || "user"}…`);
    const q = new URLSearchParams({ callId, sessionId: s.id, mode: "video", otherUserId: caller.id || "", otherName: caller.name || "User" });
    navigate(`/call?${q}`);
  };

  const pending = sessions.filter((s) => String(s.status).toUpperCase() === "PENDING" || String(s.status).toUpperCase() === "ACTIVE");
  const history = sessions.filter((s) => !pending.includes(s));
  const shown = tab === "Active" ? pending : history;

  const slotsByDay = DAYS.map((day) => ({
    day,
    items: slots.filter((s) => {
      const d = s.day ?? s.day_of_week;
      return String(d).toLowerCase() === day.toLowerCase() || Number(d) === (DAYS.indexOf(day) + 1) % 7 || Number(d) === DAYS.indexOf(day);
    }),
  }));

  /* ---------- render ---------- */

  return (
    <div style={{ padding: 32, color: colors.typography.primaryText }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 900 }}>
            1:1 <span style={{ background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sessions</span>
          </h1>
          <p style={{ margin: "4px 0 0", color: colors.typography.secondaryText, fontSize: 14 }}>
            Get booked for video consultations, billed per minute.
          </p>
        </div>

        {expert && (
          <button
            onClick={toggleAvailable}
            disabled={toggling}
            style={{
              display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 99, padding: "8px 10px 8px 18px",
              border: `1.5px solid ${expert.is_available ? "#BBF7D0" : colors.base.border}`, cursor: "pointer", fontFamily: "inherit",
              boxShadow: expert.is_available ? "0 6px 18px rgba(34,197,94,0.18)" : "none", transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 13.5, color: expert.is_available ? "#15803D" : colors.typography.secondaryText }}>
              {toggling ? "Updating…" : expert.is_available ? "Available for calls" : "Offline"}
            </span>
            <span style={{ width: 46, height: 26, borderRadius: 99, background: expert.is_available ? "#22C55E" : "#D1D5DB", position: "relative", transition: "background 0.2s ease", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 3, left: expert.is_available ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)", transition: "left 0.2s ease" }} />
            </span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard icon={Users} label="Sessions" value={stats?.total_sessions ?? 0} tint="#3B82F6" />
        <StatCard icon={Clock} label="Minutes on Calls" value={stats?.total_minutes ?? 0} tint="#8B5CF6" />
        <StatCard icon={IndianRupee} label="Earned" value={formatCurrency(stats?.total_earnings ?? 0)} tint="#22C55E" />
        <StatCard icon={Star} label="Your Rate" value={expert ? `₹${expert.video_rate || 0}/min` : "—"} tint="#F5A623" />
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
          <div className="mn-shimmer" style={{ height: 320, borderRadius: 18, opacity: 0.3 }} />
          <div className="mn-shimmer" style={{ height: 320, borderRadius: 18, opacity: 0.3 }} />
        </div>
      ) : noProfile && !expert ? (
        /* Onboarding hero */
        <div style={{ background: G.heroGold, borderRadius: 22, padding: "44px 40px", color: "#fff", textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>📞</div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>Become a Session Expert</h2>
          <p style={{ margin: "10px auto 24px", maxWidth: 520, opacity: 0.85, fontSize: 15, lineHeight: 1.65 }}>
            Set your profession, expertise and per-minute rate — users book you for 1:1 video consultations and you earn for every minute on the call.
          </p>
          <GoldBtn onClick={openExpertModal} style={{ background: "#fff", color: "#92400E", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", padding: "13px 26px" }}>
            <Star size={16} /> Set Up Expert Profile
          </GoldBtn>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }}>
          {/* LEFT: sessions list */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ ...h3, margin: 0 }}><Phone size={16} color="#F5A623" /> Your Sessions</h3>
              <div className="cs-seg" style={{ width: 220 }}>
                {["Active", "History"].map((t) => (
                  <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                    {t}{t === "Active" && pending.length > 0 ? ` (${pending.length})` : ""}
                  </button>
                ))}
              </div>
            </div>

            {shown.length === 0 ? (
              <EmptyState
                icon={tab === "Active" ? "📞" : "🗂️"}
                title={tab === "Active" ? "No active bookings" : "No completed sessions yet"}
                subtitle={tab === "Active" ? "When a user books & pays for a session, it appears here — call them at the scheduled time." : "Completed sessions and earnings will appear here."}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {shown.map((s) => {
                  const caller = s.caller || s.user || {};
                  const status = String(s.status || "").toUpperCase();
                  return (
                    <div key={s.id} className="cs-lesson-row">
                      <Avatar src={caller.profile_image} name={caller.name || "U"} size={42} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14.5 }}>{caller.name || "User"}</div>
                        <div style={{ color: colors.typography.secondaryText, fontSize: 12.5, marginTop: 2 }}>
                          {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Instant"} · {s.duration || 30} min
                          {s.rate_per_min ? ` · ₹${s.rate_per_min}/min` : ""}
                        </div>
                      </div>
                      {tab === "Active" ? (
                        <GoldBtn onClick={() => callUser(s)} style={{ padding: "9px 18px", fontSize: 13 }}>
                          <Phone size={14} /> Call
                        </GoldBtn>
                      ) : (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {s.amount > 0 && <Badge color="#16A34A">Earned {formatCurrency(s.amount)}</Badge>}
                          <Badge color={status === "COMPLETED" ? "#16A34A" : status === "MISSED" ? "#DC2626" : "#6B7280"}>{status}</Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: profile + availability + products */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Expert profile */}
            <div style={{ ...card, background: G.heroGold, border: "none", color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", opacity: 0.8 }}>Expert Profile</div>
                  <div style={{ fontSize: 19, fontWeight: 900, marginTop: 5 }}>{expert?.profession || "—"}</div>
                  <div style={{ fontSize: 13, opacity: 0.85, marginTop: 3 }}>
                    ₹{expert?.video_rate || 0}/min · {expert?.experience || 0} yrs experience
                  </div>
                </div>
                <button className="cs-icon-btn" style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff" }} onClick={openExpertModal} title="Edit profile">
                  <Pencil size={15} />
                </button>
              </div>
              {(expert?.categories || []).length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                  {expert.categories.slice(0, 4).map((c) => (
                    <span key={c} style={{ background: "rgba(255,255,255,0.16)", borderRadius: 99, padding: "4px 11px", fontSize: 11.5, fontWeight: 700 }}>{c}</span>
                  ))}
                </div>
              )}
              {(expert?.languages || []).length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, fontSize: 12.5, opacity: 0.85 }}>
                  <Languages size={13} /> {expert.languages.join(", ")}
                </div>
              )}
            </div>

            {/* Weekly availability */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ ...h3, margin: 0 }}><CalendarClock size={16} color="#F5A623" /> Weekly Availability</h3>
                <GoldBtn ghost style={{ padding: "7px 13px", fontSize: 12.5 }} onClick={() => setSlotModal(true)}><Plus size={13} /> Add Slot</GoldBtn>
              </div>
              {slots.length === 0 ? (
                <p style={{ margin: 0, color: colors.typography.secondaryText, fontSize: 13, lineHeight: 1.6 }}>
                  No slots yet — users see a default 10:00–18:00 grid. Add slots to control when you can be booked.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {slotsByDay.filter((d) => d.items.length).map(({ day, items }) => (
                    <div key={day} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ width: 44, fontSize: 12, fontWeight: 800, color: colors.typography.secondaryText, paddingTop: 6 }}>{day.slice(0, 3)}</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {items.map((s) => (
                          <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#FFF8EC", border: "1px solid #F0DDB0", color: "#92400E", borderRadius: 99, padding: "5px 11px", fontSize: 12, fontWeight: 700 }}>
                            {String(s.start_time).slice(0, 5)}–{String(s.end_time).slice(0, 5)}
                            <button onClick={() => deleteSlot(s)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#B45309", padding: 0, display: "flex" }}><X size={11} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session products */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ ...h3, margin: 0 }}><Package size={16} color="#F5A623" /> Session Products</h3>
                <GoldBtn ghost style={{ padding: "7px 13px", fontSize: 12.5 }} onClick={() => openProductModal("create")}><Plus size={13} /> New</GoldBtn>
              </div>
              {products.length === 0 ? (
                <p style={{ margin: 0, color: colors.typography.secondaryText, fontSize: 13, lineHeight: 1.6 }}>
                  Package your time — e.g. "Portfolio Review · 30 min · ₹999".
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {products.map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${colors.base.border}`, borderRadius: 12, padding: "10px 13px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                        <div style={{ color: colors.typography.secondaryText, fontSize: 12, marginTop: 2 }}>
                          {p.duration || 30} min · {Number(p.price) > 0 ? formatCurrency(p.price) : "Free"}
                        </div>
                      </div>
                      <button className="cs-icon-btn" style={{ width: 30, height: 30 }} onClick={() => openProductModal(p)}><Pencil size={13} /></button>
                      <button className="cs-icon-btn danger" style={{ width: 30, height: 30 }} onClick={() => setToDeleteProduct(p)}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Expert registration modal ---------- */}
      <Modal open={expertModal} onClose={() => setExpertModal(false)} title="" width={600}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "-6px 0 20px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 13, background: G.orange, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(245,166,35,0.35)", flexShrink: 0 }}>
            <Star size={22} color="#fff" />
          </span>
          <div>
            <div style={{ fontSize: 19, fontWeight: 900 }}>{expert ? "Edit Expert Profile" : "Become a Session Expert"}</div>
            <div style={{ fontSize: 13, color: colors.typography.secondaryText }}>This is what users see before booking you</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={lbl}>Profession / Headline</label>
              <AiEnhance endpoint="/ai/session/enhance" text={expertForm.profession} kind="headline" tone="warm" onUse={(t) => setExpertForm((f) => ({ ...f, profession: t }))} />
            </div>
            <input className="cs-input" value={expertForm.profession} onChange={(e) => setExpertForm({ ...expertForm, profession: e.target.value })} placeholder="e.g. SEBI-Registered Investment Advisor" autoFocus />
          </div>

          <div>
            <label style={lbl}>Expertise Categories</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map((c) => (
                <Chip key={c} on={expertForm.categories.includes(c)} onClick={() => toggleIn("categories", c)}>{c}</Chip>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={lbl}>Experience (years)</label>
              <input className="cs-input" inputMode="numeric" value={expertForm.experience} onChange={(e) => setExpertForm({ ...expertForm, experience: e.target.value.replace(/\D/g, "") })} placeholder="5" />
            </div>
            <div>
              <label style={lbl}>Video Rate (₹ / min)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontWeight: 900, color: "#92400E" }}>₹</span>
                <input className="cs-input" style={{ paddingLeft: 30, fontWeight: 800 }} inputMode="numeric" value={expertForm.video_rate} onChange={(e) => setExpertForm({ ...expertForm, video_rate: e.target.value.replace(/[^\d.]/g, "") })} placeholder="20" />
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={lbl}>Bio</label>
              <AiEnhance endpoint="/ai/session/enhance" text={expertForm.bio} kind="bio" tone="warm" onUse={(t) => setExpertForm((f) => ({ ...f, bio: t }))} />
            </div>
            <textarea className="cs-input" style={{ minHeight: 80, resize: "vertical" }} value={expertForm.bio} onChange={(e) => setExpertForm({ ...expertForm, bio: e.target.value })} placeholder="Tell users why they should book you..." />
          </div>

          <div>
            <label style={lbl}>Languages</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {LANGUAGES.map((l) => (
                <Chip key={l} on={expertForm.languages.includes(l)} onClick={() => toggleIn("languages", l)}>{l}</Chip>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${colors.base.border}`, paddingTop: 16 }}>
            <GoldBtn ghost onClick={() => setExpertModal(false)}>Cancel</GoldBtn>
            <GoldBtn loading={expertSaving} onClick={saveExpert} style={{ flex: 1, justifyContent: "center" }}>
              {expert ? "Save Profile" : <><CheckCircle2 size={16} /> Register as Expert</>}
            </GoldBtn>
          </div>
        </div>
      </Modal>

      {/* ---------- Slot modal ---------- */}
      <Modal open={slotModal} onClose={() => setSlotModal(false)} title="Add Availability Slot" width={440}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>Day</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DAYS.map((d) => (
                <Chip key={d} on={slotForm.day === d} onClick={() => setSlotForm({ ...slotForm, day: d })}>{d.slice(0, 3)}</Chip>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Start</label>
              <input className="cs-input" type="time" value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>End</label>
              <input className="cs-input" type="time" value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <GoldBtn ghost onClick={() => setSlotModal(false)}>Cancel</GoldBtn>
            <GoldBtn loading={slotSaving} onClick={saveSlot}><Plus size={15} /> Add Slot</GoldBtn>
          </div>
        </div>
      </Modal>

      {/* ---------- Product modal ---------- */}
      <Modal open={!!productModal} onClose={() => setProductModal(null)} title={productModal === "create" ? "New Session Product" : "Edit Session Product"} width={520}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>Title</label>
            <input className="cs-input" value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} placeholder="e.g. Portfolio Review Call" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={lbl}>Duration</label>
              <div className="cs-seg">
                {DURATIONS.map((d) => (
                  <button key={d} className={Number(productForm.duration) === d ? "on" : ""} onClick={() => setProductForm({ ...productForm, duration: d })}>{d}m</button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Platform</label>
              <select className="cs-input" value={productForm.platform} onChange={(e) => setProductForm({ ...productForm, platform: e.target.value })}>
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea className="cs-input" style={{ minHeight: 70, resize: "vertical" }} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="What does this session cover?" />
          </div>
          <div>
            <label style={lbl}>Availability Note</label>
            <input className="cs-input" value={productForm.availability} onChange={(e) => setProductForm({ ...productForm, availability: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "end" }}>
            <div>
              <label style={lbl}>Pricing</label>
              <div className="cs-seg">
                <button className={productForm.paid ? "on" : ""} onClick={() => setProductForm({ ...productForm, paid: true })}>Paid</button>
                <button className={!productForm.paid ? "on green" : ""} onClick={() => setProductForm({ ...productForm, paid: false })}>Free</button>
              </div>
            </div>
            {productForm.paid && (
              <div>
                <label style={lbl}>Price (INR)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontWeight: 900, color: "#92400E" }}>₹</span>
                  <input className="cs-input" style={{ paddingLeft: 30, fontWeight: 800 }} inputMode="numeric" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value.replace(/[^\d.]/g, "") })} placeholder="999" />
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${colors.base.border}`, paddingTop: 14 }}>
            <GoldBtn ghost onClick={() => setProductModal(null)}>Cancel</GoldBtn>
            <GoldBtn loading={productSaving} onClick={saveProduct}>{productModal === "create" ? "Create" : "Save"}</GoldBtn>
          </div>
        </div>
      </Modal>

      {/* Delete product confirm */}
      <Modal open={!!toDeleteProduct} onClose={() => setToDeleteProduct(null)} title="Delete session product?" width={400}>
        <p style={{ color: colors.typography.secondaryText, fontSize: 14, marginTop: 0 }}>
          "<b>{toDeleteProduct?.title}</b>" will no longer be bookable.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <GoldBtn ghost onClick={() => setToDeleteProduct(null)}>Cancel</GoldBtn>
          <GoldBtn danger onClick={confirmDeleteProduct}><Trash2 size={15} /> Delete</GoldBtn>
        </div>
      </Modal>
    </div>
  );
}
