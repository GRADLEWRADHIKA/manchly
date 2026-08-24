import React from "react";
import { MessageCircle, X } from "lucide-react";
import { useAssistant } from "../context/AssistantContext";
import colors from "../utils/colors";

export default function AssistantLauncher() {
  const { isOpen, toggle } = useAssistant();

  return (
    <button
      type="button"
      onClick={toggle}
      title={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        background: colors.brand.primaryOrange,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 8px 24px rgba(255,107,0,0.35)",
        zIndex: 997, // just below the panel (999) and its backdrop (998)
        transition: "transform 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
    </button>
  );
}