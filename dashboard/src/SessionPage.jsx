// SessionsPage.jsx
import React from "react";
import { Plus } from "lucide-react";
import { T, formatINR } from "./types";

/* ---------------------------------------------------------------------- */
/* Shared sub-components                                                   */
/* ---------------------------------------------------------------------- */

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

function Panel({ title, subtitle, action, children }) {
  return (
    <div className="rounded-xl overflow-hidden mb-5" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
      <div
        className="flex items-center justify-between px-[18px] py-3.5 flex-wrap gap-2.5"
        style={{ borderBottom: `1px solid ${T.border}` }}
      >
        <div>
          <div className="text-sm font-semibold" style={{ color: T.textPri }}>
            {title}
          </div>
          {subtitle && (
            <div className="text-[11px] mt-0.5" style={{ color: T.textMut }}>
              {subtitle}
            </div>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

const TYPE_STATUS_COLOR = { Active: T.green, Draft: T.textMut };
const BOOKING_STATUS_COLOR = { Confirmed: T.green, Pending: T.blue };

/* ---------------------------------------------------------------------- */
/* Mock data — parsed from legacy #sessions source markup                 */
/* ---------------------------------------------------------------------- */

const SESSION_STATS = [
  { id: "types", accent: T.orange, value: "5", label: "Session Types" },
  { id: "bookings", accent: T.green, value: "28", label: "Total Bookings" },
  { id: "today", accent: T.blue, value: "3", label: "Upcoming Today" },
  { id: "revenue", accent: T.green, value: formatINR(5200), label: "1:1 Revenue" },
];

const SESSION_TYPES = [
  { id: "st1", title: "React Native Career Strategy", status: "Active", duration: "60 min", price: 499, bookings: 8, revenue: 3992, action: "Manage" },
  { id: "st2", title: "Code Review & Mentorship", status: "Active", duration: "45 min", price: 299, bookings: 4, revenue: 1196, action: "Manage" },
  { id: "st3", title: "Portfolio Review", status: "Active", duration: "30 min", price: 149, bookings: 2, revenue: 298, action: "Manage" },
  { id: "st4", title: "Quick Doubt Clearing", status: "Draft", duration: "20 min", price: 99, bookings: 0, revenue: 0, action: "Edit" },
];

const UPCOMING_BOOKINGS = [
  { id: "b1", student: "Ankit Savla", session: "React Native Career Strategy", datetime: "25 Jun, 4:00 PM", duration: "60 min", amount: 499, status: "Confirmed" },
  { id: "b2", student: "Najikedas", session: "Code Review & Mentorship", datetime: "26 Jun, 11:00 AM", duration: "45 min", amount: 299, status: "Confirmed" },
  { id: "b3", student: "Abhishek Kumar", session: "Portfolio Review", datetime: "28 Jun, 6:00 PM", duration: "30 min", amount: 149, status: "Pending" },
];

/* ---------------------------------------------------------------------- */
/* Page                                                                    */
/* ---------------------------------------------------------------------- */

export default function SessionsPage() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {SESSION_STATS.map((s) => (
          <StatCard key={s.id} {...s} />
        ))}
      </div>

      {/* ---------------- 1. My 1:1 Session Types ---------------- */}
      <Panel
        title="My 1:1 Session Types"
        action={
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors"
            style={{ backgroundColor: T.orange, color: T.bg }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.orangeD)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = T.orange)}
          >
            <Plus size={13} />
            New Session
          </button>
        }
      >
        <table className="w-full border-collapse">
          <THead cols={["Title", "Status", "Duration", "Price (₹)", "Total Bookings", "Revenue", "Action"]} />
          <tbody>
            {SESSION_TYPES.map((s) => (
              <tr key={s.id} className="group">
                <td
                  className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                  style={{ color: T.textPri, borderBottom: `1px solid ${T.border}` }}
                >
                  {s.title}
                </td>
                <td className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <Badge color={TYPE_STATUS_COLOR[s.status]}>{s.status}</Badge>
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {s.duration}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {formatINR(s.price)}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {s.bookings}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                  style={{ color: s.revenue > 0 ? T.green : T.textMut, borderBottom: `1px solid ${T.border}` }}
                >
                  {formatINR(s.revenue)}
                </td>
                <td className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <button
                    type="button"
                    className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
                    style={{ backgroundColor: T.elevated, border: `1px solid ${T.border}`, color: T.textMut }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = T.textPri)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = T.textMut)}
                  >
                    {s.action}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* ---------------- 2. Upcoming Bookings ---------------- */}
      <Panel title="Upcoming Bookings" subtitle="Confirmed sessions scheduled ahead">
        <table className="w-full border-collapse">
          <THead cols={["Student", "Session", "Date & Time", "Duration", "Amount", "Status"]} />
          <tbody>
            {UPCOMING_BOOKINGS.map((b) => (
              <tr key={b.id} className="group">
                <td
                  className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                  style={{ color: T.textPri, borderBottom: `1px solid ${T.border}` }}
                >
                  {b.student}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {b.session}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {b.datetime}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {b.duration}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {formatINR(b.amount)}
                </td>
                <td className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <Badge color={BOOKING_STATUS_COLOR[b.status]}>{b.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}