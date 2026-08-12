import React, { useState, useRef, useEffect } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";
import Hls from "hls.js";

const INTRO_VIDEO_URL =
  "https://stream.mux.com/aiFSECiPT501KG02eutUYBTKc8aPPOz27ikxTnTHaKJJ00.m3u8";

export default function FloatingIntroVideo({
  visible,
  onClose,
  videoUrl = INTRO_VIDEO_URL,
}) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!visible || !videoRef.current) return;

    const video = videoRef.current;
    let hls;

    if (videoUrl.includes(".m3u8")) {
      if (Hls.isSupported()) {
        // Chrome, Firefox, Edge, Opera
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((err) => {
            console.warn("Autoplay prevented by browser:", err);
          });
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.error("HLS Fatal Error:", data);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari on Mac/iOS)
        video.src = videoUrl;
        video.play().catch((err) => {
          console.warn("Safari Autoplay prevented:", err);
        });
      }
    } else {
      // Standard MP4 fallback
      video.src = videoUrl;
      video.play().catch((err) => {
        console.warn("Autoplay prevented:", err);
      });
    }

    // Cleanup memory and connections on unmount/close
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [visible, videoUrl]);

  if (!visible) return null;

  const handleClose = () => {
    setIsFullScreen(false);
    onClose?.();
  };

  return (
    <div
      style={isFullScreen ? styles.fullScreenOverlay : styles.floatingContainer}
    >
      <div
        style={isFullScreen ? styles.expandedVideoWrap : styles.miniVideoWrap}
      >
        {/* Top Control Buttons */}
        <div style={styles.videoButtonsRow}>
          <button
            type="button"
            onClick={() => setIsFullScreen((prev) => !prev)}
            style={styles.videoActionButton}
            title={isFullScreen ? "Minimize" : "Maximize"}
          >
            {isFullScreen ? (
              <Minimize2 size={16} color="#FFFFFF" />
            ) : (
              <Maximize2 size={15} color="#FFFFFF" />
            )}
          </button>
          <button
            type="button"
            onClick={handleClose}
            style={styles.videoActionButton}
            title="Close"
          >
            <X size={17} color="#FFFFFF" />
          </button>
        </div>

        {/* HTML5 Video Player */}
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: isFullScreen ? "contain" : "cover",
            display: "block",
          }}
          autoPlay
          muted
          controls
          playsInline
          onEnded={handleClose}
        />
      </div>
    </div>
  );
}

const styles = {
  floatingContainer: {
    position: "fixed",
    bottom: 24,
    right: 24,
    width: 210,
    aspectRatio: "9 / 16",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
    boxShadow: "0 12px 30px -5px rgba(0, 0, 0, 0.45)",
    zIndex: 999,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  fullScreenOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(6px)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  expandedVideoWrap: {
    position: "relative",
    width: "min(380px, 90vw)",
    aspectRatio: "9 / 16",
    maxHeight: "85vh",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000000",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
  },
  miniVideoWrap: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  videoButtonsRow: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    display: "flex",
    gap: 8,
  },
  videoActionButton: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    border: "none",
    borderRadius: "50%",
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    transition: "background-color 0.2s ease, transform 0.15s ease",
  },
};