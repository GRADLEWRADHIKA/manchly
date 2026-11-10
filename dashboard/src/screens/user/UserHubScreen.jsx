import React from "react";
import { Sparkles } from "lucide-react";
import colors from "../../utils/colors";

export default function UserHubScreen() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 40,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: colors.user?.accentSoft || "#ECFDF5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Sparkles size={28} color={colors.user?.accent || "#22C55E"} />
      </div>
      <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: colors.user?.text || "#1F2937" }}>
        User Hub
      </h1>
      <p style={{ margin: 0, fontSize: 14.5, color: colors.user?.subHeading || "#64748B", maxWidth: 360 }}>
        Coming soon.
      </p>
    </div>
  );
}