import React, { useEffect, useRef, useState } from "react";
import {
  MessageSquare, Send, Plus, RefreshCw, Trash2, CheckCheck, Loader,
} from "lucide-react";

import { API_BASE } from "./api";

const T = {
  bg: "#000000",
  card: "#111111",
  cardHigh: "#161616",
  sidebar: "#0A0A0A",
  orange: "#FFC107",
  orangeL: "rgba(255,193,7,0.12)",
  green: "#22C55E",
  red: "#EF4444",
  border: "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,193,7,0.4)",
  textPri: "#FFFFFF",
  textSec: "#A1A1AA",
  textMut: "#71717A",
};

const getToken = () =>
  (typeof window !== "undefined"
    && (localStorage.getItem("manchly_token") || localStorage.getItem("token")))
  || "";

async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || `Error ${res.status}`);
  return data;
}

const API = {
  listConversations:    ()                     => apiCall("GET",    "/chat/conversations"),
  createConversation:   (b)                    => apiCall("POST",   "/chat/conversations", b),
  getMessages:          (id, q = "")           => apiCall("GET",    `/chat/conversations/${id}/messages${q}`),
  sendMessage:          (b)                    => apiCall("POST",   "/chat/messages", b),
  markRead:             (conversationId)       => apiCall("PUT",    "/chat/messages/read", { conversationId }),
  deleteMessage:        (id)                   => apiCall("DELETE", `/chat/messages/${id}`),
};

export default function ChatPanel({ currentUser }) {
  const myId = currentUser?.id || null;

  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newParticipantId, setNewParticipantId] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollerRef = useRef(null);

  const fetchConversations = async () => {
    setLoadingList(true);
    setError("");
    try {
      const data = await API.listConversations();
      const list = data?.conversations || data?.data || (Array.isArray(data) ? data : []);
      setConversations(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchMessages = async (conv) => {
    if (!conv) return;
    setLoadingMsgs(true);
    try {
      const data = await API.getMessages(conv.id, "?limit=100&offset=0");
      const list = data?.messages || data?.data || (Array.isArray(data) ? data : []);
      setMessages(list);
      API.markRead(conv.id).catch(() => {});
    } catch (err) {
      setError(err.message);
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { fetchMessages(active); }, [active?.id]);

  // Light polling for new messages in the active conversation
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => fetchMessages(active), 5000);
    return () => clearInterval(t);
  }, [active?.id]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || !active) return;
    setSending(true);
    try {
      await API.sendMessage({
        conversationId: active.id,
        content: draft.trim(),
        type: "TEXT",
      });
      setDraft("");
      fetchMessages(active);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCreateConv = async () => {
    if (!newParticipantId.trim()) return;
    try {
      const data = await API.createConversation({
        participantId: newParticipantId.trim(),
        type: "DIRECT",
      });
      const conv = data?.conversation || data?.data || data;
      setShowNew(false);
      setNewParticipantId("");
      await fetchConversations();
      if (conv?.id) setActive(conv);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Delete this message?")) return;
    try {
      await API.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      setError(err.message);
    }
  };

  const conversationLabel = (c) => {
    if (c.title) return c.title;
    const other = (c.participants || []).find((p) => p.user_id !== myId);
    return other?.user?.name || other?.name || `Conversation ${c.id?.slice(0, 8)}`;
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.textPri,
      padding: 30, fontFamily: "system-ui, sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 38, fontWeight: 900, marginBottom: 6 }}>
            Messages
          </h1>
          <p style={{ color: T.textSec }}>Direct conversations with users &amp; experts</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowNew(!showNew)}
            style={{ background: T.orange, color: "#000", border: "none",
              padding: "12px 18px", borderRadius: 12, fontWeight: 700,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Plus size={15}/> New chat
          </button>
          <button onClick={fetchConversations}
            style={{ background: T.card, color: T.textPri, border: `1px solid ${T.border}`,
              padding: "12px 16px", borderRadius: 12, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={14}/>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: `1px solid ${T.red}`,
          color: T.red, borderRadius: 12, padding: "10px 14px", marginBottom: 14,
          fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {showNew && (
        <div style={{ background: T.card, border: `1px solid ${T.borderHi}`,
          borderRadius: 14, padding: 18, marginBottom: 16,
          display: "flex", gap: 10, alignItems: "center" }}>
          <input
            placeholder="Participant user ID (UUID)"
            value={newParticipantId}
            onChange={(e) => setNewParticipantId(e.target.value)}
            style={{ flex: 1, background: T.sidebar, border: `1px solid ${T.border}`,
              padding: "10px 14px", borderRadius: 10, color: T.textPri,
              outline: "none", fontSize: 13 }}
          />
          <button onClick={handleCreateConv}
            style={{ background: T.orange, color: "#000", border: "none",
              padding: "10px 18px", borderRadius: 10, fontWeight: 700,
              cursor: "pointer", fontSize: 13 }}>
            Start
          </button>
        </div>
      )}

      {/* SPLIT LAYOUT */}
      <div style={{ display: "grid",
        gridTemplateColumns: "320px 1fr", gap: 16,
        height: "calc(100vh - 230px)", minHeight: 500 }}>

        {/* LEFT — conversations */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 16, overflow: "hidden", display: "flex",
          flexDirection: "column" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`,
            fontSize: 11, color: T.textMut, textTransform: "uppercase",
            letterSpacing: 1, fontWeight: 700 }}>
            Conversations ({conversations.length})
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingList ? (
              <div style={{ padding: 30, textAlign: "center", color: T.textSec }}>
                <Loader size={16} className="spin"/> Loading…
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: T.textSec,
                fontSize: 13 }}>
                No conversations yet.<br/>
                Click <strong style={{ color: T.orange }}>New chat</strong> to start one.
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = active?.id === c.id;
                return (
                  <div key={c.id} onClick={() => setActive(c)}
                    style={{ padding: "12px 16px",
                      borderBottom: `1px solid ${T.border}`,
                      cursor: "pointer",
                      background: isActive ? T.cardHigh : "transparent",
                      borderLeft: `3px solid ${isActive ? T.orange : "transparent"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%",
                        background: T.orangeL, display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <MessageSquare size={14} color={T.orange}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700,
                          color: T.textPri, whiteSpace: "nowrap",
                          overflow: "hidden", textOverflow: "ellipsis" }}>
                          {conversationLabel(c)}
                        </div>
                        <div style={{ fontSize: 11, color: T.textMut, marginTop: 2,
                          whiteSpace: "nowrap", overflow: "hidden",
                          textOverflow: "ellipsis" }}>
                          {c.last_message?.content || c.type || "—"}
                        </div>
                      </div>
                      {c.unread_count > 0 && (
                        <div style={{ background: T.orange, color: "#000",
                          borderRadius: 999, padding: "1px 7px", fontSize: 10,
                          fontWeight: 800 }}>
                          {c.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT — messages */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 16, overflow: "hidden", display: "flex",
          flexDirection: "column" }}>
          {!active ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center",
              justifyContent: "center", color: T.textSec, padding: 40,
              textAlign: "center" }}>
              <div>
                <MessageSquare size={36} style={{ opacity: 0.3, marginBottom: 12 }}/>
                <div style={{ fontSize: 14 }}>Select a conversation to view messages.</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {conversationLabel(active)}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>
                    GET /chat/conversations/{active.id?.slice(0, 8)}…/messages
                  </div>
                </div>
                {loadingMsgs && <Loader size={14} className="spin" style={{ color: T.orange }}/>}
              </div>

              <div ref={scrollerRef}
                style={{ flex: 1, overflowY: "auto", padding: 20,
                  display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.length === 0 ? (
                  <div style={{ color: T.textSec, fontSize: 13, textAlign: "center",
                    padding: 30 }}>
                    No messages yet. Say hi 👋
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === myId || m.user_id === myId;
                    return (
                      <div key={m.id}
                        style={{ alignSelf: mine ? "flex-end" : "flex-start",
                          maxWidth: "75%" }}>
                        <div style={{ background: mine ? T.orange : T.sidebar,
                          color: mine ? "#000" : T.textPri,
                          padding: "10px 14px", borderRadius: 14,
                          fontSize: 13.5, lineHeight: 1.5,
                          border: mine ? "none" : `1px solid ${T.border}` }}>
                          {m.content}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4,
                          justifyContent: mine ? "flex-end" : "flex-start",
                          fontSize: 10, color: T.textMut }}>
                          <span>
                            {m.created_at ? new Date(m.created_at).toLocaleTimeString() : ""}
                          </span>
                          {m.read_at && <CheckCheck size={11} color={T.green}/>}
                          {mine && (
                            <button onClick={() => handleDeleteMessage(m.id)}
                              style={{ background: "transparent", border: "none",
                                color: T.textMut, cursor: "pointer", padding: 0 }}>
                              <Trash2 size={10}/>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ padding: 14, borderTop: `1px solid ${T.border}`,
                display: "flex", gap: 10 }}>
                <input
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
                  style={{ flex: 1, background: T.sidebar, border: `1px solid ${T.border}`,
                    padding: "12px 14px", borderRadius: 12, color: T.textPri,
                    outline: "none", fontSize: 13.5 }}
                />
                <button onClick={handleSend} disabled={sending || !draft.trim()}
                  style={{ background: T.orange, color: "#000", border: "none",
                    padding: "0 18px", borderRadius: 12, fontWeight: 700,
                    cursor: (sending || !draft.trim()) ? "not-allowed" : "pointer",
                    opacity: (sending || !draft.trim()) ? 0.5 : 1,
                    display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Send size={14}/>
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
