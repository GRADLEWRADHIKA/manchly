import React, { useEffect, useRef } from "react";
import Hls from "hls.js";


export default function HlsVideo({ src, poster, autoPlay = false, onProgress, style = {}, controls = true, watermarkText, muted = false, loop = false }) {
  const videoRef = useRef(null);
  const lastPct = useRef(-1);

 useEffect(() => {
  const video = videoRef.current;
  if (!video || !src) return;

  let hls = null;

  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (autoPlay) video.play().catch((e) => console.warn("Autoplay blocked:", e));
    });
    hls.on(Hls.Events.ERROR, (_event, data) => {
      console.error("HLS.js error:", data.type, data.details, data);
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = src;
  } else {
    video.src = src;
  }

  return () => hls?.destroy();
}, [src, autoPlay]);

  const handleTime = () => {
    const v = videoRef.current;
    if (!v || !v.duration || !onProgress) return;
    const pct = Math.round((v.currentTime / v.duration) * 100);
    if (pct !== lastPct.current) {
      lastPct.current = pct;
      onProgress(pct, v.currentTime, v.duration);
    }
  };

  return (

    <div style={{ position: "relative", width: style.width ?? "100%", height: style.height ?? "auto" }}>
      <video
      ref={videoRef}
      poster={poster}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      onTimeUpdate={handleTime}
      playsInline
      style={{ width: "100%", height: "100%", borderRadius: 14, background: "#000", display: "block", ...style }}
    />
    {watermarkText && (
      <div
       style={{
        position: "absolute",
        top: "60%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "rgba(255,255,255,0.55)",
        fontSize: 13,
        fontWeight: 600,
        textShadow: "0 1 px 3px rgba(0,0,0,0.6)",
        pointerEvents: "none",
        userSelect: "none"
       }}
      >
         {watermarkText}
        </div>
    )}
   </div> 
  );
}
