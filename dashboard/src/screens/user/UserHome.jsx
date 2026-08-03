// User home — greeting, gradient hero carousel, top experts (live availability),
// latest courses, latest webinars. All data from the shared backend.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Radio, ChevronRight } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { onSocket } from "../../utils/socket";
import colors from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar, FullLoader, GradientButton } from "../../components/ui";
import { formatCurrency } from "../../utils/formatters";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const card = {
  background: colors.user.card,
  border: `1px solid ${colors.user.border}`,
  borderRadius: 16,
  overflow: "hidden",
  cursor: "pointer",
  transition: "transform 0.15s ease",
};

const HERO_SLIDES = [
  {
    title: "Explore Your Interest",
    subtitle: "Courses, webinars and 1:1 experts — all in one place",
    cta: "Browse Courses",
    to: "/app/explore",
    gradient: colors.gradients.heroNavy,
  },
  {
    title: "Learn Live from Experts",
    subtitle: "Book a 1:1 video session with a top expert today",
    cta: "Find an Expert",
    to: "/app/sessions",
    gradient: colors.gradients.heroDusk,
  },
  {
    title: "Continue Your Journey",
    subtitle: "Pick up right where you left off",
    cta: "Resume Learning",
    to: "/app/learning",
    gradient: colors.gradients.indigo,
  },
];

export default function UserHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [experts, setExperts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExperts = () =>
    apiFetch("/sessions/experts?page=1&limit=5")
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
        setWebinars(list.filter((w) => !w.is_enrolled).slice(0, 5));
      }),
    ]).finally(() => setLoading(false));

    const t = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 4000);
    const off = onSocket("expert_availability_updated", loadExperts);
    return () => {
      clearInterval(t);
      off();
    };
  }, []);

  const Section = ({ title, onSeeAll, children }) => (
    <section style={{ marginTop: 34 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>{title}</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} style={{ background: "transparent", border: "none", color: colors.user.accentSoft, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
            See All <ChevronRight size={15} />
          </button>
        )}
      </div>
      {children}
    </section>
  );

  if (loading) return <FullLoader label="Loading your home..." />;

  const hero = HERO_SLIDES[slide];

  return (
    <div>
      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <Avatar src={user?.profile_image} name={user?.name || "U"} size={52} />
        <div>
          <div style={{ fontSize: 21, fontWeight: 800 }}>Hello {String(user?.name || "there").split(" ")[0]},</div>
          <div style={{ color: colors.user.subHeading, fontSize: 14 }}>{greeting()} 👋</div>
        </div>
      </div>

      {/* Hero carousel */}
      <div
        onClick={() => navigate(hero.to)}
        style={{ background: hero.gradient, borderRadius: 20, padding: "34px 34px", cursor: "pointer", position: "relative", overflow: "hidden", minHeight: 150, transition: "background 0.6s ease" }}
      >
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, maxWidth: 520 }}>{hero.title}</h2>
        <p style={{ margin: "8px 0 18px", opacity: 0.85, fontSize: 15, maxWidth: 480 }}>{hero.subtitle}</p>
        <GradientButton gradient="rgba(255,255,255,0.16)" style={{ border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(4px)" }}>
          {hero.cta} →
        </GradientButton>
        <div style={{ position: "absolute", bottom: 14, right: 20, display: "flex", gap: 6 }}>
          {HERO_SLIDES.map((_, i) => (
            <span key={i} onClick={(e) => { e.stopPropagation(); setSlide(i); }} style={{ width: i === slide ? 22 : 8, height: 8, borderRadius: 99, background: i === slide ? "#fff" : "rgba(255,255,255,0.4)", transition: "width 0.25s ease", cursor: "pointer" }} />
          ))}
        </div>
      </div>

      {/* Top experts */}
      {experts.length > 0 && (
        <Section title="Top Experts" onSeeAll={() => navigate("/app/sessions")}>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6 }}>
            {experts.map((e) => (
              <div
                key={e.id}
                onClick={() => navigate(`/app/experts/${e.id}`, { state: { expert: e } })}
                style={{ ...card, minWidth: 150, padding: 16, textAlign: "center" }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <Avatar src={e.user?.profile_image || e.profile_image} name={e.user?.name || e.name || "E"} size={62} online={!!e.is_available} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{e.user?.name || e.name}</div>
                <div style={{ color: colors.user.subHeading, fontSize: 12, marginTop: 3 }}>{e.profession || e.category}</div>
                <div style={{ color: colors.user.accentSoft, fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>₹{e.video_rate || 0}/min</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Latest courses */}
      <Section title="Latest Courses" onSeeAll={() => navigate("/app/explore")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {courses.slice(0, 8).map((c) => (
            <div key={c.id} style={card} onClick={() => navigate(`/app/course/${c.id}`)}>
              <div style={{ height: 130, background: c.thumbnail ? `url(${c.thumbnail}) center/cover` : colors.gradients.heroNavy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {!c.thumbnail && <BookOpen size={34} color="rgba(255,255,255,0.6)" />}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 14.5, lineHeight: 1.35, minHeight: 38 }}>{c.title}</div>
                <div style={{ color: colors.user.subHeading, fontSize: 12.5, marginTop: 6 }}>by {c.creator?.name || "Creator"}</div>
                <div style={{ marginTop: 10, fontWeight: 800, color: colors.user.accentSoft, fontSize: 15 }}>
                  {Number(c.price) > 0 ? formatCurrency(c.price) : "Free"}
                </div>
              </div>
            </div>
          ))}
        </div>
        {courses.length === 0 && <div style={{ color: colors.user.subHeading }}>No courses yet — check back soon.</div>}
      </Section>

      {/* Latest webinars */}
      <Section title="Upcoming Webinars" onSeeAll={() => navigate("/app/explore?tab=webinars")}>
        {webinars.length === 0 ? (
          <div style={{ ...card, cursor: "default", padding: 26, textAlign: "center", background: colors.gradients.heroDusk }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>📡</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Webinars Coming Soon!</div>
            <div style={{ opacity: 0.75, fontSize: 13.5, marginTop: 4 }}>Live sessions from creators will appear here.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {webinars.map((w) => (
              <div key={w.id} style={card} onClick={() => navigate(`/app/webinar/${w.id}`)}>
                <div style={{ height: 120, background: w.thumbnail ? `url(${w.thumbnail}) center/cover` : colors.gradients.purple, position: "relative" }}>
                  <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.55)", padding: "4px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                    <Radio size={12} color="#F87171" /> {w.scheduled_at ? new Date(w.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Live"}
                  </span>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5 }}>{w.title}</div>
                  <div style={{ color: colors.user.subHeading, fontSize: 12.5, marginTop: 5 }}>Hosted by {w.creator?.name || "Creator"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
