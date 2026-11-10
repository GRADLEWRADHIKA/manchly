// Legal documents — Terms of Service, Privacy Policy, Refund Policy.
// Content ported verbatim from the mobile app's TermsModal / PrivacyModal /
// RefundPolicyModal (Agnivora Digital Pvt Ltd).
import React, { useState } from "react";
import { Modal } from "./ui";

const HEADER = { company: "Agnivora Digital Pvt Ltd", platform: "Platform: Manchly (India)", contact: "Contact: help@manchly.com" };

const DOCS = {
  terms: {
    title: "Terms of Service",
    sections: [
      ["1. Acceptance of Terms", `By accessing or using the Manchly platform ("Platform"), you agree to comply with these Terms of Service ("Terms"). If you do not agree, do not use the Platform.`],
      ["2. Eligibility", `You must be at least 18 years old and a resident of India. By using the Platform, you represent and warrant that you meet these criteria.`],
      ["3. User Roles", `Creators: Upload, share, sell content, manage communities. Responsible for legal compliance of all content.\nLearners/Customers: Access and purchase content. Agree not to redistribute content without permission.\nAdmins: Manage Platform operations.`],
      ["4. Account Registration", `Users must provide accurate, complete, and up-to-date information. Account credentials are confidential; users are responsible for all activity under their accounts.`],
      ["5. Payments & Refunds", `All payments are processed via Cashfree.\n\nPrice Breakup at Checkout:\nFinal payable amount = Course Price + 18% GST + 2% Platform Fee\n\nRefund Policy:\nAll sales are final due to the nature of digital delivery. Refunds are only considered for duplicate payments, technical issues preventing access, or system errors. Requests must be raised within 48 hours at help@manchly.com.`],
      ["6. Creator Payouts, Withdrawals & TDS", `Creators can request withdrawal of their available balance once every 48 hours. Withdrawal requests made before the 48-hour cooldown period will not be processed.\n\nAll payouts are subject to:\n- Platform verification and fraud checks\n- Payment gateway processing timelines\n- Applicable taxes and deductions\n\nAs per Government of India regulations:\n- 2% TDS will be deducted from creator payouts.\n- The final credited amount may vary due to tax, compliance, or settlement adjustments.`],
      ["7. Content Ownership", `Users retain ownership of content they upload. By using the Platform, users grant Agnivora Digital a worldwide, royalty-free license to host, display, and distribute content for platform functionality.\n\nThe Manchly brand, trademarks, and IP remain the property of Agnivora Digital.`],
      ["8. Prohibited Activities", `You agree not to:\n- Violate applicable laws or regulations.\n- Infringe intellectual property rights of others.\n- Upload harmful, offensive, or illegal content.\n- Attempt to interfere with the Platform's security or functionality.`],
      ["9. Termination", `Agnivora Digital may suspend or terminate accounts for violations, misuse, or inactivity. Users may terminate accounts at any time via settings or support.`],
      ["10. Limitation of Liability", `The Platform is provided "as-is." Agnivora Digital is not liable for indirect, incidental, or consequential damages arising from use of the Platform.`],
      ["11. Indemnification", `You agree to indemnify Agnivora Digital, its affiliates, and employees against claims arising from your use of the Platform, breach of these Terms, or violation of laws.`],
      ["12. Governing Law & Jurisdiction", `These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in Madhepura, Bihar, India.`],
      ["13. Modifications", `Agnivora Digital reserves the right to update these Terms at any time. Users will be notified in-app, and continued use constitutes acceptance.`],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      ["1. Introduction", `Agnivora Digital respects your privacy and is committed to protecting personal data collected via the Manchly platform ("Platform"). This Privacy Policy explains what data we collect, how we use it, and your rights under Indian laws.`],
      ["2. Data We Collect", `Personal Information: Name, email, phone number, account credentials.\nPayment Information: Details processed securely via Cashfree (we do not store full card details).\nUsage Data: Device info, app activity, analytics, cookies.`],
      ["3. How We Use Your Data", `- To provide and improve the Platform.\n- To process payments and manage refunds.\n- To communicate updates, offers, and support.\n- To ensure security and prevent misuse.`],
      ["4. Data Sharing", `We may share data with:\n- Payment processors (Cashfree) for transaction processing.\n- Analytics providers for performance insights.\n- Legal authorities if required by Indian law.\n\nWe do not sell or rent your personal information to third parties.`],
      ["5. Data Retention", `Data is retained only as long as necessary for platform operations, legal compliance, and transaction purposes.`],
      ["6. Data Security", `We implement reasonable technical and organizational measures to protect your data from unauthorized access, disclosure, or alteration.`],
      ["7. User Rights", `- Access, correct, or delete your personal data.\n- Withdraw consent for non-essential processing.\n- Report concerns via help@manchly.com.`],
      ["8. Cookies and Tracking", `We use cookies and similar technologies to enhance performance and understand user behavior. Users may disable cookies via browser/device settings, though some features may not function properly.`],
      ["9. Third-Party Links", `The Platform may include links to third-party services. Agnivora Digital is not responsible for the privacy practices of these external sites.`],
      ["10. Children's Privacy", `The Platform is not intended for children under 18. We do not knowingly collect personal data from minors.`],
      ["11. Changes to Privacy Policy", `We may update this Policy periodically. Users will be notified in-app. Continued use constitutes acceptance of changes.`],
      ["12. Governing Law & Jurisdiction", `This Policy is governed by the laws of India. Disputes fall under the exclusive jurisdiction of courts in Madhepura, Bihar, India.`],
    ],
  },
  refund: {
    title: "Refund Policy",
    sections: [
      ["", `At Agnivora Digital Private Limited, we strive to deliver high-quality digital products, courses, and services. Please read our refund policy carefully before making a purchase.`],
      ["1. General Policy", `All purchases made on our platform are for digital products/services, including but not limited to:\n- Online courses\n- Webinars\n- Digital content\n- Memberships/subscriptions\n\nDue to the nature of digital delivery, all sales are final unless stated otherwise.`],
      ["2. Refund Eligibility", `Refunds will only be considered under the following conditions:\n- Duplicate payment made by the customer\n- Technical issue from our end preventing access to the product\n- Incorrect product purchased due to a system error\n\nIn such cases, you must raise a request within 48 hours of purchase.`],
      ["3. Non-Refundable Scenarios", `Refunds will not be applicable in the following cases:\n- Change of mind after purchase\n- Lack of usage or completion of course\n- Failure to understand the product before purchase\n- Partial consumption of digital content\n- Delay in joining live sessions/webinars\n\nOnce digital content is accessed, it is typically considered non-returnable under Indian consumer norms.`],
      ["4. Refund Process", `To request a refund, email us at: help@manchly.com\n\nInclude:\n- Order ID\n- Payment proof\n- Reason for refund\n\nOnce your request is received:\n- We will review it within 3-5 business days\n- If approved, refund will be processed within 7-10 business days to the original payment method`],
      ["5. Cancellation Policy", `- Orders once placed cannot be cancelled after successful payment\n- Subscription-based services (if any) must be cancelled before the next billing cycle`],
      ["6. Chargebacks & Disputes", `If a chargeback is initiated without contacting us:\n- Your account may be suspended permanently\n- Access to all products/services may be revoked`],
      ["7. Policy Updates", `Agnivora Digital Private Limited reserves the right to modify this policy at any time and update terms without prior notice. Customers are advised to review this page periodically.`],
    ],
  },
};

export function LegalModal({ doc, onClose, dark = false }) {
  const d = DOCS[doc];
  if (!d) return null;
  const sub = { fontSize: 12.5, opacity: 0.65, margin: 0 };
  return (
    <Modal open onClose={onClose} title={d.title} dark={dark} width={640}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{HEADER.company}</div>
        <p style={sub}>{HEADER.platform}</p>
        <p style={sub}>{HEADER.contact}</p>
      </div>
      {d.sections.map(([heading, body], i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          {heading && <h4 style={{ margin: "0 0 6px", fontSize: 14.5, fontWeight: 800 }}>{heading}</h4>}
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, opacity: 0.8, whiteSpace: "pre-line" }}>{body}</p>
        </div>
      ))}
    </Modal>
  );
}

// Clickable "Terms of Service, Privacy Policy & Refund Policy" footer line.
// Manages its own modal state so any screen can drop it in.
export function LegalFooter({ color = "rgba(255,255,255,0.45)", linkColor = "rgba(255,255,255,0.75)", dark = true, showCompany = true, style = {} }) {
  const [doc, setDoc] = useState(null);
  const link = (key, label) => (
    <button
      onClick={() => setDoc(key)}
      style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: linkColor, fontWeight: 700, fontSize: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}
    >
      {label}
    </button>
  );
  return (
    <>
      <p style={{ fontSize: 11.5, color, textAlign: "center", marginTop: 20, lineHeight: 1.7, ...style }}>
        By continuing, you agree to our {link("terms", "Terms of Service")}, {link("privacy", "Privacy Policy")} &amp; {link("refund", "Refund Policy")}.
        {showCompany && (
          <>
            <br />
            Agnivora Digital Pvt Ltd · help@manchly.com
          </>
        )}
      </p>
      {doc && <LegalModal doc={doc} dark={dark} onClose={() => setDoc(null)} />}
    </>
  );
}
