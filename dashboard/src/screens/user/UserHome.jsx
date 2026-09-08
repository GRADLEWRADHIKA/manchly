import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Video,
  UsersRound,
  TrendingUp,
  GraduationCap,
  BarChart2,
  Code,
  Megaphone
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
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

function sessionIcon(title = "") {
 const t = title.toLowerCase();
  if (/resume|career|interview/.test(t)) return { Icon: BarChart2, bg: "#DCFCE7", color: "#16A34A" };
  if (/website|tech|code|developer|app/.test(t)) return { Icon: Code, bg: "#DBEAFE", color: "#3B82F6" };
  if (/marketing|brand|growth|social/.test(t)) return { Icon: Megaphone, bg: "#FCE7F3", color: "#DB2777" };
  return { Icon: UsersRound, bg: "#F3E8FF", color: "#A855F7" };
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
      style={{ marginTop: 32, animationDelay: `${delay}ms` }}
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

function CourseCard({ course }) {
  const navigate = useNavigate();

  const lessons = course?.videos?.length ?? course?.total_videos ?? 0;
  const duration =
    Array.isArray(course?.videos) && course.videos.length
      ? Math.round(
          course.videos.reduce((s, v) => s + (Number(v.duration) || 0), 0) / 60,
        )
      : 0;
  const priceDisplay =
    Number(course?.price) > 0 ? formatCurrency(course.price) : "Free";

  return (
    <div
      onClick={() => navigate(`/app/course/${course.id}`)}
      style={{
        width: "100%",
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.04)";
      }}
    >
      {/* Thumbnail Banner */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 10",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#F8FAFC",
        }}
      >
        {course?.thumbnail_url || course?.thumbnail ? (
          <img
            src={course.thumbnail_url || course.thumbnail}
            alt={course.title}
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
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={48} color="rgba(255, 255, 255, 0.6)" />
          </div>
        )}
      </div>

      {/* Card Body */}
      <div
        style={{
          padding: "16px 18px 20px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Course Title */}
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 800,
            color: "#0F172A",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 42,
          }}
        >
          {course?.title || "Course Title"}
        </h3>

        {/* Creator Name */}
        <div
          onClick={(e) => {
            if (course?.creator?.handle) {
              e.stopPropagation();
              navigate(`/app/creator/${course.creator.handle}`);
            }
          }}
          onMouseEnter={(e) => {
            if (course?.creator?.handle)
              e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
          }}
          style={{
            display: "inline-block",
            fontSize: 14,
            fontWeight: 700,
            marginTop: 10,
            cursor: course?.creator?.handle ? "pointer" : "default",
            background: "linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          by {course?.creator?.name || "T"}
        </div>

        {/* Level and Videos */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 10,
            marginBottom: 18,
          }}
        >
          {course?.level && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#1E293B",
              }}
            >
              {course.level}
            </span>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 13.5,
              color: "#94A3B8",
            }}
          >
            <BookOpen size={15} color="#94A3B8" />
            <span>{lessons} Videos</span>

            {duration > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 13.5,
                  color: "#94A3B8",
                }}
              >
                <Clock size={15} color="#94A3B8" />
                <span>{duration} min</span>
              </div>
            )}
          </div>
        </div>

        {/* Green Price Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/app/course/${course.id}`);
          }}
          style={{
            marginTop: "auto",
            width: "100%",
            padding: "12px 0",
            borderRadius: 14,
            border: "none",
            background: "#22C55E",
            color: "#FFFFFF",
            fontSize: 17,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 12px rgba(34, 197, 94, 0.25)",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#16A34A")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#22C55E")}
        >
          {priceDisplay}
        </button>
      </div>
    </div>
  );
}

export default function UserHome() {
  const navigate = useNavigate();

  const [experts, setExperts] = useState([]);
  const [sessionProducts, setSessionProducts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/sessions/products/popular?limit=6").then((r) => {
        const d = unwrap(r);
        setSessionProducts(d?.products || (Array.isArray(d) ? d : []));
      }),

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
      {/* Hero Banner */}
      <div
        className="uh-fade"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          background:
            "linear-gradient(135deg, #F0FAF4 0%, #E6FAF0 40%, #E2F9EE 100%)",
          borderRadius: 20,
          padding: "20px 32px",
          overflow: "hidden",
          border: "1px solid rgba(226, 232, 240, 0.6)",
        }}
      >
        {/* Left Section */}
        <div style={{ flex: "1 1 300px", maxWidth: 400, zIndex: 2 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 99,
              background: "#DCFCE7",
              color: "#166534",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            Explore & Learn
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#0F172A",
              letterSpacing: "-0.02em",
            }}
          >
            Learn from real creators.
          </h1>

          <p
            style={{
              margin: "8px 0 18px",
              fontSize: 14,
              lineHeight: 1.4,
              color: "#64748B",
            }}
          >
            Discover courses, live webinars and 1:1 sessions to build new skills
            and grow at your own pace.
          </p>
        </div>

        {/* Feature Cards */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 2,
            margin: "0 8px",
          }}
        >
          {/* Courses */}
          <div
            onClick={() => navigate("/app/explore/courses")}
            style={{
              width: 125,
              padding: "14px 12px",
              borderRadius: 16,
              background: "#FFFFFF",
              boxShadow: "0 8px 20px -4px rgba(0,0,0,0.03)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow =
                "0 12px 24px -4px rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px -4px rgba(0,0,0,0.03)";
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <BookOpen size={18} color="#10B981" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>
              Courses
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#94A3B8",
                marginTop: 2,
                lineHeight: 1.2,
              }}
            >
              Learn at your pace
            </div>
          </div>

          {/* Webinars */}
          <div
            onClick={() => navigate("/app/explore/webinars")}
            style={{
              width: 125,
              padding: "14px 12px",
              borderRadius: 16,
              background: "#FFFFFF",
              boxShadow: "0 8px 20px -4px rgba(0,0,0,0.03)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow =
                "0 12px 24px -4px rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px -4px rgba(0,0,0,0.03)";
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#DBEAFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Video size={18} color="#3B82F6" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>
              Webinars
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#94A3B8",
                marginTop: 2,
                lineHeight: 1.2,
              }}
            >
              Learn live with experts
            </div>
          </div>

          {/* 1:1 Sessions */}
          <div
            onClick={() => navigate("/app/sessions")}
            style={{
              width: 125,
              padding: "14px 12px",
              borderRadius: 16,
              background: "#FFFFFF",
              boxShadow: "0 8px 20px -4px rgba(0,0,0,0.03)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow =
                "0 12px 24px -4px rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px -4px rgba(0,0,0,0.03)";
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#F3E8FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <UsersRound size={18} color="#A855F7" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>
              1:1 Sessions
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#94A3B8",
                marginTop: 2,
                lineHeight: 1.2,
              }}
            >
              Get personalized mentorship
            </div>
          </div>
        </div>

        {/* Hero Illustration */}
        <div
          style={{
            position: "relative",
            width: 180,
            height: 160,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: 170,
              height: 130,
              borderRadius: "50% 50% 0 0",
              background:
                "radial-gradient(circle, rgba(167, 243, 208, 0.7) 0%, rgba(209, 250, 229, 0) 70%)",
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 10,
              right: -5,
              width: 50,
              height: 50,
              backgroundImage: "radial-gradient(#A7F3D0 2px, transparent 2px)",
              backgroundSize: "8px 8px",
              opacity: 0.8,
              zIndex: 0,
            }}
          />

          <img
            src={boy}
            alt="Creator"
            style={{
              height: "110%",
              width: "auto",
              objectFit: "contain",
              zIndex: 1,
              marginBottom: -20,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: -10,
              top: 36,
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "#FFFFFF",
              boxShadow: "0 6px 14px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <TrendingUp size={16} color="#10B981" />
          </div>

          <div
            style={{
              position: "absolute",
              right: -10,
              top: 42,
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#FFFFFF",
              boxShadow: "0 6px 14px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <GraduationCap size={18} color="#10B981" />
          </div>
        </div>
      </div>

      {/* 1. Popular Courses Section */}
      <Section
        title="Popular Courses"
        subtitle="Most loved by learners on Manchly."
        onSeeAll={() => navigate("/app/explore/courses")}
        delay={60}
      >
        {loading ? (
          <Skeleton height={260} />
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
              gap: 20,
            }}
          >
            {courses.slice(0, 8).map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </Section>

      {/* 2. Upcoming Webinars Section */}
      <Section
        title="Upcoming Webinars"
        subtitle="Join live and learn directly from creators."
        onSeeAll={() => navigate("/app/explore/webinars")}
        delay={120}
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
            <div style={{ fontSize: 30, marginBottom: 8 }}>📡</div>
            <div style={{ fontWeight: 800, fontSize: 16.5, color: "#FFFFFF" }}>
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
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 16,
            }}
          >
            {webinars.map((w) => {
              const formattedDate = w.scheduled_at
                ? `${new Date(w.scheduled_at).getDate()} ${new Date(
                    w.scheduled_at,
                  ).toLocaleDateString("en-IN", { month: "short" })}`
                : null;

              const formattedTime = w.scheduled_at
                ? new Date(w.scheduled_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Live Stream";

              return (
                <div
                  key={w.id}
                  className="uh-card"
                  onClick={() => navigate(`/app/webinar/${w.id}`)}
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
                      {w.thumbnail_url || w.thumbnail ? (
                        <img
                          src={w.thumbnail_url || w.thumbnail}
                          alt={w.title}
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
                          <Video size={34} color="rgba(255,255,255,0.55)" />
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: isToday(w.scheduled_at)
                          ? "rgba(220,38,38,0.85)"
                          : "rgba(8,12,37,0.7)",
                        backdropFilter: "blur(4px)",
                        padding: "3px 10px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#FFFFFF",
                      }}
                    >
                      {isToday(w.scheduled_at)
                        ? "Today"
                        : formattedDate || "Upcoming"}
                    </span>

                    <span
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        background:
                          Number(w.price) > 0
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
                      {Number(w.price) > 0 ? formatCurrency(w.price) : "Free"}
                    </span>
                  </div>

                  <div style={{ padding: 14 }}>
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
                      {w.title}
                    </div>

                    <div
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (w.creator?.handle)
                          navigate(`/app/creator/${w.creator.handle}`);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 6,
                        cursor: w.creator?.handle ? "pointer" : "default",
                        width: "fit-content",
                      }}
                    >
                      <Avatar
                        src={w.creator?.profile_image}
                        name={w.creator?.name || "Creator"}
                        size={20}
                      />
                      <span
                        style={{
                          color: colors.user.subHeading,
                          fontSize: 12.5,
                        }}
                      >
                        by {w.creator?.name || "Creator"}
                      </span>
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
                        <Clock size={12} />
                        {formattedTime}
                      </span>
                    </div>

                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        navigate(`/app/webinar/${w.id}`);
                      }}
                      style={{
                        marginTop: 12,
                        width: "100%",
                        padding: "9px 0",
                        borderRadius: 10,
                        border: `1.5px solid ${
                          colors.brand?.primaryOrange || "#F97316"
                        }`,
                        background: "transparent",
                        color: colors.brand?.primaryOrange || "#F97316",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {Number(w.price) > 0
                        ? `Register · ${formatCurrency(w.price)}`
                        : "Register Free"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

    {/* 3. Popular 1:1 Sessions Section */}
      <Section
        title="Popular 1:1 Sessions"
        subtitle="Get personalized guidance from industry experts"
        onSeeAll={() => navigate("/app/sessions")}
        delay={180}
      >
        {loading ? (
          <Skeleton height={110} count={3} />
        ) : sessionProducts.length === 0 ? (
          <div
            style={{
              color: colors.user.subHeading,
              fontSize: 14,
            }}
          >
            No 1:1 sessions available yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {sessionProducts.map((p) => {
              const { Icon, bg, color } = sessionIcon(p.title);
              const price = Number(p.price) || 0;
              const canBook = Boolean(p.expert_id);

              return (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    border: "1px solid #F1F5F9",
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)";
                  }}
                >
                  {/* Left Icon Square */}
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 14,
                      backgroundColor: "#E6F4EA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={24} color="#0D9488" />
                  </div>

                  {/* Right Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0F172A",
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {p.title || "Untitled Session"}
                    </h4>

                    {/* Duration */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 4,
                        color: "#64748B",
                        fontSize: 12.5,
                        fontWeight: 500,
                      }}
                    >
                      <Clock size={13} color="#64748B" />
                      <span>{p.duration ? `${p.duration} min` : "30 min"}</span>
                    </div>

                    {/* Price and Book Action */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 10,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 16,
                          color: "#16A34A",
                        }}
                      >
                        {price > 0 ? formatCurrency(price) : "Free"}
                      </span>

                      <button
                        onClick={() =>
                          canBook &&
                          navigate(`/app/experts/${p.expert_id}`, {
                            state: { productId: p.id },
                          })
                        }
                        disabled={!canBook}
                        style={{
                          padding: "6px 20px",
                          borderRadius: 999,
                          border: "none",
                          backgroundColor: canBook ? "#E6F4EA" : "#F1F5F9",
                          color: canBook ? "#16A34A" : "#94A3B8",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: canBook ? "pointer" : "not-allowed",
                          fontFamily: "inherit",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (canBook) e.currentTarget.style.backgroundColor = "#DCFCE7";
                        }}
                        onMouseLeave={(e) => {
                          if (canBook) e.currentTarget.style.backgroundColor = "#E6F4EA";
                        }}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* 4. Continue Learning Section */}
      {inProgress.length > 0 && (
        <Section
          title="Continue Learning"
          onSeeAll={() => navigate("/app/learning")}
          delay={240}
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
                  style={{ display: "flex" }}
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
    </div>
  );
}