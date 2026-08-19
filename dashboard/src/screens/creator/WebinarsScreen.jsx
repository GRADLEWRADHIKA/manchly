import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Share2,
  Video,
  Users,
  IndianRupee,
  CalendarDays,
  Clock,
  Radio,
  Copy,
  Search,
  MonitorPlay,
  X,
  Upload,
  Check,
  VideoIcon,
  ChevronRight,
  Eye,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { Modal, Badge, EmptyState } from "../../components/ui";
import { GoldBtn, StatCard, AiEnhance, lbl } from "../../components/creatorUi";
import { toast } from "../../utils/toast";
import { formatCurrency } from "../../utils/formatters";

const G = colors.gradients;
const FILTERS = ["All", "Upcoming", "Past", "Draft"];
const EMPTY_FORM = {
  title: "",
  price: "",
  date: "",
  time: "",
  duration: "60",
  max_participants: "100",
  status: "DRAFT",
  description: "",
  thumbnail: "",
  tags: [],
  recording_access: "lifetime",
};

function startDate(w) {
  if (!w?.scheduled_at) return null;
  const d = new Date(w.scheduled_at);
  if (w.start_time && /^\d{2}:\d{2}/.test(w.start_time)) {
    const [h, m] = w.start_time.split(":").map(Number);
    if (d.getHours() === 0 && d.getMinutes() === 0) d.setHours(h, m, 0, 0);
  }
  return d;
}

const endMs = (w) => {
  const s = startDate(w);
  return s ? s.getTime() + (Number(w.duration) || 60) * 60000 : 0;
};

function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

function Countdown({ target }) {
  const now = useNow();
  const diff = target - now;
  if (diff <= 0) return <span style={{ fontWeight: 900 }}>LIVE now</span>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const cell = (v, u) => (
    <span
      style={{
        background: "rgba(255,255,255,0.14)",
        borderRadius: 10,
        padding: "7px 11px",
        textAlign: "center",
        minWidth: 46,
        display: "inline-block",
      }}
    >
      <span
        style={{
          fontSize: 19,
          fontWeight: 900,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(v).padStart(2, "0")}
      </span>
      <span
        style={{
          display: "block",
          fontSize: 10,
          opacity: 0.75,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {u}
      </span>
    </span>
  );
  return (
    <span style={{ display: "inline-flex", gap: 8 }}>
      {cell(d, "day")}
      {cell(h, "hrs")}
      {cell(m, "min")}
      {cell(s, "sec")}
    </span>
  );
}

export default function WebinarsScreen() {
  const [view, setView] = useState("list"); // 'list' | 'form'
  const [formMode, setFormMode] = useState("create"); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [webinars, setWebinars] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const thumbRef = useRef(null);
  const now = useNow(30000);

  const load = useCallback(async () => {
    try {
      const [list, st] = await Promise.allSettled([
        apiFetch("/webinars?my_webinars=true&page=1&limit=50&upcoming=false"),
        apiFetch("/webinars/stats/creator"),
      ]);
      if (list.status === "fulfilled") {
        const d = unwrap(list.value);
        setWebinars(d?.webinars || (Array.isArray(d) ? d : []));
      }
      if (st.status === "fulfilled")
        setStats(unwrap(st.value)?.statistics || unwrap(st.value));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isPast = (w) => endMs(w) < now;
  const isLive = (w) => {
    const s = startDate(w)?.getTime() || 0;
    return s <= now && now < endMs(w);
  };

  const nextUp = useMemo(
    () =>
      webinars
        .filter((w) => w.status !== "DRAFT" && !isPast(w) && startDate(w))
        .sort((a, b) => startDate(a) - startDate(b))[0] || null,
    [webinars, now],
  );

  const filtered = webinars.filter((w) => {
    if (
      search &&
      !`${w.title} ${(w.tags || []).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    if (filter === "Upcoming") return w.status !== "DRAFT" && !isPast(w);
    if (filter === "Past") return isPast(w) && w.status !== "DRAFT";
    if (filter === "Draft") return w.status === "DRAFT";
    return true;
  });

  /* ---------- Navigation & Form handlers ---------- */

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setTagInput("");
    setFormMode("create");
    setEditingId(null);
    setCurrentStep(1);
    setView("form");
  };

  const openEdit = (w) => {
    const s = startDate(w);
    setForm({
      title: w.title || "",
      price: String(w.price ?? ""),
      thumbnail: w.thumbnail || "",
      date: s ? s.toISOString().slice(0, 10) : "",
      time: s
        ? `${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`
        : "",
      duration: String(w.duration ?? 60),
      max_participants: String(w.max_participants ?? 100),
      status: w.status || "DRAFT",
      description: w.description || "",
      tags: Array.isArray(w.tags) ? w.tags : [],
      recording_access: w.recording_access || "lifetime",
    });
    setTagInput("");
    setFormMode("edit");
    setEditingId(w.id);
    setCurrentStep(1);
    setView("form");
  };

  const closeForm = () => {
    setView("list");
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (!t) return;
    if (form.tags.length >= 3) return toast.info("Maximum 3 tags");
    if (form.tags.includes(t)) return setTagInput("");
    setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  const uploadThumb = async (file) => {
    if (!file) return;
    setThumbUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = unwrap(
        await apiFetch("/upload", { method: "POST", body: fd }),
      );
      if (!res?.url) throw new Error("Upload failed");
      setForm((f) => ({ ...f, thumbnail: res.url }));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setThumbUploading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (form.price === "" || isNaN(Number(form.price)))
      return toast.error("Valid price is required (0 for free)");
    if (!form.date || !form.time)
      return toast.error("Date and start time are required");
    if (form.description.trim().length < 5)
      return toast.error("Description must be at least 5 characters");
    const when = new Date(`${form.date}T${form.time}:00`);
    if (formMode === "create" && when.getTime() < Date.now())
      return toast.error("Schedule must be in the future");

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        thumbnail: form.thumbnail || undefined,
        price: Number(form.price),
        category: "webinar",
        tags: form.tags,
        scheduled_at: when.toISOString(),
        start_time: form.time,
        end_time: null,
        duration: Number(form.duration) || 60,
        max_participants: Number(form.max_participants) || 100,
        status: form.status,
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
        recording_access: form.recording_access,
      };
      if (formMode === "create") {
        await apiFetch("/webinars", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Webinar scheduled 🎉 Zoom meeting is being created");
      } else {
        await apiFetch(`/webinars/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Webinar updated");
      }
      setView("list");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await apiFetch(`/webinars/${toDelete.id}`, { method: "DELETE" });
      toast.success("Webinar deleted");
      setToDelete(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const share = async (w) => {
    await navigator.clipboard.writeText(
      `https://manchly.chottu.link/webinar/${w.id}`,
    );
    toast.success("Webinar link copied");
  };

  const copyZoom = (w) => {
    navigator.clipboard.writeText(
      `Meeting ID: ${w.zoom_meeting_id}\nPassword: ${w.zoom_password}`,
    );
    toast.success("Zoom credentials copied");
  };

  /* =========================================================================
     RENDER FORM / WIZARD PAGE
     ========================================================================= */
  if (view === "form") {
    return (
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "32px 24px",
          color: colors.typography.primaryText,
        }}
      >
        {/* Breadcrumb Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: colors.typography.secondaryText,
            marginBottom: 8,
          }}
        >
          <span
            style={{ cursor: "pointer", hover: { color: "#111" } }}
            onClick={closeForm}
          >
            Webinars
          </span>
          <ChevronRight size={14} />
          <span
            style={{ fontWeight: 600, color: colors.typography.primaryText }}
          >
            {formMode === "create" ? "New Webinar" : "Edit Webinar"}
          </span>
        </div>

        {/* Page Title Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              margin: 0,
              color: "#111827",
            }}
          >
            {formMode === "create"
              ? "Create New Webinar"
              : "Edit Webinar Details"}
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>
            Provide the basic details to set up your live Zoom session.
          </p>
        </div>

        {/* Top Stepper Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: 700,
            margin: "0 auto 36px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 20,
              left: "15%",
              right: "15%",
              height: 2,
              background: "#E5E7EB",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 20,
              left: "15%",
              width:
                currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "70%",
              height: 2,
              background: "#F59E0B",
              zIndex: 0,
              transition: "all 0.3s ease",
            }}
          />

          {[
            { id: 1, label: "Webinar Details", icon: MonitorPlay },
            { id: 2, label: "Schedule & Pricing", icon: VideoIcon },
            { id: 3, label: "Preview & Publish", icon: Eye },
          ].map((step) => {
            const Icon = step.icon;
            const active = currentStep === step.id;
            const completed = currentStep > step.id;
            return (
              <div
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                  zIndex: 1,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active || completed ? "#F59E0B" : "#F3F4F6",
                    color: active || completed ? "#fff" : "#9CA3AF",
                    boxShadow: active
                      ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                      : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {completed ? <Check size={20} /> : <Icon size={20} />}
                </div>
                <span
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#111827" : "#6B7280",
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Main Card Container */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${colors.base.border}`,
            borderRadius: 20,
            padding: 32,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          {/* STEP 1: Webinar Details */}
          {currentStep === 1 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: 32,
                alignItems: "start",
              }}
            >
              {/* Left Column: Form Fields */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label style={lbl}>WEBINAR TITLE *</label>
                    <AiEnhance
                      endpoint="/ai/webinar/enhance"
                      text={form.title}
                      kind="title"
                      tone="punchy"
                      onUse={(t) => setForm((f) => ({ ...f, title: t }))}
                    />
                  </div>
                  <input
                    className="cs-input"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Masterclass in Technical Trading & Options"
                  />
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label style={lbl}>WEBINAR DESCRIPTION</label>
                    <AiEnhance
                      endpoint="/ai/webinar/enhance"
                      text={form.description}
                      kind="description"
                      tone="conversational"
                      onUse={(t) => setForm((f) => ({ ...f, description: t }))}
                    />
                  </div>
                  <textarea
                    className="cs-input"
                    style={{ minHeight: 110, resize: "vertical" }}
                    maxLength={200}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Describe what attendees will learn in this live interactive session..."
                  />
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: 11.5,
                      color:
                        form.description.length < 5
                          ? "#DC2626"
                          : colors.typography.secondaryText,
                      marginTop: 4,
                    }}
                  >
                    {form.description.length}/200
                    {form.description.length < 5
                      ? " · at least 5 characters"
                      : ""}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  <div>
                    <label style={lbl}>STATUS</label>
                    <select
                      className="cs-input"
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      style={{ background: "#fff" }}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>MAX PARTICIPANTS</label>
                    <input
                      className="cs-input"
                      inputMode="numeric"
                      value={form.max_participants}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          max_participants: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="100"
                    />
                  </div>
                </div>

                <div>
                  <label style={lbl}>
                    TAGS{" "}
                    <span style={{ textTransform: "none", fontWeight: 400 }}>
                      (up to 3)
                    </span>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {form.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#FFF8EC",
                          color: "#B45309",
                          borderRadius: 99,
                          padding: "6px 12px",
                          fontSize: 12.5,
                          fontWeight: 700,
                        }}
                      >
                        #{t}
                        <button
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              tags: f.tags.filter((x) => x !== t),
                            }))
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#B45309",
                            padding: 0,
                            display: "flex",
                          }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {form.tags.length < 3 && (
                      <input
                        className="cs-input"
                        style={{
                          width: 160,
                          padding: "8px 12px",
                          fontSize: 13,
                        }}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        onBlur={addTag}
                        placeholder="Add tag + Enter"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Thumbnail Dropzone */}
              <div>
                <label style={lbl}>WEBINAR THUMBNAIL</label>
                <div
                  onClick={() => thumbRef.current?.click()}
                  style={{
                    border: "2px dashed #E5E7EB",
                    borderRadius: 16,
                    background: "#FAFAFA",
                    height: 290,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justify: "center",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                    textAlign: "center",
                    padding: 20,
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.borderColor = "#F59E0B")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.borderColor = "#E5E7EB")
                  }
                >
                  <input
                    ref={thumbRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => uploadThumb(e.target.files?.[0])}
                  />
                  {form.thumbnail ? (
                    <>
                      <img
                        src={form.thumbnail}
                        alt="Cover"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        Click to Change
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          background: "#FFFBEB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#D97706",
                          marginBottom: 14,
                        }}
                      >
                        <Upload size={26} />
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 15,
                          color: "#111827",
                        }}
                      >
                        {thumbUploading
                          ? "Uploading..."
                          : "Upload Webinar Thumbnail"}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}
                      >
                        JPG, PNG, or WebP (Recommended 16:9)
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Schedule & Pricing */}
          {currentStep === 2 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
                maxWidth: 700,
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <label style={lbl}>SCHEDULE DATE *</label>
                  <input
                    className="cs-input"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={lbl}>START TIME *</label>
                  <input
                    className="cs-input"
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
                <div>
                  <label style={lbl}>DURATION (MINS)</label>
                  <input
                    className="cs-input"
                    inputMode="numeric"
                    value={form.duration}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <label style={lbl}>TICKET PRICE (INR) *</label>
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
                    value={form.price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: e.target.value.replace(/[^\d.]/g, ""),
                      })
                    }
                    placeholder="e.g. 499 (0 for free)"
                  />
                </div>
              </div>

              {/* Recording Access Selection Cards */}
              <div>
                <label style={lbl}>RECORDING ACCESS</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginTop: 4,
                  }}
                >
                  <div
                    onClick={() =>
                      setForm({ ...form, recording_access: "lifetime" })
                    }
                    style={{
                      border: `2px solid ${form.recording_access === "lifetime" ? "#2563EB" : "#E5E7EB"}`,
                      background:
                        form.recording_access === "lifetime"
                          ? "#EFF6FF"
                          : "#fff",
                      borderRadius: 14,
                      padding: 18,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 14.5,
                          color: "#111827",
                        }}
                      >
                        Lifetime Access
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "#6B7280",
                          marginTop: 2,
                        }}
                      >
                        Attendees can rewatch session recordings forever
                      </div>
                    </div>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: `2px solid ${form.recording_access === "lifetime" ? "#2563EB" : "#D1D5DB"}`,
                        background:
                          form.recording_access === "lifetime"
                            ? "#2563EB"
                            : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {form.recording_access === "lifetime" && (
                        <Check size={12} color="#fff" />
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      setForm({ ...form, recording_access: "limited" })
                    }
                    style={{
                      border: `2px solid ${form.recording_access === "limited" ? "#2563EB" : "#E5E7EB"}`,
                      background:
                        form.recording_access === "limited"
                          ? "#EFF6FF"
                          : "#fff",
                      borderRadius: 14,
                      padding: 18,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 14.5,
                          color: "#111827",
                        }}
                      >
                        Live Only / Limited
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "#6B7280",
                          marginTop: 2,
                        }}
                      >
                        Access expires automatically 7 days after session ends
                      </div>
                    </div>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: `2px solid ${form.recording_access === "limited" ? "#2563EB" : "#D1D5DB"}`,
                        background:
                          form.recording_access === "limited"
                            ? "#2563EB"
                            : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {form.recording_access === "limited" && (
                        <Check size={12} color="#fff" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {currentStep === 3 && (
            <div
              style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}
            >
              <div
                style={{
                  height: 200,
                  borderRadius: 16,
                  background: form.thumbnail
                    ? `url(${form.thumbnail}) center/cover`
                    : G.heroGold,
                  marginBottom: 20,
                  position: "relative",
                }}
              >
                <span style={{ position: "absolute", top: 12, right: 12 }}>
                  <Badge color="#16A34A" bg="rgba(255,255,255,0.92)">
                    {form.status}
                  </Badge>
                </span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 8px" }}>
                {form.title || "Untitled Webinar"}
              </h2>
              <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 16px" }}>
                {form.description || "No description provided."}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 16,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#374151",
                }}
              >
                <span>
                  🗓️ {form.date || "Date TBA"} at {form.time || "Time TBA"}
                </span>
                <span>⏱️ {form.duration} mins</span>
                <span>
                  🎟️ {Number(form.price) > 0 ? `₹${form.price}` : "Free"}
                </span>
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #E5E7EB",
              marginTop: 32,
              paddingTop: 20,
            }}
          >
            <GoldBtn
              ghost
              onClick={() =>
                currentStep > 1 ? setCurrentStep(currentStep - 1) : closeForm()
              }
              style={{ padding: "12px 28px" }}
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </GoldBtn>

            <div style={{ display: "flex", gap: 12 }}>
              {currentStep < 3 ? (
                <GoldBtn
                  onClick={() => setCurrentStep(currentStep + 1)}
                  style={{ padding: "12px 32px" }}
                >
                  Continue <ChevronRight size={16} />
                </GoldBtn>
              ) : (
                <GoldBtn
                  loading={saving}
                  onClick={save}
                  style={{ padding: "12px 36px" }}
                >
                  {formMode === "create" ? "Schedule Webinar" : "Save Changes"}
                </GoldBtn>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     RENDER MAIN WEBINAR DASHBOARD LIST
     ========================================================================= */
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
            Live{" "}
            <span
              style={{
                background: G.orange,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Webinars
            </span>
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              color: colors.typography.secondaryText,
              fontSize: 14,
            }}
          >
            Schedule Zoom webinars, share the link, go live.
          </p>
        </div>
        <GoldBtn onClick={openCreate}>
          <Plus size={16} /> Schedule Webinar
        </GoldBtn>
      </div>

      {/* Stats Cards */}
      <div
        style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}
      >
        <StatCard
          icon={MonitorPlay}
          label="Total Webinars"
          value={stats?.total_webinars ?? webinars.length}
          tint="#D69C3F"
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming"
          value={
            stats?.upcoming_webinars ??
            webinars.filter((w) => !isPast(w) && w.status !== "DRAFT").length
          }
          tint="#F97316"
        />
        <StatCard
          icon={Users}
          label="Seats Sold"
          value={stats?.webinars_sold ?? stats?.total_enrollments ?? 0}
          tint="#22C55E"
        />
        <StatCard
          icon={IndianRupee}
          label="Webinar Revenue"
          value={formatCurrency(stats?.revenue ?? 0)}
          tint="#F5A623"
        />
      </div>

      {/* Next Webinar Hero */}
      {nextUp && (
        <div
          style={{
            background: G.heroGold,
            borderRadius: 20,
            padding: "24px 28px",
            color: "#fff",
            marginBottom: 26,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: "uppercase",
                opacity: 0.85,
              }}
            >
              <Radio size={13} color={isLive(nextUp) ? "#F87171" : "#fff"} />{" "}
              {isLive(nextUp) ? "Live now" : "Next webinar"}
            </div>
            <div style={{ fontSize: 21, fontWeight: 900, margin: "6px 0 4px" }}>
              {nextUp.title}
            </div>
            <div style={{ fontSize: 13.5, opacity: 0.8 }}>
              {startDate(nextUp)?.toLocaleString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · {nextUp.duration || 60} min
              {nextUp.zoom_meeting_id && (
                <> · Zoom ID {nextUp.zoom_meeting_id}</>
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <Countdown target={startDate(nextUp)?.getTime() || 0} />
            {nextUp.zoom_start_url ? (
              <button
                onClick={() => window.open(nextUp.zoom_start_url, "_blank")}
                style={{
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 12,
                  padding: "13px 22px",
                  fontWeight: 900,
                  fontSize: 14.5,
                  fontFamily: "inherit",
                  background: "#fff",
                  color: "#92400E",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
                }}
              >
                <Video size={17} /> Start Meeting
              </button>
            ) : (
              <span style={{ fontSize: 12.5, opacity: 0.75 }}>
                Zoom link provisioning…
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: `1.5px solid ${colors.base.border}`,
            borderRadius: 12,
            padding: "9px 14px",
            minWidth: 260,
          }}
        >
          <Search size={15} color="#9CA3AF" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search webinars..."
            style={{
              border: "none",
              outline: "none",
              fontSize: 14,
              fontFamily: "inherit",
              flex: 1,
              background: "transparent",
            }}
          />
        </div>
        <div className="cs-seg" style={{ flex: "0 0 auto" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className={filter === f ? "on" : ""}
              onClick={() => setFilter(f)}
              style={{ padding: "8px 18px" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="mn-shimmer"
              style={{ height: 300, borderRadius: 18, opacity: 0.3 }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${colors.base.border}`,
            borderRadius: 18,
          }}
        >
          <EmptyState
            icon="📡"
            title={
              webinars.length === 0
                ? "Schedule your first webinar"
                : `No ${filter.toLowerCase()} webinars`
            }
            subtitle={
              webinars.length === 0
                ? "Pick a date, set a price — we auto-create the Zoom meeting for you."
                : "Try a different filter or search."
            }
            action={
              webinars.length === 0 && (
                <GoldBtn onClick={openCreate}>
                  <Plus size={16} /> Schedule Webinar
                </GoldBtn>
              )
            }
          />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((w) => {
            const s = startDate(w);
            const live = isLive(w);
            const past = isPast(w);
            return (
              <div
                key={w.id}
                style={{
                  background: "#fff",
                  border: `1px solid ${live ? "#FCA5A5" : colors.base.border}`,
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: live
                    ? "0 10px 30px rgba(239,68,68,0.15)"
                    : "0 4px 14px rgba(31,41,55,0.05)",
                }}
              >
                <div
                  style={{
                    height: 130,
                    position: "relative",
                    background: w.thumbnail
                      ? `url(${w.thumbnail}) center/cover`
                      : G.heroGold,
                  }}
                >
                  {s && (
                    <span
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "#fff",
                        borderRadius: 12,
                        padding: "7px 12px",
                        textAlign: "center",
                        lineHeight: 1.1,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: 17,
                          fontWeight: 900,
                          color: "#1F2937",
                        }}
                      >
                        {s.getDate()}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: "#B45309",
                          textTransform: "uppercase",
                        }}
                      >
                        {s.toLocaleString("en-IN", { month: "short" })}
                      </span>
                    </span>
                  )}
                  <span style={{ position: "absolute", top: 12, right: 12 }}>
                    {live ? (
                      <Badge color="#DC2626" bg="rgba(255,255,255,0.92)">
                        ● Live
                      </Badge>
                    ) : w.status === "DRAFT" ? (
                      <Badge color="#B45309" bg="rgba(255,255,255,0.92)">
                        Draft
                      </Badge>
                    ) : past ? (
                      <Badge color="#6B7280" bg="rgba(255,255,255,0.92)">
                        Completed
                      </Badge>
                    ) : (
                      <Badge color="#16A34A" bg="rgba(255,255,255,0.92)">
                        Upcoming
                      </Badge>
                    )}
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      background: "rgba(10,10,14,0.7)",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 99,
                      fontSize: 12.5,
                      fontWeight: 900,
                    }}
                  >
                    {Number(w.price) > 0 ? formatCurrency(w.price) : "Free"}
                  </span>
                </div>

                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 15.5,
                      minHeight: 42,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {w.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: colors.typography.secondaryText,
                      fontSize: 12.5,
                      marginTop: 7,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Clock size={12} />{" "}
                      {s
                        ? s.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "TBA"}{" "}
                      · {w.duration || 60} min
                    </span>
                    {w.max_participants && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Users size={12} /> {w.max_participants} seats
                      </span>
                    )}
                  </div>
                  {Array.isArray(w.tags) && w.tags.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginTop: 9,
                      }}
                    >
                      {w.tags.slice(0, 3).map((t, i) => (
                        <span
                          key={i}
                          style={{
                            background: "#FFF8EC",
                            color: "#B45309",
                            borderRadius: 99,
                            padding: "3px 10px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {w.zoom_meeting_id && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "#FFF8EC",
                        border: "1px solid #F0DDB0",
                        borderRadius: 10,
                        padding: "8px 12px",
                        marginTop: 12,
                        fontSize: 12.5,
                      }}
                    >
                      <span style={{ color: "#92400E" }}>
                        Zoom <b>{w.zoom_meeting_id}</b> · Pass{" "}
                        <b>{w.zoom_password || "—"}</b>
                      </span>
                      <button
                        className="cs-icon-btn"
                        style={{ width: 28, height: 28 }}
                        title="Copy Zoom credentials"
                        onClick={() => copyZoom(w)}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 14,
                      alignItems: "center",
                    }}
                  >
                    {!past && w.status !== "DRAFT" && w.zoom_start_url && (
                      <GoldBtn
                        style={{
                          padding: "8px 14px",
                          fontSize: 13,
                          flex: 1,
                          justifyContent: "center",
                        }}
                        onClick={() => window.open(w.zoom_start_url, "_blank")}
                      >
                        <Video size={14} /> Start
                      </GoldBtn>
                    )}
                    <button
                      className="cs-icon-btn"
                      title="Copy share link"
                      onClick={() => share(w)}
                    >
                      <Share2 size={15} />
                    </button>
                    <button
                      className="cs-icon-btn"
                      title="Edit"
                      onClick={() => openEdit(w)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="cs-icon-btn danger"
                      title="Delete"
                      onClick={() => setToDelete(w)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete webinar?"
        width={420}
      >
        <p
          style={{
            color: colors.typography.secondaryText,
            fontSize: 14,
            marginTop: 0,
          }}
        >
          "<b>{toDelete?.title}</b>" will be permanently deleted. Registered
          attendees will lose access.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <GoldBtn ghost onClick={() => setToDelete(null)}>
            Cancel
          </GoldBtn>
          <GoldBtn danger onClick={confirmDelete}>
            <Trash2 size={15} /> Delete
          </GoldBtn>
        </div>
      </Modal>
    </div>
  );
}
