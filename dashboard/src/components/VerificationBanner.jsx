import colors from "../utils/colors";
import React from "react";

export default function VerificationBanner({ isKycVerified, onVerify }) {
  if (isKycVerified) {
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: "rgba(34,197,94,0.08)",
          borderBottom: `1px solid ${colors.base.border}`,
        }}
      >
        {/* Verified Icon */}
        <span
          style={{
            color: colors.brand.successGreen,
            fontSize: 18,
          }}
        >
          🛡️
        </span>

        {/* Verified Text */}
        <span
          style={{
            color: colors.brand.successGreen,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Profile Verified! Your account has been successfully verified.
        </span>
      </div>
    );
  }
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        background: colors.brand.noticeBlue,
        borderBottom: `1px solid ${colors.base.border}`,
      }}
    >
      {/* Left Side */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            color: colors.brand.actionBlue,
            fontSize: 18,
          }}
        >
          🛡️
        </span>

        <span
          style={{
            color: colors.brand.actionBlue,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Profile KYC not completed? Get verified tick for free now!
        </span>
      </div>

      {/* Verify Button */}
      <button
        type="button"
        onClick={onVerify}
        style={{
          background: colors.brand.actionBlue,
          color: colors.typography.white,
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Verify now
      </button>
    </div>
  );
}