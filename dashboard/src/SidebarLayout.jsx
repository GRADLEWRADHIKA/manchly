import React, {useState} from "react";
import {
    LayoutDashboard,
    Wallet,
    Users,
    Link2,
    Settings,
    Calendar,
    Download,
    Plus
} from "lucide-react";
import {T} from "./types";
import OverviewPage from "./OverviewPage";
import EarningsPage from "./EarningsPage";
import AudiencePage from "./AudiencePage";

const NAV_ITEMS = [
    {id: "ov", label: "Overview", icon: LayoutDashboard},
    {id: "earnings", label:"Earnings", icon: Wallet},
    {id: "audience", label: "Audience", icon: Users},
];

const TOOL_ITEMS = {
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "mypage", label: "My Page", icon: Link2 },
  { id: "settings", label: "Settings", icon: Settings },
};

const META = {
    ov : {title: "Overview", subtitle: "Your creator performace at a glance"},
    earnings : {title: "Earnings", subtitle: "Remove, payouts and transactions history"},
    audience: {title: "Audience", subtitle: "Your students and their activity"},
}

function NavItem({item, active, onClick}) {
    const Icon = item.icon;
    return (
        <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors duration-150 border-l-[3px]"
        style={{
            color: active ? T.orange: T.textMut,
            backgroundColor: active ? T.orangeL : "transparent",
            borderLeftColor: active ? T.orange : "transparent",
        }}
        onMouseEnter={(e) = > {
            if(!active){
                e.currentTarget.style.backgroundColor = T.elevated;
                e.currentTarget.style.color = T.textMut
            }
        }}
        onMouseLeave={(e) = > {
            if(!active){
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = T.textMut;
            }
        }}
        >
        < Icon size= {17} strokeWidth= {2} className="shrink-0" />
        <span>{item.label}</span>
        </button>
    )
}

function NavLabel({ children }) {
  return (
    <div
      className="px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: T.textMut }}
    >
      {children}
    </div>
  );
}
 
export default function SidebarLayout() {
  const [activeTab, setActiveTab] = useState("ov");
  const meta = META[activeTab];
 
  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: T.bg }}>
      {/* ===================== SIDEBAR ===================== */}
      <aside
        className="w-[230px] min-w-[230px] flex flex-col sticky top-0 h-screen overflow-y-auto"
        style={{ backgroundColor: T.card, borderRight: `1px solid ${T.border}` }}
      >
        {/* Logo */}
        <div className="px-5 py-5 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="text-xl font-bold tracking-tight" style={{ color: T.orange }}>
            manchly
          </div>
          <div
            className="text-[10px] mt-0.5 uppercase tracking-widest font-medium"
            style={{ color: T.textMut }}
          >
            Creator Studio
          </div>
        </div>
 
        {/* Creator profile */}
        <div
          className="flex items-center gap-2.5 px-5 py-3.5"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
            style={{ backgroundColor: T.orangeL, color: T.orange, border: `1px solid ${T.borderHi}` }}
          >
            SC
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: T.textPri }}>
              Shivdutt Chauhan
            </div>
            <div className="text-[10px]" style={{ color: T.textMut }}>
              Creator
            </div>
          </div>
        </div>
 
        {/* Dashboard nav */}
        <nav className="pt-2.5 pb-1">
          <NavLabel>Dashboard</NavLabel>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>
 
        {/* Tools nav (non-navigational placeholders, kept for parity with legacy IA) */}
        <nav className="pt-2.5 pb-1">
          <NavLabel>Tools</NavLabel>
          {TOOL_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium border-l-[3px] border-transparent transition-colors duration-150"
              style={{ color: T.textMut }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = T.elevated;
                e.currentTarget.style.color = T.textPri;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = T.textMut;
              }}
            >
              <item.icon size={17} strokeWidth={2} className="shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
 
        {/* Footer account */}
        <div className="mt-auto px-5 py-3.5" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7.5 h-7.5 w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ backgroundColor: T.orangeL, color: T.orange, border: `1px solid ${T.borderHi}` }}
            >
              SC
            </div>
            <div>
              <div className="text-[11px] font-semibold" style={{ color: T.textPri }}>
                shivdutt@manchly.com
              </div>
              <div className="text-[10px]" style={{ color: T.textMut }}>
                Creator
              </div>
            </div>
          </div>
        </div>
      </aside>
 
      {/* ===================== MAIN ===================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-between gap-4 px-7 py-3.5"
          style={{ backgroundColor: T.card, borderBottom: `1px solid ${T.border}` }}
        >
          <div>
            <h1 className="text-lg font-bold" style={{ color: T.textPri }}>
              {meta.title}
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: T.textMut }}>
              {meta.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
              style={{ backgroundColor: T.elevated, border: `1px solid ${T.border}`, color: T.textMut }}
            >
              <Calendar size={13} />
              Jun 2026
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors"
              style={{ backgroundColor: T.elevated, border: `1px solid ${T.border}`, color: T.textMut }}
              onMouseEnter={(e) => (e.currentTarget.style.color = T.textPri)}
              onMouseLeave={(e) => (e.currentTarget.style.color = T.textMut)}
            >
              <Download size={13} />
              Export
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors"
              style={{ backgroundColor: T.orange, color: T.bg }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.orangeD)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = T.orange)}
            >
              <Plus size={13} />
              New Product
            </button>
          </div>
        </header>
 
        {/* Active page content */}
        <main className="flex-1 overflow-y-auto px-7 py-6">
          {activeTab === "ov" && <OverviewPage />}
          {activeTab === "earnings" && <EarningsPage />}
          {activeTab === "audience" && <AudiencePage />}
        </main>
      </div>
    </div>
  );
}