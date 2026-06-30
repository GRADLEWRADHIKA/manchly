// OverviewPage.jsx
import React from "react";
import { GraduationCap, Mic, Video, DollarSign } from "lucide-react";
import { T, formatINR } from "./types";

/* ---------------------------------------------------------------------- */
/* Shared sub-components                                                   */
/* ---------------------------------------------------------------------- */

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 mt-1">
      <span
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: T.textMut }}
      >
        {children}
      </span>
      <span className="flex-1 h-px" style={{ backgroundColor: T.border }} />
    </div>
  );
}

function StatCard({ icon: Icon, accent, value, label, trend, note }) {
  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden transition-colors"
      style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.borderHi)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
    >
      <span
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: accent }}
      />
      {Icon && (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
          style={{ backgroundColor: `${accent}1F`, color: accent }}
        >
          <Icon size={16} strokeWidth={2.25} />
        </div>
      )}
      <div className="text-2xl font-bold leading-none" style={{ color: T.textPri }}>
        {value}
      </div>
      <div
        className="text-[11px] mt-1 font-medium uppercase tracking-wide"
        style={{ color: T.textMut }}
      >
        {label}
      </div>
      {trend && (
        <div
          className="text-[11px] mt-2 font-medium"
          style={{ color: trend.direction === "up" ? T.green : T.red }}
        >
          {trend.direction === "up" ? "↑" : "↓"} {trend.label}
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

const TYPE_COLOR = { Course: T.blue, Webinar: T.purple, "1:1": T.orange };
const STATUS_COLOR = { Published: T.green, Draft: T.textMut };

function Panel({ title, subtitle, children, action }) {
  return (
    <div
      className="rounded-xl overflow-hidden mb-5"
      style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}
    >
      <div
        className="flex items-center justify-between px-4.5 px-[18px] py-3.5"
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

/* ---------------------------------------------------------------------- */
/* Mock data — parsed from legacy #ov source markup                       */
/* ---------------------------------------------------------------------- */

const REVENUE_STATS = [
  { id: "rev-courses", icon: GraduationCap, accent: T.blue, value: formatINR(12400), label: "Courses Revenue", trend: { direction: "up", label: "18% this month" } },
  { id: "rev-webinars", icon: Mic, accent: T.purple, value: formatINR(8750), label: "Webinars Revenue", trend: { direction: "up", label: "24%" } },
  { id: "rev-sessions", icon: Video, accent: T.green, value: formatINR(5200), label: "1:1 Sessions Revenue", trend: { direction: "up", label: "10%" } },
  { id: "rev-total", icon: DollarSign, accent: T.orange, value: formatINR(26350), label: "Total Earnings", trend: { direction: "up", label: "20% overall" } },
];

const PRODUCT_STATS = [
  { id: "prod-courses", accent: T.blue, value: "8", label: "Total Courses", note: <span><span style={{ color: T.green }}>6 published</span> · <span style={{ color: T.textMut }}>2 draft</span></span> },
  { id: "prod-webinars", accent: T.purple, value: "12", label: "Total Webinars", note: <span><span style={{ color: T.green }}>9 published</span> · <span style={{ color: T.textMut }}>3 draft</span></span> },
  { id: "prod-sessions", accent: T.green, value: "5", label: "1:1 Session Types", note: <span><span style={{ color: T.green }}>4 active</span> · <span style={{ color: T.textMut }}>1 draft</span></span> },
  { id: "prod-enrollments", accent: T.orange, value: "47", label: "Total Enrollments", trend: { direction: "up", label: "12 this month" } },
];

const RECENT_ENROLLMENTS = [
  { id: "e1", student: "Ankit Savla", product: "Building Chat App", type: "Webinar", amount: 0, date: "23 Jun" },
  { id: "e2", student: "Najikedas", product: "React Native Career AMA", type: "Webinar", amount: 0, date: "21 Jun" },
  { id: "e3", student: "Abhishek Kumar", product: "TypeScript for React Native", type: "Course", amount: 0, date: "20 Jun" },
  { id: "e4", student: "Demo User", product: "State Management Showdown", type: "Webinar", amount: 199, date: "18 Jun" },
  { id: "e5", student: "Test User", product: "1:1 Career Strategy", type: "1:1", amount: 499, date: "15 Jun" },
];

const TOP_PRODUCTS = [
  { id: "t1", rank: 1, product: "React Native Career AMA", sales: 18, revenue: 5400 },
  { id: "t2", rank: 2, product: "State Management Showdown", sales: 12, revenue: 3988 },
  { id: "t3", rank: 3, product: "1:1 Career Strategy", sales: 8, revenue: 3992 },
  { id: "t4", rank: 4, product: "Idea to App Store", sales: 6, revenue: 2394 },
  { id: "t5", rank: 5, product: "RN New Architecture", sales: 4, revenue: 1196 },
];

const RANK_COLOR = { 1: "#F5C518", 2: "#C0C0C0", 3: "#CD7F32" };

const UPCOMING = [
  { id: "u1", title: "Building a Chat App – Live Coding", type: "Webinar", scheduled: "28 Jun 2026", price: 0, enrollments: 1, status: "Published" },
  { id: "u2", title: "State Management Showdown", type: "Webinar", scheduled: "5 Jul 2026", price: 199, enrollments: 0, status: "Published" },
  { id: "u3", title: "Idea to App Store: Deployment", type: "Webinar", scheduled: "14 Jul 2026", price: 149, enrollments: 0, status: "Published" },
  { id: "u4", title: "React Native Career AMA", type: "Webinar", scheduled: "29 Jul 2026", price: 0, enrollments: 0, status: "Published" },
];

/* ---------------------------------------------------------------------- */
/* Page                                                                    */
/* ---------------------------------------------------------------------- */

export default function OverviewPage() {
  return (
    <div>
      <SectionLabel>Revenue</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {REVENUE_STATS.map((s) => (
          <StatCard key={s.id} {...s} />
        ))}
      </div>

      <SectionLabel>Products</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {PRODUCT_STATS.map((s) => (
          <StatCard key={s.id} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Recent Enrollments" subtitle="Students who joined recently">
          <table className="w-full border-collapse">
            <THead cols={["Student", "Product", "Type", "Amount", "Date"]} />
            <tbody>
              {RECENT_ENROLLMENTS.map((r) => (
                <tr key={r.id} className="group">
                  <td
                    className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                    style={{ color: T.textPri, borderBottom: `1px solid ${T.border}` }}
                  >
                    {r.student}
                  </td>
                  <td
                    className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                    style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                  >
                    {r.product}
                  </td>
                  <td
                    className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                    style={{ borderBottom: `1px solid ${T.border}` }}
                  >
                    <Badge color={TYPE_COLOR[r.type]}>{r.type}</Badge>
                  </td>
                  <td
                    className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                    style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                  >
                    {formatINR(r.amount)}
                  </td>
                  <td
                    className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                    style={{ color: T.textMut, borderBottom: `1px solid ${T.border}` }}
                  >
                    {r.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Top Products by Revenue" subtitle="Ranked by earnings">
          <table className="w-full border-collapse">
            <THead cols={["#", "Product", "Sales", "Revenue"]} />
            <tbody>
              {TOP_PRODUCTS.map((r) => (
                <tr key={r.id} className="group">
                  <td
                    className="px-[18px] py-2.5 text-xs font-bold group-hover:bg-white/[0.02]"
                    style={{ color: RANK_COLOR[r.rank] || T.textMut, borderBottom: `1px solid ${T.border}` }}
                  >
                    {r.rank}
                  </td>
                  <td
                    className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                    style={{ color: T.textPri, borderBottom: `1px solid ${T.border}` }}
                  >
                    {r.product}
                  </td>
                  <td
                    className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                    style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                  >
                    {r.sales}
                  </td>
                  <td
                    className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                    style={{ color: T.green, borderBottom: `1px solid ${T.border}` }}
                  >
                    {formatINR(r.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title="Upcoming Webinars & Sessions" subtitle="Scheduled and live soon">
        <table className="w-full border-collapse">
          <THead cols={["Title", "Type", "Scheduled", "Price", "Enrollments", "Status"]} />
          <tbody>
            {UPCOMING.map((r) => (
              <tr key={r.id} className="group">
                <td
                  className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                  style={{ color: T.textPri, borderBottom: `1px solid ${T.border}` }}
                >
                  {r.title}
                </td>
                <td className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <Badge color={TYPE_COLOR[r.type]}>{r.type}</Badge>
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {r.scheduled}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {formatINR(r.price)}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {r.enrollments}
                </td>
                <td className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <Badge color={STATUS_COLOR[r.status]}>{r.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}