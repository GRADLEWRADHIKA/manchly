import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { T, formatINR } from "./types";

// Shared sub-components
function StatCard({ accent, value, label }) {
  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden transition-colors"
      style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.borderHi)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
    >
      <span className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: accent }} />
      <div className="text-2xl font-bold leading-none" style={{ color: T.textPri }}>
        {value}
      </div>
      <div className="text-[11px] mt-1 font-medium uppercase tracking-wide" style={{ color: T.textMut }}>
        {label}
      </div>
    </div>
  );
}

function Badge({ children, color }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: `${color}21`, color, border: `1px solid ${color}4D` }}
    >
      {children}
    </span>
  );
}

function THead({ cols }) {
  return (
    <thead>
      <tr style={{ backgroundColor: T.elevated }}>
        {cols.map((c) => (
          <th
            key={c}
            className="text-left text-[10px] font-semibold uppercase tracking-wide px-[18px] py-2.5"
            style={{ color: T.textMut, borderBottom: `1px solid ${T.border}` }}
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function SegmentedTabs({ options, active, onChange }) {
  return (
    <div className="flex rounded-lg p-[3px] gap-0.5" style={{ backgroundColor: T.elevated }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className="px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors"
          style={{
            backgroundColor: active === opt ? T.card : "transparent",
            color: active === opt ? T.textPri : T.textMut,
            boxShadow: active === opt ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const STATUS_COLOR = { Published: T.green, Completed: T.blue, Draft: T.textMut };

// Mock data
const WEBINAR_STATS = [
  { id: "total",     accent: T.purple,  value: "12", label: "Total Webinars" },
  { id: "published", accent: T.green,   value: "9",  label: "Published" },
  { id: "completed", accent: T.blue,    value: "2",  label: "Completed" },
  { id: "draft",     accent: T.textMut, value: "1",  label: "Draft" },
];

const WEBINARS = [
  { id: "w1", title: "React Native Career AMA",        status: "Published", price: 0,   scheduled: "29 Jul 2026", registrations: 0, revenue: 0,    action: "Manage" },
  { id: "w2", title: "Idea to App Store: Deployment",  status: "Published", price: 149, scheduled: "14 Jul 2026", registrations: 0, revenue: 0,    action: "Manage" },
  { id: "w3", title: "State Management Showdown",      status: "Published", price: 199, scheduled: "5 Jul 2026",  registrations: 0, revenue: 0,    action: "Manage" },
  { id: "w4", title: "Building a Chat App – Live",     status: "Published", price: 0,   scheduled: "28 Jun 2026", registrations: 1, revenue: 0,    action: "Manage" },
  { id: "w5", title: "RN New Architecture Deep Dive",  status: "Completed", price: 299, scheduled: "21 Jun 2026", registrations: 4, revenue: 1196, action: "View" },
];

const FILTERS = ["All", "Published", "Completed", "Draft"];

// Page
export default function WebinarsPage() {
  const [filter, setFilter] = useState("All");

  const rows = useMemo(
    () => (filter === "All" ? WEBINARS : WEBINARS.filter((w) => w.status === filter)),
    [filter]
  );

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {WEBINAR_STATS.map((s) => (
          <StatCard key={s.id} {...s} />
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <div
          className="flex items-center justify-between px-[18px] py-3.5 flex-wrap gap-2.5"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          <span className="text-sm font-semibold" style={{ color: T.textPri }}>
            My Webinars
          </span>
          <div className="flex items-center gap-2">
            <SegmentedTabs options={FILTERS} active={filter} onChange={setFilter} />
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors"
              style={{ backgroundColor: T.orange, color: T.bg }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.orangeD)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = T.orange)}
            >
              <Plus size={13} />
              New Webinar
            </button>
          </div>
        </div>

        <table className="w-full border-collapse">
          <THead cols={["Title", "Status", "Price (₹)", "Scheduled", "Registrations", "Revenue", "Action"]} />
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className="group">
                <td
                  className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                  style={{ color: T.textPri, borderBottom: `1px solid ${T.border}` }}
                >
                  {w.title}
                </td>
                <td className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <Badge color={STATUS_COLOR[w.status]}>{w.status}</Badge>
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {formatINR(w.price)}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {w.scheduled}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {w.registrations}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                  style={{ color: w.revenue > 0 ? T.green : T.textMut, borderBottom: `1px solid ${T.border}` }}
                >
                  {formatINR(w.revenue)}
                </td>
                <td className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <button
                    type="button"
                    className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
                    style={{ backgroundColor: T.elevated, border: `1px solid ${T.border}`, color: T.textMut }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = T.textPri)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = T.textMut)}
                  >
                    {w.action}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-[18px] py-8 text-center text-xs" style={{ color: T.textMut }}>
                  No webinars in "{filter}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}