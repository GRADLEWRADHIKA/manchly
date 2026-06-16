import { useState } from "react";
import {
  LifeBuoy,
  MessageCircle,
  Mail,
  Phone,
  Share2,
  FileText,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  Clock,
} from "lucide-react";

const T = {
  bg: "#000000",
  card: "#111111",
  elevated: "#0A0A0A",
  orange: "#FFC107",
  green: "#10B981",
  blue: "#3B82F6",
  border: "rgba(255,255,255,0.1)",
  textPri: "#FFFFFF",
  textSec: "#A1A1AA",
};

// ── Real Manchly support / brand details (from the mobile app) ──
const SUPPORT_PHONE = "6363790659";
const SUPPORT_EMAIL = "help@manchly.com";
const INSTAGRAM = "https://www.instagram.com/manchly_app";
const COMPANY = "Agnivora Digital Pvt Ltd";
const waLink = (msg) =>
  `https://wa.me/91${SUPPORT_PHONE}?text=${encodeURIComponent(msg)}`;

// ── Policy content (faithful condensation of the mobile policy modals) ──
const TERMS = [
  ["Acceptance of Terms", ["By accessing or using the Manchly platform, you agree to comply with these Terms of Service. If you do not agree, do not use the Platform."]],
  ["Eligibility", ["You must be at least 18 years old and a resident of India. By using the Platform you represent that you meet these criteria."]],
  ["User Roles", ["Creators: upload, share and sell content and manage communities; responsible for the legal compliance of their content.", "Learners/Customers: access and purchase content; agree not to redistribute it without permission.", "Admins: manage Platform operations."]],
  ["Payments & Refunds", ["All payments are processed via Cashfree.", "Final payable amount = Course Price + 18% GST + 2% Platform Fee.", "All sales are final due to digital delivery. Refunds are considered only for duplicate payments, technical issues preventing access, or system errors — raised within 48 hours at " + SUPPORT_EMAIL + "."]],
  ["Creator Payouts, Withdrawals & TDS", ["Creators can request a withdrawal of their available balance once every 48 hours; requests made before the cooldown will not be processed.", "2% TDS is deducted from creator payouts."]],
  ["Content Ownership", ["Users retain ownership of content they upload and grant " + COMPANY + " a worldwide, royalty-free license to host, display and distribute it for platform functionality. The Manchly brand and IP remain the property of " + COMPANY + "."]],
  ["Prohibited Activities", ["Violating laws, infringing IP, uploading harmful/offensive/illegal content, or interfering with Platform security or functionality is prohibited."]],
  ["Termination", [COMPANY + " may suspend or terminate accounts for violations, misuse or inactivity. Users may terminate their account anytime via settings or support."]],
  ["Limitation of Liability", ["The Platform is provided \"as-is\". " + COMPANY + " is not liable for indirect, incidental or consequential damages arising from use of the Platform."]],
  ["Governing Law", ["These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts in Madhepura, Bihar, India."]],
];

const PRIVACY = [
  ["Introduction", [COMPANY + " respects your privacy and is committed to protecting personal data collected via Manchly. This policy explains what we collect, how we use it, and your rights under Indian law."]],
  ["Data We Collect", ["Personal information: name, email, phone number, account credentials.", "Payment information: processed securely via Cashfree (we do not store full card details).", "Usage data: device info, app activity, analytics, cookies."]],
  ["How We Use Your Data", ["To provide and improve the Platform, process payments and refunds, communicate updates and support, and ensure security and prevent misuse."]],
  ["Data Sharing", ["Shared only with payment processors (Cashfree), analytics providers, and legal authorities where required by law. We do not sell or rent your personal information."]],
  ["Data Security & Retention", ["We use reasonable technical and organizational measures to protect your data, and retain it only as long as necessary for operations and legal compliance."]],
  ["Your Rights", ["Access, correct or delete your personal data, withdraw consent for non-essential processing, and report concerns via " + SUPPORT_EMAIL + "."]],
  ["Children's Privacy", ["The Platform is not intended for children under 18; we do not knowingly collect data from minors."]],
  ["Governing Law", ["This policy is governed by the laws of India; disputes fall under the jurisdiction of courts in Madhepura, Bihar, India."]],
];

const REFUND = [
  ["General Policy", ["This policy covers online courses, webinars, digital content and memberships. Due to the nature of digital delivery, all sales are final unless stated otherwise."]],
  ["Refund Eligibility", ["Refunds are considered only for: a duplicate payment, a technical issue on our end preventing access, or an incorrect product purchased due to a system error. Requests must be raised within 48 hours of purchase."]],
  ["Non-Refundable Scenarios", ["Change of mind, lack of usage/completion, failure to understand the product before purchase, partial consumption of content, or delay in joining live sessions/webinars."]],
  ["Refund Process", ["Email " + SUPPORT_EMAIL + " with your Order ID, payment proof and reason. We review within 3-5 business days; if approved, the refund is processed within 7-10 business days to the original payment method."]],
  ["Cancellation", ["Orders cannot be cancelled after successful payment. Subscriptions must be cancelled before the next billing cycle."]],
  ["Chargebacks & Disputes", ["Initiating a chargeback without contacting us first may result in permanent account suspension and revoked access to all products/services."]],
];

const TABS = [
  { key: "support", label: "Support", icon: LifeBuoy },
  { key: "terms", label: "Terms of Service", icon: FileText },
  { key: "privacy", label: "Privacy Policy", icon: ShieldCheck },
  { key: "refund", label: "Refund Policy", icon: RotateCcw },
];

export default function HelpCenter({ role = "USER" }) {
  const [tab, setTab] = useState("support");
  const roleWord = String(role).toUpperCase() === "CREATOR" ? "Creator" : "User";

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,193,7,0.12)", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LifeBuoy size={22} color={T.orange} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Help & Legal</h2>
          <p style={{ margin: "3px 0 0", color: T.textSec, fontSize: 13 }}>Support, contact and Manchly's policies.</p>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: "flex", alignItems: "center", gap: 7, background: on ? T.orange : T.card, color: on ? "#000" : T.textSec, border: `1px solid ${on ? T.orange : T.border}`, padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>
              <t.icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "support" ? (
        <div style={{ display: "grid", gap: 14 }}>
          {/* WhatsApp */}
          <a href={waLink(`Hello, I am a ${roleWord}, I need help with Manchly.`)} target="_blank" rel="noreferrer"
            style={{ ...row, textDecoration: "none" }}>
            <Icon bg="rgba(16,185,129,0.15)" color={T.green}><MessageCircle size={20} /></Icon>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14.5 }}>WhatsApp Support</div>
              <div style={{ color: T.textSec, fontSize: 12.5 }}>Chat with us — +91 {SUPPORT_PHONE}</div>
            </div>
            <ExternalLink size={16} color={T.textSec} />
          </a>

          {/* Email */}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ ...row, textDecoration: "none" }}>
            <Icon bg="rgba(59,130,246,0.15)" color={T.blue}><Mail size={20} /></Icon>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14.5 }}>Email Support</div>
              <div style={{ color: T.textSec, fontSize: 12.5 }}>{SUPPORT_EMAIL}</div>
            </div>
            <ExternalLink size={16} color={T.textSec} />
          </a>

          {/* Phone + hours */}
          <div style={row}>
            <Icon bg="rgba(255,193,7,0.15)" color={T.orange}><Phone size={20} /></Icon>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14.5 }}>Phone</div>
              <div style={{ color: T.textSec, fontSize: 12.5 }}>+91 {SUPPORT_PHONE}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.textSec, fontSize: 11.5 }}>
              <Clock size={13} /> Mon–Sat, 10am–6pm IST
            </div>
          </div>

          {/* Instagram / social */}
          <a href={INSTAGRAM} target="_blank" rel="noreferrer" style={{ ...row, textDecoration: "none" }}>
            <Icon bg="rgba(225,48,108,0.15)" color="#E1306C"><Share2 size={20} /></Icon>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14.5 }}>Follow us on Instagram</div>
              <div style={{ color: T.textSec, fontSize: 12.5 }}>@manchly_app</div>
            </div>
            <ExternalLink size={16} color={T.textSec} />
          </a>

          <p style={{ color: T.textSec, fontSize: 11.5, textAlign: "center", marginTop: 4 }}>
            {COMPANY} · Madhepura, Bihar, India
          </p>
        </div>
      ) : (
        <Policy sections={tab === "terms" ? TERMS : tab === "privacy" ? PRIVACY : REFUND} />
      )}
    </div>
  );
}

function Policy({ sections }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "22px 24px", maxHeight: "70vh", overflowY: "auto" }}>
      {sections.map(([title, paras], i) => (
        <div key={i} style={{ marginBottom: 18 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 800, color: T.orange }}>
            {i + 1}. {title}
          </h3>
          {paras.map((p, j) => (
            <p key={j} style={{ margin: "0 0 7px", color: T.textSec, fontSize: 13, lineHeight: 1.55 }}>{p}</p>
          ))}
        </div>
      ))}
      <p style={{ color: "#71717A", fontSize: 11, marginTop: 4 }}>
        Last updated periodically by {COMPANY}. Continued use of Manchly constitutes acceptance.
      </p>
    </div>
  );
}

function Icon({ bg, color, children }) {
  return (
    <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {children}
    </div>
  );
}

const row = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  padding: "14px 16px",
  color: T.textPri,
};
