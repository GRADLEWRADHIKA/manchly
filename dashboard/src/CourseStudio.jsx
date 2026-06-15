import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play, Plus, CheckCircle, Upload, Eye, Edit3, Trash2,
  ChevronRight, ChevronLeft, Users, Star, DollarSign,
  BarChart2, X, Loader, AlertTriangle, RefreshCw,
  Save, Video, Activity,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════ */
const T = {
  bg:       "#000000",
  card:     "#111111",
  cardHigh: "#161616",
  sidebar:  "#0A0A0A",
  orange:   "#FFC107",
  orangeD:  "#FFB300",
  orangeL:  "rgba(255,193,7,0.15)",
  orangeM:  "#FFE082",
  green:    "#22C55E",
  greenL:   "rgba(34,197,94,0.12)",
  red:      "#EF4444",
  redL:     "rgba(239,68,68,0.12)",
  purple:   "#A855F7",
  purpleL:  "rgba(168,85,247,0.12)",
  blue:     "#3B82F6",
  blueL:    "rgba(59,130,246,0.12)",
  border:   "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,193,7,0.35)",
  textPri:  "#FFFFFF",
  textSec:  "#A1A1AA",
  textMut:  "#8A8A93",
};


import { API_BASE } from "./api";
const getToken = () => {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("manchly_token");
  return t && t.trim().length > 0 ? t.trim() : null;
};

class AuthError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "AuthError";
    this.isAuth = true;
  }
}

async function apiCall(method, path, body = null) {
  const token = getToken();
  if (!token) {
    throw new AuthError("No auth token found. Please log in first.");
  }

  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,   
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new AuthError(
        data?.message || data?.error?.message || "Unauthorized — please log in again."
      );
    }
    throw new Error(data?.message || data?.error?.message || `Error ${res.status}`);
  }
  return data;
}
// Mux direct-upload flow (matches the mobile app + backend contract):
//  1. POST /courses/:id/videos  with a JSON body → returns { video, upload_url }
//     (the endpoint creates the DB row + a Mux direct-upload URL; it does NOT
//      accept the file itself — there is no multer on that route).
//  2. PUT the raw file bytes straight to that Mux upload_url.
async function createVideoUpload(courseId, fields) {
  const token = getToken();
  if (!token) throw new AuthError("No auth token found. Please log in first.");

  const res = await fetch(`${API_BASE}/courses/${courseId}/videos`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body:    JSON.stringify(fields),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 || res.status === 403)
      throw new AuthError(data?.error?.message || data?.message || "Unauthorized");
    throw new Error(data?.error?.message || data?.message || `Upload init error ${res.status}`);
  }
  const payload = data?.data || data;
  if (!payload?.upload_url) throw new Error("Server did not return a Mux upload URL.");
  return payload; // { video, upload_url, upload_id }
}

// PUT the file straight to Mux. The backend creates the upload with
// cors_origin "*", so the browser can upload cross-origin. XHR gives real %.
function putFileToMux(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300)
      ? resolve()
      : reject(new Error(`Mux upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error while uploading the video."));
    xhr.send(file);
  });
}

// Full single-file upload = create record + push bytes to Mux.
async function uploadVideoFile(courseId, file, extraFields = {}, onProgress) {
  const { video, upload_url } = await createVideoUpload(courseId, {
    title:   extraFields.title ?? file.name,
    is_free: extraFields.is_free ?? false,
    order:   extraFields.order ?? 0,
  });
  await putFileToMux(upload_url, file, onProgress);
  return video; // status starts UPLOADING/PROCESSING; VideoRow polls until READY
}

const API = {
  /* Courses */
  getCreatorStats: ()  => apiCall("GET","/courses/stats/creator"),
  getCourse:       (id)  => apiCall("GET", `/courses/${id}`),
  createCourse:    (body) => apiCall("POST", "/courses", body),
  updateCourse:    (id, body) => apiCall("PUT",`/courses/${id}`, body),
  deleteCourse:    (id)  => apiCall("DELETE",`/courses/${id}`),
  /* Videos */
  uploadVideo:     (courseId, file, fields, onProgress) => uploadVideoFile(courseId, file, fields, onProgress),
  getVideoStatus:  (vid) => apiCall("GET", `/courses/videos/${vid}/status`),
  updateVideo:     (vid, body) => apiCall("PUT", `/courses/videos/${vid}`, body),
  deleteVideo:     (vid) => apiCall("DELETE", `/courses/videos/${vid}`),
};

const SEED_COURSES = [
  {
    id: "c1", title: "Advanced Options Trading",
    category: "Trading", price: 999, level: "Advanced",
    language: "English", status: "PUBLISHED",
    students: 234, rating: 4.8, revenue: 233766,
    tags: ["options", "derivatives"],
    curriculum: [
      { id:"v1", title:"Introduction to Options",order:1, duration:"18:22", status:"READY", is_free:true,  uploadPct:100 },
      { id:"v2", title:"Call & Put Strategies", order:2, duration:"31:10", status:"READY", is_free:false, uploadPct:100 },
      { id:"v3", title:"Greeks Explained",  order:3, duration:"24:45", status:"READY", is_free:false, uploadPct:100 },
      { id:"v4", title:"Iron Condor Mastery",  order:4, duration:"29:08", status:"READY", is_free:false, uploadPct:100 },
      { id:"v5", title:"Live Trade Walkthrough", order:5, duration:"38:15", status:"READY", is_free:false, uploadPct:100 },
    ],
  },
  {
    id: "c2", title: "Startup Growth Masterclass",
    category: "Business", price: 699, level: "Intermediate",
    language: "English", status: "DRAFT",
    students: 0, rating: 0, revenue: 0,
    tags: ["startup", "growth"],
    curriculum: [
      { id:"v6", title:"Product-Market Fit",order:1, duration:"22:00", status:"READY", is_free:true,  uploadPct:100 },
      { id:"v7", title:"Growth Hacking Tactics", order:2, duration:"28:40", status:"READY", is_free:false, uploadPct:100 },
    ],
  },
];

const CATEGORIES = ["Trading","Business","Marketing","Finance","Design","Tech"];
const LEVELS = ["Beginner","Intermediate","Advanced"];
const LANGUAGES  = ["English","Hindi","Hinglish"];
const VIDEO_STATUS_MAP = {
  READY: { label:"READY", color:T.green,bg:T.greenL },
  PROCESSING: { label:"PROCESSING", color:T.blue, bg:T.blueL },
  QUEUED: { label:"QUEUED", color:T.textMut, bg:"rgba(255,255,255,0.06)" },
  UPLOADING: { label:"UPLOADING", color:T.orange, bg:T.orangeL },
  ERROR:{ label:"ERROR", color:T.red, bg:T.redL},
};

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "info", ms = 3600) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type==="error" ? "#1a0000" : t.type==="success" ? "#001a0a" : "#111",
          border: `1px solid ${t.type==="error"?T.red:t.type==="success"?T.green:T.orange}44`,
          borderRadius:10, padding:"10px 16px",
          display:"flex", alignItems:"center", gap:10,
          boxShadow:"0 8px 24px rgba(0,0,0,0.6)",
          minWidth:280, maxWidth:380,
          animation:"slideIn 0.25s ease",
        }}>
          <span style={{fontSize:15}}>{t.type==="error"?"❌":t.type==="success"?"✅":"⏳"}</span>
          <span style={{fontSize:13, color:T.textSec, lineHeight:1.45}}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#111", border:`1px solid ${T.redL}`, borderRadius:16, padding:28, width:360, boxShadow:"0 20px 60px rgba(0,0,0,0.9)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <AlertTriangle size={20} style={{ color:T.red, flexShrink:0 }}/>
          <h3 style={{ fontSize:15, fontWeight:700, color:T.textPri, margin:0 }}>{title}</h3>
        </div>
        <p style={{ fontSize:13, color:T.textSec, lineHeight:1.6, marginBottom:22 }}>{message}</p>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onCancel} disabled={loading} style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.textSec, padding:"7px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600 }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ background:T.red, border:"none", color:"#fff", padding:"7px 18px", borderRadius:8, cursor:loading?"not-allowed":"pointer", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6, opacity:loading?0.7:1 }}>
            {loading ? <Loader size={13} style={{ animation:"spin 1s linear infinite" }}/> : <Trash2 size={13}/>}
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditVideoModal({ video, onClose, onSaved, toast }) {
  const [form, setForm]   = useState({ title: video.title, is_free: video.is_free });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const handleSave = async () => {
    if (!form.title.trim()) { toast("Title is required.", "error"); return; }
    setLoading(true);
    try {
      const data = await API.updateVideo(video.id, form);
      toast("Video updated.", "success");
      onSaved({ ...video, ...form, ...(data?.video || {}) });
    } catch (err) {
      toast(err.message || "Could not update video.", "error");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#111", border:`1px solid ${T.borderHi}`, borderRadius:16, padding:26, width:400, boxShadow:"0 20px 60px rgba(0,0,0,0.9)" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:4, height:20, background:T.orange, borderRadius:3 }}/>
            <h3 style={{ fontSize:14, fontWeight:700, color:T.textPri, margin:0 }}>Edit Video</h3>
            <span style={{ fontSize:9.5, background:T.orangeL, color:T.orange, borderRadius:20, padding:"2px 8px", fontWeight:700, fontFamily:"monospace" }}>
              PUT /courses/videos/{video.id}
            </span>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:T.textMut, cursor:"pointer" }}><X size={15}/></button>
        </div>
        {/* Fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:11.5, fontWeight:600, color:T.textSec }}>Video Title <span style={{ color:T.red }}>*</span></label>
            <input value={form.title} onChange={set("title")}
              style={{ background:"#0D0D0D", border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", color:T.textPri, fontSize:13, outline:"none", fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e  => e.target.style.borderColor = T.border}
            />
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
            <input type="checkbox" checked={form.is_free} onChange={set("is_free")} style={{ accentColor:T.orange, width:15, height:15 }}/>
            <span style={{ fontSize:12.5, color:T.textSec }}>Mark as Free Preview</span>
            {form.is_free && <span style={{ fontSize:9.5, background:T.greenL, color:T.green, borderRadius:20, padding:"1px 7px", fontWeight:700 }}>FREE</span>}
          </label>
        </div>
        {/* Actions */}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.textSec, padding:"7px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600 }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ background:loading?T.orangeD:T.orange, border:"none", color:"#000", padding:"7px 18px", borderRadius:8, cursor:loading?"not-allowed":"pointer", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
            {loading ? <Loader size={13} style={{ animation:"spin 1s linear infinite" }}/> : <Save size={13}/>}
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoldBtn({ children, onClick, outline=false, small=false, loading=false, disabled=false }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} disabled={loading||disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: outline ? "transparent" : (h&&!loading ? T.orangeD : T.orange),
        border: `1.5px solid ${T.orange}`,
        color: outline ? (h ? T.orange : T.textSec) : "#000",
        padding: small ? "5px 12px" : "8px 18px",
        borderRadius:9, fontSize:small?11.5:13, fontWeight:700,
        cursor: loading||disabled ? "not-allowed" : "pointer",
        display:"inline-flex", alignItems:"center", gap:6,
        transition:"0.18s ease", opacity:loading||disabled?0.75:1,
      }}
    >
      {loading && <Loader size={12} style={{ animation:"spin 1s linear infinite" }}/>}
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder="", type="text", required=false }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:11.5, color:T.textSec, fontWeight:600 }}>
        {label}{required && <span style={{ color:T.red }}> *</span>}
      </label>
      <input value={value} type={type} placeholder={placeholder} onChange={onChange}
        style={{ background:"#0D0D0D", border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px", color:"#fff", outline:"none", fontSize:13, fontFamily:"inherit" }}
        onFocus={e => e.target.style.borderColor = T.orange}
        onBlur={e  => e.target.style.borderColor = T.border}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:11.5, color:T.textSec, fontWeight:600 }}>{label}</label>
      <select value={value} onChange={onChange}
        style={{ background:"#0D0D0D", border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px", color:"#fff", outline:"none", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function StatusPill({ status }) {
  const s = VIDEO_STATUS_MAP[status] || VIDEO_STATUS_MAP.PROCESSING;
  return (
    <span style={{ background:s.bg, color:s.color, borderRadius:20, padding:"2px 8px", fontSize:9.5, fontWeight:700 }}>
      {s.label}
    </span>
  );
}

function iconBtn(bg, color) {
  return { width:28, height:28, borderRadius:8, border:"none", background:bg, color, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" };
}

// Duration may be a string ("18:22"), a number of seconds (from Mux), or null.
function fmtDur(d) {
  if (d == null || d === "") return "—";
  if (typeof d === "string") return d;
  const s = Math.max(0, Math.floor(Number(d) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function CreatorCourseCard({ course, selected, onSelect, onDelete, fetchLoading }) {
  const active = selected?.id === course.id;
  return (
    <div style={{
      background: active ? T.cardHigh : T.card,
      border: `1.5px solid ${active ? T.borderHi : T.border}`,
      borderRadius:14, padding:"16px", marginBottom:10,
      cursor:"pointer", transition:"0.2s ease",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"flex-start" }}
           onClick={() => onSelect(course)}>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ display:"flex", gap:8, marginBottom:8, flexWrap:"wrap" }}>
            <span style={{ background:T.purpleL, color:T.purple, fontSize:10, padding:"2px 7px", borderRadius:20, fontWeight:700 }}>{course.category}</span>
            <span style={{ background:course.status==="PUBLISHED"?T.greenL:T.orangeL, color:course.status==="PUBLISHED"?T.green:T.orange, fontSize:10, padding:"2px 7px", borderRadius:20, fontWeight:700 }}>{course.status}</span>
          </div>
          <h3 style={{ fontSize:14, marginBottom:4, fontWeight:700, color:T.textPri, lineHeight:1.3 }}>{course.title}</h3>
          <p style={{ color:T.textMut, fontSize:11 }}>{course.curriculum.length} lessons · {course.students} users</p>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:16, fontWeight:900, color:T.orange }}>₹{course.price}</div>
          {course.rating > 0 && <div style={{ color:T.orange, fontSize:11, marginTop:4 }}>★ {course.rating}</div>}
        </div>
      </div>

      {active && (
        <div style={{ display:"flex", gap:8, marginTop:12, paddingTop:10, borderTop:`1px solid ${T.border}` }}>
          <span style={{ fontSize:9.5, color:T.textMut, background:"rgba(255,255,255,0.04)", borderRadius:20, padding:"2px 8px", fontFamily:"monospace" }}>
            GET /courses/{course.id}
          </span>
          <div style={{ flex:1 }}/>
          <button onClick={e => { e.stopPropagation(); onDelete(course); }}
            style={{ ...iconBtn(T.redL, T.red), borderRadius:7 }}
            title="Delete course">
            <Trash2 size={12}/>
          </button>
          {fetchLoading && <Loader size={14} style={{ color:T.orange, animation:"spin 1s linear infinite", alignSelf:"center" }}/>}
        </div>
      )}
      {active && <div style={{ height:2, background:T.orange, borderRadius:2, boxShadow:`0 0 8px ${T.orange}88`, marginTop:8 }}/>}
    </div>
  );
}

function VideoRow({ video, index, onEdit, onDelete, onStatusUpdate, onToggleFree }) {
  const pollRef    = useRef(null);
  const failsRef   = useRef(0);          
  const MAX_FAILS  = 5;                  

  useEffect(() => {
    if (!["UPLOADING", "PROCESSING"].includes(video.status)) return;
    if (video.id.length <= 4) return;
    if (!getToken()) return;
    failsRef.current = 0;
    pollRef.current = setInterval(async () => {
      try {
        const data = await API.getVideoStatus(video.id);
        const updated = data?.video || data;
        failsRef.current = 0;            

        if (updated?.status) {
          onStatusUpdate(video.id, updated);
          if (!["UPLOADING", "PROCESSING"].includes(updated.status)) {
            clearInterval(pollRef.current); // terminal status — done polling
          }
        }
      } catch (err) {
        if (err?.isAuth) {
          clearInterval(pollRef.current);
          console.warn(`[VideoRow] poll stopped — auth error for video ${video.id}`);
          return;
        }
        failsRef.current += 1;
        if (failsRef.current >= MAX_FAILS) {
          clearInterval(pollRef.current);
          onStatusUpdate(video.id, { ...video, status: "ERROR" });
          console.warn(`[VideoRow] poll stopped after ${MAX_FAILS} failures for video ${video.id}`);
        }
      }
    }, 4000);

    return () => clearInterval(pollRef.current);
  }, [video.id, video.status]); // eslint-disable-line

  const pct = video.uploadPct ?? 0;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"12px 14px", background:T.card,
      border:`1px solid ${T.border}`, borderRadius:10, marginBottom:8,
      transition:"border-color 0.2s",
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,193,7,0.2)"}
    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
    >
      {/* Order badge */}
      <div style={{ width:24, height:24, borderRadius:7, background:T.orangeL, color:T.orange, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>
        {index + 1}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <p style={{ fontSize:13, fontWeight:600, color:T.textPri }}>{video.title}</p>
          <StatusPill status={video.status}/>
          {!["UPLOADING","QUEUED"].includes(video.status) && (
            <button
              onClick={() => onToggleFree && onToggleFree(video)}
              title={video.is_free ? "Free preview — click to make paid" : "Paid — click to make a free preview"}
              aria-label={`Toggle free preview for ${video.title}`}
              style={{
                cursor:"pointer", border:"none", borderRadius:20, padding:"1px 8px",
                fontSize:9, fontWeight:700,
                background: video.is_free ? T.greenL : "rgba(255,255,255,0.06)",
                color: video.is_free ? T.green : T.textMut,
              }}
            >
              {video.is_free ? "FREE" : "PAID"}
            </button>
          )}
        </div>

        <div style={{ display:"flex", gap:8, marginTop:4, alignItems:"center" }}>
          <span style={{ color:T.textMut, fontSize:11 }}>{fmtDur(video.duration)}</span>
          {/* Polling badge */}
          {["UPLOADING","PROCESSING"].includes(video.status) && (
            <span style={{ fontSize:9.5, color:T.blue, display:"flex", alignItems:"center", gap:3 }}>
              <Activity size={9} style={{ animation:"pulse 1.2s infinite" }}/>
              Polling /videos/{video.id}/status
            </span>
          )}
        </div>

        {/* Upload progress bar */}
        {video.status === "UPLOADING" && (
          <div style={{ marginTop:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:10, color:T.textMut }}>Uploading…</span>
              <span style={{ fontSize:10, color:T.orange, fontWeight:700 }}>{pct}%</span>
            </div>
            <div style={{ height:4, background:"rgba(255,255,255,0.05)", borderRadius:999, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:T.orange, transition:"width 0.4s", borderRadius:999 }}/>
            </div>
          </div>
        )}

        {/* Processing shimmer */}
        {video.status === "PROCESSING" && (
          <div style={{ marginTop:8, height:4, background:T.blueL, borderRadius:999, overflow:"hidden", position:"relative" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:`linear-gradient(90deg,transparent,${T.blue},transparent)`, animation:"slide 1.4s linear infinite" }}/>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
        <button onClick={() => onEdit(video)} style={iconBtn(T.orangeL, T.orange)} title="Edit video" aria-label={`Edit ${video.title}`}>
          <Edit3 size={12}/>
        </button>
        <button onClick={() => onDelete(video)} style={iconBtn(T.redL, T.red)} title="Delete video" aria-label={`Delete ${video.title}`}>
          <Trash2 size={12}/>
        </button>
      </div>
    </div>
  );
}

function CurriculumManager({ course, onCurriculumChange, toast }) {
  const fileRef  = useRef(null);

  /* Local video list (mirrors course.curriculum, mutated optimistically) */
  const [videos, setVideos]  = useState(course.curriculum || []);
  const [uploading,setUploading] = useState(false);
  const [batch,setBatch] = useState({ done:0, total:0 });

  /* Delete video confirm */
  const [deleteVideo, setDeleteVideo] = useState(null);
  const [delLoading,  setDelLoading]  = useState(false);

  /* Edit video modal */
  const [editVideo, setEditVideo] = useState(null);

  /* Keep local list in sync when parent course changes */
  useEffect(() => { setVideos(course.curriculum || []); }, [course.id]); 
  // BULK upload: accept many files, upload each (bounded concurrency), real %.
  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const targetCourseId = course.id;
    // base on the MAX existing order (not the count) so prior deletions don't collide
    const baseOrder = videos.reduce((m, v) => Math.max(m, Number(v.order) || 0), 0);
    const items = files.map((file, i) => ({
      file,
      tempId: `temp_${Date.now()}_${i}`,
      order:  baseOrder + i + 1,
    }));

    // optimistic "queued" row for every selected file
    const queuedRows = items.map(it => ({
      id: it.tempId, title: it.file.name, order: it.order,
      duration: null, status: "QUEUED", is_free: false, uploadPct: 0,
    }));
    // local authoritative list — kept OUT of setState updaters so the final
    // onCurriculumChange is a pure call, not a side effect inside a reducer.
    let working = [...videos, ...queuedRows];
    setVideos(working);
    setUploading(true);
    setBatch({ done: 0, total: items.length });

    let done = 0, ok = 0, fail = 0, authFailed = false;
    const replace = (id, makeRow) => {
      working = working.map(v => v.id === id ? makeRow(v) : v);
      setVideos(prev => prev.map(v => v.id === id ? makeRow(v) : v));
    };

    // bounded concurrency so a big drop doesn't saturate the connection
    const CONCURRENCY = Math.min(3, items.length);
    let cursor = 0;
    const worker = async () => {
      while (cursor < items.length && !authFailed) {
        const it = items[cursor++];
        replace(it.tempId, v => ({ ...v, status: "UPLOADING" }));
        try {
          const video = await uploadVideoFile(
            course.id, it.file,
            { title: it.file.name, is_free: false, order: it.order },
            (pct) => setVideos(prev => prev.map(v => v.id === it.tempId ? { ...v, uploadPct: pct } : v)),
          );
          const serverVideo = video
            ? { ...video, uploadPct: 100, status: video.status || "PROCESSING" }
            : { id:`v_${Date.now()}`, title:it.file.name, order:it.order, duration:null, status:"PROCESSING", is_free:false, uploadPct:100 };
          replace(it.tempId, () => serverVideo);
          ok++;
        } catch (err) {
          replace(it.tempId, v => ({ ...v, status:"ERROR", uploadPct:0 }));
          fail++;
          if (err instanceof AuthError) { authFailed = true; toast(err.message || "Please log in again.", "error"); }
        } finally {
          done++;
          setBatch({ done, total: items.length });
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    setUploading(false);
    onCurriculumChange(targetCourseId, working);  // pure call, outside any updater

    if (ok)   toast(`${ok} video${ok > 1 ? "s" : ""} uploaded — processing started.`, "success");
    if (fail && !authFailed) toast(`${fail} upload${fail > 1 ? "s" : ""} failed. Drop them again to retry.`, "error");
  };

  /* ── DELETE /courses/videos/:id ── */
  const confirmDeleteVideo = async () => {
    if (!deleteVideo) return;
    setDelLoading(true);
    try {
      await API.deleteVideo(deleteVideo.id);
      const next = videos.filter(v => v.id !== deleteVideo.id);
      setVideos(next);
      onCurriculumChange(course.id, next);
      toast(`"${deleteVideo.title}" deleted.`, "success");
    } catch (err) {
      toast(err.message || "Could not delete video.", "error");
    } finally {
      setDelLoading(false);
      setDeleteVideo(null);
    }
  };

  /* ── After PUT /courses/videos/:id ── */
  const handleVideoSaved = (updated) => {
    const next = videos.map(v => v.id === updated.id ? updated : v);
    setVideos(next);
    onCurriculumChange(course.id, next);
    setEditVideo(null);
  };

  /* ── Status poll callback from VideoRow ── */
  const handleStatusUpdate = (videoId, updated) => {
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, ...updated } : v));
  };

  /* ── Quick Free/Paid toggle → PUT /courses/videos/:id ── */
  const handleToggleFree = async (video) => {
    const next = !video.is_free;
    setVideos(prev => prev.map(v => v.id === video.id ? { ...v, is_free: next } : v)); // optimistic
    try {
      await API.updateVideo(video.id, { is_free: next });
      onCurriculumChange(course.id, videos.map(v => v.id === video.id ? { ...v, is_free: next } : v));
      toast(`"${video.title}" set to ${next ? "Free preview" : "Paid"}.`, "success");
    } catch (err) {
      setVideos(prev => prev.map(v => v.id === video.id ? { ...v, is_free: !next } : v)); // revert
      toast(err.message || "Could not update lesson.", "error");
    }
  };

  return (
    <>
      {/* Confirm delete video */}
      {deleteVideo && (
        <ConfirmDialog
          title="Delete Video"
          message={`Delete "${deleteVideo.title}"? This cannot be undone and will remove the lesson from the course.`}
          onConfirm={confirmDeleteVideo}
          onCancel={() => setDeleteVideo(null)}
          loading={delLoading}
        />
      )}

      {/* Edit video modal */}
      {editVideo && (
        <EditVideoModal
          video={editVideo}
          onClose={() => setEditVideo(null)}
          onSaved={handleVideoSaved}
          toast={toast}
        />
      )}

      <div style={{ background:T.card, borderRadius:14, padding:18, border:`1px solid ${T.border}` }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16, alignItems:"flex-start" }}>
          <div>
            <h3 style={{ fontSize:15, marginBottom:4, fontWeight:700 }}>{course.title}</h3>
            <p style={{ color:T.textMut, fontSize:11 }}>{videos.length} lessons</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {/* API badge */}
            <span style={{ fontSize:9, fontFamily:"monospace", color:T.green, background:T.greenL, borderRadius:20, padding:"3px 8px", alignSelf:"center", fontWeight:700 }}>
              POST /courses/{course.id}/videos
            </span>
            <GoldBtn small onClick={() => fileRef.current?.click()} loading={uploading}>
              <Upload size={13}/>{uploading ? `Uploading ${batch.done}/${batch.total}…` : "Add Lessons"}
            </GoldBtn>
            <input ref={fileRef} type="file" accept="video/*" multiple style={{ display:"none" }}
              onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}/>
          </div>
        </div>

        {/* Video rows */}
        {videos.map((video, index) => (
          <VideoRow
            key={video.id}
            video={video}
            index={index}
            onEdit={setEditVideo}
            onDelete={setDeleteVideo}
            onStatusUpdate={handleStatusUpdate}
            onToggleFree={handleToggleFree}
          />
        ))}

        {/* Drop zone */}
        <div
          role="button" tabIndex={0} aria-label="Upload videos"
          style={{ marginTop:10, border:`2px dashed ${T.borderHi}`, borderRadius:12, padding:"24px", textAlign:"center", cursor:"pointer", transition:"background 0.2s" }}
          onClick={() => fileRef.current?.click()}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = T.orangeL; }}
          onDragLeave={e => { e.currentTarget.style.background = "transparent"; }}
          onDrop={e => {
            e.preventDefault();
            e.currentTarget.style.background = "transparent";
            handleFiles(e.dataTransfer.files);
          }}
        >
          <Upload size={18} style={{ color:T.orange, marginBottom:8 }}/>
          <p style={{ color:T.textMut, fontSize:12 }}>Drop videos here or <span style={{ color:T.orange, fontWeight:600 }}>click to upload</span></p>
          <p style={{ color:T.textMut, fontSize:10, marginTop:4 }}>Bulk upload supported · MP4, MOV, AVI</p>
        </div>
      </div>
    </>
  );
}
function CourseWizard({ onCancel, editTarget, onCreated, onUpdated, toast }) {
  const isEdit = Boolean(editTarget);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: editTarget?.title || "",
    description: editTarget?.description || "",
    price:editTarget?.price ?? "",
    category:editTarget?.category || "Trading",
    level:editTarget?.level || "Beginner",
    language: editTarget?.language || "English",
    tags:editTarget?.tags?.join(", ") || "",
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSubmit = async () => {
    if (!form.title.trim()) { toast("Course title is required.", "error"); return; }
    if (form.price === "")  { toast("Price is required (0 for free).", "error"); return; }
    setLoading(true);
    const payload = {
      ...form,
      price: Number(form.price),
      tags:  form.tags.split(",").map(t => t.trim()).filter(Boolean),
    };

    try {
      if (isEdit) {
        /* PUT /courses/:id */
        const data = await API.updateCourse(editTarget.id, payload);
        toast("Course updated!", "success");
        onUpdated({ ...editTarget, ...payload, ...(data?.course || {}) });
      } else {
        /* POST /courses */
        const data = await API.createCourse(payload);
        toast("Course created!", "success");
        onCreated(data?.course || { ...payload, id:`c_${Date.now()}`, students:0, rating:0, revenue:0, status:"DRAFT", curriculum:[] });
      }
    } catch (err) {
      toast(err.message || "Something went wrong.", "error");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ background:T.card, borderRadius:14, padding:22, border:`1px solid ${T.borderHi}`, marginBottom:18 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18, alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:4, height:20, background:T.orange, borderRadius:3 }}/>
          <h3 style={{ fontSize:16, fontWeight:700, color:T.textPri, margin:0 }}>
            {isEdit ? `Edit: ${editTarget.title}` : "Course Blueprint Wizard"}
          </h3>
          <span style={{ fontSize:9.5, fontFamily:"monospace", borderRadius:20, padding:"2px 8px", fontWeight:700,
            background:isEdit?T.orangeL:T.blueL, color:isEdit?T.orange:T.blue }}>
            {isEdit ? `PUT /courses/${editTarget.id}` : "POST /courses"}
          </span>
        </div>
        <button onClick={onCancel} style={{ background:"transparent", border:"none", color:T.textMut, cursor:"pointer" }}><X size={18}/></button>
      </div>

      {/* Step indicators */}
      <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:20 }}>
        {["Details","Pricing & Level"].map((label, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:24, height:24, borderRadius:"50%",
                background:step>i+1?T.orange:step===i+1?T.orangeL:"rgba(255,255,255,0.05)",
                border:`1.5px solid ${step>=i+1?T.orange:T.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:700,
                color:step>i+1?"#000":step===i+1?T.orange:T.textMut,
                transition:"all 0.25s",
              }}>
                {step>i+1?<CheckCircle size={13}/>:i+1}
              </div>
              <span style={{ fontSize:11, fontWeight:step===i+1?700:400, color:step===i+1?T.orange:T.textMut, whiteSpace:"nowrap" }}>{label}</span>
            </div>
            {i<1 && <div style={{ flex:1, height:1.5, background:step>i+1?T.orange:T.border, margin:"0 8px", transition:"background 0.3s" }}/>}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ display:"grid", gap:14 }}>
          <Input label="Course Title" value={form.title} onChange={set("title")} placeholder="e.g. Advanced Options Trading" required/>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:11.5, color:T.textSec, fontWeight:600 }}>Description</label>
            <textarea value={form.description} onChange={set("description")} rows={3} placeholder="What will users learn?"
              style={{ background:"#0D0D0D", border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px", color:"#fff", outline:"none", fontSize:13, resize:"vertical", fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e  => e.target.style.borderColor = T.border}
            />
          </div>
          <Input label="Tags (comma separated)" value={form.tags} onChange={set("tags")} placeholder="options, intraday, derivatives"/>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Input label="Price (₹)" value={form.price} onChange={set("price")} type="number" placeholder="999" required/>
          <Select label="Category" value={form.category} onChange={set("category")} options={CATEGORIES}/>
          <Select label="Level"    value={form.level}    onChange={set("level")}    options={LEVELS}/>
          <Select label="Language" value={form.language} onChange={set("language")} options={LANGUAGES}/>
        </div>
      )}

      {/* Footer */}
      <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
        {step > 1 && (
          <GoldBtn outline onClick={() => setStep(s => s-1)} disabled={loading}>
            <ChevronLeft size={13}/>Back
          </GoldBtn>
        )}
        {step < 2 ? (
          <GoldBtn onClick={() => setStep(s => s+1)}>
            Continue<ChevronRight size={13}/>
          </GoldBtn>
        ) : (
          <GoldBtn onClick={handleSubmit} loading={loading}>
            {loading
              ? (isEdit ? "Saving…" : "Publishing…")
              : isEdit
                ? <><Save size={13}/>Save Changes</>
                : <><CheckCircle size={13}/>Publish</>}
          </GoldBtn>
        )}
      </div>
    </div>
  );
}
function CreatorStats({ stats, loading }) {
  const rows = [
    { label:"Total Revenue",value:loading?"…":(stats?.total_revenue ? `₹${Number(stats.total_revenue).toLocaleString("en-IN")}`  : "₹0"),      icon:DollarSign, color:T.orange  },
    { label:"Total Users", value:loading?"…":(stats?.total_students  ?? "0"),                                                                     icon:Users,      color:T.purple  },
    { label:"Avg Rating", value:loading?"…":(stats?.avg_rating ? `${stats.avg_rating} ★`                                   : "—"),          icon:Star,       color:T.orange  },
    { label:"Completion Rate", value:loading?"…":(stats?.completion_rate ? `${stats.completion_rate}%`                               : "—"),          icon:BarChart2,  color:T.green   },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
      {rows.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"14px", position:"relative", overflow:"hidden" }}>
            {/* API badge */}
            {i===0 && (
              <div style={{ position:"absolute", top:8, right:8, fontSize:8.5, fontFamily:"monospace", color:T.purple, background:T.purpleL, borderRadius:20, padding:"1px 6px", fontWeight:700 }}>
                GET /courses/stats/creator
              </div>
            )}
            <Icon size={16} style={{ color:s.color, marginBottom:8 }}/>
            <div style={{ fontSize:22, fontWeight:900, color:s.color, opacity:loading?0.4:1, transition:"opacity 0.3s" }}>{s.value}</div>
            <div style={{ color:T.textMut, fontSize:11, marginTop:4 }}>{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function CourseStudio() {
  /* ── UI state ── */
  const [showWizard,   setShowWizard]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteCourse, setDeleteCourse] = useState(null);
  const [delLoading,   setDelLoading]   = useState(false);

  /* ── Data state ── */
  const [courses,setCourses] = useState(SEED_COURSES);
  const [selected, setSelected] = useState(SEED_COURSES[0]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { toasts, push: toast } = useToast();
  useEffect(() => {
    let active = true;

    /* No token → don't even attempt; just leave seed stats visible */
    if (!getToken()) {
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);
    API.getCreatorStats()
      .then(data => {
        if (!active) return;
        setStatsData(data?.stats || data || null);
        if (Array.isArray(data?.courses)) setCourses(data.courses);
      })
      .catch(err => {
        if (!active) return;
        /* Auth errors are expected before login — log once, don't spam */
        if (err?.isAuth) {
          console.warn("[CourseStudio] stats skipped — not authenticated");
        } else {
          console.warn("[CourseStudio] stats:", err.message);
        }
      })
      .finally(() => { if (active) setStatsLoading(false); });

    return () => { active = false; };
  }, []);

  const handleSelect = useCallback(async (course) => {
    setSelected(course); // optimistic
    if (!getToken()) return; // no token → keep seed data, don't attempt

    setFetchLoading(true);
    try {
      const data = await API.getCourse(course.id);
      const full = data?.course || data;
      if (full?.id) {
        setSelected(full);
        setCourses(prev => prev.map(c => c.id === full.id ? { ...c, ...full } : c));
      }
    } catch (err) {
      if (!err?.isAuth) console.warn("[CourseStudio] getCourse:", err.message);
    } finally { setFetchLoading(false); }
  }, []);

  const handleCreated = useCallback(newCourse => {
    setCourses(prev => [newCourse, ...prev]);
    setSelected(newCourse);
    setShowWizard(false);
    setEditTarget(null);
  }, []);
  const handleUpdated = useCallback(updated => {
    setCourses(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    setSelected(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
    setShowWizard(false);
    setEditTarget(null);
    toast("Course saved.", "success");
  }, [toast]);

  const confirmDeleteCourse = async () => {
    if (!deleteCourse) return;
    setDelLoading(true);
    try {
      await API.deleteCourse(deleteCourse.id);
      const next = courses.filter(c => c.id !== deleteCourse.id);
      setCourses(next);
      if (selected?.id === deleteCourse.id) setSelected(next[0] || null);
      toast(`"${deleteCourse.title}" deleted.`, "success");
    } catch (err) {
      toast(err.message || "Could not delete course.", "error");
    } finally {
      setDelLoading(false);
      setDeleteCourse(null);
    }
  };

  const handleCurriculumChange = useCallback((courseId, newCurriculum) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, curriculum: newCurriculum } : c));
    setSelected(prev => prev?.id === courseId ? { ...prev, curriculum: newCurriculum } : prev);
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:"#fff", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      {/* ── Confirm delete course ── */}
      {deleteCourse && (
        <ConfirmDialog
          title="Delete Course"
          message={`Permanently delete "${deleteCourse.title}"? All enrolled users will lose access.`}
          onConfirm={confirmDeleteCourse}
          onCancel={() => setDeleteCourse(null)}
          loading={delLoading}
        />
      )}

      {/* ── HEADER ── */}
      <div style={{
        background:T.sidebar, borderBottom:`1px solid ${T.border}`,
        padding:"18px 26px", display:"flex", justifyContent:"space-between",
        alignItems:"center", position:"sticky", top:0, zIndex:100,
      }}>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ width:4, height:22, background:T.orange, borderRadius:4 }}/>
          <h1 style={{ fontSize:18, fontWeight:800 }}>Course Studio</h1>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {/* API endpoints strip */}
          <div style={{ display:"flex", gap:4, flexWrap:"nowrap", alignSelf:"center" }}>
            {[
              { m:"POST", p:"/courses",c:T.green },
              { m:"GET", p:"/courses/:id", c:T.blue },
              { m:"PUT", p:"/courses/:id", c:T.orange },
              { m:"DELETE", p:"/courses/:id", c:T.red },
              { m:"GET", p:"/courses/stats/creator", c:T.purple },
            ].map((e,i) => (
              <span key={i} style={{ fontSize:8.5, fontFamily:"monospace", borderRadius:20, padding:"2px 7px", background:`${e.c}12`, color:e.c, border:`1px solid ${e.c}30`, whiteSpace:"nowrap" }}>
                {e.m} {e.p}
              </span>
            ))}
          </div>
          <GoldBtn>
            <Eye size={14}/>Preview Store
          </GoldBtn>
        </div>
      </div>

      <div style={{ padding:"22px 26px" }}>

        {/* FIX 4 — Auth warning banner: shown when no token detected */}
        {!getToken() && (
          <div style={{
            background:"rgba(239,68,68,0.08)",
            border:`1px solid rgba(239,68,68,0.25)`,
            borderRadius:12, padding:"12px 16px", marginBottom:18,
            display:"flex", alignItems:"center", gap:10,
          }}>
            <AlertTriangle size={15} style={{ color:T.red, flexShrink:0 }}/>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:T.red, margin:0 }}>
                Not authenticated — API calls are paused
              </p>
              <p style={{ fontSize:11.5, color:T.textSec, marginTop:3 }}>
                Log in first. Token must be stored under <code style={{ background:"rgba(255,255,255,0.06)", padding:"1px 5px", borderRadius:4, fontFamily:"monospace" }}>manchly_token</code> in localStorage.
                Stats and video polling will resume automatically after login.
              </p>
            </div>
          </div>
        )}

        {/* Stats — hydrated from API */}
        <CreatorStats stats={statsData} loading={statsLoading}/>

        {/* Wizard */}
        {(showWizard || editTarget) && (
          <CourseWizard
            editTarget={editTarget}
            onCancel={() => { setShowWizard(false); setEditTarget(null); }}
            onCreated={handleCreated}
            onUpdated={handleUpdated}
            toast={toast}
          />
        )}

        {/* New course button */}
        {!showWizard && !editTarget && (
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14, gap:8 }}>
            {selected && (
              <GoldBtn outline small onClick={() => { setEditTarget(selected); setShowWizard(false); }}>
                <Edit3 size={13}/>Edit Course
              </GoldBtn>
            )}
            <GoldBtn onClick={() => { setEditTarget(null); setShowWizard(true); }}>
              <Plus size={14}/>New Course
            </GoldBtn>
          </div>
        )}

        {/* Two-column layout */}
        <div style={{ display:"grid", gridTemplateColumns:"1.12fr 0.88fr", gap:18, alignItems:"start" }}>

          {/* LEFT — course cards */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <p style={{ fontSize:11, fontWeight:700, color:T.textMut, textTransform:"uppercase", letterSpacing:1 }}>
                Your Courses ({courses.length})
              </p>
              {statsLoading && <Loader size={12} style={{ color:T.orange, animation:"spin 1s linear infinite" }}/>}
            </div>
            {courses.map(course => (
              <CreatorCourseCard
                key={course.id}
                course={course}
                selected={selected}
                onSelect={handleSelect}
                onDelete={setDeleteCourse}
                fetchLoading={fetchLoading && selected?.id === course.id}
              />
            ))}
            {courses.length === 0 && (
              <div style={{ textAlign:"center", padding:"40px 20px", color:T.textMut, border:`1px dashed ${T.border}`, borderRadius:14 }}>
                <Video size={32} style={{ marginBottom:10, opacity:0.3 }}/>
                <p style={{ fontSize:13 }}>No courses yet. Create your first one!</p>
              </div>
            )}
          </div>

          {/* RIGHT — curriculum manager */}
          <div>
            {selected ? (
              <CurriculumManager
                key={selected.id}
                course={selected}
                onCurriculumChange={handleCurriculumChange}
                toast={toast}
              />
            ) : (
              <div style={{ background:T.card, borderRadius:14, padding:"40px 20px", border:`1px solid ${T.border}`, textAlign:"center", color:T.textMut }}>
                <Video size={28} style={{ marginBottom:10, opacity:0.3 }}/>
                <p style={{ fontSize:13 }}>Select a course to manage its curriculum</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast stack */}
      <ToastStack toasts={toasts}/>

      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#000; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:#0A0A0A; }
        ::-webkit-scrollbar-thumb { background:#222; border-radius:20px; }
        button, input, textarea, select { font-family:inherit; }
        select option { background:#111; color:#fff; }
        @keyframes spin{ to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes slide { from{transform:translateX(-100%)} to{transform:translateX(300%)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}