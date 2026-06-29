// types.js
// ---------------------------------------------------------------------------
// Shared type definitions (JSDoc) + design tokens for the Manchly Creator
// Dashboard. Import `T` anywhere a Tailwind arbitrary value needs a
// canonical hex / rgba reference, e.g. className={`bg-[${T.card}]`}.
// ---------------------------------------------------------------------------

/**
 * @typedef {"up" | "down" | "neutral"} TrendDirection
 */

/**
 * @typedef {Object} StatTrend
 * @property {TrendDirection} direction
 * @property {string} label - e.g. "18% this month"
 */

/**
 * @typedef {Object} DashboardMetric
 * @property {string} id
 * @property {string} label
 * @property {string} value
 * @property {string} accent       - hex color used for the card's top accent bar / icon bg
 * @property {import('lucide-react').LucideIcon} [icon]
 * @property {StatTrend} [trend]
 * @property {string} [note]       - neutral subtext when no trend applies
 */

/**
 * @typedef {"Course" | "Webinar" | "1:1"} ProductType
 */

/**
 * @typedef {"Paid" | "Pending" | "Published" | "Draft" | "Confirmed"} StatusType
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} student
 * @property {string} product
 * @property {ProductType} type
 * @property {number} gross
 * @property {number} fee
 * @property {number} net
 * @property {string} date
 * @property {StatusType} status
 */

/**
 * @typedef {Object} AudienceMember
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} enrolledIn
 * @property {number} products
 * @property {number} totalPaid
 * @property {string} joined
 * @property {string} lastActive
 */

/**
 * @typedef {Object} EnrollmentRow
 * @property {string} id
 * @property {string} student
 * @property {string} product
 * @property {ProductType} type
 * @property {number} amount
 * @property {string} date
 */

/**
 * @typedef {Object} TopProductRow
 * @property {string} id
 * @property {number} rank
 * @property {string} product
 * @property {number} sales
 * @property {number} revenue
 */

/**
 * @typedef {Object} UpcomingRow
 * @property {string} id
 * @property {string} title
 * @property {"Webinar" | "1:1"} type
 * @property {string} scheduled
 * @property {number} price
 * @property {number} enrollments
 * @property {"Published" | "Draft"} status
 */

/**
 * @typedef {Object} EarningsBreakdown
 * @property {string} id
 * @property {string} label
 * @property {import('lucide-react').LucideIcon} icon
 * @property {number} gross
 * @property {number} fee
 * @property {number} net
 */

export const T = {
  bg: "#000000", // Main background
  card: "#111111", // Sidebar, Panels, Cards
  elevated: "#0A0A0A", // Inner highlights, Table Headers
  orange: "#FFC107", // Primary Brand Accent, Active states
  orangeD: "#E6AC00", // Hover states for primary
  orangeL: "rgba(255,193,7,0.13)", // Active tab backgrounds, soft badges
  green: "#10B981", // Success, Up trends, Published
  greenL: "rgba(16,185,129,0.13)",
  red: "#EF4444", // Down trends, Errors
  blue: "#3B82F6", // Secondary data accents
  blueL: "rgba(59,130,246,0.13)",
  purple: "#A855F7", // Tertiary data accents
  border: "rgba(255,255,255,0.1)", // All standard borders/dividers
  borderHi: "rgba(255,193,7,0.4)", // Focus borders, Hover borders
  textPri: "#FFFFFF", // Headings, Primary values
  textSec: "#A1A1AA", // Subtext, Table data
  textMut: "#71717A", // Icons, Inactive tabs, Metatags
};

/** Formats a number into the ₹ Indian Rupee display format used across the dashboard. */
export const formatINR = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default T;