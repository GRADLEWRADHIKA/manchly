// Global call listener — mirrors the app's CallListener + IncomingCallScreen.
// Listens for socket `incoming_call`, shows a full-screen ringing overlay with
// Accept/Decline; accept → PATCH /sessions/:id/accept + navigate to the call
// room. Also surfaces call_declined / call_ended toasts.
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, PhoneOff } from "lucide-react";
import { onSocket, emitSocket } from "../utils/socket";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import colors from "../utils/colors";
import { Avatar } from "./ui";
import { toast } from "../utils/toast";

export default function CallManager() {
  const navigate = useNavigate();
  const { user, isAuthed } = useAuth();
  const [incoming, setIncoming] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!isAuthed) return;
    const offs = [
      onSocket("incoming_call", (data) => {
        if (!data?.callId) return;
        if (data.caller?.id && data.caller.id === user?.id) return; // self echo
        setIncoming(data);
      }),
      onSocket("call_declined", () => {
        toast.info("Call declined");
        setIncoming(null);
      }),
      onSocket("call_ended", () => {
        setIncoming(null);
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [isAuthed, user?.id]);

  // Ringtone via WebAudio beep loop (no asset needed)
  useEffect(() => {
    if (!incoming) return;
    let ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const ring = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 620;
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      };
      ring();
      audioRef.current = setInterval(ring, 1600);
    } catch { /* audio blocked */ }
    return () => {
      clearInterval(audioRef.current);
      ctx?.close?.();
    };
  }, [incoming]);

  if (!incoming) return null;

  const accept = async () => {
    const data = incoming;
    setIncoming(null);
    try {
      if (data.sessionId) {
        await apiFetch(`/sessions/${data.sessionId}/accept`, { method: "PATCH", body: JSON.stringify({}) }).catch(() => {});
      }
      emitSocket("call_accepted", { callId: data.callId, callerId: data.caller?.id });
      const q = new URLSearchParams({
        callId: data.callId,
        sessionId: data.sessionId || "",
        mode: data.mode || "video",
        otherUserId: data.caller?.id || "",
        otherName: data.caller?.name || "Caller",
      });
      navigate(`/call?${q}`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const decline = () => {
    emitSocket("call_declined", { callId: incoming.callId, callerId: incoming.caller?.id });
    setIncoming(null);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: colors.gradients.heroNavy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
      <div className="mn-pulse" style={{ borderRadius: "50%", padding: 14 }}>
        <Avatar src={incoming.caller?.profile_image} name={incoming.caller?.name || "?"} size={120} />
      </div>
      <h2 style={{ margin: "22px 0 4px", fontSize: 26, fontWeight: 900 }}>{incoming.caller?.name || "Incoming call"}</h2>
      <p style={{ margin: 0, opacity: 0.75 }}>Incoming {incoming.mode || "video"} call…</p>
      <div style={{ display: "flex", gap: 40, marginTop: 46 }}>
        <button onClick={decline} style={{ width: 68, height: 68, borderRadius: "50%", border: "none", background: colors.gradients.danger, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(220,38,38,0.5)" }}>
          <PhoneOff size={26} />
        </button>
        <button onClick={accept} style={{ width: 68, height: 68, borderRadius: "50%", border: "none", background: colors.gradients.teal, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(16,185,129,0.5)" }}>
          <Phone size={26} />
        </button>
      </div>
    </div>
  );
}
