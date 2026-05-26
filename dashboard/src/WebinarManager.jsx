/**
 * Manchly — WebinarManager.jsx
 * Webinars & Dynamic Live Sessions Desk
 * Strict dark token map: bg=#000000 · card=#111111 · gold=#FFC107
 */

import { useState } from "react";
import {
  Video, Plus, Clock, Users, DollarSign, Calendar,
  ChevronRight, ChevronLeft, ChevronDown, Edit3, Trash2,
  Radio, CheckCircle, XCircle, Eye, Zap, BarChart2, X,
} from "lucide-react";

/* ── DESIGN TOKENS ── */
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
  textMut:  "#71717A",
};

/* ── MOCK DATA ── */
const WEBINARS = [
  { id:"w1", title:"Options Trading Masterclass", category:"Trading", price:799, seats:200, enrolled:148, scheduled_at:"2026-06-15T18:00:00Z", duration:90, status:"PUBLISHED", timezone:"Asia/Kolkata" },
  { id:"w2", title:"Startup Pitch Blueprint",      category:"Business", price:499, seats:100, enrolled:63,  scheduled_at:"2026-06-22T17:00:00Z", duration:60, status:"PUBLISHED", timezone:"Asia/Kolkata" },
  { id:"w3", title:"Instagram Growth Hacking",     category:"Marketing",price:0,   seats:500, enrolled:312, scheduled_at:"2026-06-08T19:00:00Z", duration:45, status:"LIVE",      timezone:"Asia/Kolkata" },
  { id:"w4", title:"Personal Finance 101",          category:"Finance",  price:299, seats:150, enrolled:0,   scheduled_at:"2026-07-01T18:30:00Z", duration:75, status:"DRAFT",     timezone:"Asia/Kolkata" },
  { id:"w5", title:"Design Systems for Builders",  category:"Design",   price:599, seats:80,  enrolled:55,  scheduled_at:"2026-06-29T16:00:00Z", duration:120,status:"PUBLISHED", timezone:"Asia/Kolkata" },
];

/* Slot calendar: 7 days × time slots */
const SLOT_DAYS = ["Mon 9", "Tue 10", "Wed 11", "Thu 12", "Fri 13", "Sat 14", "Sun 15"];
const SLOT_TIMES = ["09:00","10:00","11:00","12:00","14:00","15:00","16:00","17:00","18:00"];
const BOOKED_SLOTS = new Set(["Mon 9-10:00","Tue 10-14:00","Wed 11-09:00","Thu 12-17:00","Fri 13-15:00"]);
const PENDING_SLOTS = new Set(["Mon 9-14:00","Wed 11-16:00"]);

const CATEGORIES = ["Trading","Business","Marketing","Finance","Design","Tech","Health"];
const STATUS_META = {
  LIVE:      { label:"LIVE",      bg:T.redL,    color:T.red,    dot:T.red,    icon:Radio      },
  PUBLISHED: { label:"PUBLISHED", bg:T.greenL,  color:T.green,  dot:T.green,  icon:CheckCircle},
  DRAFT:     { label:"DRAFT",     bg:"rgba(113,113,122,0.15)", color:T.textMut, dot:T.textMut, icon:Edit3 },
};

/* ── ATOMS ── */
function Avatar({ initials, color = T.orange, size = 32 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:`${color}22`, border:`1.5px solid ${color}44`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.33, fontWeight:700, color, flexShrink:0,
    }}>{initials}</div>
  );
}

function StatusChip({ status }) {
  const m = STATUS_META[status] || STATUS_META.DRAFT;
  const Icon = m.icon;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:m.bg, color:m.color,
      borderRadius:20, padding:"3px 10px",
      fontSize:10.5, fontWeight:700, whiteSpace:"nowrap",
    }}>
      <span style={{width:5,height:5,borderRadius:"50%",background:m.dot}}/>
      {m.label}
    </span>
  );
}

function PriceTag({ price, size = 13 }) {
  return (
    <span style={{
      color:price===0?T.green:T.orange, fontWeight:800, fontSize:size,
    }}>
      {price===0 ? "FREE" : `₹${price.toLocaleString()}`}
    </span>
  );
}

function GoldBtn({ children, onClick, outline = false, small = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: outline ? "transparent" : (hov ? T.orangeD : T.orange),
        border:`1.5px solid ${T.orange}`,
        color: outline ? (hov?T.orange:T.textSec) : "#000",
        padding: small ? "5px 12px" : "8px 18px",
        borderRadius:9, fontSize:small?11.5:13, fontWeight:700,
        cursor:"pointer", display:"inline-flex", alignItems:"center",
        gap:6, transition:"all 0.18s", whiteSpace:"nowrap",
      }}
    >{children}</button>
  );
}

function Input({ label, value, onChange, type="text", placeholder="", required=false }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={{fontSize:11.5,fontWeight:600,color:T.textSec}}>
        {label}{required&&<span style={{color:T.red}}> *</span>}
      </label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          background:"#0D0D0D", border:`1px solid ${T.border}`,
          borderRadius:8, padding:"9px 12px", color:T.textPri,
          fontSize:13, outline:"none", width:"100%",
          fontFamily:"inherit",
        }}
        onFocus={e=>e.target.style.borderColor=T.orange}
        onBlur={e=>e.target.style.borderColor=T.border}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={{fontSize:11.5,fontWeight:600,color:T.textSec}}>{label}</label>
      <select value={value} onChange={onChange}
        style={{
          background:"#0D0D0D", border:`1px solid ${T.border}`,
          borderRadius:8, padding:"9px 12px", color:T.textPri,
          fontSize:13, outline:"none", width:"100%", fontFamily:"inherit",
          cursor:"pointer",
        }}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ── WEBINAR ROW ── */
function WebinarRow({ w, onEdit }) {
  const [hov, setHov] = useState(false);
  const dt = new Date(w.scheduled_at);
  const pct = w.seats>0 ? Math.round((w.enrolled/w.seats)*100) : 0;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:"grid", gridTemplateColumns:"2fr 90px 90px 100px 80px 80px",
        alignItems:"center", gap:12,
        padding:"12px 16px", borderRadius:11,
        background:hov?T.cardHigh:T.card,
        border:`1px solid ${hov?T.borderHi:T.border}`,
        transition:"all 0.2s", marginBottom:8, cursor:"pointer",
      }}>
      {/* Title + meta */}
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        <div style={{
          width:36, height:36, borderRadius:9, flexShrink:0,
          background:`linear-gradient(135deg,${T.orangeL},rgba(168,85,247,0.15))`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <Video size={16} style={{color:T.orange}}/>
        </div>
        <div style={{minWidth:0}}>
          <p style={{fontSize:13,fontWeight:700,color:T.textPri,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{w.title}</p>
          <p style={{fontSize:10.5,color:T.textMut,marginTop:2}}>
            {dt.toLocaleDateString("en-IN",{day:"numeric",month:"short"})} · {dt.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})} · {w.duration}min
          </p>
        </div>
      </div>
      {/* Category */}
      <span style={{fontSize:11,color:T.purple,background:T.purpleL,padding:"3px 8px",borderRadius:20,fontWeight:600,whiteSpace:"nowrap"}}>{w.category}</span>
      {/* Price */}
      <PriceTag price={w.price} size={13}/>
      {/* Enrollment bar */}
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:10,color:T.textMut}}>{w.enrolled}/{w.seats}</span>
          <span style={{fontSize:10,color:pct>=80?T.red:T.orange,fontWeight:700}}>{pct}%</span>
        </div>
        <div style={{height:3,background:"rgba(255,255,255,0.07)",borderRadius:3,overflow:"hidden"}}>
          <div style={{width:`${pct}%`,height:"100%",background:pct>=80?T.red:T.orange,borderRadius:3}}/>
        </div>
      </div>
      {/* Status */}
      <StatusChip status={w.status}/>
      {/* Actions */}
      <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
        <button onClick={e=>{e.stopPropagation();onEdit(w);}} style={{background:T.orangeL,border:"none",color:T.orange,width:28,height:28,borderRadius:7,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Edit3 size={12}/></button>
        <button style={{background:"rgba(239,68,68,0.12)",border:"none",color:T.red,width:28,height:28,borderRadius:7,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={12}/></button>
      </div>
    </div>
  );
}

/* ── CREATION FORM ── */
function CreateWebinarForm({ onCancel }) {
  const [form, setForm] = useState({ title:"", description:"", price:"", seats:"", scheduled_at:"", duration:"60", timezone:"Asia/Kolkata", category:"Trading" });
  const set = (k) => (e) => setForm(f=>({...f,[k]:e.target.value}));
  return (
    <div style={{background:T.card,borderRadius:14,padding:24,border:`1px solid ${T.border}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:4,height:20,background:T.orange,borderRadius:3}}/>
          <h3 style={{fontSize:15,fontWeight:700,color:T.textPri,margin:0}}>Create New Webinar</h3>
        </div>
        <button onClick={onCancel} style={{background:"transparent",border:"none",color:T.textMut,cursor:"pointer"}}><X size={16}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{gridColumn:"1/-1"}}><Input label="Title" value={form.title} onChange={set("title")} placeholder="e.g. Options Trading Masterclass" required/></div>
        <div style={{gridColumn:"1/-1"}}>
          <label style={{fontSize:11.5,fontWeight:600,color:T.textSec,display:"block",marginBottom:6}}>Description</label>
          <textarea value={form.description} onChange={set("description")} rows={3} placeholder="What will attendees learn?" style={{background:"#0D0D0D",border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",color:T.textPri,fontSize:13,outline:"none",width:"100%",resize:"vertical",fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=T.orange} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <Input label="Price (₹)" value={form.price} onChange={set("price")} type="number" placeholder="0 for free"/>
        <Input label="Max Seats" value={form.seats} onChange={set("seats")} type="number" placeholder="e.g. 200"/>
        <Input label="Scheduled At" value={form.scheduled_at} onChange={set("scheduled_at")} type="datetime-local"/>
        <Input label="Duration (min)" value={form.duration} onChange={set("duration")} type="number" placeholder="60"/>
        <Select label="Category" value={form.category} onChange={set("category")} options={CATEGORIES}/>
        <Select label="Timezone" value={form.timezone} onChange={set("timezone")} options={["Asia/Kolkata","UTC","America/New_York"]}/>
      </div>
      <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
        <GoldBtn outline onClick={onCancel}>Cancel</GoldBtn>
        <GoldBtn><Plus size={13}/>Publish Webinar</GoldBtn>
      </div>
    </div>
  );
}

/* ── SLOT CALENDAR ── */
function SlotCalendar() {
  const [selected, setSelected] = useState(null);
  const [month] = useState("Jun 2026");

  const getSlotKey = (day,time)=>`${day}-${time}`;
  const getState = (day,time) => {
    const k = getSlotKey(day,time);
    if(BOOKED_SLOTS.has(k))  return "booked";
    if(PENDING_SLOTS.has(k)) return "pending";
    if(selected===k)         return "selected";
    return "free";
  };
  const stateStyle = {
    booked:   { bg:"rgba(239,68,68,0.18)",  color:T.red,    label:"Booked"   },
    pending:  { bg:"rgba(251,191,36,0.18)", color:"#FBBF24",label:"Pending"  },
    selected: { bg:T.orangeL,               color:T.orange,  label:"Selected" },
    free:     { bg:"rgba(255,255,255,0.04)",color:T.textMut, label:"Free"     },
  };

  return (
    <div style={{background:T.card,borderRadius:14,padding:20,border:`1px solid ${T.border}`}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <h3 style={{fontSize:14,fontWeight:700,color:T.textPri,margin:0}}>Session Booking Calendar</h3>
          <p style={{fontSize:11,color:T.textMut,marginTop:2}}>{month} · Click a free slot to reserve</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{background:T.orangeL,border:"none",color:T.orange,width:28,height:28,borderRadius:7,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronLeft size={13}/></button>
          <button style={{background:T.orangeL,border:"none",color:T.orange,width:28,height:28,borderRadius:7,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronRight size={13}/></button>
        </div>
      </div>
      {/* Legend */}
      <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        {Object.entries(stateStyle).map(([k,s])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:10,height:10,borderRadius:3,background:s.bg,border:`1px solid ${s.color}44`}}/>
            <span style={{fontSize:10,color:T.textMut}}>{s.label}</span>
          </div>
        ))}
      </div>
      {/* Grid */}
      <div style={{overflowX:"auto"}}>
        <div style={{minWidth:520}}>
          {/* Day headers */}
          <div style={{display:"grid",gridTemplateColumns:`60px repeat(${SLOT_DAYS.length},1fr)`,gap:4,marginBottom:4}}>
            <div/>
            {SLOT_DAYS.map(d=>(
              <div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:T.textSec,padding:"4px 0"}}>{d}</div>
            ))}
          </div>
          {/* Time rows */}
          {SLOT_TIMES.map(time=>(
            <div key={time} style={{display:"grid",gridTemplateColumns:`60px repeat(${SLOT_DAYS.length},1fr)`,gap:4,marginBottom:4}}>
              <div style={{fontSize:10,color:T.textMut,display:"flex",alignItems:"center",paddingRight:6}}>{time}</div>
              {SLOT_DAYS.map(day=>{
                const state = getState(day,time);
                const s = stateStyle[state];
                return (
                  <div key={day} onClick={()=>state==="free"&&setSelected(getSlotKey(day,time))}
                    style={{
                      height:28,borderRadius:6,background:s.bg,
                      border:`1px solid ${s.color}33`,
                      cursor:state==="free"?"pointer":"default",
                      transition:"all 0.15s",
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}
                    onMouseEnter={e=>{ if(state==="free") e.currentTarget.style.background=T.orangeL; }}
                    onMouseLeave={e=>{ if(state==="free") e.currentTarget.style.background=s.bg; }}
                  >
                    {state!=="free"&&<div style={{width:6,height:6,borderRadius:"50%",background:s.color}}/>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Book CTA */}
      {selected && (
        <div style={{marginTop:16,padding:12,background:T.orangeL,borderRadius:10,border:`1px solid ${T.borderHi}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <p style={{fontSize:12,fontWeight:700,color:T.orange,margin:0}}>Selected: {selected.replace("-"," at ")}</p>
            <p style={{fontSize:10,color:T.textSec,marginTop:2}}>Click Confirm to reserve this slot</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <GoldBtn small onClick={()=>setSelected(null)} outline>Clear</GoldBtn>
            <GoldBtn small>Confirm Slot</GoldBtn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── QUICK STATS ── */
function QuickStats() {
  const stats = [
    { label:"Total Webinars", value:"5",   icon:Video,    color:T.orange },
    { label:"Live Now",       value:"1",   icon:Radio,    color:T.red    },
    { label:"Total Enrolled", value:"578", icon:Users,    color:T.purple },
    { label:"Revenue",        value:"₹2.4L",icon:DollarSign,color:T.green},
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
      {stats.map((s,i)=>{
        const Icon=s.icon;
        return (
          <div key={i} style={{background:T.card,borderRadius:12,padding:"14px 16px",border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:32,height:32,borderRadius:8,background:`${s.color}18`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon size={14} style={{color:s.color}}/>
              </div>
              <span style={{fontSize:11,color:T.textMut}}>{s.label}</span>
            </div>
            <p style={{fontSize:20,fontWeight:800,color:s.color,margin:0}}>{s.value}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ── UPCOMING BOOKINGS ── */
function UpcomingBookings() {
  const bookings = [
    { name:"Rahul Sharma",   initials:"RS", time:"Mon 09 · 10:00", type:"1-on-1 Session", color:T.orange },
    { name:"Priya Nair",     initials:"PN", time:"Wed 11 · 09:00", type:"Strategy Call",  color:T.purple },
    { name:"Amit Verma",     initials:"AV", time:"Thu 12 · 17:00", type:"1-on-1 Session", color:T.blue   },
  ];
  return (
    <div style={{background:T.card,borderRadius:14,padding:16,border:`1px solid ${T.border}`,marginTop:14}}>
      <p style={{fontSize:12,fontWeight:700,color:T.textSec,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Upcoming Bookings</p>
      {bookings.map((b,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<bookings.length-1?`1px solid ${T.border}`:"none"}}>
          <Avatar initials={b.initials} color={b.color} size={30}/>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:12.5,fontWeight:600,color:T.textPri,margin:0}}>{b.name}</p>
            <p style={{fontSize:10.5,color:T.textMut,marginTop:1}}>{b.type}</p>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{fontSize:11,color:T.orange,fontWeight:700}}>{b.time.split("·")[0]}</p>
            <p style={{fontSize:10,color:T.textMut}}>{b.time.split("·")[1]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── MAIN COMPONENT ── */
export default function WebinarManager() {
  const [subView, setSubView] = useState("list"); // 'list' | 'create'
  const [editTarget, setEditTarget] = useState(null);
  const [filter, setFilter] = useState("ALL");

  const filtered = filter==="ALL" ? WEBINARS : WEBINARS.filter(w=>w.status===filter);

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",color:T.textPri}}>
      {/* Page header */}
      <div style={{background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:"15px 26px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:20,backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:4,height:22,background:T.orange,borderRadius:3}}/>
          <h1 style={{fontSize:17,fontWeight:700,color:T.textPri,margin:0}}>Webinar Manager</h1>
          <span style={{fontSize:11,color:T.textMut,background:"rgba(255,255,255,0.05)",padding:"3px 10px",borderRadius:20}}>Live Sessions Desk</span>
        </div>
        <GoldBtn onClick={()=>setSubView(subView==="list"?"create":"list")}>
          {subView==="list" ? <><Plus size={14}/>New Webinar</> : <><X size={14}/>Close Form</>}
        </GoldBtn>
      </div>

      <div style={{padding:"22px 26px"}}>
        <QuickStats/>

        {/* Two-column layout */}
        <div style={{display:"grid",gridTemplateColumns:"1.12fr 0.88fr",gap:18,alignItems:"start"}}>

          {/* ── LEFT COLUMN ── */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {subView==="create" || editTarget ? (
              <CreateWebinarForm onCancel={()=>{setSubView("list");setEditTarget(null);}}/>
            ) : null}

            {/* Filter tabs */}
            <div style={{display:"flex",gap:4,padding:"4px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`,width:"fit-content"}}>
              {["ALL","LIVE","PUBLISHED","DRAFT"].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{
                  padding:"5px 14px",borderRadius:7,border:"none",
                  background:filter===f?T.orange:"transparent",
                  color:filter===f?"#000":T.textSec,
                  fontSize:11.5,fontWeight:filter===f?700:500,cursor:"pointer",transition:"all 0.18s",
                }}>{f}</button>
              ))}
            </div>

            {/* Webinar list */}
            <div style={{background:T.card,borderRadius:14,padding:16,border:`1px solid ${T.border}`}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 90px 90px 100px 80px 80px",gap:12,padding:"6px 16px",marginBottom:8}}>
                {["Webinar","Category","Price","Enrollment","Status",""].map((h,i)=>(
                  <span key={i} style={{fontSize:10.5,fontWeight:700,color:T.textMut,textTransform:"uppercase",letterSpacing:0.6}}>{h}</span>
                ))}
              </div>
              {filtered.map(w=><WebinarRow key={w.id} w={w} onEdit={(w)=>{setEditTarget(w);setSubView("create");}}/>)}
              {filtered.length===0 && (
                <div style={{textAlign:"center",padding:"40px 20px",color:T.textMut}}>
                  <Video size={32} style={{marginBottom:10,opacity:0.3}}/>
                  <p style={{fontSize:13}}>No webinars match this filter</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <SlotCalendar/>
            <UpcomingBookings/>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#0A0A0A; }
        ::-webkit-scrollbar-thumb { background:#222; border-radius:4px; }
        button, select, input, textarea { font-family:inherit; }
        select option { background:#111; color:#fff; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}