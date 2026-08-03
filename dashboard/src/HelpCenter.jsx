// Help & Legal — light creator-suite design: gold hero with WhatsApp CTA,
// contact-channel card grid, and a numbered policy reader (Terms / Privacy /
// Refund content mirrors the mobile app's policy modals).
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
  ArrowUpRight,
  Clock,
} from "lucide-react";
import colors from "./utils/colors";

const G = colors.gradients;

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
  const waMessage = `Hello, I am a ${roleWord}, I need help with Manchly.`;

  const CHANNELS = [
    {
      key: "whatsapp",
      title: "WhatsApp Support",
      sub: `+91 ${SUPPORT_PHONE}`,
      note: "Fastest replies",
      icon: MessageCircle,
      tint: "#059669",
      tintBg: "#ECFDF5",
      href: waLink(waMessage),
      external: true,
    },
    {
      key: "email",
      title: "Email Support",
      sub: SUPPORT_EMAIL,
      note: "Replies within 24 hours",
      icon: Mail,
      tint: "#2563EB",
      tintBg: "#EFF6FF",
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    {
      key: "phone",
      title: "Call Us",
      sub: `+91 ${SUPPORT_PHONE}`,
      note: "Mon–Sat · 10am–6pm IST",
      noteIcon: Clock,
      icon: Phone,
      tint: "#B45309",
      tintBg: "#FFFBEB",
      href: `tel:+91${SUPPORT_PHONE}`,
    },
    {
      key: "instagram",
      title: "Instagram",
      sub: "@manchly_app",
      note: "News, tips & updates",
      icon: Share2,
      tint: "#DB2777",
      tintBg: "#FDF2F8",
      href: INSTAGRAM,
      external: true,
    },
  ];

  return (
    <div style={{ padding: 32, color: colors.typography.primaryText }}>
      <style>{`
        .hc-card { transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease; }
        .hc-card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(17,24,39,0.09); border-color: #E2C58A !important; }
        .hc-card:hover .hc-arrow { opacity: 1; transform: translate(0,0); }
        .hc-tab { transition: background .15s ease, color .15s ease, border-color .15s ease; }
        .hc-tab:hover { border-color: #E2C58A; color: #92400E; }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 900 }}>
            Help &{" "}
            <span style={{ background: G.orange, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Legal
            </span>
          </h1>
          <p style={{ margin: "4px 0 0", color: colors.typography.secondaryText, fontSize: 14 }}>
            Support, contact and Manchly's policies.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                className={on ? undefined : "hc-tab"}
                onClick={() => setTab(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: on ? G.orange : "#fff",
                  color: on ? "#fff" : colors.typography.secondaryText,
                  border: `1px solid ${on ? "transparent" : colors.base.border}`,
                  boxShadow: on ? "0 6px 16px rgba(245,166,35,0.3)" : "none",
                  padding: "9px 16px", borderRadius: 999, cursor: "pointer",
                  fontWeight: 800, fontSize: 12.5, fontFamily: "inherit",
                }}
              >
                <t.icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "support" ? (
          <>
            {/* Hero */}
            <div
              style={{
                background: G.heroGold, borderRadius: 22, padding: "26px 30px",
                color: "#fff", marginBottom: 22, display: "flex",
                justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <LifeBuoy size={26} />
                </div>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 900 }}>We're here to help</div>
                  <div style={{ fontSize: 13.5, opacity: 0.85, marginTop: 3 }}>
                    Questions about payouts, courses or your account? Reach us on any channel below.
                  </div>
                </div>
              </div>
              <a
                href={waLink(waMessage)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#fff", color: "#92400E", textDecoration: "none",
                  borderRadius: 12, padding: "11px 20px", fontWeight: 800, fontSize: 13.5,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.18)", flexShrink: 0,
                }}
              >
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            </div>

            {/* Contact channels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {CHANNELS.map((c) => (
                <a
                  key={c.key}
                  className="hc-card"
                  href={c.href}
                  target={c.external ? "_blank" : undefined}
                  rel={c.external ? "noreferrer" : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 15,
                    background: "#fff", border: `1px solid ${colors.base.border}`,
                    borderRadius: 18, padding: "18px 20px",
                    textDecoration: "none", color: colors.typography.primaryText,
                  }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: c.tintBg, color: c.tint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <c.icon size={21} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{c.title}</div>
                    <div style={{ color: colors.typography.secondaryText, fontSize: 13, marginTop: 2 }}>{c.sub}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, background: c.tintBg, color: c.tint, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                      {c.noteIcon ? <c.noteIcon size={11} /> : null}
                      {c.note}
                    </div>
                  </div>
                  <ArrowUpRight
                    className="hc-arrow"
                    size={18}
                    color={colors.typography.secondaryText}
                    style={{ opacity: 0.35, transform: "translate(-3px, 3px)", transition: "opacity .16s ease, transform .16s ease", flexShrink: 0 }}
                  />
                </a>
              ))}
            </div>

            <p style={{ color: "#9CA3AF", fontSize: 12, textAlign: "center", marginTop: 26 }}>
              {COMPANY} · Madhepura, Bihar, India
            </p>
          </>
        ) : (
          <Policy sections={tab === "terms" ? TERMS : tab === "privacy" ? PRIVACY : REFUND} />
        )}
      </div>
    </div>
  );
}

function Policy({ sections }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${colors.base.border}`, borderRadius: 18, padding: "26px 30px", maxHeight: "70vh", overflowY: "auto" }}>
      {sections.map(([title, paras], i) => (
        <div key={i} style={{ display: "flex", gap: 14, marginBottom: 22 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: "#FFFBEB", border: "1px solid #FDE68A", color: "#B45309", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 800, flexShrink: 0 }}>
            {i + 1}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: "4px 0 8px", fontSize: 15, fontWeight: 800, color: colors.typography.primaryText }}>
              {title}
            </h3>
            {paras.map((p, j) => (
              <p key={j} style={{ margin: "0 0 7px", color: colors.typography.secondaryText, fontSize: 13.5, lineHeight: 1.6 }}>{p}</p>
            ))}
          </div>
        </div>
      ))}
      <p style={{ color: "#9CA3AF", fontSize: 11.5, margin: "2px 0 0", paddingLeft: 42 }}>
        Last updated periodically by {COMPANY}. Continued use of Manchly constitutes acceptance.
      </p>
    </div>
  );
}
