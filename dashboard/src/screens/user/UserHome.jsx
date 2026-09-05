import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  Star,
  Clock,
  PlayCircle,
  Video,
  UserRound,
  UsersRound,
  Clapperboard,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { onSocket } from "../../utils/socket";
import colors from "../../utils/colors";
import { useAuth } from "../../context/AuthContext";
import { Avatar, ProgressBar } from "../../components/ui";
import { formatCurrency } from "../../utils/formatters";
import boy from "../../assets/Images/boy.png";

function isToday(date) {
  if (!date) return false;

  const d = new Date(date);
  const today = new Date();

  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

function Skeleton({ height = 180, count = 4 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(240px, 1fr))`,
        gap: 16,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="mn-shimmer"
          style={{ height, borderRadius: 16 }}
        />
      ))}
    </div>
  );
}

function Section({ title, subtitle, onSeeAll, delay = 0, children }) {
  return (
    <section
      className="uh-fade"
      style={{ marginTop: 36, animationDelay: `${delay}ms` }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 800,
              color: colors.user.text,
            }}
          >
            <span className="uh-kicker" />
            {title}
          </h2>

          {subtitle && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: colors.user.subHeading,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

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
  const navigate = useNavigate();


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
      .catch((error) => {
        console.error("Failed to load experts:", error);
        setExperts([]);
      });

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

        setEnrollments(
          d?.enrollments || d?.courses || (Array.isArray(d) ? d : []),
        );
      }),
    ]).finally(() => setLoading(false));

    const t = setInterval(
      () => setSlide((s) => (s + 1) % HERO_SLIDES.length),
      4500,
    );

    const off = onSocket("expert_availability_updated", loadExperts);

    return () => {
      clearInterval(t);
      off();
    };
  }, []);



  const inProgress = enrollments
    .map((en) => ({
      ...en,
      course: en.course || en,
      progress: Number(en.progress) || 0,
    }))
    .filter((en) => en.progress < 100)
    .slice(0, 3);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
     {/* Hero */}
<div
  className="uh-fade"
  style={{
    display: "flex",
    alignItems: "center",
    gap: 32,
    background: "linear-gradient(120deg, #EAF7EF 0%, #F3FBF5 60%, #FFFFFF 100%)",
    borderRadius: 22,
    padding: "36px 40px",
    minHeight: 220,
    flexWrap: "wrap",
  }}
>
  <div style={{ flex: 1, minWidth: 280 }}>
    <div
      style={{
        fontSize: 12.5,
        fontWeight: 800,
        letterSpacing: 1.2,
        color: colors.user.accent,
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      Learn. Grow. Do.
    </div>

    <h1
      style={{
        margin: 0,
        fontSize: 34,
        fontWeight: 900,
        lineHeight: 1.2,
        color: "#0F172A",
        maxWidth: 420,
      }}
    >
      Learn from real creators.
    </h1>

    <p
      style={{
        margin: "12px 0 24px",
        fontSize: 15,
        color: colors.user.subHeading,
        maxWidth: 380,
      }}
    >
      Practical skills, live sessions and communities to help you grow.
    </p>

    <button
      onClick={() => navigate("/app/explore/courses")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "13px 26px",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        fontSize: 14.5,
        fontWeight: 800,
        color: "#FFFFFF",
        background: colors.gradients?.greenButtonDark || "#22C55E",
        fontFamily: "inherit",
      }}
    >
      Explore All Courses <ChevronRight size={16} />
    </button>
  </div>

<div style={{ position: "relative", flexShrink: 0, width: 300, height: 260 }}>
  <img
    src={boy}
    alt="Creator"
    style={{
      width: 260,
      height: 260,
      borderRadius: 20,
      margin: "0 auto",
      display: "block",
      objectFit: "cover",
    }}
  />

    {/* Floating pills */}
    <div
      style={{
        position: "absolute",
        top: 6,
        left: -18,
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#FFFFFF",
        borderRadius: 10,
        padding: "7px 12px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        fontSize: 12,
        fontWeight: 700,
        color: "#1F2937",
      }}
    >
      <Video size={13} color="#3B82F6" /> Live Webinars
    </div>

    <div
      style={{
        position: "absolute",
        top: 58,
        left: -30,
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#FFFFFF",
        borderRadius: 10,
        padding: "7px 12px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        fontSize: 12,
        fontWeight: 700,
        color: "#1F2937",
      }}
    >
      <UsersRound size={13} color="#6366F1" /> 1:1 Sessions
    </div>

    <div
      style={{
        position: "absolute",
        bottom: 18,
        left: -22,
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#FFFFFF",
        borderRadius: 10,
        padding: "7px 12px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        fontSize: 12,
        fontWeight: 700,
        color: "#1F2937",
      }}
    >
      <UserRound size={13} color="#F97316" /> Creator Communities
    </div>

    <div
      style={{
        position: "absolute",
        top: 10,
        right: -10,
        background: "#FFFFFF",
        borderRadius: 14,
        padding: "10px 16px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 900, color: "#0F172A" }}>10K+</div>
      <div style={{ fontSize: 10, color: colors.user.subHeading, whiteSpace: "nowrap" }}>
        Learners growing with Manchly
      </div>
    </div>
  </div>
</div>

      {/* Continue learning */}
      {inProgress.length > 0 && (
        <Section
          title="Continue Learning"
          onSeeAll={() => navigate("/app/learning")}
          delay={60}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {inProgress.map((en) => {
              const c = en.course;

              return (
                <div
                  key={en.id || c.id}
                  className="uh-card"
                  onClick={() => navigate(`/app/player/${c.id}`)}
                  style={{
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: 160,
                      aspectRatio: "16 / 9",
                      flexShrink: 0,
                      position: "relative",
                      overflow: "hidden",
                      alignSelf: "stretch",
                    }}
                  >
                    <div
                      className="uh-thumb"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          c.thumbnail_url || c.thumbnail
                            ? `url(${c.thumbnail_url || c.thumbnail}) center/cover`
                            : colors.gradients.heroWarm,
                      }}
                    />

                    <BookOpen
                      size={30}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        color: "rgba(255,255,255,0.92)",
                        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      padding: "14px 16px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 14.5,
                        lineHeight: 1.35,
                        color: colors.user.text,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {c.title}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: colors.user.subHeading,
                        fontSize: 12,
                        margin: "8px 0 6px",
                      }}
                    >
                      <span>{en.progress}% complete</span>

                      <span
                        style={{
                          color: colors.user.accent,
                          fontWeight: 700,
                        }}
                      >
                        Resume →
                      </span>
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
      <Section
        title="Featured Creators"
        subtitle="Learn from the best. Real creators, real experience."
        onSeeAll={() => navigate("/app/sessions")}
        delay={120}
      >
        {loading ? (
          <Skeleton height={190} count={5} />
        ) : experts.length === 0 ? (
          <div
            style={{
              color: colors.user.subHeading,
              fontSize: 14,
            }}
          >
            Experts will appear here soon.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 14,
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            {experts.map((e) => (
              <div
                key={e.id}
                className="uh-card"
                onClick={() =>
                  navigate(`/app/experts/${e.id}`, {
                    state: { expert: e },
                  })
                }
                style={{
                  minWidth: 168,
                  padding: 18,
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 10,
                    position: "relative",
                  }}
                >
                  <Avatar
                    src={e.user?.profile_image || e.profile_image}
                    name={e.user?.name || e.name || "E"}
                    size={64}
                  />

                  {!!e.is_available && (
                    <span
                      className="uh-online-dot"
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: "calc(50% - 30px)",
                        width: 13,
                        height: 13,
                        borderRadius: "50%",
                        background: "#22C55E",
                        border: `2.5px solid ${colors.user.card}`,
                      }}
                    />
                  )}
                </div>

                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 14,
                    color: colors.user.text,
                  }}
                >
                  {e.user?.name || e.name}
                </div>

                <div
                  style={{
                    color: colors.user.subHeading,
                    fontSize: 12,
                    marginTop: 3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {e.profession || e.category}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 9,
                    fontSize: 12,
                    color: colors.user.subHeading,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Star size={11} color="#F0C040" />
                    {e.rating || "New"}
                  </span>

                  <span
                    style={{
                      color: colors.user.accent,
                      fontWeight: 800,
                    }}
                  >
                    ₹{e.video_rate || 0}/min
                  </span>
                </div>

                <button
                  onClick={(ev) => {
                    ev.stopPropagation();

                    navigate(`/app/experts/${e.id}`, {
                      state: {
                        expert: e,
                      },
                    });
                  }}
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: "8px 0",
                    borderRadius: 10,
                    border: `1px solid ${colors.user?.border || "#E2E8F0"}`,
                    background: "transparent",
                    color: colors.user.text,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Latest courses */}
      <Section
        title="Popular Courses"
        subtitle="Most loved by learners on Manchly."
        onSeeAll={() => navigate("/app/explore/courses")}
        delay={180}
      >
        {loading ? (
          <Skeleton height={230} />
        ) : courses.length === 0 ? (
          <div
            style={{
              color: colors.user.subHeading,
              fontSize: 14,
            }}
          >
            No courses yet — check back soon.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 16,
            }}
          >
            {courses.slice(0, 8).map((c) => {
              const lessons = c.videos?.length ?? c.total_videos ?? 0;

              const mins =
                Array.isArray(c.videos) && c.videos.length
                  ? Math.round(
                      c.videos.reduce(
                        (s, v) => s + (Number(v.duration) || 0),
                        0,
                      ) / 60,
                    )
                  : 0;

              return (
                <div
                  key={c.id}
                  className="uh-card"
                  onClick={() => navigate(`/app/course/${c.id}`)}
                >
                  <div
                    style={{
                      aspectRatio: "16 / 9",
                      width: "100%",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="uh-thumb"
                      style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                      }}
                    >
                      {c.thumbnail_url || c.thumbnail ? (
                        <img
                          src={c.thumbnail_url || c.thumbnail}
                          alt={c.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: colors.gradients.heroWarm,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <BookOpen size={34} color="rgba(255,255,255,0.55)" />
                        </div>
                      )}
                    </div>

                    {c.level && (
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          background: "rgba(8,12,37,0.7)",
                          backdropFilter: "blur(4px)",
                          padding: "3px 10px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#FFFFFF",
                        }}
                      >
                        {c.level}
                      </span>
                    )}

                    <span
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        background:
                          Number(c.price) > 0
                            ? "rgba(8,12,37,0.75)"
                            : "rgba(16,185,129,0.85)",
                        backdropFilter: "blur(4px)",
                        padding: "4px 12px",
                        borderRadius: 99,
                        fontSize: 12.5,
                        fontWeight: 900,
                        color: "#FFFFFF",
                      }}
                    >
                      {Number(c.price) > 0 ? formatCurrency(c.price) : "Free"}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 14.5,
                        lineHeight: 1.35,
                        minHeight: 39,
                        color: colors.user.text,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {c.title}
                    </div>

                    <div
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (c.creator?.id)
                          navigate(`/app/creator/${c.creator.id}`);
                      }}
                      style={{
                        color: colors.user.subHeading,
                        fontSize: 12.5,
                        marginTop: 6,
                        cursor: c.creator?.id ? "pointer" : "default",
                        width: "fit-content",
                      }}
                      onMouseEnter={(e) => {
                        if (c.creator?.id)
                          e.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = "none";
                      }}
                    >
                      by {c.creator?.name || "Creator"}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        marginTop: 9,
                        color: colors.user.subHeading,
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <PlayCircle size={12} />
                        {lessons} Videos
                      </span>

                      {mins > 0 && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Clock size={12} />
                          {mins} min
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();

                        navigate(`/app/course/${c.id}`);
                      }}
                      style={{
                        marginTop: 12,
                        width: "100%",
                        padding: "9px 0",
                        borderRadius: 10,
                        border: `1.5px solid ${
                          colors.user?.accent || "#22C55E"
                        }`,
                        background: "transparent",
                        color: colors.user?.accent || "#22C55E",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Upcoming webinars */}
      <Section
        title="Upcoming Webinars"
        subtitle="Join live and learn directly from creators."
        onSeeAll={() => navigate("/app/explore/webinars")}
        delay={240}
      >
        {loading ? (
          <Skeleton height={230} />
        ) : webinars.length === 0 ? (
          <div
            className="uh-card"
            style={{
              cursor: "default",
              padding: 30,
              textAlign: "center",
              background: colors.gradients.heroWarm,
              border: "none",
            }}
          >
            <div
              style={{
                fontSize: 30,
                marginBottom: 8,
              }}
            >
              📡
            </div>

            <div
              style={{
                fontWeight: 800,
                fontSize: 16.5,
                color: "#FFFFFF",
              }}
            >
              Webinars Coming Soon!
            </div>

            <div
              style={{
                opacity: 0.75,
                fontSize: 13.5,
                marginTop: 4,
                color: "#FFFFFF",
              }}
            >
              Live sessions from creators will appear here.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {webinars.map((w) => (
              <div
                key={w.id}
                className="uh-card"
                onClick={() => navigate(`/app/webinar/${w.id}`)}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: 16,
                  alignItems: "flex-start",
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 120,
                    aspectRatio: "16 / 9",
                    borderRadius: 12,
                    flexShrink: 0,
                    overflow: "hidden",
                    position: "relative",
                    background:
                      w.thumbnail_url || w.thumbnail
                        ? "transparent"
                        : colors.gradients.heroWarm,
                  }}
                >
                  {w.thumbnail_url || w.thumbnail ? (
                    <img
                      src={w.thumbnail_url || w.thumbnail}
                      alt={w.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Video size={22} color="rgba(255,255,255,0.75)" />
                    </div>
                  )}
                </div>

                {/* Date badge */}
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 12,
                    background: isToday(w.scheduled_at)
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(37,99,235,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: isToday(w.scheduled_at) ? "#DC2626" : "#2563EB",
                      lineHeight: 1.1,
                    }}
                  >
                    {w.scheduled_at ? new Date(w.scheduled_at).getDate() : "--"}
                  </span>

                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: isToday(w.scheduled_at) ? "#DC2626" : "#2563EB",
                      textTransform: "uppercase",
                    }}
                  >
                    {w.scheduled_at
                      ? new Date(w.scheduled_at).toLocaleDateString("en-IN", {
                          month: "short",
                        })
                      : ""}
                  </span>
                </div>

                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 14.5,
                      lineHeight: 1.35,
                      color: colors.user.text,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {w.title}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 6,
                      fontSize: 12,
                      color: colors.user.subHeading,
                    }}
                  >
                    <Clock size={12} />

                    {w.scheduled_at
                      ? new Date(w.scheduled_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Live Stream"}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 12,
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        minWidth: 0,
                      }}
                    >
                      <Avatar
                        src={w.creator?.profile_image}
                        name={w.creator?.name || "Creator"}
                        size={24}
                      />

                      <span
                        style={{
                          fontSize: 12.5,
                          color: colors.user.subHeading,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {w.creator?.name || "Creator"}
                      </span>
                    </div>

                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();

                        navigate(`/app/webinar/${w.id}`);
                      }}
                      style={{
                        flexShrink: 0,
                        padding: "7px 14px",
                        borderRadius: 10,
                        border: `1.5px solid ${
                          colors.brand?.primaryOrange || "#F97316"
                        }`,
                        background: "transparent",
                        color: colors.brand?.primaryOrange || "#F97316",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {Number(w.price) > 0
                        ? `Register · ${formatCurrency(w.price)}`
                        : "Register Free"}
                    </button>
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
