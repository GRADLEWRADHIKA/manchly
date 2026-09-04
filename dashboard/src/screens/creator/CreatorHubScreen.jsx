import React from "react";
import Sidebar from "../../components/Sidebar";
import TopHeader from "../../components/TopHeader";
import colors from "../../utils/colors";
import {
  HelpCircle,
  ChevronRight,
  Lock,
  Send,
  Code2,
  UserPlus,
  Link as LinkIcon,
} from "lucide-react";

function HubCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  actionLabel,
  actionColor,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${colors.base.border}`,
        borderRadius: 16,
        padding: 22,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <Icon size={22} color={iconColor} />
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: colors.typography.primaryText,
          marginBottom: 6,
        }}
      >
        {title}
      </div>

      <p
        style={{
          fontSize: 13,
          color: colors.typography.secondaryText,
          lineHeight: 1.5,
          margin: "0 0 18px",
          flex: 1,
        }}
      >
        {description}
      </p>

      <button
        type="button"
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: iconBg,
          border: "none",
          borderRadius: 10,
          padding: "9px 16px",
          fontSize: 13,
          fontWeight: 700,
          color: actionColor,
          cursor: "pointer",
        }}
      >
        {actionLabel} <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default function CreatorHubScreen({ user, onNavigate }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        active="creator-hub"
        onNavigate={onNavigate}
        onLogout={() => console.log("logout")}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: colors.base.appBackground,
          padding: 32,
        }}
      >
        <TopHeader
          totalRevenue={0}
          walletBalance={0}
          hasUnreadNotifications={false}
          onWithdraw={() => {}}
          onNotifications={() => {}}
        />

        {/* Page Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: colors.brand?.primaryOrange || "#F5A623",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              Creator Hub
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: colors.typography.primaryText,
                margin: "0 0 6px 0",
              }}
            >
              Creator Hub
            </h1>
            <p
              style={{
                fontSize: 14,
                color: colors.typography.secondaryText,
                margin: 0,
              }}
            >
              Everything you need to grow, automate, and manage your creator
              business.
            </p>
          </div>

          {/* Need Help Card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#fff",
              border: `1px solid ${colors.base.border}`,
              borderRadius: 14,
              padding: "12px 18px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: `1.5px solid ${colors.base.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HelpCircle size={16} color={colors.typography.secondaryText} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.typography.primaryText,
                }}
              >
                Need Help?
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: colors.typography.secondaryText,
                }}
              >
                Check tutorials or contact support
              </div>
            </div>
            <ChevronRight size={16} color={colors.typography.secondaryText} />
          </div>
        </div>

        {/* Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          <HubCard
            icon={Lock}
            iconColor="#DC2626"
            iconBg="rgba(220,38,38,0.1)"
            title="Locked Message"
            description="Send premium content on WhatsApp. Users must complete an action to unlock the message."
            actionLabel="Set Up Locked Message"
            actionColor="#DC2626"
          />

          <HubCard
            icon={Send}
            iconColor="#2563EB"
            iconBg="rgba(37,99,235,0.1)"
            title="Telegram Automation"
            description="Automate your Telegram messages, broadcasts and audience engagement with smart triggers."
            actionLabel="Connect Telegram"
            actionColor="#2563EB"
          />

          <HubCard
            icon={Code2}
            iconColor="#16A34A"
            iconBg="rgba(22,163,74,0.1)"
            title="Website SDK"
            description="Integrate our Website SDK to track users, capture leads and enable seamless purchases on your website."
            actionLabel="Get SDK Code"
            actionColor="#16A34A"
          />

          <HubCard
            icon={UserPlus}
            iconColor="#EA580C"
            iconBg="rgba(234,88,12,0.1)"
            title="Register as an Influencer"
            description="Join our influencer program, get your unique referral link and start earning commissions by promoting our courses and products."
            actionLabel="Apply Now"
            actionColor="#EA580C"
          />

          <HubCard
            icon={LinkIcon}
            iconColor="#7C3AED"
            iconBg="rgba(124,58,237,0.1)"
            title="Bio Link"
            description="Create a single link for all your important links — courses, webinars, 1:1 sessions, social profiles and more."
            actionLabel="Create Bio Link"
            actionColor="#7C3AED"
          />
        </div>
      </div>
    </div>
  );
}