// EarningsPage.jsx
import React from "react";
import { GraduationCap, Mic, Video, Download } from "lucide-react";
import { T, formatINR } from "./types";

/* ---------------------------------------------------------------------- */
/* Shared sub-components                                                   */
/* ---------------------------------------------------------------------- */

function StatCard({ accent, value, label, trend, note }) {
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
      {trend && (
        <div className="text-[11px] mt-2 font-medium" style={{ color: T.green }}>
          ↑ {trend}
        </div>
      )}
      {!trend && note && (
        <div className="text-[11px] mt-2" style={{ color: T.textMut }}>
          {note}
        </div>
      )}
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

function BreakdownPanel({ icon: Icon, label, gross, fee, net }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-2 px-[18px] py-3.5" style={{ borderBottom: `1px solid ${T.border}` }}>
        <Icon size={15} style={{ color: T.orange }} />
        <span className="text-sm font-semibold" style={{ color: T.textPri }}>
          {label}
        </span>
      </div>
      <div className="flex justify-between items-center px-[18px] py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
        <span className="text-xs font-medium" style={{ color: T.textSec }}>
          Gross Revenue
        </span>
        <span className="text-[15px] font-bold" style={{ color: T.green }}>
          {formatINR(gross)}
        </span>
      </div>
      <div className="flex justify-between items-center px-[18px] py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
        <span className="text-xs font-medium" style={{ color: T.textSec }}>
          Platform Fee (10%)
        </span>
        <span className="text-xs font-semibold" style={{ color: T.red }}>
          −{formatINR(fee)}
        </span>
      </div>
      <div className="flex justify-between items-center px-[18px] py-3" style={{ backgroundColor: T.orangeL }}>
        <span className="text-xs font-semibold" style={{ color: T.textPri }}>
          Net Payout
        </span>
        <span className="text-base font-bold" style={{ color: T.orange }}>
          {formatINR(net)}
        </span>
      </div>
    </div>
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

const TYPE_COLOR = { Course: T.blue, Webinar: T.purple, "1:1": T.orange };
const STATUS_COLOR = { Paid: T.green, Pending: T.blue };

/* ---------------------------------------------------------------------- */
/* Mock data — parsed from legacy #earnings source markup                 */
/* ---------------------------------------------------------------------- */

const TOP_STATS = [
  { id: "total-earned", accent: T.blue, value: formatINR(26350), label: "Total Earned", trend: "20%" },
  { id: "net-payout", accent: T.green, value: formatINR(23715), label: "Net Payout", note: "After 10% platform fee" },
  { id: "commission", accent: T.orange, value: formatINR(2635), label: "Platform Commission", note: "10% of revenue" },
  { id: "paid-out", accent: T.purple, value: formatINR(18500), label: "Paid Out", note: "Last payout: 15 Jun" },
];

const BREAKDOWNS = [
  { id: "courses", icon: GraduationCap, label: "Courses", gross: 12400, fee: 1240, net: 11160 },
  { id: "webinars", icon: Mic, label: "Webinars", gross: 8750, fee: 875, net: 7875 },
  { id: "sessions", icon: Video, label: "1:1 Sessions", gross: 5200, fee: 520, net: 4680 },
];

const TRANSACTIONS = [
  { id: "tx1", student: "Ankit Savla", product: "Building Chat App", type: "Webinar", gross: 0, fee: 0, net: 0, date: "23 Jun", status: "Paid" },
  { id: "tx2", student: "Demo User", product: "State Management", type: "Webinar", gross: 199, fee: 20, net: 179, date: "18 Jun", status: "Paid" },
  { id: "tx3", student: "Test User", product: "Career Strategy 1:1", type: "1:1", gross: 499, fee: 50, net: 449, date: "15 Jun", status: "Paid" },
  { id: "tx4", student: "Najikedas", product: "RN New Architecture", type: "Course", gross: 299, fee: 30, net: 269, date: "12 Jun", status: "Pending" },
];

/* ---------------------------------------------------------------------- */
/* Page                                                                    */
/* ---------------------------------------------------------------------- */

export default function EarningsPage() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {TOP_STATS.map((s) => (
          <StatCard key={s.id} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-5">
        {BREAKDOWNS.map((b) => (
          <BreakdownPanel key={b.id} {...b} />
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <div
          className="flex items-center justify-between px-[18px] py-3.5"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          <span className="text-sm font-semibold" style={{ color: T.textPri }}>
            Transaction History
          </span>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors"
            style={{ backgroundColor: T.elevated, border: `1px solid ${T.border}`, color: T.textMut }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.textPri)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.textMut)}
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
        <table className="w-full border-collapse">
          <THead cols={["Student", "Product", "Type", "Gross (₹)", "Fee", "Net", "Date", "Status"]} />
          <tbody>
            {TRANSACTIONS.map((tx) => (
              <tr key={tx.id} className="group">
                <td
                  className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                  style={{ color: T.textPri, borderBottom: `1px solid ${T.border}` }}
                >
                  {tx.student}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {tx.product}
                </td>
                <td className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <Badge color={TYPE_COLOR[tx.type]}>{tx.type}</Badge>
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {formatINR(tx.gross)}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {formatINR(tx.fee)}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                  style={{ color: tx.net > 0 ? T.green : T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {formatINR(tx.net)}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textMut, borderBottom: `1px solid ${T.border}` }}
                >
                  {tx.date}
                </td>
                <td className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <Badge color={STATUS_COLOR[tx.status]}>{tx.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}