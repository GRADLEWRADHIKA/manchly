import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { FullLoader, EmptyState } from "../../components/ui";
import HlsVideo from "../../components/HlsVideo";
import {useAuth} from "../../context/AuthContext";

export default function Player() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const {user} = useAuth();
  const [course, setCourse] = useState(null);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastSent = useRef(-1);

  useEffect(() => {
    apiFetch(`/courses/${courseId}`)
      .then((r) => {
        const d = unwrap(r);
        const c = d?.course || d;
        setCourse(c);
        const vids = (c?.videos || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
        setActive(vids.find((v) => v.playback_url) || vids[0] || null);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const onProgress = (pct) => {
    if (pct === lastSent.current || pct % 5 !== 0) return; // send every 5%
    lastSent.current = pct;
    apiFetch(`/courses/${courseId}/progress`, { method: "PUT", body: JSON.stringify({ progress: pct }) }).catch(() => {});
  };

  if (loading) return <FullLoader label="Loading player..." />;
  if (!course) return <EmptyState icon="🎬" title="Course not found" />;

  const videos = (course.videos || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const upNext = videos.filter((v) => v.id !== active?.id);
  const phoneLast4 = user?.phone ? String(user.phone).replace(/\D/g, "").slice(-4) : "";
  const watermarkText = user ? `${user.name}${phoneLast4 ? ` • ${phoneLast4}` : ""}` : undefined;

  return (
    <div>
      <button 
        onClick={() => navigate(-1)} 
        style={{ 
          background: "transparent", 
          border: "none", 
          color: colors.user.subHeading, 
          cursor: "pointer", 
          display: "flex", 
          alignItems: "center", 
          gap: 6, 
          marginBottom: 14, 
          padding: 0, 
          fontSize: 13.5, 
          fontWeight: 700 
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 22, alignItems: "start" }}>
        <div>
          {active?.playback_url ? (
            <HlsVideo 
              key={active.id} 
              src={active.playback_url} 
              poster={active.thumbnail_url || course.thumbnail} 
              autoPlay 
              onProgress={onProgress} 
              watermarkText={watermarkText}
              style={{ aspectRatio: "16/9" }} 
            />
          ) : (
            <div 
              style={{ 
                aspectRatio: "16/9", 
                borderRadius: 14, 
                background: colors.user.card, 
                border: `1px solid ${colors.user.border}`,
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: colors.user.subHeading 
              }}
            >
              {active ? "This lesson is still processing…" : "No lessons yet"}
            </div>
          )}
          {active && (
            <>
              <h2 style={{ margin: "16px 0 6px", fontSize: 21, fontWeight: 900, color: colors.user.text }}>{active.title}</h2>
              <p style={{ margin: 0, color: colors.user.subHeading, fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{active.description}</p>
            </>
          )}
        </div>

        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, color: colors.user.subHeading }}>
            Up Next · {course.title}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "72vh", overflowY: "auto" }}>
            {upNext.length === 0 && <div style={{ color: colors.user.subHeading, fontSize: 13.5 }}>No more lessons.</div>}
            {upNext.map((v, i) => (
              <div
                key={v.id || i}
                onClick={() => { setActive(v); lastSent.current = -1; }}
                style={{ 
                  display: "flex", 
                  gap: 12, 
                  background: colors.user.card, 
                  border: `1px solid ${colors.user.border}`, 
                  borderRadius: 12, 
                  padding: 10, 
                  cursor: "pointer" 
                }}
              >
                <div 
                  style={{ 
                    width: 92, 
                    height: 56, 
                    borderRadius: 8, 
                    flexShrink: 0, 
                    background: v.thumbnail_url ? `url(${v.thumbnail_url}) center/cover` : colors.gradients.heroWarm, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    position: "relative" 
                  }}
                >
                  <PlayCircle size={22} color="#FFFFFF" />
                  {v.duration > 0 && (
                    <span style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.75)", color: "#FFFFFF", borderRadius: 4, fontSize: 10, padding: "1px 5px", fontWeight: 700 }}>
                      {Math.floor(v.duration / 60)}:{String(Math.floor(v.duration % 60)).padStart(2, "0")}
                    </span>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.35, color: colors.user.text }}>{v.title}</div>
                  <div style={{ color: colors.user.subHeading, fontSize: 12, marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}