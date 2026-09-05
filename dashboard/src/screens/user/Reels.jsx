import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Volume2, VolumeX, Play, ShoppingBag, Users, BookOpen, X, Loader2, ChevronUp,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { runPurchase } from "../../utils/payments";
import { toast } from "../../utils/toast";
import { useAuth } from "../../context/AuthContext";
import colors from "../../utils/colors";
import HlsVideo from "../../components/HlsVideo";

const PAGE_SIZE = 8;

export default function Reels() {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();

  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [sheetFor, setSheetFor] = useState(null); // the reel whose sheet is open

  const containerRef = useRef(null);
  const seenRef = useRef(new Set()); // reels already counted as viewed

  const load = useCallback(async (pageNum) => {
    try {
      const data = unwrap(await apiFetch(`/reels?page=${pageNum}&limit=${PAGE_SIZE}`));
      const batch = data?.reels || [];
      setReels((prev) => (pageNum === 1 ? batch : [...prev, ...batch]));
      setHasMore(pageNum < (data?.pagination?.totalPages || 1));
    } catch {
      if (pageNum === 1) setReels([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  // Track which reel is centred, and pull the next page as the end nears.
  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    if (idx !== activeIndex) setActiveIndex(idx);

    if (hasMore && idx >= reels.length - 3) {
      setPage((p) => {
        const next = p + 1;
        load(next);
        return next;
      });
      setHasMore(false); // re-enabled by load() when more pages remain
    }
  }, [activeIndex, hasMore, reels.length, load]);

  // Count a view once the reel has been the active one for a moment.
  useEffect(() => {
    const reel = reels[activeIndex];
    if (!reel || seenRef.current.has(reel.id)) return;
    const t = setTimeout(() => {
      seenRef.current.add(reel.id);
      apiFetch(`/reels/${reel.id}/view`, { method: "POST" }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [activeIndex, reels]);

  if (loading) {
    return (
      <Centered>
        <Loader2 size={30} className="spin" color={colors.brand?.primaryOrange || "#FFC107"} />
        <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 12 }}>Loading reels…</p>
      </Centered>
    );
  }

  if (!reels.length) {
    return (
      <Centered>
        <Play size={38} color="rgba(255,255,255,0.5)" />
        <h2 style={{ color: "#fff", margin: "14px 0 6px", fontSize: 19 }}>No reels yet</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center", maxWidth: 300 }}>
          Creators haven't posted any course reels. Browse courses instead.
        </p>
        <button onClick={() => navigate("/app/explore")} style={ctaStyle}>Explore courses</button>
      </Centered>
    );
  }

  return (
    <div style={{ position: "relative", height: "calc(100vh - 84px)", background: "#000", borderRadius: 16, overflow: "hidden" }}>
      <div
        ref={containerRef}
        onScroll={onScroll}
        style={{
          height: "100%",
          overflowY: "auto",
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
        }}
      >
        {reels.map((reel, i) => (
         <ReelSlide
  key={reel.id}
  reel={reel}
  isActive={i === activeIndex}
  muted={muted}
  onToggleMute={() => setMuted((m) => !m)}
  onBuy={() => setSheetFor(reel)}
  onOpenCourse={() => navigate(`/app/course/${reel.course.id}`)}
  onOpenCreator={() =>
    reel.course?.creator?.id && navigate(`/app/creator/${reel.course.creator.id}`)
  }
/>
        ))}
        

        {hasMore && (
          <div style={{ height: 60, display: "grid", placeItems: "center", color: "rgba(255,255,255,0.5)" }}>
            <Loader2 size={20} className="spin" />
          </div>
        )}
      </div>

      {activeIndex === 0 && reels.length > 1 && (
        <div style={swipeHintStyle}>
          <ChevronUp size={16} /> Swipe up for more
        </div>
      )}

      {sheetFor && (
        <BuySheet
          reel={sheetFor}
          isAuthed={isAuthed}
          onClose={() => setSheetFor(null)}
          onNeedLogin={() => navigate("/auth")}
          onEnrolled={(courseId) =>
            setReels((prev) =>
              prev.map((r) => (r.course.id === courseId ? { ...r, is_enrolled: true } : r)),
            )
          }
          onOpenCourse={(courseId) => navigate(`/app/course/${courseId}`)}
        />
      )}

      <style>{`
        .spin { animation: reelspin 0.9s linear infinite; }
        @keyframes reelspin { to { transform: rotate(360deg); } }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────── one full-screen reel ─────────────────────────── */

function ReelSlide({ reel, isActive, muted, onToggleMute, onBuy, onOpenCourse, onOpenCreator }) {
  const course = reel.course || {};
  const creator = course.creator || {};
  const price = Number(course.price ?? 0);
  const isFree = price === 0;
  
  return (
         <div style={{ height: "100%", scrollSnapAlign: "start", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
      <div style={{ position: "relative", height: "100%", maxHeight: "100%", aspectRatio: "9 / 16", background: "#000" }}>
        {isActive && reel.mux_playback_id ? (
          <HlsVideo
            src={reel.playback_url || `https://stream.mux.com/${reel.mux_playback_id}.m3u8`}
            poster={reel.thumbnail_url}
            autoPlay
            loop
            muted={muted}
            controls={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }}
          />
        ) : (
          <img
            src={reel.thumbnail_url || course.thumbnail_url || course.thumbnail}
            alt={course.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }}
          />
        )}
      </div>

      {/* Readability scrim behind the caption + CTA */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 42%, rgba(0,0,0,0.35) 100%)", pointerEvents: "none" }} />

      <button onClick={onToggleMute} title={muted ? "Unmute" : "Mute"} style={muteBtnStyle}>
        {muted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
      </button>

      {/* Bottom overlay: creator, caption, and the buy CTA */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 18px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        <button onClick={onOpenCreator} style={creatorRowStyle}>
          {creator.profile_image
            ? <img src={creator.profile_image} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
            : <div style={avatarFallback}>{(creator.name || "?").charAt(0).toUpperCase()}</div>}
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{creator.name || "Creator"}</span>
        </button>

        {reel.caption && (
          <p style={{ color: "#fff", fontSize: 14, lineHeight: 1.45, margin: 0, maxWidth: 560, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
            {reel.caption}
          </p>
        )}

        <div style={courseStripStyle}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {course.title}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><BookOpen size={12} /> {course._count?.videos ?? 0} Videos</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /> {course._count?.enrollments ?? 0} enrolled</span>
            </div>
          </div>

          <button onClick={reel.is_enrolled ? onOpenCourse : onBuy} style={buyBtnStyle}>
            {reel.is_enrolled ? <><Play size={15} /> Continue</> : <><ShoppingBag size={15} /> {isFree ? "Enroll free" : `Buy ₹${price.toLocaleString("en-IN")}`}</>}
          </button>
        </div>
      </div>
    </div>
  );
  
}

/* ───────────────────────── purchase bottom sheet ───────────────────────── */

function BuySheet({ reel, isAuthed, onClose, onNeedLogin, onEnrolled, onOpenCourse }) {
  const course = reel.course || {};
  const price = Number(course.price ?? 0);
  const isFree = price === 0;
  const [paying, setPaying] = useState(false);

  const buy = async () => {
    if (!isAuthed) return onNeedLogin();
    setPaying(true);
    try {
      if (isFree) {
        await apiFetch(`/courses/${course.id}/enroll`, { method: "POST", body: JSON.stringify({}) });
      } else {
        await runPurchase({
          createOrder: async () =>
            unwrap(await apiFetch(`/payments/create-order/${course.id}`, { method: "POST", body: JSON.stringify({}) })),
          verifyPath: "/payments/verify",
        });
      }
      toast.success("You're enrolled 🎉");
      onEnrolled(course.id);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };
  

  return (
    <div onClick={onClose} style={sheetBackdrop}>
      <div onClick={(e) => e.stopPropagation()} style={sheetStyle}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.15)", margin: "0 auto 16px" }} />

        <button onClick={onClose} style={sheetCloseStyle}><X size={18} /></button>

        <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 84, height: 60, borderRadius: 10, flexShrink: 0,
            background: (course.thumbnail_url || course.thumbnail)
              ? `url(${course.thumbnail_url || course.thumbnail}) center/cover no-repeat`
              : "rgba(0,0,0,0.06)",
          }} />
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>{course.title}</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
              by {course.creator?.name || "Creator"}
              {course.level ? ` · ${course.level}` : ""}
            </p>
          </div>
        </div>

        {course.description && (
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "#4B5563", margin: "0 0 16px", maxHeight: 88, overflow: "hidden" }}>
            {course.description}
          </p>
        )}

        <div style={{ display: "flex", gap: 18, padding: "12px 0", borderTop: "1px solid #F1F3F6", borderBottom: "1px solid #F1F3F6", marginBottom: 16 }}>
          <Stat label="Lessons" value={course._count?.videos ?? 0} />
          <Stat label="Enrolled" value={course._count?.enrollments ?? 0} />
          <Stat label="Price" value={isFree ? "Free" : `₹${price.toLocaleString("en-IN")}`} />
        </div>

        {reel.is_enrolled ? (
          <button onClick={() => onOpenCourse(course.id)} style={{ ...sheetCta, background: "#10B981" }}>
            <Play size={16} /> Continue learning
          </button>
        ) : (
          <button onClick={buy} disabled={paying} style={{ ...sheetCta, opacity: paying ? 0.6 : 1 }}>
            {paying ? <><Loader2 size={16} className="spin" /> Processing…</> : <><ShoppingBag size={16} /> {isFree ? "Enroll for free" : `Buy for ₹${price.toLocaleString("en-IN")}`}</>}
          </button>
        )}

        <button onClick={() => onOpenCourse(course.id)} style={sheetSecondary}>View full course details</button>
      </div>
    </div>

    
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#8A919E", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div style={{ height: "calc(100vh - 84px)", background: "#000", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {children}
    </div>
  );
}

/* ───────────────────────────────── styles ───────────────────────────────── */

const ctaStyle = {
  marginTop: 18, padding: "10px 20px", borderRadius: 999, border: "none",
  background: "#FFC107", color: "#3A2A00", fontWeight: 700, fontSize: 14, cursor: "pointer",
};

const muteBtnStyle = {
  position: "absolute", top: 16, right: 16, width: 38, height: 38, borderRadius: "50%",
  border: "none", background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center",
  cursor: "pointer", backdropFilter: "blur(4px)",
};

const creatorRowStyle = {
  display: "flex", alignItems: "center", gap: 9, background: "none", border: "none",
  padding: 0, cursor: "pointer", alignSelf: "flex-start",
};

const avatarFallback = {
  width: 34, height: 34, borderRadius: "50%", background: "#FFC107", color: "#3A2A00",
  display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14,
};

const courseStripStyle = {
  display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14,
  background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.16)", maxWidth: 560,
};

const buyBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 999,
  border: "none", background: "linear-gradient(180deg,#FFC107,#FFB300)", color: "#3A2A00",
  fontWeight: 800, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
  boxShadow: "0 4px 14px rgba(255,179,0,0.4)",
};

const sheetBackdrop = {
  position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
  alignItems: "flex-end", justifyContent: "center", zIndex: 40, backdropFilter: "blur(2px)",
};

const sheetStyle = {
  width: "100%", maxWidth: 520, background: "#fff", borderRadius: "20px 20px 0 0",
  padding: "12px 20px 22px", position: "relative", maxHeight: "82%", overflowY: "auto",
  animation: "none",
};

const sheetCloseStyle = {
  position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%",
  border: "none", background: "#F1F3F6", display: "grid", placeItems: "center", cursor: "pointer",
};

const sheetCta = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "13px 20px", borderRadius: 12, border: "none",
  background: "linear-gradient(180deg,#FFC107,#FFB300)", color: "#3A2A00",
  fontWeight: 800, fontSize: 15, cursor: "pointer",
};

const sheetSecondary = {
  width: "100%", marginTop: 10, padding: "10px 20px", borderRadius: 12,
  border: "1px solid #E9ECF0", background: "#fff", color: "#4B5563",
  fontWeight: 600, fontSize: 13.5, cursor: "pointer",
};

const swipeHintStyle = {
  position: "absolute", bottom: 150, left: "50%", transform: "translateX(-50%)",
  display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 999,
  background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 12, pointerEvents: "none",
};
