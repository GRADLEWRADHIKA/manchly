import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Radio,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Building2,
  UserCheck,
  ShoppingCart,
  CheckCircle2,
  FileText,
  Mic,
  Video,
  Trophy,
  Crown,
  Target,
  CreditCard,
  Download,
  UserPlus,
  Calendar,
} from "lucide-react";

// ── Design Tokens ────────────────────────────────────────────
const T = {
  bg:       "#000000",
  card:     "#111111",
  elevated: "#0A0A0A",
  orange:   "#FFC107",
  orangeD:  "#E6AC00",
  orangeL:  "rgba(255,193,7,0.13)",
  green:    "#10B981",
  greenL:   "rgba(16,185,129,0.13)",
  red:      "#EF4444",
  blue:     "#3B82F6",
  blueL:    "rgba(59,130,246,0.13)",
  purple:   "#A855F7",
  border:   "rgba(255,255,255,0.1)",
  borderHi: "rgba(255,193,7,0.4)",
  textPri:  "#FFFFFF",
  textSec:  "#A1A1AA",
  textMut:  "#71717A",
};

// ── Static Data ───────────────────────────────────────────────
const TOP_CREATORS = [
  { rank: 1, name: "Shivdutt Chauhan",    revenue: "₹12,400", commission: "₹1,240", courses: 4, webinars: 8 },
  { rank: 2, name: "Pritam Mondal",       revenue: "₹8,750",  commission: "₹875",   courses: 3, webinars: 2 },
  { rank: 3, name: "Radhika",             revenue: "₹5,200",  commission: "₹520",   courses: 2, webinars: 3 },
  { rank: 4, name: "Md Mazhar Hussain",   revenue: "₹3,100",  commission: "₹310",   courses: 1, webinars: 0 },
  { rank: 5, name: "Vikrant Kamble",      revenue: "₹1,800",  commission: "₹180",   courses: 2, webinars: 0 },
];

const TOP_USERS = [
  { rank: 1, name: "Ankit Savla",          enrollments: 3, spent: "₹1,200", joined: "23 Jun" },
  { rank: 2, name: "Najikedas",            enrollments: 2, spent: "₹800",   joined: "21 Jun" },
  { rank: 3, name: "Abhishek Kumar",       enrollments: 1, spent: "₹299",   joined: "23 Jun" },
  { rank: 4, name: "Manikanth Saggurthi", enrollments: 1, spent: "₹149",   joined: "22 Jun" },
  { rank: 5, name: "Upinderjeet Kaur",    enrollments: 0, spent: "₹0",     joined: "19 Jun" },
];

const TOP_SESSIONS = [
  { rank: 1, title: "React Native Career Strategy", creator: "Shivdutt Chauhan", price: "₹499", bookings: 8, revenue: "₹3,992", status: "published" },
  { rank: 2, title: "Instagram Growth Coaching",    creator: "Md Mazhar Hussain", price: "₹999", bookings: 3, revenue: "₹2,997", status: "published" },
  { rank: 3, title: "SEO Audit Session",            creator: "Manchly",           price: "₹1",   bookings: 1, revenue: "₹1",     status: "completed" },
];

const ALL_USERS = [
  { name: "Abhishek Kumar",     email: "abhishek@gmail.com",            phone: "+91 80548 10988", type: "user",    courses: 0, enrollments: 0,  joined: "23 Jun 2026", lastLogin: "—" },
  { name: "Ankit Savla",        email: "ankit.savla@msn.com",           phone: "+91 94272 36733", type: "user",    courses: 0, enrollments: 1,  joined: "23 Jun 2026", lastLogin: "—" },
  { name: "Md Mazhar Hussain",  email: "mdmazharhussain716@gmail.com",  phone: "88022 92952",     type: "creator", courses: 1, enrollments: 0,  joined: "19 Jun 2026", lastLogin: "—" },
  { name: "Upinderjeet Kaur",   email: "ujeetkaur924@gmail.com",        phone: "76579 67196",     type: "creator", courses: 0, enrollments: 0,  joined: "19 Jun 2026", lastLogin: "—" },
  { name: "Radhika",            email: "radhika@manchly.com",           phone: "—",               type: "creator", courses: 2, enrollments: 0,  joined: "15 Jun 2026", lastLogin: "—" },
  { name: "Demo Agency",        email: "agency@manchly.com",            phone: "—",               type: "agency",  courses: 5, enrollments: 12, joined: "1 Jun 2026",  lastLogin: "—" },
];

const ALL_COURSES = [
  { title: "TypeScript for React Native",  creator: "Shivdutt Chauhan",      category: "Tech",      status: "published", price: 0,   enrollments: 0, revenue: "₹0", created: "14 Jun" },
  { title: "RAILWAY EXPRESS BATCH",        creator: "Pritam Mondal",         category: "Video",     status: "published", price: 699, enrollments: 0, revenue: "₹0", created: "30 Apr" },
  { title: "Instagram Growth Mastert",     creator: "Md Mazhar Hussain",     category: "Marketing", status: "draft",     price: 999, enrollments: 0, revenue: "₹0", created: "19 Jun" },
  { title: "Auxiliary Verbs",              creator: "Vikrant Nanaji Kamble", category: "Language",  status: "draft",     price: 49,  enrollments: 0, revenue: "₹0", created: "17 Jun" },
  { title: "Advanced Tenses",             creator: "Vikrant Nanaji Kamble", category: "Language",  status: "draft",     price: 99,  enrollments: 0, revenue: "₹0", created: "17 Jun" },
];

const ALL_WEBINARS = [
  { title: "React Native Career AMA",         creator: "Shivdutt Chauhan", status: "published", price: 0,   scheduled: "29 Jul 2026", duration: "—",     enrollments: 0, created: "14 Jun" },
  { title: "Idea to App Store Deployment",    creator: "Shivdutt Chauhan", status: "published", price: 149, scheduled: "14 Jul 2026", duration: "—",     enrollments: 0, created: "14 Jun" },
  { title: "State Management Showdown",       creator: "Shivdutt Chauhan", status: "published", price: 199, scheduled: "5 Jul 2026",  duration: "—",     enrollments: 0, created: "14 Jun" },
  { title: "Building a Chat App - Live",      creator: "Shivdutt Chauhan", status: "published", price: 0,   scheduled: "28 Jun 2026", duration: "—",     enrollments: 1, created: "14 Jun" },
  { title: "React Native New Architecture",   creator: "Shivdutt Chauhan", status: "completed", price: 299, scheduled: "21 Jun 2026", duration: "—",     enrollments: 0, created: "14 Jun" },
  { title: "Seo",                             creator: "Manchly",          status: "completed", price: 1,   scheduled: "15 Apr 2026", duration: "60 min",enrollments: 1, created: "14 Apr" },
  { title: "dsa",                             creator: "Radhika",          status: "draft",     price: 20,  scheduled: "30 Jun 2026", duration: "—",     enrollments: 0, created: "15 Jun" },
];

const TRANSACTIONS = [
  { user: "Ankit Savla",  product: "Building a Chat App", type: "webinar", amount: "₹0",   commission: "₹0",  creator: "Shivdutt Chauhan", status: "published", date: "23 Jun 2026" },
  { user: "Demo User",    product: "RAILWAY EXPRESS BATCH", type: "course", amount: "₹699", commission: "₹70", creator: "Pritam Mondal",    status: "published", date: "30 Apr 2026" },
  { user: "Demo User 2",  product: "Seo Webinar",           type: "webinar", amount: "₹1",   commission: "₹0",  creator: "Manchly",          status: "published", date: "15 Apr 2026" },
];

// ── Badge Component ───────────────────────────────────────────
const badgeConfig = {
  published: { bg: "rgba(16,185,129,0.15)",  color: "#10B981",  border: "rgba(16,185,129,0.3)",  label: "Published" },
  draft:     { bg: "rgba(113,113,122,0.15)", color: "#71717A",  border: "rgba(113,113,122,0.3)", label: "Draft" },
  completed: { bg: "rgba(59,130,246,0.15)",  color: "#3B82F6",  border: "rgba(59,130,246,0.3)",  label: "Completed" },
  user:      { bg: "rgba(59,130,246,0.1)",   color: "#93C5FD",  border: "rgba(59,130,246,0.2)",  label: "User" },
  creator:   { bg: "rgba(168,85,247,0.15)",  color: "#C4B5FD",  border: "rgba(168,85,247,0.3)",  label: "Creator" },
  agency:    { bg: "rgba(255,193,7,0.15)",   color: "#FFC107",  border: "rgba(255,193,7,0.3)",   label: "Agency" },
  webinar:   { bg: "rgba(16,185,129,0.1)",   color: "#34D399",  border: "rgba(16,185,129,0.2)",  label: "Webinar" },
  course:    { bg: "rgba(59,130,246,0.1)",   color: "#93C5FD",  border: "rgba(59,130,246,0.2)",  label: "Course" },
  success:   { bg: "rgba(16,185,129,0.15)",  color: "#10B981",  border: "rgba(16,185,129,0.3)",  label: "Success" },
};

function Badge({ variant }) {
  const c = badgeConfig[variant] || badgeConfig.draft;
  return (
    <span
      className="inline-block rounded-full text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 border"
      style={{ background: c.bg, color: c.color, borderColor: c.border }}
    >
      {c.label}
    </span>
  );
}

function RankCell({ rank }) {
  const color = rank === 1 ? "#F59E0B" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : T.textMut;
  return (
    <span className="text-[11px] font-bold" style={{ color }}>
      {rank}
    </span>
  );
}

function StatCard({ icon, value, label, accent, change, changeUp, sub, subValue }) {
  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden border transition-colors duration-200 hover:border-[rgba(255,193,7,0.4)] group"
      style={{ background: T.card, borderColor: T.border }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ background: accent }}
      />
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
        style={{ background: `${accent}1a` }}
      >
        {icon}
      </div>
      {/* Value */}
      <div className="text-[26px] font-bold leading-none" style={{ color: T.textPri }}>
        {value}
      </div>
      {/* Label */}
      <div className="text-[10px] font-semibold uppercase tracking-wide mt-1" style={{ color: T.textMut }}>
        {label}
      </div>
      {/* Change */}
      {change && (
        <div className="flex items-center gap-1 mt-2 text-[11px]">
          {changeUp ? (
            <TrendingUp size={11} style={{ color: T.green }} />
          ) : (
            <TrendingDown size={11} style={{ color: T.red }} />
          )}
          <span style={{ color: changeUp ? T.green : T.red }}>{change}</span>
        </div>
      )}
      {/* Sub value (commission) */}
      {sub && subValue && (
        <div className="flex items-center gap-1 mt-2 text-[11px]">
          <span style={{ color: T.textMut }}>{sub}</span>
          <span className="ml-1 font-semibold" style={{ color: T.green }}>{subValue}</span>
        </div>
      )}
    </div>
  );
}

function Panel({ title, subtitle, action, children }) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ background: T.card, borderColor: T.border }}>
      <div
        className="flex items-center justify-between px-[18px] py-[14px] border-b"
        style={{ borderColor: T.border }}
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

function Th({ children }) {
  return (
    <th
      className="text-left text-[10px] font-semibold uppercase tracking-wide px-[18px] py-[10px] border-b"
      style={{ color: T.textMut, background: T.elevated, borderColor: T.border }}
    >
      {children}
    </th>
  );
}

function Tr({ children }) {
  return (
    <tr
      className="border-b last:border-b-0 transition-colors duration-100 hover:bg-white/[0.02]"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      {children}
    </tr>
  );
}

function Td({ children, muted, highlight }) {
  return (
    <td
      className="px-[18px] py-[11px] text-xs"
      style={{
        color: highlight ? T.textPri : muted ? T.textMut : T.textSec,
        fontWeight: highlight ? 600 : 400,
      }}
    >
      {children}
    </td>
  );
}

function Seg({ items, active, onChange }) {
  return (
    <div className="flex gap-0.5 p-[3px] rounded-lg" style={{ background: T.elevated }}>
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className="px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-150"
          style={
            active === item
              ? { background: T.card, color: T.textPri, boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }
              : { background: "transparent", color: T.textMut }
          }
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function CommissionRow({ label, value, valueColor, highlight }) {
  return (
    <div
      className="flex items-center justify-between px-[18px] py-3 border-b last:border-b-0"
      style={{
        borderColor: "rgba(255,255,255,0.05)",
        background: highlight ? "rgba(59,130,246,0.04)" : "transparent",
      }}
    >
      <span className="text-xs font-medium" style={{ color: T.textSec }}>
        {label}
      </span>
      <span className="text-[15px] font-bold" style={{ color: valueColor ?? T.green }}>
        {value}
      </span>
    </div>
  );
}

function GhostBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors duration-150 hover:text-white"
      style={{ background: T.elevated, borderColor: T.border, color: T.textMut }}
    >
      {children}
    </button>
  );
}

// ── Tab Pages ─────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="space-y-5">
      {/* Users */}
      <section>
        <div
          className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: T.textMut }}
        >
          Users
          <div className="flex-1 h-px" style={{ background: T.border }} />
        </div>
        <div className="grid grid-cols-4 gap-3.5">
          <StatCard icon={<Users size={16} color={T.blue} />}      value="100" label="Total Users"    accent={T.blue}   change="↑ 12% this month" changeUp />
          <StatCard icon={<Sparkles size={16} color={T.purple} />} value="50"  label="Creators"       accent={T.purple} change="↑ 8%"              changeUp />
          <StatCard icon={<UserCheck size={16} color={T.green} />} value="40"  label="Regular Users"  accent={T.green}  change="↑ 15%"             changeUp />
          <StatCard icon={<Building2 size={16} color={T.orange} />}value="10"  label="Agencies"       accent={T.orange} change="↑ 5%"              changeUp />
        </div>
      </section>

      {/* Courses */}
      <section>
        <div
          className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: T.textMut }}
        >
          Courses
          <div className="flex-1 h-px" style={{ background: T.border }} />
        </div>
        <div className="grid grid-cols-4 gap-3.5">
          <StatCard icon={<BookOpen size={16} color={T.blue} />}      value="50" label="Total Courses" accent={T.blue} />
          <StatCard icon={<CheckCircle2 size={16} color={T.green} />} value="30" label="Published"     accent={T.green} />
          <StatCard icon={<FileText size={16} color={T.textMut} />}   value="20" label="Draft"          accent={T.textMut} />
          <StatCard icon={<ShoppingCart size={16} color={T.purple} />}value="15" label="Enrollments"   accent={T.purple} />
        </div>
      </section>

      {/* 3-column quick panels */}
      <div className="grid grid-cols-3 gap-5">
        {/* Webinars */}
        <Panel title={<span className="flex items-center gap-2"><Mic size={14} color={T.orange} />Webinars</span>}>
          <CommissionRow label="Total"       value="50" valueColor={T.textPri} />
          <CommissionRow label="Published"   value="30" valueColor={T.green}   />
          <CommissionRow label="Draft"       value="20" valueColor={T.textMut} />
          <CommissionRow label="Enrollments" value="10" valueColor={T.blue}    />
        </Panel>

        {/* 1:1 Sessions */}
        <Panel title={<span className="flex items-center gap-2"><Video size={14} color={T.blue} />1:1 Sessions</span>}>
          <CommissionRow label="Total"       value="50" valueColor={T.textPri} />
          <CommissionRow label="Published"   value="30" valueColor={T.green}   />
          <CommissionRow label="Draft"       value="20" valueColor={T.textMut} />
          <CommissionRow label="Enrollments" value="5"  valueColor={T.blue}    />
        </Panel>

        {/* Revenue Overview */}
        <Panel title={<span className="flex items-center gap-2"><DollarSign size={14} color={T.green} />Revenue Overview</span>}>
          <CommissionRow label="Courses Revenue"  value="₹10,000" />
          <CommissionRow label="Webinars Revenue" value="₹10,000" />
          <CommissionRow label="1:1 Revenue"      value="₹10,000" />
          <CommissionRow label="Total Commission" value="₹3,000"  valueColor={T.blue} highlight />
        </Panel>
      </div>

      {/* Top 10 tables */}
      <div className="grid grid-cols-2 gap-5">
        {/* Top Creators */}
        <Panel
          title={<span className="flex items-center gap-2"><Trophy size={14} color={T.orange} />Top 10 Creators</span>}
          subtitle="By total revenue generated"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>#</Th><Th>Name</Th><Th>Revenue</Th><Th>Commission</Th><Th>Courses</Th><Th>Webinars</Th>
              </tr>
            </thead>
            <tbody>
              {TOP_CREATORS.map((r) => (
                <Tr key={r.rank}>
                  <Td><RankCell rank={r.rank} /></Td>
                  <Td highlight>{r.name}</Td>
                  <Td>{r.revenue}</Td>
                  <Td>{r.commission}</Td>
                  <Td>{r.courses}</Td>
                  <Td>{r.webinars}</Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Top Users */}
        <Panel
          title={<span className="flex items-center gap-2"><Crown size={14} color={T.orange} />Top 10 Users</span>}
          subtitle="By total enrollments"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>#</Th><Th>Name</Th><Th>Enrollments</Th><Th>Spent (₹)</Th><Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {TOP_USERS.map((r) => (
                <Tr key={r.rank}>
                  <Td><RankCell rank={r.rank} /></Td>
                  <Td highlight>{r.name}</Td>
                  <Td>{r.enrollments}</Td>
                  <Td>{r.spent}</Td>
                  <Td muted>{r.joined}</Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Top 1:1 Sessions */}
      <Panel
        title={<span className="flex items-center gap-2"><Target size={14} color={T.orange} />Top 10 1:1 Sessions</span>}
        subtitle="By bookings and revenue"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>#</Th><Th>Session Title</Th><Th>Creator</Th>
              <Th>Price (₹)</Th><Th>Bookings</Th><Th>Revenue</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {TOP_SESSIONS.map((r) => (
              <Tr key={r.rank}>
                <Td><RankCell rank={r.rank} /></Td>
                <Td highlight>{r.title}</Td>
                <Td>{r.creator}</Td>
                <Td>{r.price}</Td>
                <Td>{r.bookings}</Td>
                <Td>{r.revenue}</Td>
                <Td><Badge variant={r.status} /></Td>
              </Tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function UsersTab() {
  const [seg, setSeg] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = ALL_USERS.filter((u) => {
    const matchSeg =
      seg === "All" ||
      (seg === "Creator" && u.type === "creator") ||
      (seg === "User"    && u.type === "user")    ||
      (seg === "Agency"  && u.type === "agency");
    const matchSearch =
      search === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchSeg && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3.5">
        <StatCard icon={<Users size={16} color={T.blue} />}      value="100" label="Total Users"    accent={T.blue} />
        <StatCard icon={<Sparkles size={16} color={T.purple} />} value="50"  label="Creators"       accent={T.purple} />
        <StatCard icon={<UserCheck size={16} color={T.green} />} value="40"  label="Regular Users"  accent={T.green} />
        <StatCard icon={<Building2 size={16} color={T.orange} />}value="10"  label="Agencies"       accent={T.orange} />
      </div>

      <Panel
        title="All Users"
        action={
          <div className="flex items-center gap-2">
            <Seg items={["All", "Creator", "User", "Agency"]} active={seg} onChange={setSeg} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email…"
              className="rounded-lg px-3 py-1.5 text-xs outline-none w-48"
              style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textPri }}
            />
          </div>
        }
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Type</Th>
              <Th>Courses</Th><Th>Enrollments</Th><Th>Joined</Th><Th>Last Login</Th><Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <Tr key={u.email}>
                <Td highlight>{u.name}</Td>
                <Td muted>{u.email}</Td>
                <Td>{u.phone}</Td>
                <Td><Badge variant={u.type} /></Td>
                <Td>{u.courses}</Td>
                <Td>{u.enrollments}</Td>
                <Td>{u.joined}</Td>
                <Td muted>{u.lastLogin}</Td>
                <Td><GhostBtn>View</GhostBtn></Td>
              </Tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function CoursesTab() {
  const [seg, setSeg] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = ALL_COURSES.filter((c) => {
    const matchSeg =
      seg === "All"       ||
      (seg === "Published" && c.status === "published") ||
      (seg === "Draft"     && c.status === "draft");
    const matchSearch =
      search === "" || c.title.toLowerCase().includes(search.toLowerCase());
    return matchSeg && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3.5">
        <StatCard icon={<BookOpen size={16} color={T.blue} />}       value="50" label="Total Courses"    accent={T.blue} />
        <StatCard icon={<CheckCircle2 size={16} color={T.green} />}  value="30" label="Published"        accent={T.green} />
        <StatCard icon={<FileText size={16} color={T.textMut} />}    value="20" label="Draft"             accent={T.textMut} />
        <StatCard icon={<ShoppingCart size={16} color={T.purple} />} value="15" label="Total Enrollments" accent={T.purple} />
      </div>

      <Panel
        title="All Courses"
        action={
          <div className="flex items-center gap-2">
            <Seg items={["All", "Published", "Draft"]} active={seg} onChange={setSeg} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses…"
              className="rounded-lg px-3 py-1.5 text-xs outline-none w-44"
              style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textPri }}
            />
          </div>
        }
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Title</Th><Th>Creator</Th><Th>Category</Th><Th>Status</Th>
              <Th>Price (₹)</Th><Th>Enrollments</Th><Th>Revenue</Th><Th>Created</Th><Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <Tr key={c.title}>
                <Td highlight>{c.title}</Td>
                <Td>{c.creator}</Td>
                <Td>{c.category}</Td>
                <Td><Badge variant={c.status} /></Td>
                <Td>{c.price}</Td>
                <Td>{c.enrollments}</Td>
                <Td>{c.revenue}</Td>
                <Td muted>{c.created}</Td>
                <Td><GhostBtn>View</GhostBtn></Td>
              </Tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function WebinarsTab() {
  const [seg, setSeg] = useState("All");

  const filtered = ALL_WEBINARS.filter((w) => {
    if (seg === "All")       return true;
    if (seg === "Published") return w.status === "published";
    if (seg === "Draft")     return w.status === "draft";
    if (seg === "Completed") return w.status === "completed";
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3.5">
        <StatCard icon={<Radio size={16} color={T.blue} />}          value="50" label="Total Webinars" accent={T.blue} />
        <StatCard icon={<CheckCircle2 size={16} color={T.green} />}  value="30" label="Published"      accent={T.green} />
        <StatCard icon={<FileText size={16} color={T.textMut} />}    value="20" label="Draft"           accent={T.textMut} />
        <StatCard icon={<ShoppingCart size={16} color={T.purple} />} value="10" label="Enrollments"    accent={T.purple} />
      </div>

      <Panel
        title="All Webinars"
        action={<Seg items={["All", "Published", "Draft", "Completed"]} active={seg} onChange={setSeg} />}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Title</Th><Th>Creator</Th><Th>Status</Th><Th>Price (₹)</Th>
              <Th>Scheduled</Th><Th>Duration</Th><Th>Enrollments</Th><Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <Tr key={w.title}>
                <Td highlight>{w.title}</Td>
                <Td>{w.creator}</Td>
                <Td><Badge variant={w.status} /></Td>
                <Td>{w.price}</Td>
                <Td>{w.scheduled}</Td>
                <Td>{w.duration}</Td>
                <Td>{w.enrollments}</Td>
                <Td muted>{w.created}</Td>
              </Tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function RevenueTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3.5">
        <StatCard
          icon={<BookOpen size={16} color={T.blue} />}
          value="₹10,000" label="Courses Revenue" accent={T.blue}
          sub="Commission:" subValue="₹1,000"
        />
        <StatCard
          icon={<Mic size={16} color={T.purple} />}
          value="₹10,000" label="Webinars Revenue" accent={T.purple}
          sub="Commission:" subValue="₹1,000"
        />
        <StatCard
          icon={<Video size={16} color={T.green} />}
          value="₹10,000" label="1:1 Sessions Revenue" accent={T.green}
          sub="Commission:" subValue="₹1,000"
        />
        <StatCard
          icon={<DollarSign size={16} color={T.orange} />}
          value="₹30,000" label="Total Revenue" accent={T.orange}
          sub="Total Commission:" subValue="₹3,000"
        />
      </div>

      <Panel
        title={<span className="flex items-center gap-2"><CreditCard size={14} color={T.orange} />Recent Transactions</span>}
        action={
          <GhostBtn>
            <Download size={12} />Export
          </GhostBtn>
        }
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>User</Th><Th>Product</Th><Th>Type</Th><Th>Amount (₹)</Th>
              <Th>Commission</Th><Th>Creator</Th><Th>Status</Th><Th>Date</Th>
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map((t) => (
              <Tr key={`${t.user}-${t.date}`}>
                <Td highlight>{t.user}</Td>
                <Td>{t.product}</Td>
                <Td><Badge variant={t.type} /></Td>
                <Td>{t.amount}</Td>
                <Td>{t.commission}</Td>
                <Td>{t.creator}</Td>
                <Td><Badge variant={t.status} /></Td>
                <Td muted>{t.date}</Td>
              </Tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

// ── Nav Config ────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "users",    label: "Users",    Icon: Users },
  { id: "courses",  label: "Courses",  Icon: BookOpen },
  { id: "webinars", label: "Webinars", Icon: Radio },
  { id: "revenue",  label: "Revenue",  Icon: DollarSign },
];

const PAGE_META = {
  overview: { title: "Overview",          sub: "Platform health at a glance" },
  users:    { title: "Users",             sub: "Manage all users, creators & agencies" },
  courses:  { title: "Courses",           sub: "All courses across the platform" },
  webinars: { title: "Webinars",          sub: "Scheduled and completed webinars" },
  revenue:  { title: "Revenue & Payments",sub: "Earnings, commissions and transactions" },
};

// ── Root Component ────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const meta = PAGE_META[activeTab];

  return (
    <div
      className="flex min-h-screen text-[13px]"
      style={{ background: T.bg, color: T.textPri, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="w-[220px] min-w-[220px] flex flex-col sticky top-0 h-screen overflow-y-auto border-r"
        style={{ background: T.card, borderColor: T.border }}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: T.border }}>
          <div
            className="text-xl font-bold tracking-tight"
            style={{
              background: `linear-gradient(135deg, ${T.orange}, ${T.orangeD})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            manchly
          </div>
          <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: T.textMut }}>
            Admin Console
          </div>
        </div>

        {/* Nav */}
        <nav className="py-3">
          <div className="px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.textMut }}>
            Main
          </div>
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="w-full flex items-center gap-2.5 px-5 py-2 text-left text-[13px] font-medium transition-all duration-150 border-l-[3px]"
                style={{
                  borderLeftColor: active ? T.orange : "transparent",
                  background:      active ? T.orangeL : "transparent",
                  color:           active ? T.orange  : T.textMut,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = T.textPri;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = T.textMut;
                  }
                }}
              >
                <Icon size={15} color={active ? T.orange : T.textMut} />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-7 py-3.5 border-b sticky top-0 z-10"
          style={{ background: T.card, borderColor: T.border }}
        >
          <div>
            <div className="text-[18px] font-bold" style={{ color: T.textPri }}>
              {meta.title}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: T.textMut }}>
              {meta.sub}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border"
              style={{ background: T.elevated, borderColor: T.border, color: T.textMut }}
            >
              <Calendar size={12} /> Jun 2026
            </div>
            <GhostBtn>
              <Download size={12} />Export CSV
            </GhostBtn>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-85"
              style={{ background: T.orange, color: "#000" }}
            >
              <UserPlus size={12} /> Invite Creator
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-7 py-6">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "users"    && <UsersTab />}
          {activeTab === "courses"  && <CoursesTab />}
          {activeTab === "webinars" && <WebinarsTab />}
          {activeTab === "revenue"  && <RevenueTab />}
        </main>
      </div>
    </div>
  );
}