import React from "react";
import Sidebar from "../../components/Sidebar";
import TopHeader from "../../components/TopHeader";
import colors from "../../utils/colors";
import {Sparkles} from "lucide-react"

export default function CreatorHubScreen({user, onNavigate}){
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active="creator-hub" onNavigate={onNavigate} onLogout={() => console.log("logout")} />

      <div style={{ flex: 1, minWidth: 0, background: colors.base.appBackground, padding: 32 }}>
        <TopHeader
          totalRevenue={0}
          walletBalance={0}
          hasUnreadNotifications={false}
          onWithdraw={() => {}}
          onNotifications={() => {}}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 170px)",
            background: "#fff",
            borderRadius: 16,
            border: `1px solid ${colors.base.border}`,
            marginTop: 24,
            padding: 40,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(245, 166, 35, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Sparkles size={32} color={colors.brand?.primaryOrange || "#F5A623"} />
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.typography.primaryText, margin: "0 0 8px 0" }}>
            Creator Hub
          </h1>
          <p style={{ fontSize: 16, fontWeight: 600, color: colors.brand?.primaryOrange || "#F5A623", margin: 0 }}>
            Coming Up Soon
          </p>
        </div>
      </div>
    </div>  
    )
}