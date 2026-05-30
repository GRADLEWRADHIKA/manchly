import { useState, useEffect, useCallback } from "react";
import {
  Video, Calendar, Clock, UserCheck, Layers,
  Plus, Trash2, Edit3, X, Loader, Save,
  Mic, PhoneCall, PhoneOff, Star, DollarSign,
  Activity, BarChart2,
} from "lucide-react";

const T = {
  bg: "#000000",
  card: "#111111",
  cardHigh: "#181818",
  sidebar:"#0A0A0A",
  orange: "#FFC107",
  orangeD:"#FFB300",
  orangeL:"rgba(255,193,7,0.13)",
  green:"#22C55E",
  greenL:"rgba(34,197,94,0.12)",
  red: "#EF4444",
  redL:"rgba(239,68,68,0.12)",
  blue:"#3B82F6",
  blueL:"rgba(59,130,246,0.12)",
  purple:"#A855F7",
  purpleL:"rgba(168,85,247,0.12)",
  border: "rgba(255,255,255,0.08)",
  borderHi:"rgba(255,193,7,0.4)",
  textPri:"#FFFFFF",
  textSec:"#A1A1AA",
  textMut:"#71717A",
};
const API_BASE = "https://server.manchly.com";

const getToken = () => {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("manchly_token");
  return t && t.trim() ? t.trim() : null;
};
class AuthError extends Error {
  constructor(m) { super(m); this.isAuth = true; }
}
async function apiCall(method, path, body = null) {
  const token = getToken();
  if (!token) throw new AuthError("Not authenticated");
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 || res.status === 403)
      throw new AuthError(data?.message || "Unauthorized");
    throw new Error(data?.message || `Error ${res.status}`);
  }
  return data;
}
const API = {
  getStats:() => apiCall("GET","/sessions/stats"),
  getExpertMe:() => apiCall("GET", "/sessions/expert/me"),
  registerExpert: (b) => apiCall("POST","/sessions/expert/register", b),
  updateExpert: (b) => apiCall("PATCH","/sessions/expert/update", b),
  addSlot: (b) => apiCall("POST","/sessions/availability/slot", b),
  deleteSlot:(id) => apiCall("DELETE", `/sessions/availability/${id}`),
  createProduct:(b) => apiCall("POST","/sessions/products", b),
  updateProduct:(id, b) => apiCall("PATCH", `/sessions/products/${id}`, b),
  deleteProduct:(id)  => apiCall("DELETE", `/sessions/products/${id}`),
  acceptSession:(id) => apiCall("PATCH",  `/sessions/${id}/accept`),
  endSession:(id) => apiCall("PATCH", `/sessions/${id}/end`),
};

//MOCK DATA
const MOCK_EXPERT = {
  id: "exp_01", name: "Rahul Sharma",
  headline: "Options Trader & Startup Mentor",
  bio: "10+ years in equity derivatives and venture building. Helped 200+ founders.",
  category: "Trading", audio_rate: 15, video_rate: 25,
  avg_rating: 4.8, total_calls: 312, is_registered: true,
};

const MOCK_PRODUCTS = [
  { id:"p1", title:"30-min Strategy Review", duration:30, price:1499, type:"video", sessions_sold:48 },
  { id:"p2", title:"60-min Deep Dive", duration:60, price:2799, type:"video", sessions_sold:21 },
  { id:"p3", title:"Quick Audio Check-in", duration:15, price:599,  type:"audio", sessions_sold:89 },
];

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const MOCK_SLOTS = {
  Monday: [{ id:"sl1", start:"09:00", end:"11:00" }, { id:"sl2", start:"15:00", end:"17:00" }],
  Wednesday:[{ id:"sl3", start:"10:00", end:"12:00" }],
  Friday:[{ id:"sl4", start:"14:00", end:"16:00" }, { id:"sl5", start:"18:00", end:"20:00" }],
};

const MOCK_INCOMING = [
  { id:"ses1", learner:"Priya Nair",  product:"30-min Strategy Review", status:"PENDING",time:"Today 4:00 PM",amount:1499, initials:"PN" },
  { id:"ses2", learner:"Amit Verma", product:"Quick Audio Check-in", status:"LIVE", time:"NOW",amount:599,  initials:"AV" },
  { id:"ses3", learner:"Kavya Singh", product:"60-min Deep Dive",status:"PENDING",time:"Tomorrow 11 AM", amount:2799, initials:"KS" },
  { id:"ses4", learner:"Dev Patel",  product:"30-min Strategy Review",status:"COMPLETED", time:"Yesterday", amount:1499, initials:"DP" },
];
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "info", ms = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999,
      display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type==="error"?"#1a0000":t.type==="success"?"#001a0a":"#111",
          border:`1px solid ${t.type==="error"?T.red:t.type==="success"?T.green:T.orange}44`,
          borderRadius:10, padding:"10px 16px",
          display:"flex", alignItems:"center", gap:10,
          boxShadow:"0 8px 24px rgba(0,0,0,0.6)", minWidth:280,
          animation:"slideIn 0.25s ease",
        }}>
          <span>{t.type==="error"?"❌":t.type==="success"?"✅":"⏳"}</span>
          <span style={{ fontSize:13, color:T.textSec }}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
function Avatar({ initials, color = T.orange, size = 36 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:`${color}22`, border:`1.5px solid ${color}44`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.32, fontWeight:700, color, flexShrink:0,
    }}>{initials}</div>
  );
}
function GoldBtn({ children, onClick, outline=false, small=false,
  loading=false, disabled=false, danger=false }) {
  const [h, setH] = useState(false);
  const col = danger ? T.red : T.orange;
  return (
    <button onClick={onClick} disabled={loading || disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: outline ? "transparent"
          : (h && !loading ? (danger ? "#DC2626" : T.orangeD) : (danger ? T.redL : T.orange)),
        border:`1.5px solid ${col}`,
        color: outline ? (h ? col : T.textSec) : (danger && outline ? col : "#000"),
        padding: small ? "5px 12px" : "9px 20px",
        borderRadius:9, fontSize:small?11.5:13, fontWeight:700,
        cursor: loading||disabled ? "not-allowed" : "pointer",
        display:"inline-flex", alignItems:"center", gap:6,
        transition:"all 0.18s", opacity:loading||disabled?0.75:1, whiteSpace:"nowrap",
      }}>
      {loading && <Loader size={12} style={{ animation:"spin 1s linear infinite" }}/>}
      {children}
    </button>
  );
}
function SectionCard({ title, subtitle, icon: Icon, iconColor=T.orange, children, action }) {
  return (
    <div style={{ background:T.card, borderRadius:16,
      border:`1px solid ${T.border}`, overflow:"hidden" }}>
      <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:`${iconColor}18`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon size={15} style={{ color:iconColor }}/>
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:T.textPri, margin:0 }}>{title}</p>
            {subtitle && <p style={{ fontSize:11, color:T.textMut, marginTop:1 }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  );
}
function StatPill({ label, value, color = T.orange }) {
  return (
    <div style={{ background:`${color}0F`, border:`1px solid ${color}28`,
      borderRadius:10, padding:"12px 16px", textAlign:"center" }}>
      <p style={{ fontSize:20, fontWeight:900, color, margin:0 }}>{value}</p>
      <p style={{ fontSize:10.5, color:T.textMut, marginTop:3 }}>{label}</p>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder="", type="text", required=false }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && (
        <label style={{ fontSize:11.5, fontWeight:600, color:T.textSec }}>
          {label}{required && <span style={{ color:T.red }}> *</span>}
        </label>
      )}
      <input value={value} type={type} placeholder={placeholder} onChange={onChange}
        style={{ background:"#0D0D0D", border:`1px solid ${T.border}`, borderRadius:8,
          padding:"9px 12px", color:T.textPri, fontSize:13, outline:"none",
          width:"100%", fontFamily:"inherit" }}
        onFocus={e => e.target.style.borderColor = T.orange}
        onBlur={e  => e.target.style.borderColor = T.border}/>
    </div>
  );
}
function StatusBadge({ status }) {
  const map = {
    PENDING:   { color:T.orange, bg:T.orangeL, dot:T.orange },
    LIVE:      { color:T.red,    bg:T.redL,    dot:T.red    },
    COMPLETED: { color:T.green,  bg:T.greenL,  dot:T.green  },
    SCHEDULED: { color:T.blue,   bg:T.blueL,   dot:T.blue   },
  };
  const s = map[status] || map.PENDING;
  return (
    <span style={{ background:s.bg, color:s.color, borderRadius:20, padding:"3px 10px",
      fontSize:10.5, fontWeight:700, display:"inline-flex", alignItems:"center", gap:4 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot }}/>
      {status}
    </span>
  );
}

function CreatorStatsBar() {
  const [stats,setStats] = useState({ total_sessions:312, total_earned:"₹4.8L", avg_rating:4.8, live_now:1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    setLoading(true);
    API.getStats()
      .then(d => setStats(s => ({ ...s, ...(d?.stats || d || {}) })))
      .catch(e => { if (!e.isAuth) console.warn("[CreatorStatsBar]", e.message); })
      .finally(() => setLoading(false));
  }, []);

  const rows = [
    { label:"Total Sessions", value:stats.total_sessions, icon:Video, color:T.orange },
    { label:"Total Earned", value:stats.total_earned, icon:DollarSign, color:T.green  },
    { label:"Avg Rating",value:`★ ${stats.avg_rating}`, icon:Star, color:T.orange },
    { label:"Live Now", value:stats.live_now,icon:Activity, color:T.red },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
      {rows.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`,
            borderRadius:12, padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:`${s.color}18`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon size={13} style={{ color:s.color }}/>
              </div>
              <span style={{ fontSize:11, color:T.textMut }}>{s.label}</span>
            </div>
            <p style={{ fontSize:20, fontWeight:900, color:s.color, margin:0,
              opacity:loading?0.4:1, transition:"opacity 0.3s" }}>
              {loading ? "…" : s.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
function ExpertProfileSection({ toast }) {
  const [expert, setExpert]  = useState(MOCK_EXPERT);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    headline: MOCK_EXPERT.headline,
    bio: MOCK_EXPERT.bio,
    category: MOCK_EXPERT.category,
    audio_rate: MOCK_EXPERT.audio_rate,
    video_rate: MOCK_EXPERT.video_rate,
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setLoading(true);
    try {
      const fn   = expert.is_registered ? API.updateExpert : API.registerExpert;
      const data = await fn(form);
      setExpert(prev => ({ ...prev, ...form, ...(data?.expert || {}) }));
      setEditing(false);
      toast(expert.is_registered ? "Profile updated!" : "Expert account created!", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally { setLoading(false); }
  };

  if (!expert.is_registered || editing) {
    return (
      <SectionCard
        title={expert.is_registered ? "Edit Expert Profile" : "Register as Expert"}
        subtitle={expert.is_registered ? "PATCH /sessions/expert/update" : "POST /sessions/expert/register"}
        icon={UserCheck} iconColor={T.purple}
        action={editing && (
          <button onClick={() => setEditing(false)}
            style={{ background:"transparent", border:"none", color:T.textMut, cursor:"pointer" }}>
            <X size={15}/>
          </button>
        )}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div style={{ gridColumn:"1/-1" }}>
            <FieldInput label="Headline" value={form.headline} onChange={set("headline")}
              placeholder="e.g. Options Trader & Startup Mentor" required/>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ fontSize:11.5, fontWeight:600, color:T.textSec,
              display:"block", marginBottom:6 }}>Bio</label>
            <textarea value={form.bio} onChange={set("bio")} rows={3}
              placeholder="Your expertise, experience, achievements..."
              style={{ background:"#0D0D0D", border:`1px solid ${T.border}`, borderRadius:8,
                padding:"9px 12px", color:T.textPri, fontSize:13, outline:"none",
                width:"100%", resize:"vertical", fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e  => e.target.style.borderColor = T.border}/>
          </div>
          <div>
            <label style={{ fontSize:11.5, fontWeight:600, color:T.textSec,
              display:"block", marginBottom:6 }}>Category</label>
            <select value={form.category} onChange={set("category")}
              style={{ background:"#0D0D0D", border:`1px solid ${T.border}`, borderRadius:8,
                padding:"9px 12px", color:T.textPri, fontSize:13, outline:"none",
                width:"100%", fontFamily:"inherit", cursor:"pointer" }}>
              {["Trading","Design","Business","Finance","Marketing","Tech"].map(c =>
                <option key={c}>{c}</option>
              )}
            </select>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <FieldInput label="Audio Rate (₹/min)" value={form.audio_rate}
              onChange={set("audio_rate")} type="number"/>
            <FieldInput label="Video Rate (₹/min)" value={form.video_rate}
              onChange={set("video_rate")} type="number"/>
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:18 }}>
          <GoldBtn onClick={handleSave} loading={loading}>
            <Save size={13}/>
            {expert.is_registered ? "Save Changes" : "Create Expert Profile"}
          </GoldBtn>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Expert Profile" subtitle="GET /sessions/expert/me"
      icon={UserCheck} iconColor={T.purple}
      action={<GoldBtn small outline onClick={() => setEditing(true)}><Edit3 size={12}/>Edit</GoldBtn>}>
      <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
        <Avatar initials={expert.name.split(" ").map(n => n[0]).join("")} color={T.orange} size={56}/>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:16, fontWeight:800, color:T.textPri, marginBottom:3 }}>{expert.name}</p>
          <p style={{ fontSize:13, color:T.orange, marginBottom:6 }}>{expert.headline}</p>
          <p style={{ fontSize:12, color:T.textSec, lineHeight:1.6, marginBottom:14 }}>{expert.bio}</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            <StatPill label="Avg Rating"   value={`★ ${expert.avg_rating}`} color={T.orange}/>
            <StatPill label="Total Calls"  value={expert.total_calls}        color={T.purple}/>
            <StatPill label="Audio ₹/min"  value={`₹${expert.audio_rate}`}  color={T.green}/>
            <StatPill label="Video ₹/min"  value={`₹${expert.video_rate}`}  color={T.blue}/>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
function AvailabilityManager({ toast }) {
  const [slots, setSlots] = useState(MOCK_SLOTS);
  const [adding,setAdding] = useState(null);
  const [newSlot,setNewSlot] = useState({ start:"09:00", end:"10:00" });
  const [delLoading, setDelLoading] = useState(null);

  const handleAdd = async () => {
    if (!adding) return;
    try {
      const data = await API.addSlot({ day:adding, start:newSlot.start, end:newSlot.end });
      const slot = data?.slot || { id:`sl_${Date.now()}`, ...newSlot };
      setSlots(prev => ({ ...prev, [adding]: [...(prev[adding] || []), slot] }));
      setAdding(null);
      toast(`Slot added for ${adding}.`, "success");
    } catch (err) { toast(err.message, "error"); }
  };

  const handleDelete = async (day, slotId) => {
    setDelLoading(slotId);
    try {
      await API.deleteSlot(slotId);
      setSlots(prev => ({ ...prev, [day]: prev[day].filter(s => s.id !== slotId) }));
      toast("Slot removed.", "success");
    } catch (err) { toast(err.message, "error"); }
    finally { setDelLoading(null); }
  };

  return (
    <SectionCard title="Weekly Availability"
      subtitle="POST /sessions/availability/slot · DELETE /sessions/availability/:id"
      icon={Calendar} iconColor={T.blue}>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {DAYS.map(day => (
          <div key={day} style={{ borderRadius:10, border:`1px solid ${T.border}`,
            background:"#0A0A0A", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"10px 14px",
              borderBottom: slots[day]?.length || adding===day ? `1px solid ${T.border}` : "none" }}>
              <span style={{ fontSize:12.5, fontWeight:700, color:T.textPri, minWidth:90 }}>{day}</span>
              <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                {slots[day]?.map(s => (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:5,
                    background:T.orangeL, border:`1px solid ${T.borderHi}`,
                    borderRadius:20, padding:"3px 10px", fontSize:11.5, color:T.orange, fontWeight:600 }}>
                    <Clock size={10}/>{s.start}–{s.end}
                    <button onClick={() => handleDelete(day, s.id)} disabled={delLoading===s.id}
                      style={{ background:"transparent", border:"none", color:T.red,
                        cursor:"pointer", display:"flex", alignItems:"center", padding:0, marginLeft:2 }}>
                      {delLoading===s.id
                        ? <Loader size={9} style={{ animation:"spin 1s linear infinite" }}/>
                        : <X size={9}/>}
                    </button>
                  </div>
                ))}
                <button onClick={() => setAdding(adding===day ? null : day)}
                  style={{ background:T.orangeL, border:`1px solid ${T.borderHi}`,
                    color:T.orange, borderRadius:20, padding:"3px 9px",
                    fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
                  <Plus size={10}/> Add Slot
                </button>
              </div>
            </div>
            {adding===day && (
              <div style={{ padding:"10px 14px", display:"flex", gap:10, alignItems:"center",
                background:"rgba(255,193,7,0.04)" }}>
                <input type="time" value={newSlot.start}
                  onChange={e => setNewSlot(p => ({ ...p, start:e.target.value }))}
                  style={{ background:"#0D0D0D", border:`1px solid ${T.border}`, borderRadius:7,
                    padding:"6px 10px", color:T.textPri, fontSize:12, outline:"none", fontFamily:"inherit" }}/>
                <span style={{ color:T.textMut, fontSize:12 }}>to</span>
                <input type="time" value={newSlot.end}
                  onChange={e => setNewSlot(p => ({ ...p, end:e.target.value }))}
                  style={{ background:"#0D0D0D", border:`1px solid ${T.border}`, borderRadius:7,
                    padding:"6px 10px", color:T.textPri, fontSize:12, outline:"none", fontFamily:"inherit" }}/>
                <GoldBtn small onClick={handleAdd}>Confirm</GoldBtn>
                <button onClick={() => setAdding(null)}
                  style={{ background:"transparent", border:"none", color:T.textMut, cursor:"pointer" }}>
                  <X size={14}/>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
function ProductsShelf({ toast }) {
  const [products,setProducts] = useState(MOCK_PRODUCTS);
  const [showCreate,setShowCreate] = useState(false);
  const [editTarget,setEditTarget] = useState(null);
  const [delLoading, setDelLoading]  = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const EMPTY = { title:"", duration:30, price:"", type:"video" };
  const [form, setForm] = useState(EMPTY);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const openCreate = () => { setForm(EMPTY); setEditTarget(null); setShowCreate(true); };
  const openEdit   = p   => {
    setForm({ title:p.title, duration:p.duration, price:p.price, type:p.type });
    setEditTarget(p);
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.price) { toast("Title and price are required.", "error"); return; }
    setSaveLoading(true);
    try {
      const payload = { ...form, price:Number(form.price), duration:Number(form.duration) };
      if (editTarget) {
        const data = await API.updateProduct(editTarget.id, payload);
        setProducts(prev => prev.map(p =>
          p.id===editTarget.id ? { ...p, ...payload, ...(data?.product||{}) } : p));
        toast("Product updated.", "success");
      } else {
        const data = await API.createProduct(payload);
        setProducts(prev => [...prev, data?.product || { ...payload, id:`p_${Date.now()}`, sessions_sold:0 }]);
        toast("Product created!", "success");
      }
      setShowCreate(false);
    } catch (err) { toast(err.message, "error"); }
    finally { setSaveLoading(false); }
  };

  const handleDelete = async (id) => {
    setDelLoading(id);
    try {
      await API.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast("Product deleted.", "success");
    } catch (err) { toast(err.message, "error"); }
    finally { setDelLoading(null); }
  };

  return (
    <SectionCard title="Consulting Products"
      subtitle="POST · PATCH · DELETE /sessions/products"
      icon={Layers} iconColor={T.green}
      action={<GoldBtn small onClick={openCreate}><Plus size={13}/>New Product</GoldBtn>}>

      {showCreate && (
        <div style={{ background:"#0A0A0A", border:`1px solid ${T.borderHi}`,
          borderRadius:12, padding:18, marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <p style={{ fontSize:13, fontWeight:700, color:T.textPri, margin:0 }}>
              {editTarget ? "Edit Product" : "New Product"}
            </p>
            <button onClick={() => setShowCreate(false)}
              style={{ background:"transparent", border:"none", color:T.textMut, cursor:"pointer" }}>
              <X size={14}/>
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <FieldInput label="Title" value={form.title} onChange={set("title")}
                placeholder='"30-min Strategy Review"' required/>
            </div>
            <FieldInput label="Price (₹)" value={form.price} onChange={set("price")} type="number" required/>
            <FieldInput label="Duration (min)" value={form.duration} onChange={set("duration")} type="number"/>
            <div>
              <label style={{ fontSize:11.5, fontWeight:600, color:T.textSec,
                display:"block", marginBottom:6 }}>Type</label>
              <select value={form.type} onChange={set("type")}
                style={{ background:"#0D0D0D", border:`1px solid ${T.border}`, borderRadius:8,
                  padding:"9px 12px", color:T.textPri, fontSize:13, outline:"none",
                  width:"100%", fontFamily:"inherit" }}>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <GoldBtn outline small onClick={() => setShowCreate(false)}>Cancel</GoldBtn>
            <GoldBtn small onClick={handleSave} loading={saveLoading}>
              <Save size={12}/>{editTarget ? "Save Changes" : "Create"}
            </GoldBtn>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {products.map(p => (
          <div key={p.id}
            style={{ background:"#0A0A0A", border:`1px solid ${T.border}`,
              borderRadius:12, padding:14, transition:"border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHi}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
              {p.type==="audio"
                ? <Mic size={14} style={{ color:T.purple }}/>
                : <Video size={14} style={{ color:T.blue }}/>}
              <span style={{ fontSize:10, fontWeight:700, borderRadius:20, padding:"1px 7px",
                color:p.type==="audio"?T.purple:T.blue,
                background:p.type==="audio"?T.purpleL:T.blueL }}>
                {p.type.toUpperCase()}
              </span>
              <span style={{ fontSize:10, color:T.textMut, marginLeft:"auto" }}>{p.duration} min</span>
            </div>
            <p style={{ fontSize:13, fontWeight:700, color:T.textPri, lineHeight:1.35, marginBottom:6 }}>{p.title}</p>
            <p style={{ fontSize:17, fontWeight:900, color:T.orange, marginBottom:4 }}>₹{p.price.toLocaleString()}</p>
            <p style={{ fontSize:10.5, color:T.textMut, marginBottom:12 }}>{p.sessions_sold} sessions sold</p>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={() => openEdit(p)}
                style={{ flex:1, background:T.orangeL, border:"none", color:T.orange,
                  borderRadius:7, padding:"5px 0", cursor:"pointer", fontSize:11.5, fontWeight:600,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                <Edit3 size={10}/>Edit
              </button>
              <button onClick={() => handleDelete(p.id)} disabled={delLoading===p.id}
                style={{ flex:1, background:T.redL, border:"none", color:T.red,
                  borderRadius:7, padding:"5px 0", cursor:"pointer", fontSize:11.5, fontWeight:600,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                {delLoading===p.id
                  ? <Loader size={10} style={{ animation:"spin 1s linear infinite" }}/>
                  : <Trash2 size={10}/>}
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function IncomingStream({ toast }) {
  const [sessions,setSessions] = useState(MOCK_INCOMING);
  const [actLoading, setActLoading] = useState(null);
  const handleAccept = async (id) => {
    setActLoading(id + "_accept");
    try {
      await API.acceptSession(id);
      setSessions(prev => prev.map(s => s.id===id ? { ...s, status:"LIVE" } : s));
      toast("Session accepted — you're now LIVE!", "success");
    } catch (err) { toast(err.message, "error"); }
    finally { setActLoading(null); }
  };

  const handleEnd = async (id) => {
    setActLoading(id + "_end");
    try {
      await API.endSession(id);
      setSessions(prev => prev.map(s => s.id===id ? { ...s, status:"COMPLETED" } : s));
      toast("Session ended.", "success");
    } catch (err) { toast(err.message, "error"); }
    finally { setActLoading(null); }
  };

  return (
    <SectionCard title="Incoming Session Stream"
      subtitle="PATCH /sessions/:id/accept · PATCH /sessions/:id/end"
      icon={PhoneCall} iconColor={T.red}>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {sessions.map(s => (
          <div key={s.id} style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"12px 14px", borderRadius:11, background:"#0A0A0A",
            border:`1px solid ${s.status==="LIVE"?`${T.red}44`:s.status==="PENDING"?`${T.orange}33`:T.border}`,
            transition:"all 0.2s",
          }}>
            {s.status==="LIVE" && (
              <div style={{ width:8, height:8, borderRadius:"50%", background:T.red,
                boxShadow:`0 0 8px ${T.red}`, animation:"pulse 1.2s infinite", flexShrink:0 }}/>
            )}
            <Avatar initials={s.initials} color={s.status==="LIVE" ? T.red : T.orange} size={34}/>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:700, color:T.textPri }}>{s.learner}</p>
              <p style={{ fontSize:11, color:T.textMut }}>{s.product} · {s.time}</p>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:T.orange, flexShrink:0 }}>₹{s.amount}</span>
            <StatusBadge status={s.status}/>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              {s.status==="PENDING" && (
                <GoldBtn small onClick={() => handleAccept(s.id)}
                  loading={actLoading===s.id+"_accept"}>
                  <UserCheck size={12}/>Accept
                </GoldBtn>
              )}
              {s.status==="LIVE" && (
                <GoldBtn small danger outline onClick={() => handleEnd(s.id)}
                  loading={actLoading===s.id+"_end"}>
                  <PhoneOff size={12}/>End Call
                </GoldBtn>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
export default function SessionHubCreator() {
  const { toasts, push: toast } = useToast();

  return (
    <div style={{ minHeight:"100vh", background:T.bg,
      fontFamily:"'Segoe UI',system-ui,sans-serif", color:T.textPri }}>
      {/* Header */}
      <div style={{ background:T.sidebar, borderBottom:`1px solid ${T.border}`,
        padding:"16px 26px", display:"flex", alignItems:"center",
        justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:4, height:24, background:T.orange, borderRadius:3 }}/>
          <h1 style={{ fontSize:18, fontWeight:800, color:T.textPri, margin:0 }}>Sessions Hub</h1>
          <span style={{ fontSize:11, color:T.textMut,
            background:"rgba(255,255,255,0.05)", padding:"3px 10px", borderRadius:20 }}>
            👑 Creator Hub
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"22px 26px", display:"flex", flexDirection:"column", gap:18 }}>
        <CreatorStatsBar/>
        <ExpertProfileSection toast={toast}/>
        <div style={{ display:"grid", gridTemplateColumns:"1.1fr 0.9fr", gap:18 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <AvailabilityManager toast={toast}/>
            <IncomingStream toast={toast}/>
          </div>
          <ProductsShelf toast={toast}/>
        </div>
      </div>
      <ToastStack toasts={toasts}/>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#0A0A0A; }
        ::-webkit-scrollbar-thumb { background:#222; border-radius:4px; }
        button, input, textarea, select { font-family:inherit; }
        select option { background:#111; color:#fff; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}