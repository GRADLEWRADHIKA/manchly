// AudiencePage.jsx
import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
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
/* Mock data — parsed from legacy #audience source markup                 */
/* ---------------------------------------------------------------------- */

const AUDIENCE_STATS = [
  { id: "total-students", accent: T.blue, value: "47", label: "Total Students", trend: "12 this month" },
  { id: "active-learners", accent: T.green, value: "28", label: "Active Learners", note: "Enrolled in 1+ course" },
  { id: "completion-rate", accent: T.purple, value: "62%", label: "Completion Rate", trend: "5%" },
  { id: "avg-rating", accent: T.orange, value: "4.8★", label: "Avg Rating", note: "From 22 reviews" },
];

const STUDENTS = [
  { id: "s1", name: "Ankit Savla", email: "ankit.savla@msn.com", enrolledIn: "Building Chat App", products: 1, totalPaid: 0, joined: "23 Jun", lastActive: "Today" },
  { id: "s2", name: "Najikedas", email: "najikedas421@gmail.com", enrolledIn: "RN Architecture", products: 2, totalPaid: 299, joined: "21 Jun", lastActive: "Yesterday" },
  { id: "s3", name: "Abhishek Kumar", email: "abhishek@gmail.com", enrolledIn: "TypeScript for RN", products: 1, totalPaid: 0, joined: "20 Jun", lastActive: "20 Jun" },
  { id: "s4", name: "Demo User", email: "demo@example.com", enrolledIn: "State Management", products: 3, totalPaid: 698, joined: "18 Jun", lastActive: "18 Jun" },
  { id: "s5", name: "Test Student", email: "test@example.com", enrolledIn: "Career 1:1", products: 1, totalPaid: 499, joined: "15 Jun", lastActive: "15 Jun" },
];

/* ---------------------------------------------------------------------- */
/* Page                                                                    */
/* ---------------------------------------------------------------------- */

export default function AudiencePage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STUDENTS;
    return STUDENTS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.enrolledIn.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {AUDIENCE_STATS.map((s) => (
          <StatCard key={s.id} {...s} />
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <div
          className="flex items-center justify-between px-[18px] py-3.5"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          <span className="text-sm font-semibold" style={{ color: T.textPri }}>
            My Students
          </span>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 w-[220px]"
            style={{ backgroundColor: T.elevated, border: `1px solid ${T.border}` }}
          >
            <Search size={13} style={{ color: T.textMut }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students…"
              className="bg-transparent outline-none text-xs w-full"
              style={{ color: T.textPri }}
            />
          </div>
        </div>
        <table className="w-full border-collapse">
          <THead cols={["Name", "Email", "Enrolled In", "Products", "Total Paid", "Joined", "Last Active"]} />
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="group">
                <td
                  className="px-[18px] py-2.5 text-xs font-semibold group-hover:bg-white/[0.02]"
                  style={{ color: T.textPri, borderBottom: `1px solid ${T.border}` }}
                >
                  {s.name}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textMut, borderBottom: `1px solid ${T.border}` }}
                >
                  {s.email}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {s.enrolledIn}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {s.products}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs font-medium group-hover:bg-white/[0.02]"
                  style={{ color: s.totalPaid > 0 ? T.green : T.textSec, borderBottom: `1px solid ${T.border}` }}
                >
                  {formatINR(s.totalPaid)}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textMut, borderBottom: `1px solid ${T.border}` }}
                >
                  {s.joined}
                </td>
                <td
                  className="px-[18px] py-2.5 text-xs group-hover:bg-white/[0.02]"
                  style={{ color: T.textMut, borderBottom: `1px solid ${T.border}` }}
                >
                  {s.lastActive}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-[18px] py-8 text-center text-xs" style={{ color: T.textMut }}>
                  No students match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}