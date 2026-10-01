import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Users,
  Clock,
  IndianRupee,
  Trash2,
  Plus,
  Star,
  CalendarClock,
  User,
  CheckCircle2,
  X,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { emitSocket } from "../../utils/socket";
import colors from "../../utils/colors";
import { Modal, Badge, Avatar, EmptyState } from "../../components/ui";
import { GoldBtn, StatCard, AiEnhance, lbl } from "../../components/creatorUi";
import { toast } from "../../utils/toast";
import { formatCurrency } from "../../utils/formatters";
import SessionProductRow from "../Auth/Creator/components/SessionProductRow";
import CreateSessionForm from "../Auth/Creator/components/CreateSessionForm";

const G = colors.gradients;

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const dayNameToNum = (day) => (DAYS.indexOf(day) + 1) % 7;
const toDayOfWeek = (s) =>
  s.day_of_week != null ? Number(s.day_of_week) : dayNameToNum(s.day);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;
const EMPTY_ADD_USER = { contact: "", date: "", time: "" };

const CATEGORIES = [
  "Business Consulting",
  "Career Guidance",
  "Finance & Tax",
  "Legal Advice",
  "Health & Wellness",
  "Fitness Coach",
  "Astrology",
  "Education & Tutoring",
  "Technology",
  "Marketing",
  "Design",
  "Life Coach",
];
const LANGUAGES = [
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Kannada",
];

const EMPTY_EXPERT = {
  profession: "",
  categories: [],
  experience: "",
  bio: "",
  video_rate: "",
  languages: [],
};

function Chip({ on, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1.5px solid ${on ? "transparent" : colors.base.border}`,
        background: on ? G.orange : "#fff",
        color: on ? "#fff" : colors.typography.secondaryText,
        borderRadius: 99,
        padding: "7px 14px",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

const card = {
  background: "#fff",
  border: `1px solid ${colors.base.border}`,
  borderRadius: 18,
  padding: 13,
};
const h3 = {
  margin: "0 0 14px",
  fontSize: 15.5,
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const cardSm = { ...card, padding: 14, borderRadius: 14 };
const h3Sm = { ...h3, fontSize: 14 };

const GST_RATE = 0.18;
const PLATFORM_FEE_RATE = 0.02;

// next upcoming slot from the expert's real availability
const getNextSlotDate = (slots) => {
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const todays = (slots || [])
      .filter((s) => Number(toDayOfWeek(s)) === d.getDay())
      .map((s) => String(s.start_time ?? s.start ?? "").slice(0, 5))
      .sort();
    for (const t of todays) {
      const [h, m] = t.split(":").map(Number);
      const at = new Date(d);
      at.setHours(h, m, 0, 0);
      if (at > now) return at;
    }
  }
  return null;
};

export default function SessionsScreen() {
  const navigate = useNavigate();
  const [expert, setExpert] = useState(null);
  const [noProfile, setNoProfile] = useState(false);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]); // bookings (kept for stats + booking modals)
  const [tab, setTab] = useState("All");
  const [slots, setSlots] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [addUserProduct, setAddUserProduct] = useState(null);
  const [addUserForm, setAddUserForm] = useState(EMPTY_ADD_USER);
  const [addUserSaving, setAddUserSaving] = useState(false);

  const [previewProductId, setPreviewProductId] = useState(null);

  const previewProduct =
    products.find((x) => x.id === previewProductId) || null;
  const previewPrice = Number(previewProduct?.price) || 0;
  const previewGst = previewPrice * GST_RATE;
  const previewFee = previewPrice * PLATFORM_FEE_RATE;
  const previewTotal = previewPrice + previewGst + previewFee;
  const previewSlot = getNextSlotDate(slots);

  // modals
  const [expertModal, setExpertModal] = useState(false);
  const [expertForm, setExpertForm] = useState(EMPTY_EXPERT);
  const [expertSaving, setExpertSaving] = useState(false);
  const [slotModal, setSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({
    day: "Monday",
    start_time: "10:00",
    end_time: "18:00",
  });
  const [viewUsersProduct, setViewUsersProduct] = useState(null);
  const [viewUsers, setViewUsers] = useState([]);
  const [viewUsersLoading, setViewUsersLoading] = useState(false);
  const [viewUsersError, setViewUsersError] = useState("");
  const [slotSaving, setSlotSaving] = useState(false);
  const [toDeleteProduct, setToDeleteProduct] = useState(null);

  const [view, setView] = useState("list"); // "list" | "form"
  const [editingProduct, setEditingProduct] = useState(null);

  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionSort, setSessionSort] = useState("newest");
  const [sessionDateFilter, setSessionDateFilter] = useState("all");

  const [previewSession, setPreviewSession] = useState(null);

  const [editSession, setEditSession] = useState(null);
  const [editForm, setEditForm] = useState({
    date: "",
    time: "",
    duration: "30",
    rate_per_min: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  const [performanceSession, setPerformanceSession] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  const [toCancelSession, setToCancelSession] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const totalUsers = useMemo(() => {
    const set = new Set(
      sessions.map((s) => s.caller?.id || s.user?.id).filter(Boolean),
    );
    return set.size;
  }, [sessions]);

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
      const prof =
        d?.expert || d?.profile || (d && d.profession !== undefined ? d : null);
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

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingProduct(null);
    setView("form");
  };
  const openEdit = (p) => {
    setEditingProduct(p);
    setView("form");
  };
  const closeForm = () => {
    setEditingProduct(null);
    setView("list");
  };

  /* ---------- availability toggle ---------- */
  const toggleAvailable = async () => {
    if (!expert) return;
    const next = !expert.is_available;
    setToggling(true);
    try {
      await apiFetch("/sessions/expert/update", {
        method: "PATCH",
        body: JSON.stringify({ is_available: next }),
      });
      setExpert((e) => ({ ...e, is_available: next }));
      emitSocket("expert_availability_changed", {
        is_available: next,
        expert_id: expert.id,
      });
      toast.success(
        next ? "You're now available for calls" : "You're now offline",
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setToggling(false);
    }
  };

  const saveSessionEdit = async () => {
    if (!editForm.date || !editForm.time)
      return toast.error("Date and time are required");
    if (!editForm.duration || isNaN(Number(editForm.duration)))
      return toast.error("Valid duration is required");
    if (!editForm.rate_per_min || isNaN(Number(editForm.rate_per_min)))
      return toast.error("Valid rate is required");

    setEditSaving(true);
    try {
      const scheduled_at = new Date(
        `${editForm.date}T${editForm.time}:00`,
      ).toISOString();
      await apiFetch(`/sessions/${editSession.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          scheduled_at,
          duration: Number(editForm.duration),
          rate_per_min: Number(editForm.rate_per_min),
        }),
      });
      toast.success("Session updated");
      setEditSession(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  /* ---------- expert registration ---------- */
  const openExpertModal = () => {
    setExpertForm(
      expert
        ? {
            profession: expert.profession || "",
            categories: expert.categories || [],
            experience: String(expert.experience ?? ""),
            bio: expert.bio || "",
            video_rate: String(expert.video_rate ?? ""),
            languages: expert.languages || [],
          }
        : EMPTY_EXPERT,
    );
    setExpertModal(true);
  };

  const toggleIn = (key, val) =>
    setExpertForm((f) => ({
      ...f,
      [key]: f[key].includes(val)
        ? f[key].filter((x) => x !== val)
        : [...f[key], val],
    }));

  const saveExpert = async () => {
    if (!expertForm.profession.trim())
      return toast.error("Profession is required");
    if (!expertForm.video_rate || isNaN(Number(expertForm.video_rate)))
      return toast.error("Set your ₹/min video rate");
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
        await apiFetch("/sessions/expert/update", {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Expert profile updated");
      } else {
        await apiFetch("/sessions/expert/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
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

    const newDayNum = Number(dayNameToNum(slotForm.day));
    if (isNaN(newDayNum)) {
      return toast.error("Invalid day selected");
    }

    setSlotSaving(true);
    try {
      const existing = (slots || [])
        .map((s) => ({
          day_of_week: Number(toDayOfWeek(s)),
          start_time: String(s.start_time ?? s.start ?? "").slice(0, 5),
          end_time: String(s.end_time ?? s.end ?? "").slice(0, 5),
        }))
        .filter((s) => !isNaN(s.day_of_week) && s.start_time && s.end_time);

      const newSlot = {
        day_of_week: newDayNum,
        start_time: String(slotForm.start_time).slice(0, 5),
        end_time: String(slotForm.end_time).slice(0, 5),
      };

      const payload = { slots: [...existing, newSlot] };

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

  const deleteSlot = async (slotToRemove) => {
    try {
      const remaining = (slots || [])
        .filter((s) => s.id !== slotToRemove.id)
        .map((s) => ({
          day_of_week: Number(toDayOfWeek(s)),
          start_time: String(s.start_time ?? s.start ?? "").slice(0, 5),
          end_time: String(s.end_time ?? s.end ?? "").slice(0, 5),
        }));

      await apiFetch("/sessions/availability", {
        method: "POST",
        body: JSON.stringify({ slots: remaining }),
      });

      toast.success("Slot removed");
      load();
    } catch (e) {
      toast.error(e.message || "Failed to remove slot");
    }
  };

  /* ---------- products (delete only; create/edit lives in CreateSessionForm) ---------- */
  const confirmDeleteProduct = async () => {
    try {
      await apiFetch(`/sessions/products/${toDeleteProduct.id}`, {
        method: "DELETE",
      });
      toast.success("Deleted");
      setToDeleteProduct(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const toggleProductStatus = async (p) => {
    const next = p.is_active === false; // draft -> active, active -> draft
    const setActive = (val) =>
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, is_active: val } : x)),
      );

    setActive(next);
    try {
      await apiFetch(`/sessions/products/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: next }),
      });
      toast.success(next ? "Session published" : "Moved to draft");
    } catch (e) {
      setActive(!next);
      toast.error(e.message);
    }
  };

  const contact = addUserForm.contact.trim();
  const addUserIsEmail = EMAIL_RE.test(contact);
  const addUserIsPhone = PHONE_RE.test(contact);
  const addUserValid =
    (addUserIsEmail || addUserIsPhone) &&
    !!addUserForm.date &&
    !!addUserForm.time;

  const closeAddUser = () => {
    if (addUserSaving) return;
    setAddUserProduct(null);
    setAddUserForm(EMPTY_ADD_USER);
  };

  const submitAddUser = async () => {
    if (!addUserValid || addUserSaving) return;
    setAddUserSaving(true);
    try {
      const scheduled_at = new Date(
        `${addUserForm.date}T${addUserForm.time}:00`,
      ).toISOString();
      const res = unwrap(
        await apiFetch(`/sessions/products/${addUserProduct.id}/add-user`, {
          method: "POST",
          body: JSON.stringify({
            ...(addUserIsEmail ? { email: contact } : { phone: contact }),
            scheduled_at,
          }),
        }),
      );
      toast.success(`${res?.user?.name || contact} added to the session`);
      setAddUserProduct(null);
      setAddUserForm(EMPTY_ADD_USER);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAddUserSaving(false);
    }
  };

  const openViewUsers = async (p) => {
    setViewUsersProduct(p);
    setViewUsers([]);
    setViewUsersError("");
    setViewUsersLoading(true);
    try {
      const d = unwrap(await apiFetch(`/sessions/products/${p.id}/users`));
      setViewUsers(d?.users || []);
    } catch (e) {
      setViewUsersError(e.message || "Couldn't load users");
    } finally {
      setViewUsersLoading(false);
    }
  };

  /* ---------- call (booking modals; not reachable from the table right now) ---------- */
  const callUser = (s) => {
    const caller = s.caller || s.user || {};
    const callId = s.call_id || `call_${s.id}`;
    emitSocket("call_user", {
      receiverId: caller.id,
      callId,
      sessionId: s.id,
      mode: "video",
    });
    toast.info(`Ringing ${caller.name || "user"}…`);
    const q = new URLSearchParams({
      callId,
      sessionId: s.id,
      mode: "video",
      otherUserId: caller.id || "",
      otherName: caller.name || "User",
    });
    navigate(`/call?${q}`);
  };

  // booking buckets (still used by the stat card subtext)
  const upcoming = sessions.filter((s) =>
    ["PENDING", "ACTIVE"].includes(String(s.status).toUpperCase()),
  );
  const completed = sessions.filter(
    (s) => String(s.status).toUpperCase() === "COMPLETED",
  );

  /* ---------- "Your Sessions" table = session products I created ---------- */
  const tabCounts = {
    All: products.length,
    Active: products.filter((p) => p.is_active !== false).length,
    Inactive: products.filter((p) => p.is_active === false).length,
  };

  const productsFiltered = useMemo(() => {
    let list = products;
    if (tab === "Active") list = list.filter((p) => p.is_active !== false);
    else if (tab === "Inactive")
      list = list.filter((p) => p.is_active === false);

    if (sessionSearch.trim()) {
      const q = sessionSearch.trim().toLowerCase();
      list = list.filter((p) => (p.title || "").toLowerCase().includes(q));
    }

    if (sessionDateFilter !== "all") {
      const cutoff =
        Date.now() - Number(sessionDateFilter) * 24 * 60 * 60 * 1000;
      list = list.filter(
        (p) => new Date(p.created_at || 0).getTime() >= cutoff,
      );
    }

    return [...list].sort((a, b) => {
      if (sessionSort === "price_desc") return (b.price || 0) - (a.price || 0);
      if (sessionSort === "price_asc") return (a.price || 0) - (b.price || 0);
      const ad = new Date(a.created_at || 0).getTime();
      const bd = new Date(b.created_at || 0).getTime();
      return sessionSort === "oldest" ? ad - bd : bd - ad;
    });
  }, [products, tab, sessionSearch, sessionDateFilter, sessionSort]);

  const slotsByDay = DAYS.map((day) => ({
    day,
    items: slots.filter((s) => {
      const d = s.day ?? s.day_of_week;
      return (
        String(d).toLowerCase() === day.toLowerCase() ||
        Number(d) === (DAYS.indexOf(day) + 1) % 7 ||
        Number(d) === DAYS.indexOf(day)
      );
    }),
  }));

  const confirmCancelSession = async () => {
    setCancelling(true);
    try {
      const response = await apiFetch(`/sessions/${toCancelSession.id}`, {
        method: "DELETE",
      });
      const data = unwrap(response);
      toast.success(
        data?.was_paid
          ? "Session cancelled. Refund will be processed manually."
          : "Session cancelled",
      );
      setToCancelSession(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (view === "form") {
    return (
      <CreateSessionForm
        key={editingProduct?.id || "new"}
        product={editingProduct}
        onClose={closeForm}
        onSaved={() => {
          closeForm();
          load();
        }}
      />
    );
  }

  return (
    <div style={{ padding: 32, color: colors.typography.primaryText }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 900 }}>
            1:1{" "}
            <span
              style={{
                background: G.orange,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Sessions
            </span>
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              color: colors.typography.secondaryText,
              fontSize: 14,
            }}
          >
            Get booked for video consultations, billed per minute.
          </p>
        </div>
        <GoldBtn onClick={openCreate}>
          <Plus size={16} /> Schedule Session
        </GoldBtn>
      </div>

      {/* Stats */}
      <div
        style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}
      >
        <StatCard
          icon={User}
          label="Total Sessions"
          value={stats?.total_sessions ?? 0}
          tint="#22C55E"
          subtext={`${upcoming.length} upcoming · ${completed.length} completed`}
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={totalUsers}
          tint="#3B82F6"
          subtext="--vs last month"
        />
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={formatCurrency(stats?.total_earnings ?? 0)}
          tint={colors.brand.primaryOrange}
          subtext="--vs last month"
          highlight
        />
      </div>

      {loading ? (
        <div
          style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}
        >
          <div
            className="mn-shimmer"
            style={{ height: 320, borderRadius: 18, opacity: 0.3 }}
          />
          <div
            className="mn-shimmer"
            style={{ height: 320, borderRadius: 18, opacity: 0.3 }}
          />
        </div>
      ) : noProfile && !expert ? (
        <div
          style={{
            background: G.heroGold,
            borderRadius: 22,
            padding: "44px 40px",
            color: "#fff",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 10 }}>📞</div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>
            Become a Session Expert
          </h2>
          <p
            style={{
              margin: "10px auto 24px",
              maxWidth: 520,
              opacity: 0.85,
              fontSize: 15,
              lineHeight: 1.65,
            }}
          >
            Set your profession, expertise and per-minute rate — users book you
            for 1:1 video consultations and you earn for every minute on the
            call.
          </p>
          <GoldBtn
            onClick={openExpertModal}
            style={{
              background: "#fff",
              color: "#92400E",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              padding: "13px 26px",
            }}
          >
            <Star size={16} /> Set Up Expert Profile
          </GoldBtn>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* LEFT: sessions I created (session products) */}
          <div style={card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <h3 style={{ ...h3, margin: 0 }}>
                <Phone size={16} color="#F5A623" /> Your Sessions
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#fff",
                    border: `1.5px solid ${colors.base.border}`,
                    borderRadius: 10,
                    padding: "7px 12px",
                  }}
                >
                  <input
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Search sessions..."
                    style={{
                      border: "none",
                      outline: "none",
                      fontSize: 13,
                      fontFamily: "inherit",
                      background: "transparent",
                      width: 140,
                    }}
                  />
                </div>

                <select
                  value={sessionSort}
                  onChange={(e) => setSessionSort(e.target.value)}
                  style={{
                    border: `1.5px solid ${colors.base.border}`,
                    borderRadius: 10,
                    padding: "7px 10px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="price_asc">Price: Low to High</option>
                </select>

                <select
                  value={sessionDateFilter}
                  onChange={(e) => setSessionDateFilter(e.target.value)}
                  style={{
                    border: `1.5px solid ${colors.base.border}`,
                    borderRadius: 10,
                    padding: "7px 10px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last 1 year</option>
                </select>
              </div>
            </div>

            <div className="cs-seg" style={{ marginBottom: 16 }}>
              {["All", "Active", "Inactive"].map((t) => (
                <button
                  key={t}
                  className={tab === t ? "on" : ""}
                  onClick={() => setTab(t)}
                >
                  {t} ({tabCounts[t]})
                </button>
              ))}
            </div>

            {productsFiltered.length === 0 ? (
              <EmptyState
                icon="🗂️"
                title={
                  products.length === 0
                    ? "No sessions created yet"
                    : `No ${tab.toLowerCase()} sessions`
                }
                subtitle={
                  products.length === 0
                    ? 'Click "Schedule Session" to create your first bookable session.'
                    : "Sessions matching this filter will appear here."
                }
              />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: `1px solid ${colors.base.border}`,
                      }}
                    >
                      {[
                        "Session",
                        "Duration",
                        "Price",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: h === "Actions" ? "right" : "left",
                            padding: "10px 8px",
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: colors.typography.secondaryText,
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productsFiltered.map((p) => (
                      <SessionProductRow
                        key={p.id}
                        p={p}
                        onEdit={openEdit}
                        onDelete={(p) => setToDeleteProduct(p)}
                        onToggleStatus={toggleProductStatus}
                        onAddUsers={(p) => setAddUserProduct(p)}
                        onViewUsers={openViewUsers}
                        onPreview={(p) => setPreviewProductId(p.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT: profile + availability + products */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Expert profile */}
            <div style={cardSm}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h3 style={{ ...h3Sm, margin: 0 }}>
                  <Star size={16} color="#F5A623" /> Your Expert Profile
                </h3>
                <button
                  onClick={openExpertModal}
                  style={{
                    background: "none",
                    border: "none",
                    color: colors.brand.primaryOrange,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#FFF1DC",
                    color: "#D97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {(expert?.profession || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}
                  >
                    {expert?.user?.name || expert?.name || "Your Profile"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 0 }}>
                    {expert?.profession || "—"}
                  </div>
                  <div
                    style={{ fontSize: 11.5, color: "#6B7280", marginTop: 1 }}
                  >
                    ₹{expert?.video_rate || 0}/min · {expert?.experience || 0}{" "}
                    yrs experience
                  </div>
                </div>
              </div>

              {(expert?.categories || []).length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 5,
                    flexWrap: "wrap",
                    marginTop: 10,
                  }}
                >
                  {expert.categories.slice(0, 4).map((c) => (
                    <span
                      key={c}
                      style={{
                        background: "#fff",
                        border: `1px solid ${colors.base.border}`,
                        borderRadius: 99,
                        padding: "3px 9px",
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: colors.typography.primaryText,
                      }}
                    >
                      {c}
                    </span>
                  ))}
                  {(expert?.languages || []).length > 0 &&
                    expert.languages.map((l) => (
                      <span
                        key={l}
                        style={{
                          background: "#fff",
                          border: `1px solid ${colors.base.border}`,
                          borderRadius: 99,
                          padding: "5px 12px",
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: colors.typography.primaryText,
                        }}
                      >
                        {l}
                      </span>
                    ))}
                </div>
              )}

              {expert?.bio && (
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: 12,
                    color: "#6B7280",
                    lineHeight: 1.45,
                  }}
                >
                  {expert.bio}
                </p>
              )}
            </div>

            {/* Weekly availability */}
            <div style={cardSm}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h3 style={{ ...h3Sm, margin: 0 }}>
                  <CalendarClock size={16} color="#F5A623" /> Availability
                </h3>
                {expert && (
                  <button
                    onClick={toggleAvailable}
                    disabled={toggling}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: expert.is_available
                          ? "#15803D"
                          : colors.typography.secondaryText,
                      }}
                    >
                      {toggling ? "Updating…" : "Available for calls"}
                    </span>
                    <span
                      style={{
                        width: 38,
                        height: 22,
                        borderRadius: 99,
                        background: expert.is_available ? "#22C55E" : "#D1D5DB",
                        position: "relative",
                        transition: "background 0.2s ease",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 2,
                          left: expert.is_available ? 18 : 2,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#fff",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                          transition: "left 0.2s ease",
                        }}
                      />
                    </span>
                  </button>
                )}
              </div>

              {slots.length === 0 ? (
                <div
                  style={{
                    background: "#FFF8EC",
                    border: "1px solid #F0DDB0",
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Clock size={15} color="#B45309" />
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: "#92400E",
                      }}
                    >
                      Set your weekly availability
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0 0 14px",
                      fontSize: 12.5,
                      color: "#92400E",
                      lineHeight: 1.5,
                      opacity: 0.85,
                    }}
                  >
                    Add time slots when users can book you for 1:1 sessions.
                  </p>
                  <button
                    onClick={() => setSlotModal(true)}
                    style={{
                      width: "100%",
                      background: "#fff",
                      border: "1.5px solid #F5A623",
                      color: "#B45309",
                      borderRadius: 10,
                      padding: "9px 0",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Plus size={14} /> Add Time Slot
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    {slotsByDay
                      .filter((d) => d.items.length)
                      .map(({ day, items }) => (
                        <div
                          key={day}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                          }}
                        >
                          <span
                            style={{
                              width: 44,
                              fontSize: 12,
                              fontWeight: 800,
                              color: colors.typography.secondaryText,
                              paddingTop: 6,
                            }}
                          >
                            {day.slice(0, 3)}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            {items.map((s) => (
                              <span
                                key={s.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 7,
                                  background: "#FFF8EC",
                                  border: "1px solid #F0DDB0",
                                  color: "#92400E",
                                  borderRadius: 99,
                                  padding: "5px 11px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {String(s.start_time).slice(0, 5)}–
                                {String(s.end_time).slice(0, 5)}
                                <button
                                  onClick={() => deleteSlot(s)}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#B45309",
                                    padding: 0,
                                    display: "flex",
                                  }}
                                >
                                  <X size={11} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                  <GoldBtn
                    ghost
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "9px 0",
                      fontSize: 13,
                    }}
                    onClick={() => setSlotModal(true)}
                  >
                    <Plus size={14} /> Add Time Slot
                  </GoldBtn>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Expert registration modal ---------- */}
      <Modal
        open={expertModal}
        onClose={() => setExpertModal(false)}
        title=""
        width={600}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            margin: "-6px 0 20px",
          }}
        >
          <span
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              background: G.orange,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(245,166,35,0.35)",
              flexShrink: 0,
            }}
          >
            <Star size={22} color="#fff" />
          </span>
          <div>
            <div style={{ fontSize: 19, fontWeight: 900 }}>
              {expert ? "Edit Expert Profile" : "Become a Session Expert"}
            </div>
            <div
              style={{ fontSize: 13, color: colors.typography.secondaryText }}
            >
              This is what users see before booking you
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label style={lbl}>Profession / Headline</label>
              <AiEnhance
                endpoint="/ai/session/enhance"
                text={expertForm.profession}
                kind="headline"
                tone="warm"
                onUse={(t) => setExpertForm((f) => ({ ...f, profession: t }))}
              />
            </div>
            <input
              className="cs-input"
              value={expertForm.profession}
              onChange={(e) =>
                setExpertForm({ ...expertForm, profession: e.target.value })
              }
              placeholder="e.g. SEBI-Registered Investment Advisor"
              autoFocus
            />
          </div>

          <div>
            <label style={lbl}>Expertise Categories</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  on={expertForm.categories.includes(c)}
                  onClick={() => toggleIn("categories", c)}
                >
                  {c}
                </Chip>
              ))}
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div>
              <label style={lbl}>Experience (years)</label>
              <input
                className="cs-input"
                inputMode="numeric"
                value={expertForm.experience}
                onChange={(e) =>
                  setExpertForm({
                    ...expertForm,
                    experience: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="5"
              />
            </div>
            <div>
              <label style={lbl}>Video Rate (₹ / min)</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontWeight: 900,
                    color: "#92400E",
                  }}
                >
                  ₹
                </span>
                <input
                  className="cs-input"
                  style={{ paddingLeft: 30, fontWeight: 800 }}
                  inputMode="numeric"
                  value={expertForm.video_rate}
                  onChange={(e) =>
                    setExpertForm({
                      ...expertForm,
                      video_rate: e.target.value.replace(/[^\d.]/g, ""),
                    })
                  }
                  placeholder="20"
                />
              </div>
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label style={lbl}>Bio</label>
              <AiEnhance
                endpoint="/ai/session/enhance"
                text={expertForm.bio}
                kind="bio"
                tone="warm"
                onUse={(t) => setExpertForm((f) => ({ ...f, bio: t }))}
              />
            </div>
            <textarea
              className="cs-input"
              style={{ minHeight: 80, resize: "vertical" }}
              value={expertForm.bio}
              onChange={(e) =>
                setExpertForm({ ...expertForm, bio: e.target.value })
              }
              placeholder="Tell users why they should book you..."
            />
          </div>

          <div>
            <label style={lbl}>Languages</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {LANGUAGES.map((l) => (
                <Chip
                  key={l}
                  on={expertForm.languages.includes(l)}
                  onClick={() => toggleIn("languages", l)}
                >
                  {l}
                </Chip>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              borderTop: `1px solid ${colors.base.border}`,
              paddingTop: 16,
            }}
          >
            <GoldBtn ghost onClick={() => setExpertModal(false)}>
              Cancel
            </GoldBtn>
            <GoldBtn
              loading={expertSaving}
              onClick={saveExpert}
              style={{ flex: 1, justifyContent: "center" }}
            >
              {expert ? (
                "Save Profile"
              ) : (
                <>
                  <CheckCircle2 size={16} /> Register as Expert
                </>
              )}
            </GoldBtn>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!previewProduct}
        onClose={() => setPreviewProductId(null)}
        title="User View Preview"
        width={400}
      >
        {previewProduct && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* banner */}
            <div
              style={{
                borderRadius: 14,
                aspectRatio: "16 / 8",
                background: "#F8FAFC",
                backgroundImage: previewProduct.thumbnail_url
                  ? `url(${previewProduct.thumbnail_url})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                {previewProduct.title}
              </div>
              {previewProduct.description && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: "#64748B",
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {previewProduct.description}
                </div>
              )}
            </div>

            {/* expert */}
            <div
              style={{
                border: `1px solid ${colors.base.border}`,
                borderRadius: 14,
                padding: 12,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar
                  src={expert?.user?.profile_image}
                  name={expert?.user?.name || "E"}
                  size={48}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>
                    {expert?.user?.name || "Expert"}
                  </div>
                  <div
                    style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4 }}
                  >
                    {expert?.bio || expert?.profession}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  marginTop: 10,
                  fontSize: 12,
                }}
              >
                <div>
                  <div style={{ color: "#9CA3AF" }}>Category</div>
                  <b>{previewProduct.categories?.[0] || "—"}</b>
                </div>
                <div>
                  <div style={{ color: "#9CA3AF" }}>Experience</div>
                  <b>{expert?.experience || 0}+ Years</b>
                </div>
              </div>
            </div>

            {/* session details */}
            <div
              style={{
                border: `1px solid ${colors.base.border}`,
                borderRadius: 14,
                padding: 12,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                Session Details
              </div>
              {[
                [
                  "Date",
                  previewSlot
                    ? previewSlot.toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "No slots set",
                ],
                [
                  "Time",
                  previewSlot
                    ? previewSlot.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—",
                ],
                ["Duration", `${previewProduct.duration || 30} Minutes`],
                [
                  "Session Type",
                  previewProduct.mode === "VIDEO" ? "Video Call" : "Audio Call",
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0",
                  }}
                >
                  <span style={{ color: "#6B7280" }}>{k}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>

            {/* payment details */}
            {previewPrice > 0 && (
              <div
                style={{
                  border: `1px solid ${colors.base.border}`,
                  borderRadius: 14,
                  padding: 12,
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 8 }}>
                  Payment Details
                </div>
                {[
                  [
                    `Session Fee (${previewProduct.duration} minutes)`,
                    previewPrice,
                  ],
                  ["GST (18%)", previewGst],
                  ["Platform Fee (2%)", previewFee],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                    }}
                  >
                    <span style={{ color: "#6B7280" }}>{k}</span>
                    <b>{formatCurrency(v)}</b>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#ECFDF5",
                    color: "#16A34A",
                    fontWeight: 800,
                  }}
                >
                  <span>Total Amount</span>
                  <span>{formatCurrency(previewTotal)}</span>
                </div>
              </div>
            )}

            <div
              style={{
                padding: "12px 0",
                borderRadius: 14,
                background: "#22C55E",
                color: "#fff",
                fontSize: 16,
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              {previewPrice > 0
                ? `Pay ${formatCurrency(previewTotal)} & Book`
                : "Book for Free"}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!viewUsersProduct}
        onClose={() => setViewUsersProduct(null)}
        title={`Users — ${viewUsersProduct?.title || ""}`}
        width={480}
      >
        {viewUsersLoading ? (
          <div
            style={{
              padding: "20px 0",
              textAlign: "center",
              color: "#6B7280",
              fontSize: 13,
            }}
          >
            Loading...
          </div>
        ) : viewUsersError ? (
          <div style={{ fontSize: 13, color: "#EF4444" }}>{viewUsersError}</div>
        ) : viewUsers.length === 0 ? (
          <div
            style={{
              padding: "20px 0",
              textAlign: "center",
              color: "#6B7280",
              fontSize: 13,
            }}
          >
            No one has booked this session yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {viewUsers.map((r) => {
              const status = String(r.status).toUpperCase();
              const label =
                status === "PENDING" || status === "ACTIVE"
                  ? "Upcoming"
                  : status.charAt(0) + status.slice(1).toLowerCase();
              const color =
                status === "COMPLETED"
                  ? "#16A34A"
                  : status === "CANCELLED" || status === "MISSED"
                    ? "#DC2626"
                    : "#2563EB";
              return (
                <div
                  key={r.session_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: `1px solid ${colors.base.border}`,
                  }}
                >
                  <Avatar
                    src={r.user?.profile_image}
                    name={r.user?.name || "U"}
                    size={36}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {r.user?.name || r.user?.email || "Unknown"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>
                      {r.scheduled_at
                        ? new Date(r.scheduled_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Not scheduled"}
                      {" · "}
                      {r.amount > 0 ? formatCurrency(r.amount) : "Free"}
                    </div>
                  </div>
                  <Badge color={color}>{label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* ---------- Session Preview Modal (booking) ---------- */}
      <Modal
        open={!!previewSession}
        onClose={() => setPreviewSession(null)}
        title="Session Preview"
        width={420}
      >
        {previewSession &&
          (() => {
            const caller = previewSession.caller || previewSession.user || {};
            const status = String(previewSession.status || "").toUpperCase();
            return (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 18,
                  }}
                >
                  <Avatar
                    src={caller.profile_image}
                    name={caller.name || "U"}
                    size={54}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 900,
                        color: "#111827",
                      }}
                    >
                      {caller.name || "User"}
                    </div>
                    {caller.email && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "#6B7280",
                          marginTop: 2,
                        }}
                      >
                        {caller.email}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#6B7280" }}>Status</span>
                    <Badge
                      color={
                        status === "COMPLETED"
                          ? "#16A34A"
                          : status === "CANCELLED"
                            ? "#DC2626"
                            : "#2563EB"
                      }
                    >
                      {status === "PENDING" || status === "ACTIVE"
                        ? "Upcoming"
                        : status.charAt(0) + status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#6B7280" }}>Scheduled</span>
                    <span style={{ fontWeight: 700, color: "#111827" }}>
                      {previewSession.scheduled_at
                        ? new Date(previewSession.scheduled_at).toLocaleString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "Instant"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#6B7280" }}>Duration</span>
                    <span style={{ fontWeight: 700, color: "#111827" }}>
                      {previewSession.duration || 30} mins
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#6B7280" }}>Rate</span>
                    <span style={{ fontWeight: 700, color: "#111827" }}>
                      ₹{previewSession.rate_per_min || 0}/min
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#6B7280" }}>Amount</span>
                    <span style={{ fontWeight: 700, color: "#111827" }}>
                      {previewSession.amount != null
                        ? formatCurrency(previewSession.amount)
                        : "--"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#6B7280" }}>Mode</span>
                    <span style={{ fontWeight: 700, color: "#111827" }}>
                      {previewSession.mode || "VIDEO"}
                    </span>
                  </div>
                </div>

                {(String(previewSession.status).toUpperCase() === "PENDING" ||
                  String(previewSession.status).toUpperCase() === "ACTIVE") && (
                  <GoldBtn
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => callUser(previewSession)}
                  >
                    <Phone size={15} /> Call Now
                  </GoldBtn>
                )}
              </div>
            );
          })()}
      </Modal>

      {/* ---------- Performance Modal (booking) ---------- */}
      <Modal
        open={!!performanceSession}
        onClose={() => setPerformanceSession(null)}
        title="Session Performance"
        width={400}
      >
        {performanceLoading ? (
          <div
            style={{
              padding: "20px 0",
              textAlign: "center",
              color: "#6B7280",
              fontSize: 13,
            }}
          >
            Loading...
          </div>
        ) : performanceData ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(34,197,94,0.08)",
              }}
            >
              <span style={{ fontSize: 13, color: "#6B7280" }}>
                Amount Earned
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#16A34A" }}>
                {performanceData.amount != null
                  ? formatCurrency(performanceData.amount)
                  : "--"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(59,130,246,0.08)",
              }}
            >
              <span style={{ fontSize: 13, color: "#6B7280" }}>Duration</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#2563EB" }}>
                {performanceData.duration || 0} min
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(107,114,128,0.08)",
              }}
            >
              <span style={{ fontSize: 13, color: "#6B7280" }}>
                Payment Status
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                {performanceData.payment_status || "—"}
              </span>
            </div>

            {performanceData.review ? (
              <div
                style={{
                  marginTop: 6,
                  padding: "12px",
                  borderRadius: 10,
                  border: `1px solid ${colors.base.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 6,
                  }}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      color="#F59E0B"
                      fill={
                        i < performanceData.review.rating ? "#F59E0B" : "none"
                      }
                    />
                  ))}
                </div>
                {performanceData.review.comment && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12.5,
                      color: "#374151",
                      lineHeight: 1.5,
                    }}
                  >
                    "{performanceData.review.comment}"
                  </p>
                )}
              </div>
            ) : (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12.5,
                  color: "#9CA3AF",
                  textAlign: "center",
                  padding: "10px 0",
                }}
              >
                No review left for this session yet.
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: "20px 0",
              textAlign: "center",
              color: "#6B7280",
              fontSize: 13,
            }}
          >
            Unable to load performance data.
          </div>
        )}
      </Modal>

      {/* ---------- Cancel Session Modal (booking) ---------- */}
      <Modal
        open={!!toCancelSession}
        onClose={() => !cancelling && setToCancelSession(null)}
        title="Cancel session?"
        width={400}
      >
        <p
          style={{
            color: colors.typography.secondaryText,
            fontSize: 14,
            marginTop: 0,
          }}
        >
          The session with "
          <b>
            {toCancelSession?.caller?.name ||
              toCancelSession?.user?.name ||
              "this user"}
          </b>
          " will be cancelled.
          {toCancelSession?.payment_status === "SUCCESS" &&
            toCancelSession?.amount > 0 && (
              <>
                {" "}
                They already paid — you'll need to process a refund manually.
              </>
            )}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <GoldBtn
            ghost
            onClick={() => setToCancelSession(null)}
            disabled={cancelling}
          >
            Keep Session
          </GoldBtn>
          <GoldBtn danger loading={cancelling} onClick={confirmCancelSession}>
            <Trash2 size={15} /> Cancel Session
          </GoldBtn>
        </div>
      </Modal>

      {/* ---------- Slot modal ---------- */}
      <Modal
        open={slotModal}
        onClose={() => setSlotModal(false)}
        title="Add Availability Slot"
        width={440}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>Day</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DAYS.map((d) => (
                <Chip
                  key={d}
                  on={slotForm.day === d}
                  onClick={() => setSlotForm({ ...slotForm, day: d })}
                >
                  {d.slice(0, 3)}
                </Chip>
              ))}
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={lbl}>Start</label>
              <input
                className="cs-input"
                type="time"
                value={slotForm.start_time}
                onChange={(e) =>
                  setSlotForm({ ...slotForm, start_time: e.target.value })
                }
              />
            </div>
            <div>
              <label style={lbl}>End</label>
              <input
                className="cs-input"
                type="time"
                value={slotForm.end_time}
                onChange={(e) =>
                  setSlotForm({ ...slotForm, end_time: e.target.value })
                }
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <GoldBtn ghost onClick={() => setSlotModal(false)}>
              Cancel
            </GoldBtn>
            <GoldBtn loading={slotSaving} onClick={saveSlot}>
              <Plus size={15} /> Add Slot
            </GoldBtn>
          </div>
        </div>
      </Modal>

      {/* ---------- Edit Session Modal (booking) ---------- */}
      <Modal
        open={!!editSession}
        onClose={() => setEditSession(null)}
        title="Edit Session"
        width={440}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={lbl}>Date</label>
              <input
                className="cs-input"
                type="date"
                value={editForm.date}
                onChange={(e) =>
                  setEditForm({ ...editForm, date: e.target.value })
                }
              />
            </div>
            <div>
              <label style={lbl}>Time</label>
              <input
                className="cs-input"
                type="time"
                value={editForm.time}
                onChange={(e) =>
                  setEditForm({ ...editForm, time: e.target.value })
                }
              />
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={lbl}>Duration (mins)</label>
              <input
                className="cs-input"
                inputMode="numeric"
                value={editForm.duration}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    duration: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </div>
            <div>
              <label style={lbl}>Rate (₹/min)</label>
              <input
                className="cs-input"
                inputMode="numeric"
                value={editForm.rate_per_min}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    rate_per_min: e.target.value.replace(/[^\d.]/g, ""),
                  })
                }
              />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: "#6B7280" }}>
            New amount: ₹
            {(
              (Number(editForm.duration) || 0) *
              (Number(editForm.rate_per_min) || 0)
            ).toFixed(2)}
            . The user will be notified of this change.
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              borderTop: `1px solid ${colors.base.border}`,
              paddingTop: 14,
            }}
          >
            <GoldBtn ghost onClick={() => setEditSession(null)}>
              Cancel
            </GoldBtn>
            <GoldBtn loading={editSaving} onClick={saveSessionEdit}>
              Save Changes
            </GoldBtn>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!addUserProduct}
        onClose={closeAddUser}
        title="Add User"
        width={440}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: colors.typography.secondaryText,
              lineHeight: 1.5,
            }}
          >
            Book a free "<b>{addUserProduct?.title}</b>" session for a user.
            They're notified right away, and it's added to your schedule.
          </p>

          <div>
            <label style={lbl}>User's phone or email</label>
            <input
              className="cs-input"
              value={addUserForm.contact}
              onChange={(e) =>
                setAddUserForm({ ...addUserForm, contact: e.target.value })
              }
              placeholder="10-digit phone or email"
              disabled={addUserSaving}
            />
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 11.5,
                color: colors.typography.secondaryText,
              }}
            >
              The user must already have a Manchly account with this phone or
              email.
            </p>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={lbl}>Date</label>
              <input
                className="cs-input"
                type="date"
                min={new Date().toLocaleDateString("en-CA")}
                value={addUserForm.date}
                onChange={(e) =>
                  setAddUserForm({ ...addUserForm, date: e.target.value })
                }
                disabled={addUserSaving}
              />
            </div>
            <div>
              <label style={lbl}>Time</label>
              <input
                className="cs-input"
                type="time"
                value={addUserForm.time}
                onChange={(e) =>
                  setAddUserForm({ ...addUserForm, time: e.target.value })
                }
                disabled={addUserSaving}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <GoldBtn ghost onClick={closeAddUser} disabled={addUserSaving}>
              Cancel
            </GoldBtn>
            <GoldBtn
              loading={addUserSaving}
              onClick={submitAddUser}
              disabled={!addUserValid}
            >
              Grant Access
            </GoldBtn>
          </div>
        </div>
      </Modal>

      {/* Delete product confirm */}
      <Modal
        open={!!toDeleteProduct}
        onClose={() => setToDeleteProduct(null)}
        title="Delete session product?"
        width={400}
      >
        <p
          style={{
            color: colors.typography.secondaryText,
            fontSize: 14,
            marginTop: 0,
          }}
        >
          "<b>{toDeleteProduct?.title}</b>" will no longer be bookable.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <GoldBtn ghost onClick={() => setToDeleteProduct(null)}>
            Cancel
          </GoldBtn>
          <GoldBtn danger onClick={confirmDeleteProduct}>
            <Trash2 size={15} /> Delete
          </GoldBtn>
        </div>
      </Modal>
    </div>
  );
}
