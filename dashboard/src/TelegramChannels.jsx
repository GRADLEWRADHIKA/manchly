import React, { useEffect, useState } from "react";
import {
  Send, RefreshCw, ExternalLink, Search, Users, IndianRupee, Copy, CheckCircle2,
} from "lucide-react";

import { API_BASE } from "./api";
const BOT_USERNAME = "ManchlyBot";

const T = {
  bg: "#000000",
  card: "#111111",
  cardHigh: "#161616",
  sidebar: "#0A0A0A",
  orange: "#FFC107",
  orangeL: "rgba(255,193,7,0.12)",
  green: "#22C55E",
  greenL: "rgba(34,197,94,0.12)",
  red: "#EF4444",
  redL: "rgba(239,68,68,0.12)",
  border: "rgba(255,255,255,0.1)",
  borderHi: "rgba(255,193,7,0.4)",
  textPri: "#FFFFFF",
  textSec: "#A1A1AA",
  textMut: "#71717A",
};

const getToken = () =>
  (typeof window !== "undefined"
    && (localStorage.getItem("manchly_token") || localStorage.getItem("token")))
  || "";

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
}

export default function TelegramChannels() {
  const [channels, setChannels] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const loadChannels = async () => {
    setLoadingChannels(true);
    setError("");
    try {
      const data = await apiFetch("/telegram/channels");
      const list = data?.data || data?.channels || [];
      setChannels(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingChannels(false);
    }
  };

  const loadSubsForChannel = async (channelId) => {
    setLoadingSubs(true);
    try {
      const data = await apiFetch(`/telegram/subscriptions?channelId=${encodeURIComponent(channelId)}`);
      const list = data?.data || data?.subscriptions || [];
      setSubscriptions(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
      setSubscriptions([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => { loadChannels(); }, []);

  useEffect(() => {
    if (activeChannelId) loadSubsForChannel(activeChannelId);
    else setSubscriptions([]);
  }, [activeChannelId]);

  const filtered = channels.filter((c) =>
    !search ||
    String(c.channel_title || "").toLowerCase().includes(search.toLowerCase()) ||
    String(c.creator_username || "").toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 1500);
  };

  const registerLink = `https://t.me/${BOT_USERNAME}?start=register`;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.textPri,
      padding: 30, fontFamily: "system-ui, sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 38, fontWeight: 900, marginBottom: 6 }}>
            Telegram Channels
          </h1>
          <p style={{ color: T.textSec }}>
            Paid Telegram channels listed via @{BOT_USERNAME}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href={registerLink} target="_blank" rel="noreferrer"
            style={{ background: T.orange, color: "#000", padding: "12px 20px",
              borderRadius: 12, fontWeight: 700, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Send size={16}/> Register a channel
          </a>
          <button onClick={loadChannels}
            style={{ background: T.card, color: T.textPri, border: `1px solid ${T.border}`,
              padding: "12px 16px", borderRadius: 12, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={14}/> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: T.redL, border: `1px solid ${T.red}`,
          color: T.red, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {/* INSTRUCTIONS BANNER */}
      <div style={{ background: T.card, border: `1px solid ${T.borderHi}`,
        borderRadius: 16, padding: 18, marginBottom: 24,
        display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ width: 42, height: 42, borderRadius: 12,
          background: T.orangeL, display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0 }}>
          <Send color={T.orange} size={20}/>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
            How to list your channel
          </div>
          <ol style={{ paddingLeft: 18, color: T.textSec, fontSize: 13.5, lineHeight: 1.7 }}>
            <li>Add <code style={{ color: T.orange }}>@{BOT_USERNAME}</code> as an admin in your private Telegram channel.</li>
            <li>Open the bot with the button on the right and run <code style={{ color: T.orange }}>/register</code>.</li>
            <li>Forward any message from your channel into the chat with the bot.</li>
            <li>Set price + description. Buyers join via the bot's deep link.</li>
          </ol>
        </div>
        <button onClick={() => copyLink(registerLink, "register")}
          style={{ background: T.sidebar, border: `1px solid ${T.border}`,
            color: T.textPri, padding: "8px 14px", borderRadius: 10,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {copied === "register" ? <CheckCircle2 size={14} color={T.green}/> : <Copy size={14}/>}
          {copied === "register" ? "Copied" : "Copy invite link"}
        </button>
      </div>

      {/* SEARCH */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: "50%",
          transform: "translateY(-50%)", color: T.textMut }}/>
        <input
          placeholder="Search channels by title or creator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "12px 14px 12px 38px",
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 12, color: T.textPri, outline: "none",
            fontSize: 14, boxSizing: "border-box" }}
        />
      </div>

      {/* LIST */}
      <div style={{ display: "grid",
        gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div>
          <div style={{ marginBottom: 10, fontSize: 11, color: T.textMut,
            textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
            Channels ({filtered.length})
          </div>
          {loadingChannels ? (
            <div style={{ padding: 30, color: T.textSec, textAlign: "center" }}>
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: T.card, border: `1px dashed ${T.border}`,
              borderRadius: 14, padding: 30, textAlign: "center", color: T.textSec }}>
              No channels yet. Register one via @{BOT_USERNAME}.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filtered.map((ch) => {
                const active = activeChannelId === ch.id;
                const deepLink = `https://t.me/${BOT_USERNAME}?start=channel_${ch.id.slice(0, 8)}`;
                return (
                  <div key={ch.id}
                    onClick={() => setActiveChannelId(active ? null : ch.id)}
                    style={{ background: active ? T.cardHigh : T.card,
                      border: `1px solid ${active ? T.borderHi : T.border}`,
                      borderRadius: 14, padding: 16, cursor: "pointer",
                      transition: "all 0.18s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      gap: 10, alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700,
                          color: T.textPri, marginBottom: 4 }}>
                          {ch.channel_title}
                        </div>
                        <div style={{ fontSize: 12, color: T.textSec }}>
                          @{ch.creator_username || "private"} · ID {ch.channel_id}
                        </div>
                        {ch.description && (
                          <div style={{ fontSize: 12.5, color: T.textMut,
                            marginTop: 6, lineHeight: 1.5 }}>
                            {ch.description.slice(0, 120)}
                            {ch.description.length > 120 && "…"}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 900,
                          color: T.orange, display: "flex",
                          alignItems: "center", gap: 2 }}>
                          <IndianRupee size={14}/>{Number(ch.price_inr || 0).toLocaleString("en-IN")}
                        </div>
                        <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>
                          {ch.status}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12,
                      paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                      <button onClick={(e) => { e.stopPropagation(); copyLink(deepLink, ch.id); }}
                        style={{ flex: 1, background: T.orangeL, border: "none",
                          color: T.orange, padding: "6px 10px", borderRadius: 8,
                          fontWeight: 700, fontSize: 11.5, cursor: "pointer",
                          display: "inline-flex", alignItems: "center",
                          justifyContent: "center", gap: 5 }}>
                        {copied === ch.id ? <CheckCircle2 size={12}/> : <Copy size={12}/>}
                        {copied === ch.id ? "Copied" : "Copy buy link"}
                      </button>
                      <a href={deepLink} target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ background: T.sidebar, border: `1px solid ${T.border}`,
                          color: T.textPri, padding: "6px 10px", borderRadius: 8,
                          fontWeight: 700, fontSize: 11.5, textDecoration: "none",
                          display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <ExternalLink size={11}/> Open
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT — subscriptions for selected channel */}
        <div>
          <div style={{ marginBottom: 10, fontSize: 11, color: T.textMut,
            textTransform: "uppercase", letterSpacing: 1, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={11}/>
            {activeChannelId
              ? `Subscribers (${subscriptions.length})`
              : "Select a channel to view subscribers"}
          </div>
          {!activeChannelId ? (
            <div style={{ background: T.card, border: `1px dashed ${T.border}`,
              borderRadius: 14, padding: 30, textAlign: "center", color: T.textSec }}>
              Click a channel on the left to load its subscribers from
              GET&nbsp;/telegram/subscriptions.
            </div>
          ) : loadingSubs ? (
            <div style={{ padding: 30, color: T.textSec, textAlign: "center" }}>
              Loading subscribers…
            </div>
          ) : subscriptions.length === 0 ? (
            <div style={{ background: T.card, border: `1px dashed ${T.border}`,
              borderRadius: 14, padding: 30, textAlign: "center", color: T.textSec }}>
              No subscriptions yet for this channel.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {subscriptions.map((s) => (
                <div key={s.id}
                  style={{ background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", gap: 10 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>
                        @{s.buyer_username || "unknown"}
                      </div>
                      <div style={{ fontSize: 11, color: T.textMut, marginTop: 3 }}>
                        TG ID {s.buyer_telegram_id}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: T.orange }}>
                        ₹{Number(s.amount_inr || 0).toLocaleString("en-IN")}
                      </div>
                      <StatusBadge status={s.status}/>
                    </div>
                  </div>
                  {s.payment_method && (
                    <div style={{ marginTop: 8, paddingTop: 8,
                      borderTop: `1px solid ${T.border}`,
                      display: "flex", justifyContent: "space-between",
                      fontSize: 11, color: T.textMut }}>
                      <span>{s.payment_method}</span>
                      <span>{s.payment_reference?.slice(0, 20) || "—"}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE: { bg: T.greenL, color: T.green },
    PENDING_PAYMENT: { bg: T.orangeL, color: T.orange },
    FAILED: { bg: T.redL, color: T.red },
    EXPIRED: { bg: "rgba(113,113,122,0.2)", color: T.textMut },
  };
  const s = map[status] || map.PENDING_PAYMENT;
  return (
    <span style={{ display: "inline-block", background: s.bg, color: s.color,
      borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700,
      marginTop: 4 }}>
      {status}
    </span>
  );
}
