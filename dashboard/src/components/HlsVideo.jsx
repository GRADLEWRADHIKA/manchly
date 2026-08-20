// Minimal HLS <video> wrapper (Mux playback URLs). Native HLS on Safari,
// hls.js elsewhere. onProgress(percent, seconds, duration) fires ~1/sec.
import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function HlsVideo({ src, poster, autoPlay = false, onProgress, style = {}, controls = true, watermarkText }) {
  const videoRef = useRef(null);
  const lastPct = useRef(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls = null;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src;
    }
    return () => hls?.destroy();
  }, [src]);

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
    <div style={{position: "relative", width: "100%"}}>
    <video
      ref={videoRef}
      poster={poster}
      controls={controls}
      autoPlay={autoPlay}
      onTimeUpdate={handleTime}
      playsInline
      style={{ width: "100%", borderRadius: 14, background: "#000", display: "block", ...style }}
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
