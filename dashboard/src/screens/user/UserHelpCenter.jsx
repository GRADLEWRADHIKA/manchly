import React, { useState } from "react";
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
  X,
  ExternalLink
} from "lucide-react";
import colors from "../../utils/colors";
import UserSidebar from "./UserSidebar";

const G = colors.gradients;

const SUPPORT_PHONE = "6363790659";
const SUPPORT_EMAIL = "help@manchly.com";
const INSTAGRAM = "https://www.instagram.com/manchly_app";
const COMPANY = "Agnivora Digital Pvt Ltd";

const waLink = (msg) =>
  `https://wa.me/91${SUPPORT_PHONE}?text=${encodeURIComponent(msg)}`;

// ── Policy Content Structure ──
const TERMS = [
  ["1. Acceptance of Terms", ["By accessing or using the Manchly platform (\"Platform\"), you agree to comply with these Terms of Service (\"Terms\"). If you do not agree, do not use the Platform."]],
  ["2. Eligibility", ["You must be at least 18 years old and a resident of India. By using the Platform, you represent and warrant that you meet these criteria."]],
  ["3. User Roles", ["Learners/Customers: Access and purchase courses, webinars, and sessions; agree not to redistribute content without permission.", "Creators: Upload, share, sell content, manage communities; responsible for legal compliance.", "Admins: Manage Platform operations."]],
  ["4. Account Registration", ["Users must provide accurate, complete, and up-to-date information. Account credentials are confidential; users are responsible for all activity under their accounts."]],
  ["5. Payments & Refunds", ["All payments are processed securely via Cashfree.", "Checkout Price Breakup: Final payable amount = Course Price + 18% GST + 2% Platform Fee.", "Refund Policy: All sales are final due to digital delivery. Refunds are considered only for duplicate payments, technical issues preventing access, or system errors — raised within 48 hours at " + SUPPORT_EMAIL + "."]],
  ["6. Content Access & Intellectual Property", ["Purchasing content grants you a personal, non-transferable, limited license to access materials. Content remains the intellectual property of the respective Creator or Agnivora Digital Pvt Ltd."]],
  ["7. Prohibited Activities", ["Violating laws, infringing IP, sharing account access, downloading/recording protected content without permission, or interfering with Platform security is strictly prohibited."]],
  ["8. Termination", ["Agnivora Digital Pvt Ltd may suspend or terminate accounts for violations, misuse, or inactivity. Users may request account deletion anytime via settings or support."]],
  ["9. Limitation of Liability", ["The Platform is provided \"as-is\". Agnivora Digital Pvt Ltd is not liable for indirect, incidental, or consequential damages arising from Platform use."]],
  ["10. Governing Law & Jurisdiction", ["These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts in Madhepura, Bihar, India."]],
];

const PRIVACY = [
  ["1. Introduction", [COMPANY + " respects your privacy and is committed to protecting personal data collected via the Manchly platform. This policy explains what data we collect, how we use it, and your rights under Indian law."]],
  ["2. Data We Collect", ["Personal Information: Name, email, phone number, account credentials.", "Payment Information: Processed securely via Cashfree (we do not store full card details).", "Usage Data: Device info, learning progress, app activity, analytics, and cookies."]],
  ["3. How We Use Your Data", ["To provide and improve the Platform, deliver course content, process payments/refunds, send account and booking updates, and prevent fraudulent activity."]],
  ["4. Data Sharing", ["Shared only with essential service providers like payment processors (Cashfree) and analytics providers, or legal authorities when required by Indian law. We never sell or rent your personal data."]],
  ["5. Data Security & Retention", ["We implement industry-standard technical and organizational measures to safeguard your information. Data is retained only as long as necessary for learning access, operations, and legal compliance."]],
  ["6. Your Rights", ["You can access, correct, or request deletion of your personal data, manage communication preferences, and raise concerns via " + SUPPORT_EMAIL + "."]],
  ["7. Children's Privacy", ["The Platform is intended for users aged 18 and above. We do not knowingly collect personal information from minors."]],
  ["8. Governing Law", ["This Privacy Policy is governed by the laws of India; disputes fall under the jurisdiction of courts in Madhepura, Bihar, India."]],
];

const REFUND = [
  ["1. General Policy", ["This policy covers online courses, webinars, 1-on-1 sessions, digital content, and subscriptions purchased on Manchly. Due to the digital nature of instant access, all sales are final unless explicitly stated otherwise."]],
  ["2. Refund Eligibility", ["Refund requests are considered under strict criteria: duplicate payment for the same order, a technical error on our side preventing access to purchased content, or an incorrect transaction caused by system error. Requests must be raised within 48 hours of purchase."]],
  ["3. Non-Refundable Scenarios", ["Refunds will not be granted for change of mind, partial completion/viewing of content, failure to attend scheduled live webinars or 1-on-1 sessions, or lack of understanding prior to purchase."]],
  ["4. How to Request a Refund", ["Send an email to " + SUPPORT_EMAIL + " containing your Order ID, registered phone number, receipt/payment proof, and detailed explanation. Approved refunds are processed within 7-10 business days to the original payment method."]],
  ["5. Cancellation Policy", ["Orders cannot be cancelled once payment is successful. Subscriptions (if applicable) must be cancelled before the next recurring billing date."]],
  ["6. Chargebacks & Disputes", ["Initiating an unauthorized chargeback or dispute without contacting Manchly support first may lead to immediate, permanent account suspension and revocation of all purchased content."]],
];

const TABS = [
  { key: 'support', label: "Support & Contact", icon: LifeBuoy },
  { key: 'terms', label: "Terms of Service", icon: FileText },
  { key: 'privacy', label: "Privacy Policy", icon: ShieldCheck },
  { key: 'refund', label: "Refund Policy", icon: RotateCcw },
];

export default function HelpCenter() {
  const [tab, setTab] = useState("support");
  const [activeModelDoc, setActiveModalDoc] = useState(null);

  const waMessage = "Hello, I am a Learner on Manchly and I need help with my account";

  const CHANNELS = [
    {
      key: "whatsapp",
      title: "WhatsApp Support",
      sub: `+91 ${SUPPORT_PHONE}`,
      note: "Instant & fastest replies",
      icon: MessageCircle,
      tint: "#10B981",
      tintBg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(16, 185, 129, 0.3)",
      href: waLink(waMessage),
      external: true,
    },
    {
      key: "email",
      title: "Email Support",
      sub: SUPPORT_EMAIL,
      note: "Replies within 24 hours",
      icon: Mail,
      tint: "#60A5FA",
      tintBg: "rgba(96, 165, 250, 0.12)",
      border: "rgba(96, 165, 250, 0.3)",
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    {
      key: "phone",
      title: "Call Helpline",
      sub: `+91 ${SUPPORT_PHONE}`,
      note: "Mon–Sat · 10am–6pm IST",
      noteIcon: Clock,
      icon: Phone,
      tint: "#F59E0B",
      tintBg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.3)",
      href: `tel:+91${SUPPORT_PHONE}`,
    },
    {
      key: "instagram",
      title: "Instagram",
      sub: "@manchly_app",
      note: "Community & updates",
      icon: Share2,
      tint: "#EC4899",
      tintBg: "rgba(236, 72, 153, 0.12)",
      border: "rgba(236, 72, 153, 0.3)",
      href: INSTAGRAM,
      external: true,
    },
  ];

  const T = {
    bg: colors.user.bg,
    cardBg: colors.user.card,
    border: colors.user.border,
    text: colors.user.text,
    sub: colors.user.subHeading,
    accent: colors.user.accentSoft,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.text }}>
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <style>{`
          .hc-card { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
          .hc-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0,0,0,0.35); border-color: ${colors.user.accentSoft} !important; }
          .hc-card:hover .hc-arrow { opacity: 1; transform: translate(0,0); color: ${colors.user.accentSoft}; }
          .hc-tab { transition: all .15s ease; }
          .hc-tab:hover { border-color: ${colors.user.border}; color: #FFF; background: rgba(255,255,255,0.06); }
        `}</style>

        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ margin: 0, fontSize: 27, fontWeight: 900 }}>
              Help &{" "}
              <span style={{ background: G.buttonBlue, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Legal Center
              </span>
            </h1>
            <p style={{ margin: "5px 0 0", color: T.cardBg, fontSize: 14 }}>
              Need assistance with your courses, purchases, or account? We are here to help.
            </p>
          </div>

          {/* Nav Tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {TABS.map((t) => {
              const on = tab === t.key;
              return (
                <button
                  key={t.key}
                  className={on ? undefined : "hc-tab"}
                  onClick={() => setTab(t.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: on ? G.heroWarm : T.cardBg,
                    color: on ? "#FFF" : T.sub,
                    border: `1px solid ${on ? "transparent" : T.border}`,
                    boxShadow: on ? "0 4px 18px rgba(90,104,243,0.35)" : "none",
                    padding: "9px 18px", borderRadius: 999, cursor: "pointer",
                    fontWeight: 800, fontSize: 13, fontFamily: "inherit",
                  }}
                >
                  <t.icon size={15} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Support Tab Content */}
          {tab === "support" ? (
            <>
              {/* WhatsApp Hero Card */}
              <div
                style={{
                  background: colors.user.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 20, padding: "26px 30px",
                  color: colors.user.text, marginBottom: 22, display: "flex",
                  justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 260 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(90,104,243,0.2)", border: "1px solid rgba(90,104,243,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <LifeBuoy size={26} color="#818CF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 900 }}>Have questions or technical issues?</div>
                    <div style={{ fontSize: 13.5, color: T.sub, marginTop: 4, lineHeight: 1.5 }}>
                      Reach our dedicated learner support team directly on WhatsApp for immediate resolution.
                    </div>
                  </div>
                </div>
                <a
                  href={waLink(waMessage)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "#10B981", color: "#FFF", textDecoration: "none",
                    borderRadius: 12, padding: "12px 22px", fontWeight: 800, fontSize: 13.5,
                    boxShadow: "0 6px 18px rgba(16,185,129,0.3)", flexShrink: 0,
                  }}
                >
                  <MessageCircle size={17} /> Chat on WhatsApp
                </a>
              </div>

              {/* Grid of Support Channels */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                {CHANNELS.map((c) => (
                  <a
                    key={c.key}
                    className="hc-card"
                    href={c.href}
                    target={c.external ? "_blank" : undefined}
                    rel={c.external ? "noreferrer" : undefined}
                    style={{
                      display: "flex", alignItems: "center", gap: 16,
                      background: T.cardBg, border: `1px solid ${T.border}`,
                      borderRadius: 18, padding: "18px 20px",
                      textDecoration: "none", color: T.text,
                    }}
                  >
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: c.tintBg, border: `1px solid ${c.border}`, color: c.tint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <c.icon size={21} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{c.title}</div>
                      <div style={{ color: T.sub, fontSize: 13, marginTop: 2 }}>{c.sub}</div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, background: c.tintBg, color: c.tint, borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
                        {c.noteIcon ? <c.noteIcon size={11} /> : null}
                        {c.note}
                      </div>
                    </div>
                    <ArrowUpRight
                      className="hc-arrow"
                      size={18}
                      style={{ color: T.sub, opacity: 0.4, transform: "translate(-2px, 2px)", transition: "all .16s ease", flexShrink: 0 }}
                    />
                  </a>
                ))}
              </div>

              <LegalFooter color="rgba(255,255,255,0.4)" linkColor={colors.user.accentSoft} dark={true} />
            </>
          ) : (
            <InlinePolicyViewer
              sections={tab === "terms" ? TERMS : tab === "privacy" ? PRIVACY : REFUND}
              docKey={tab}
              onOpenModal={() => setActiveModalDoc(tab)}
            />
          )}
        </div>
      </main>

      {/* Pop-up Legal Modal */}
      {activeModelDoc && (
        <LegalModal doc={activeModelDoc} dark={true} onClose={() => setActiveModalDoc(null)} />
      )}
    </div>
  );
}

// ── Inline Policy Reader Component ──
function InlinePolicyViewer({ sections, docKey, onOpenModal }) {
  const titles = { terms: "Terms of Service", privacy: "Privacy Policy", refund: "Refund Policy" };

  return (
    <div style={{ background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 20, padding: "26px 30px", maxHeight: "72vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${colors.user.border}` }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{titles[docKey]}</h2>
          <span style={{ fontSize: 12, color: colors.user.subHeading }}>{COMPANY} · Manchly Platform</span>
        </div>
      </div>

      {sections.map(([title, paras], i) => (
        <div key={i} style={{ display: "flex", gap: 14, marginBottom: 22 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(90,104,243,0.15)", border: "1px solid rgba(90,104,243,0.3)", color: "#818CF8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 800, flexShrink: 0 }}>
            {i + 1}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: "2px 0 8px", fontSize: 15, fontWeight: 800, color: "#FFFFFF" }}>
              {title}
            </h3>
            {paras.map((p, j) => (
              <p key={j} style={{ margin: "0 0 8px", color: colors.user.subHeading, fontSize: 13.5, lineHeight: 1.65 }}>{p}</p>
            ))}
          </div>
        </div>
      ))}

      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, margin: "20px 0 0", paddingLeft: 42, borderTop: `1px dashed ${colors.user.border}`, paddingTop: 14 }}>
        Last updated periodically by {COMPANY}. Continued platform usage constitutes acceptance of these terms.
      </p>
    </div>
  );
}

// ── Reusable Standalone Policy Modal Component ──
export function LegalModal({ doc, onClose, dark = true }) {
  const docData = {
    terms: { title: "Terms of Service", sections: TERMS },
    privacy: { title: "Privacy Policy", sections: PRIVACY },
    refund: { title: "Refund Policy", sections: REFUND },
  }[doc];

  if (!docData) return null;

  const bg = dark ? "#111827" : "#FFFFFF";
  const border = dark ? "rgba(255,255,255,0.12)" : colors.base.border;
  const text = dark ? "#FFFFFF" : colors.typography.primaryText;
  const sub = dark ? "#9CA3AF" : colors.typography.secondaryText;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 650, maxHeight: "85vh",
          background: bg, border: `1px solid ${border}`, borderRadius: 20,
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column",
          overflow: "hidden", color: text, animation: "hcFadeIn 0.18s ease-out",
        }}
      >
        <style>{`@keyframes hcFadeIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }`}</style>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{docData.title}</h3>
            <div style={{ fontSize: 12, color: sub, marginTop: 3 }}>
              {COMPANY} · Platform: Manchly (India) · Contact: {SUPPORT_EMAIL}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: sub, cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {docData.sections.map(([heading, paras], i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              {heading && <h4 style={{ margin: "0 0 6px", fontSize: 14.5, fontWeight: 800, color: text }}>{heading}</h4>}
              {paras.map((p, j) => (
                <p key={j} style={{ margin: "0 0 6px", fontSize: 13, lineHeight: 1.6, color: sub }}>{p}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Footer button */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${border}`, textAlign: "right", background: dark ? "rgba(255,255,255,0.02)" : "#F9FAFB" }}>
          <button
            onClick={onClose}
            style={{ background: G.indigo, color: "#FFF", border: "none", borderRadius: 10, padding: "8px 20px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Footer Line with Embedded Modal State ──
export function LegalFooter({
  color = "rgba(255,255,255,0.45)",
  linkColor = "rgba(255,255,255,0.8)",
  dark = true,
  showCompany = true,
  style = {},
}) {
  const [activeDoc, setActiveDoc] = useState(null);

  const linkBtn = (key, label) => (
    <button
      type="button"
      onClick={() => setActiveDoc(key)}
      style={{
        background: "transparent", border: "none", padding: 0, cursor: "pointer",
        color: linkColor, fontWeight: 700, fontSize: "inherit",
        textDecoration: "underline", textUnderlineOffset: 3,
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <p style={{ fontSize: 12, color, textAlign: "center", marginTop: 22, lineHeight: 1.7, ...style }}>
        By continuing, you agree to our {linkBtn("terms", "Terms of Service")},{" "}
        {linkBtn("privacy", "Privacy Policy")} &amp; {linkBtn("refund", "Refund Policy")}.
        {showCompany && (
          <>
            <br />
            {COMPANY} · {SUPPORT_EMAIL}
          </>
        )}
      </p>
      {activeDoc && <LegalModal doc={activeDoc} dark={dark} onClose={() => setActiveDoc(null)} />}
    </>
  );
}