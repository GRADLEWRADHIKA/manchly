import React, { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { useAssistant } from "../../context/AssistantContext";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";

export default function AssistantPanel() {
  const { isOpen, close } = useAssistant();
  const [messages, setMessages] = useState([]); // { role: "user" | "assistant", text: string }
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setSending(true);
    setError("");

    try {
      const res = unwrap(
        await apiFetch("/ai/chat/assistant", {
          method: "POST",
          body: JSON.stringify({ message: text }),
        })
      );
      const reply = res?.reply || "Sorry, I couldn't generate a response.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 998,
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 380,
          background: colors.base.cardBackground,
          borderLeft: `1px solid ${colors.base.border}`,
          boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: `1px solid ${colors.base.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={18} color={colors.brand.primaryOrange} />
            <span style={{ fontSize: 15, fontWeight: 800, color: colors.typography.primaryText }}>
              AI Assistant
            </span>
          </div>
          <button
            onClick={close}
            style={{
              background: "rgba(0,0,0,0.04)",
              border: "none",
              borderRadius: 8,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={15} color={colors.typography.secondaryText} />
          </button>
        </div>

        {/* Message list */}
        <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ margin: "auto", textAlign: "center", color: colors.typography.secondaryText, fontSize: 13, maxWidth: 240 }}>
              Ask me anything — course ideas, pricing, copywriting, or just talk through what you're stuck on.
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: m.role === "user" ? colors.brand.primaryOrange : "rgba(0,0,0,0.04)",
                color: m.role === "user" ? "#fff" : colors.typography.primaryText,
                borderRadius: 14,
                padding: "10px 14px",
                fontSize: 13.5,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>
          ))}

          {sending && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "rgba(0,0,0,0.04)",
                borderRadius: 14,
                padding: "10px 14px",
                fontSize: 13.5,
                color: colors.typography.secondaryText,
              }}
            >
              Thinking…
            </div>
          )}

          {error && (
            <div style={{ alignSelf: "center", color: "#DC2626", fontSize: 12.5 }}>{error}</div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ display: "flex", gap: 8, padding: 14, borderTop: `1px solid ${colors.base.border}`, flexShrink: 0 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: `1.5px solid ${colors.base.border}`,
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13.5,
              fontFamily: "inherit",
              outline: "none",
              maxHeight: 100,
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            style={{
              background: colors.brand.primaryOrange,
              border: "none",
              borderRadius: 10,
              width: 40,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() && !sending ? "pointer" : "not-allowed",
              opacity: input.trim() && !sending ? 1 : 0.5,
            }}
          >
            <Send size={16} color="#fff" />
          </button>
        </div>
      </div>
    </>
  );
}