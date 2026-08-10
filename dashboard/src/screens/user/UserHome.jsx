// User home — hero carousel, Continue Learning (enrollment progress),
// top experts (live availability), latest courses, upcoming webinars.
// All data from the shared backend; per-section skeletons while loading.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Radio, ChevronRight, Star, Clock, PlayCircle, CalendarDays } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { onSocket } from "../../utils/socket";
import colors from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar, ProgressBar } from "../../components/ui";
import { formatCurrency } from "../../utils/formatters";

const HERO_SLIDES = [
  {
    title: "Explore Your Interest",
    subtitle: "Courses, webinars and 1:1 experts — all in one place",
    cta: "Browse Courses",
    to: "/app/explore",
    gradient: "linear-gradient(120deg, #101538 0%, #1A2755 45%, #3A47B8 100%)",
    emoji: "🎓",
  },
  {
    title: "Learn Live from Experts",
    subtitle: "Book a 1:1 video session with a top expert today",
    cta: "Find an Expert",
    to: "/app/sessions",
    gradient: "linear-gradient(120deg, #1A1040 0%, #3B2E8C 55%, #6D5AE6 100%)",
    emoji: "📞",
  },
  {
    title: "Join Live Webinars",
    subtitle: "Interactive sessions hosted by creators, straight from Zoom",
    cta: "See What's Coming",
    to: "/app/explore?tab=webinars",
    gradient: "linear-gradient(120deg, #241238 0%, #5B2A83 55%, #9A4FD1 100%)",
    emoji: "📡",
  },
];

function Skeleton({ height = 180, count = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(240px, 1fr))`, gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mn-shimmer" style={{ height, borderRadius: 16 }} />
      ))}
    </div>
  );
}

function Section({ title, onSeeAll, delay = 0, children }) {
  return (
    <section className="uh-fade" style={{ marginTop: 36, animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>
          <span className="uh-kicker" />
          {title}
        </h2>
        {onSeeAll && (
          <button className="uh-see-all" onClick={onSeeAll}>
            See All <ChevronRight size={15} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export default function UserHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [experts, setExperts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExperts = () =>
    apiFetch("/sessions/experts?page=1&limit=8")
      .then((r) => {
        const d = unwrap(r);
        setExperts(d?.experts || d?.data || (Array.isArray(d) ? d : []));
      })
      .catch(() => {});

  useEffect(() => {
    Promise.allSettled([
      loadExperts(),
      apiFetch("/courses?page=1&limit=8").then((r) => {
        const d = unwrap(r);
        setCourses(d?.courses || (Array.isArray(d) ? d : []));
      }),
      apiFetch("/webinars?page=1&limit=8&upcoming=true").then((r) => {
        const d = unwrap(r);
        const list = d?.webinars || (Array.isArray(d) ? d : []);
        setWebinars(list.filter((w) => !w.is_enrolled).slice(0, 6));
      }),
      apiFetch("/courses/enrolled/me?page=1&limit=20").then((r) => {
        const d = unwrap(r);
        setEnrollments(d?.enrollments || d?.courses || (Array.isArray(d) ? d : []));
      }),
    ]).finally(() => setLoading(false));

    const t = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 4500);
    const off = onSocket("expert_availability_updated", loadExperts);
    return () => {
      clearInterval(t);
      off();
    };
  }, []);

  const hero = HERO_SLIDES[slide];
  const inProgress = enrollments
    .map((en) => ({ ...en, course: en.course || en, progress: Number(en.progress) || 0 }))
    .filter((en) => en.progress < 100)
    .slice(0, 3);
  const isToday = (dt) => dt && new Date(dt).toDateString() === new Date().toDateString();

  return (
    <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", boxSizing: "border-box" }}>
      {/* Hero carousel */}
      <div
        key={slide}
        className="uh-fade"
        onClick={() => navigate(hero.to)}
        style={{
          background: hero.gradient, borderRadius: 22, padding: "38px 38px", cursor: "pointer",
          position: "relative", overflow: "hidden", minHeight: 170,
        }}
      >
        <div style={{ position: "absolute", top: -70, right: -40, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", bottom: -90, right: 120, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", right: 46, top: "50%", transform: "translateY(-50%)", fontSize: 84, opacity: 0.55 }}>{hero.emoji}</div>

        <h2 style={{ margin: 0, fontSize: 30, fontWeight: 900, maxWidth: 540, letterSpacing: -0.5, position: "relative" }}>{hero.title}</h2>
        <p style={{ margin: "10px 0 22px", opacity: 0.85, fontSize: 15.5, maxWidth: 460, position: "relative" }}>{hero.subtitle}</p>
        <button className="uh-cta">{hero.cta} <ChevronRight size={16} /></button>

        <div style={{ position: "absolute", bottom: 16, right: 22, display: "flex", gap: 6 }}>
          {HERO_SLIDES.map((_, i) => (
            <span
              key={i}
              onClick={(e) => { e.stopPropagation(); setSlide(i); }}
              style={{ width: i === slide ? 24 : 8, height: 8, borderRadius: 99, background: i === slide ? "#fff" : "rgba(255,255,255,0.4)", transition: "width 0.25s ease", cursor: "pointer" }}
            />
          ))}
        </div>
      </div>

      {/* Continue learning */}
      {inProgress.length > 0 && (
        <Section title="Continue Learning" onSeeAll={() => navigate("/app/learning")} delay={60}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {inProgress.map((en) => {
              const c = en.course;
              return (
                <div key={en.id || c.id} className="uh-card" onClick={() => navigate(`/app/player/${c.id}`)} style={{ display: "flex" }}>
                  <div style={{ width: 116, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                    <div className="uh-thumb" style={{ position: "absolute", inset: 0, background: c.thumbnail ? `url(${c.thumbnail}) center/cover` : colors.gradients?.heroNavy }} />
                    <PlayCircle size={30} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "rgba(255,255,255,0.92)", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }} />
                  </div>
                  <div style={{ padding: "14px 16px", flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14.5, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: colors.user?.subHeading || "#73799B", fontSize: 12, margin: "8px 0 6px" }}>
                      <span>{en.progress}% complete</span>
                      <span style={{ color: colors.user?.accentSoft || "#BDC2FF", fontWeight: 700 }}>Resume →</span>
                    </div>
                    <ProgressBar percent={en.progress} height={6} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Top experts */}
      <Section title="Top Experts" onSeeAll={() => navigate("/app/sessions")} delay={120}>
        {loading ? (
          <Skeleton height={190} count={5} />
        ) : experts.length === 0 ? (
          <div style={{ color: colors.user?.subHeading || "#73799B", fontSize: 14 }}>Experts will appear here soon.</div>
        ) : (
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
            {experts.map((e) => (
              <div
                key={e.id}
                className="uh-card"
                onClick={() => navigate(`/app/experts/${e.id}`, { state: { expert: e } })}
                style={{ minWidth: 168, padding: 18, textAlign: "center", flexShrink: 0 }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, position: "relative" }}>
                  <Avatar src={e.user?.profile_image || e.profile_image} name={e.user?.name || e.name || "E"} size={64} />
                  {!!e.is_available && (
                    <span className="uh-online-dot" style={{ position: "absolute", bottom: 2, right: "calc(50% - 30px)", width: 13, height: 13, borderRadius: "50%", background: "#22C55E", border: "2.5px solid #1A1E38" }} />
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{e.user?.name || e.name}</div>
                <div style={{ color: colors.user?.subHeading || "#73799B", fontSize: 12, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.profession || e.category}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 9, fontSize: 12, color: colors.user?.subHeading || "#73799B" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={11} color="#F0C040" /> {e.rating || "New"}</span>
                  <span style={{ color: colors.user?.accentSoft || "#BDC2FF", fontWeight: 800 }}>₹{e.video_rate || 0}/min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Latest courses */}
      <Section title="Latest Courses" onSeeAll={() => navigate("/app/explore")} delay={180}>
        {loading ? (
          <Skeleton height={230} />
        ) : courses.length === 0 ? (
          <div style={{ color: colors.user?.subHeading || "#73799B", fontSize: 14 }}>No courses yet — check back soon.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
            {courses.slice(0, 8).map((c) => {
              const lessons = c.videos?.length ?? c.total_videos ?? 0;
              const mins = Array.isArray(c.videos) && c.videos.length ? Math.round(c.videos.reduce((s, v) => s + (Number(v.duration) || 0), 0) / 60) : 0;
              return (
                <div key={c.id} className="uh-card" onClick={() => navigate(`/app/course/${c.id}`)}>
                  <div style={{ height: 136, position: "relative", overflow: "hidden" }}>
                    <div className="uh-thumb" style={{ position: "absolute", inset: 0, background: c.thumbnail ? `url(${c.thumbnail}) center/cover` : colors.gradients?.heroNavy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {!c.thumbnail && <BookOpen size={34} color="rgba(255,255,255,0.55)" />}
                    </div>
                    {c.level && (
                      <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(8,12,37,0.7)", backdropFilter: "blur(4px)", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{c.level}</span>
                    )}
                    <span style={{ position: "absolute", bottom: 10, right: 10, background: Number(c.price) > 0 ? "rgba(8,12,37,0.75)" : "rgba(16,185,129,0.85)", backdropFilter: "blur(4px)", padding: "4px 12px", borderRadius: 99, fontSize: 12.5, fontWeight: 900 }}>
                      {Number(c.price) > 0 ? formatCurrency(c.price) : "Free"}
                    </span>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 14.5, lineHeight: 1.35, minHeight: 39, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.title}</div>
                    <div style={{ color: colors.user?.subHeading || "#73799B", fontSize: 12.5, marginTop: 6 }}>by {c.creator?.name || "Creator"}</div>
                    <div style={{ display: "flex", gap: 12, marginTop: 9, color: colors.user?.subHeading || "#73799B", fontSize: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><PlayCircle size={12} /> {lessons} lessons</span>
                      {mins > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {mins} min</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Upcoming webinars */}
      <Section title="Upcoming Webinars" onSeeAll={() => navigate("/app/explore?tab=webinars")} delay={240}>
        {loading ? (
          <Skeleton height={200} count={3} />
        ) : webinars.length === 0 ? (
          <div className="uh-card" style={{ cursor: "default", padding: 30, textAlign: "center", background: colors.gradients?.heroDusk, border: "none" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📡</div>
            <div style={{ fontWeight: 800, fontSize: 16.5 }}>Webinars Coming Soon!</div>
            <div style={{ opacity: 0.75, fontSize: 13.5, marginTop: 4 }}>Live sessions from creators will appear here.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
            {webinars.map((w) => (
              <div key={w.id} className="uh-card" onClick={() => navigate(`/app/webinar/${w.id}`)}>
                <div style={{ height: 124, position: "relative", overflow: "hidden" }}>
                  <div className="uh-thumb" style={{ position: "absolute", inset: 0, background: w.thumbnail ? `url(${w.thumbnail}) center/cover` : colors.gradients?.purple }} />
                  <span style={{ position: "absolute", top: 10, left: 10, background: isToday(w.scheduled_at) ? "rgba(239,68,68,0.9)" : "rgba(8,12,37,0.7)", backdropFilter: "blur(4px)", padding: "4px 11px", borderRadius: 99, fontSize: 11.5, fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}>
                    <Radio size={11} /> {isToday(w.scheduled_at) ? "Today" : w.scheduled_at ? new Date(w.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Live"}
                  </span>
                  <span style={{ position: "absolute", bottom: 10, right: 10, background: Number(w.price) > 0 ? "rgba(8,12,37,0.75)" : "rgba(16,185,129,0.85)", backdropFilter: "blur(4px)", padding: "4px 12px", borderRadius: 99, fontSize: 12.5, fontWeight: 900 }}>
                    {Number(w.price) > 0 ? formatCurrency(w.price) : "Free"}
                  </span>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{w.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: colors.user?.subHeading || "#73799B", fontSize: 12.5, marginTop: 7 }}>
                    <CalendarDays size={12} />
                    {w.scheduled_at ? new Date(w.scheduled_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "TBA"}
                    <span>· {w.creator?.name || "Creator"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}