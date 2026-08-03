// 1:1 video call room — ZegoCloud web UIKit joins the same room (callID) as
// the mobile app. On end: PATCH /sessions/:id/end {duration} + socket
// call_ended; users go to the rating screen, creators back to their dashboard.
//
// Zego web needs VITE_ZEGO_APP_ID + VITE_ZEGO_SERVER_SECRET (the RN app ships
// an AppSign, which the web SDK cannot use — generate a kit token instead).
// Without them the session lifecycle still works (timer + end), minus video.
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PhoneOff } from "lucide-react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { apiFetch } from "../utils/api";
import { emitSocket, onSocket } from "../utils/socket";
import { useAuth } from "../context/AuthContext";
import colors from "../utils/colors";
import { toast } from "../utils/toast";

const ZEGO_APP_ID = Number(import.meta.env.VITE_ZEGO_APP_ID || 0);
const ZEGO_SERVER_SECRET = import.meta.env.VITE_ZEGO_SERVER_SECRET || "";

export default function CallRoom() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const containerRef = useRef(null);
  const zegoRef = useRef(null);
  const startRef = useRef(Date.now());
  const endedRef = useRef(false);
  const [seconds, setSeconds] = useState(0);

  const callId = params.get("callId") || `call_${Date.now()}`;
  const sessionId = params.get("sessionId");
  const otherUserId = params.get("otherUserId");
  const otherName = params.get("otherName") || "Participant";
  const zegoReady = ZEGO_APP_ID > 0 && ZEGO_SERVER_SECRET.length > 0;

  const endCall = async (notify = true) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const duration = Math.max(1, Math.ceil((Date.now() - startRef.current) / 60000));
    try {
      if (sessionId) await apiFetch(`/sessions/${sessionId}/end`, { method: "PATCH", body: JSON.stringify({ duration }) });
    } catch { /* already ended server-side */ }
    if (notify) emitSocket("call_ended", { callId, otherUserId, endedBy: user?.id });
    try { zegoRef.current?.destroy?.(); } catch { /* noop */ }
    if (role === "CREATOR") {
      toast.success(`Session ended · lasted ${duration} min`);
      navigate("/creator/sessions", { replace: true });
    } else {
      navigate(`/app/rate/${sessionId || ""}?name=${encodeURIComponent(otherName)}&duration=${duration}`, { replace: true });
    }
  };

  useEffect(() => {
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    const off = onSocket("call_ended", () => endCall(false));
    return () => {
      clearInterval(t);
      off();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!zegoReady || !containerRef.current) return;
    const userId = String(user?.id || "guest").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      ZEGO_APP_ID,
      ZEGO_SERVER_SECRET,
      String(callId),
      userId,
      user?.name || "User"
    );
    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zegoRef.current = zp;
    zp.joinRoom({
      container: containerRef.current,
      scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
      showPreJoinView: false,
      showScreenSharingButton: false,
      showLeavingView: false,
      onLeaveRoom: () => endCall(true),
    });
    return () => { try { zp.destroy(); } catch { /* noop */ } };
  }, [zegoReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ position: "fixed", inset: 0, background: "#05060F", color: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px" }}>
        <div style={{ fontWeight: 900 }}>{otherName}</div>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, padding: "4px 14px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{mm}:{ss}</div>
      </div>

      {zegoReady ? (
        <div ref={containerRef} style={{ flex: 1 }} />
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: colors.gradients.heroNavy }}>
          <div style={{ fontSize: 46 }}>📹</div>
          <div style={{ fontWeight: 900, fontSize: 19 }}>Call in progress</div>
          <p style={{ maxWidth: 420, textAlign: "center", opacity: 0.7, fontSize: 13.5, lineHeight: 1.7 }}>
            Video engine not configured for web. Add <code>VITE_ZEGO_APP_ID</code> and <code>VITE_ZEGO_SERVER_SECRET</code> to a
            <code> .env</code> file to enable in-browser video. The session timer and billing still run.
          </p>
        </div>
      )}

      {!zegoReady && (
        <div style={{ display: "flex", justifyContent: "center", padding: 22 }}>
          <button onClick={() => endCall(true)} style={{ width: 66, height: 66, borderRadius: "50%", border: "none", background: colors.gradients.danger, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PhoneOff size={26} />
          </button>
        </div>
      )}
    </div>
  );
}
