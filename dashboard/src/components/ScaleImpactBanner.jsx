import React from "react";
import {
  TrendingUp,
  Users,
  Megaphone,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import colors from "../utils/colors";

export default function ScaleImpactBanner() {
  const features = [
    { icon: TrendingUp },
    { icon: Users },
    { icon: Megaphone },
    { icon: Sparkles },
  ];

  return (
    <div
      style={{
        marginTop: 32,
        background: colors.base.cardBackground,
        borderRadius: 20,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        padding: 32,
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: 32,
        alignItems: "center",
      }}
    >
      {/* Left Side */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            textTransform: "uppercase",
            fontWeight: 700,
            fontSize: 13,
            color: colors.brand.actionBlue,
            letterSpacing: 1,
            marginBottom: 14,
          }}
        >
          Grow Your Creator Business
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: 36,
            lineHeight: 1.3,
            fontWeight: 700,
            color: colors.typography.primaryText,
          }}
        >
          Scale Your{" "}
          <span
            style={{
              color: colors.brand.actionBlue,
            }}
          >
            impact,
          </span>{" "}
          Grow Your{" "}
          <span
            style={{
              color: colors.brand.primaryOrange,
            }}
          >
            Earnings.
          </span>
        </h2>

        <p
          style={{
            marginTop: 18,
            marginBottom: 24,
            maxWidth: 540,
            color: colors.typography.secondaryText,
            lineHeight: 1.7,
          }}
        >
          Get expert marketing support, unlock growth strategies, optimize your
          products, and reach more learners with personalized guidance from our
          creator success team.
        </p>

        {/* Feature Icons */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 28,
          }}
        >
          {features.map(({ icon: Icon }, index) => (
            <div
              key={index}
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: colors.brand.noticeBlue,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Icon
                size={20}
                color={colors.brand.actionBlue}
              />
            </div>
          ))}
        </div>

        <div>
          <button
            type="button"
            style={{
              background: colors.brand.actionBlue,
              color: colors.typography.white,
              border: "none",
              borderRadius: 12,
              padding: "14px 24px",
              fontWeight: 700,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            Book Free Consultation
            <ArrowRight size={18} />
          </button>

          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: colors.typography.secondaryText,
            }}
          >
            No commitment. Just growth.
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 320,
            height: 260,
            borderRadius: 20,
            background:
              "linear-gradient(135deg,#F8FAFF 0%,#EEF5FF 45%,#FFF4EA 100%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 100,
          }}
        >
          🚀
        </div>
      </div>
    </div>
  );
}