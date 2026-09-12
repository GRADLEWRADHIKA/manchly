import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Copy, Radio, BookOpen, Video, Phone, Clock } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import {
  FullLoader,
  EmptyState,
  ProgressBar,
  GradientButton,
  Badge,
  CircularProgress
} from "../../components/ui";
import { toast } from "../../utils/toast";
import { formatCurrency } from "../../utils/formatters";

const STATUS_COLORS = {
  COMPLETED: "#22C55E",
  ACTIVE: "#3B82F6",
  PENDING: "#F59E0B",
  MISSED: "#EF4444",
};

export default function Learning() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [courses, setCourses] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});
  const [streak, setStreak] = useState({ current_streak: 0, week: [] });

  const overviewStats = useMemo(() => {
    const totalCourses = courses.length;
    const totalWebinars = webinars.length;
    const totalSessions = sessions.length;

    const progressValues = courses.map((en) => Number(en.progress) || 0);
    const overallProgress = progressValues.length
      ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
      : 0;

    // Estimate: video duration (seconds) × how far into the course they are
    const hoursWatchedSeconds = courses.reduce((sum, en) => {
      const c = en.course || en;
      const progress = Number(en.progress) || 0;
      const totalDuration = (c.videos || []).reduce((s, v) => s + (v.duration || 0), 0);
      return sum + totalDuration * (progress / 100);
    }, 0);

    const continueCourse = courses
      .filter((en) => {
        const p = Number(en.progress) || 0;
        return p > 0 && p < 100;
      })
      .sort((a, b) => new Date(b.last_watched_at || 0) - new Date(a.last_watched_at || 0))[0];

    return { totalCourses, totalWebinars, totalSessions, overallProgress, hoursWatchedSeconds, continueCourse };
  }, [courses, webinars, sessions]);

  function formatDuration(totalSeconds) {
    const totalMinutes = Math.round(totalSeconds / 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h === 0 ? `${m}m` : `${h}h ${m}m`;
  }

  function StatCard({ icon, label, value }) {
    return (
      <div
        style={{
          background: colors.user.card,
          border: `1px solid ${colors.user.border}`,
          borderRadius: 14,
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: colors.user.cardSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.user.icon,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: colors.user.text }}>{value}</div>
          <div style={{ fontSize: 12, color: colors.user.subHeading }}>{label}</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      apiFetch("/courses/enrolled/me?page=1&limit=100").then((r) => {
        const d = unwrap(r);
        return d?.enrollments || d?.courses || (Array.isArray(d) ? d : []);
      }),
      apiFetch("/webinars/enrolled/me?page=1&limit=50&upcoming=true").then(
        (r) => {
          const d = unwrap(r);
          return d?.webinars || d?.enrollments || (Array.isArray(d) ? d : []);
        },
      ),
      apiFetch("/sessions?role=caller&page=1&limit=50").then((r) => {
        const d = unwrap(r);
        return d?.sessions || (Array.isArray(d) ? d : []);
      }),
      apiFetch("/activity/streak/me").then((r) => unwrap(r)), 
    ]).then(([coursesRes, webinarsRes, sessionsRes, streakRes]) => {
      if (!isMounted) return;
      if (coursesRes.status === "fulfilled") setCourses(coursesRes.value);
      if (webinarsRes.status === "fulfilled") setWebinars(webinarsRes.value);
      if (sessionsRes.status === "fulfilled") setSessions(sessionsRes.value);
       if (streakRes.status === "fulfilled") setStreak(streakRes.value);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const isToday = (dt) => {
    if (!dt) return false;
    const date = new Date(dt);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const toggleReveal = (id) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCredentials = (meetingId, password) => {
    navigator.clipboard.writeText(
      `Meeting ID: ${meetingId}\nPassword: ${password}`,
    );
    toast.success("Zoom credentials copied");
  };

  if (loading) return <FullLoader label="Loading your library..." />;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: colors.user.bg,
        color: colors.user.text,
      }}
    >
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <h1
          style={{
            margin: "0 0 18px",
            fontSize: 26,
            fontWeight: 900,
            color: colors.user.text,
          }}
        >
          My Purchases
        </h1>

        {/* Tab Selection */}
        <div
          role="tablist"
          style={{
            display: "inline-flex",
            background: colors.user.card,
            borderRadius: 999,
            padding: 4,
            marginBottom: 24,
            border: `1px solid ${colors.user.border}`,
          }}
        >
          {[
            { id: "overview", label: "Overview" },
            { id: "courses", label: "Courses", count: courses.length },
            { id: "webinars", label: "Webinars", count: webinars.length },
            { id: "sessions", label: "Sessions", count: sessions.length },
          ].map(({ id, label, count }) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(id)}
                style={{
                  padding: "12px 36px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 800,
                  background: isActive
                    ? colors.gradients.heroWarm
                    : "transparent",
                  color: isActive ? "#FFFFFF" : colors.user.subHeading,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                }}
              >
                {label}
                {count !== undefined && (
                  <span
                    style={{
                      background: isActive
                        ? "rgba(255,255,255,0.25)"
                        : colors.user.cardSoft,
                      borderRadius: 99,
                      padding: "1px 8px",
                      fontSize: 11.5,
                      color: isActive ? "#FFFFFF" : colors.user.text,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: colors.user.card,
                border: `1px solid ${colors.user.border}`,
                borderRadius: 16,
                padding: 20,
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <CircularProgress percent={overviewStats.overallProgress} size={92} strokeWidth={10}>
                <div style={{ fontSize: 22, fontWeight: 900, color: colors.user.text }}>
                  {overviewStats.overallProgress}%
                </div>
              </CircularProgress>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: colors.user.text }}>Overall Progress</div>
                <div style={{ fontSize: 13, color: colors.user.subHeading, marginTop: 4 }}>You're on track!</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <StatCard icon={<BookOpen size={20} />} label="Total Courses" value={overviewStats.totalCourses} />
              <StatCard icon={<Video size={20} />} label="Total Webinars" value={overviewStats.totalWebinars} />
              <StatCard icon={<Phone size={20} />} label="1:1 Sessions" value={overviewStats.totalSessions} />
              <StatCard icon={<Clock size={20} />} label="Hours Watched" value={formatDuration(overviewStats.hoursWatchedSeconds)} />
            </div>

            {overviewStats.continueCourse && (() => {
              const en = overviewStats.continueCourse;
              const c = en.course || en;
              const progress = Number(en.progress) || 0;
              const lessons = c.videos?.length ?? c.total_videos ?? 0;
              return (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: colors.user.text }}>Continue Learning</h3>
                    <button
                      onClick={() => setTab("courses")}
                      style={{ background: "transparent", border: "none", color: colors.brand.actionBlue, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      See All
                    </button>
                  </div>
                  <div
                    onClick={() => navigate(`/app/player/${c.id}`)}
                    style={{
                      background: colors.user.card,
                      border: `1px solid ${colors.user.border}`,
                      borderRadius: 16,
                      overflow: "hidden",
                      cursor: "pointer",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        width: 140,
                        aspectRatio: "16 / 9",
                        background: c.thumbnail_url || c.thumbnail
                          ? `url(${c.thumbnail_url || c.thumbnail}) center/cover`
                          : colors.gradients.heroWarm,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ padding: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14.5, color: colors.user.text }}>{c.title}</div>
                      <div style={{ color: colors.user.subHeading, fontSize: 12.5, margin: "6px 0 10px" }}>
                        {lessons} lessons · {progress}% complete
                      </div>
                      <ProgressBar percent={progress} />
                      <div style={{ marginTop: 12 }}>
                        <GradientButton size="sm" gradient={colors.gradients.greenButtonDark}>Continue</GradientButton>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {streak.week.length > 0 && (
  <div
    style={{
      background: colors.user.card,
      border: `1px solid ${colors.user.border}`,
      borderRadius: 16,
      padding: 18,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 16,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 22 }}>🔥</span>
      <div>
        <div style={{ fontSize: 16, fontWeight: 900, color: colors.user.text }}>
          Learning Streak
        </div>
        <div style={{ fontSize: 13, color: colors.user.subHeading }}>
          {streak.current_streak} {streak.current_streak === 1 ? "Day" : "Days"}
        </div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      {streak.week.map((day) => (
        <div key={day.date} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: colors.user.subHeading, marginBottom: 4 }}>
            {day.label}
          </div>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: day.active
                ? colors.gradients.greenButtonDark
                : colors.user.cardSoft,
              color: day.active ? "#fff" : colors.user.subHeading,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {day.active ? "✓" : ""}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        {/* Tab Content Routing */}
        {tab === "courses" &&
          (courses.length === 0 ? (
            <EmptyState
              icon="🎓"
              title="No courses yet"
              subtitle="Courses you enroll in will appear here."
              action={
                <GradientButton onClick={() => navigate("/app/explore")}>
                  Browse Courses
                </GradientButton>
              }
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {courses.map((en) => {
                const c = en.course || en;
                const progress = Number(en.progress) || 0;
                const lessons = c.videos?.length ?? c.total_videos ?? 0;
                return (
                  <div
                    key={en.id || c.id}
                    onClick={() => navigate(`/app/player/${c.id}`)}
                    style={{
                      background: colors.user.card,
                      border: `1px solid ${colors.user.border}`,
                      borderRadius: 16,
                      overflow: "hidden",
                      cursor: "pointer",
                      display: "flex",
                      transition:
                        "transform 0.15s ease, border-color 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 160,
                        aspectRatio: "16 / 9",
                        background:
                          c.thumbnail_url || c.thumbnail
                            ? `url(${c.thumbnail_url || c.thumbnail}) center/cover`
                            : colors.gradients.heroWarm,
                        flexShrink: 0,
                        alignSelf: "stretch",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {!(c.thumbnail_url || c.thumbnail) && (
                        <BookOpen size={24} color="rgba(255,255,255,0.75)" />
                      )}
                    </div>
                    <div style={{ padding: 14, flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 14.5,
                          lineHeight: 1.35,
                          color: colors.user.text,
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{
                          color: colors.user.subHeading,
                          fontSize: 12.5,
                          margin: "6px 0 10px",
                        }}
                      >
                        {progress >= 100
                          ? "✅ Completed"
                          : `${lessons} Videos · ${progress}% complete`}
                      </div>
                      <ProgressBar percent={progress} />
                      <div style={{ marginTop: 12 }}>
                        <GradientButton
                          size="sm"
                          gradient={colors.gradients.greenButtonDark}
                        >
                          {progress >= 100 ? "Review Course" : "Resume Lesson"}
                        </GradientButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

        {tab === "webinars" &&
          (webinars.length === 0 ? (
            <EmptyState
              icon="📡"
              title="No webinars booked"
              subtitle="Webinars you register for will appear here."
              action={
                <GradientButton
                  onClick={() => navigate("/app/explore?tab=webinars")}
                  style={{
                    background:
                      "linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%)",
                    color: "#065F46",
                  }}
                >
                  Browse Webinars
                </GradientButton>
              }
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 16,
              }}
            >
              {webinars.map((en) => {
                const w = en.webinar || en;
                const past =
                  w.scheduled_at &&
                  new Date(w.scheduled_at).getTime() +
                    (Number(w.duration) || 60) * 60000 <
                    Date.now();
                const shown = revealed[w.id];
                return (
                  <div
                    key={en.id || w.id}
                    style={{
                      background: colors.user.card,
                      border: `1px solid ${colors.user.border}`,
                      borderRadius: 16,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "flex-start",
                      transition:
                        "transform 0.15s ease, border-color 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 160,
                        aspectRatio: "16 / 9",
                        background:
                          w.thumbnail_url || w.thumbnail
                            ? `url(${w.thumbnail_url || w.thumbnail}) center/cover`
                            : colors.gradients.heroWarm,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      {!(w.thumbnail_url || w.thumbnail) && (
                        <Video size={28} color="rgba(255,255,255,0.75)" />
                      )}
                      {isToday(w.scheduled_at) && (
                        <span
                          style={{ position: "absolute", top: 10, left: 10 }}
                        >
                          <Badge color="#F87171" bg="rgba(0,0,0,0.55)">
                            <Radio size={10} style={{ marginRight: 4 }} />
                            Today
                          </Badge>
                        </span>
                      )}
                      <span
                        style={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          background: "rgba(0,0,0,0.65)",
                          color: "#FFFFFF",
                          borderRadius: 99,
                          padding: "3px 10px",
                          fontSize: 11.5,
                          fontWeight: 700,
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {w.duration || 60} min
                      </span>
                    </div>
                    <div style={{ padding: 16, flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 15,
                          color: colors.user.text,
                        }}
                      >
                        {w.title}
                      </div>
                      <div
                        style={{
                          color: colors.user.subHeading,
                          fontSize: 12.5,
                          marginTop: 5,
                        }}
                      >
                        {w.scheduled_at
                          ? isToday(w.scheduled_at)
                            ? `Today, ${new Date(w.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                            : new Date(w.scheduled_at).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                          : ""}
                        {" · "}
                        {w.creator?.name || "Host"}
                      </div>

                      {(w.zoom_meeting_id || w.zoom_password) && (
                        <div
                          style={{
                            background: "rgba(79,96,250,0.1)",
                            border: "1px solid rgba(79,96,250,0.3)",
                            borderRadius: 10,
                            padding: 12,
                            marginTop: 12,
                            fontSize: 13,
                            color: colors.user.text,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span>
                              ID:{" "}
                              <b>{shown ? w.zoom_meeting_id : "••••••••"}</b> ·
                              Pass: <b>{shown ? w.zoom_password : "••••"}</b>
                            </span>
                            <span style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => toggleReveal(w.id)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: colors.user.text,
                                  cursor: "pointer",
                                  padding: 2,
                                }}
                              >
                                {shown ? (
                                  <EyeOff size={15} />
                                ) : (
                                  <Eye size={15} />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleCopyCredentials(
                                    w.zoom_meeting_id,
                                    w.zoom_password,
                                  )
                                }
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: colors.user.text,
                                  cursor: "pointer",
                                  padding: 2,
                                }}
                              >
                                <Copy size={15} />
                              </button>
                            </span>
                          </div>
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 14,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            color: colors.user.subHeading,
                          }}
                        >
                          Paid {formatCurrency(w.price || 0)}
                        </span>
                        <GradientButton
                          size="sm"
                          disabled={past}
                          gradient={
                            past ? undefined : colors.gradients.greenButtonDark
                          }
                          onClick={() =>
                            w.zoom_join_url
                              ? window.open(w.zoom_join_url, "_blank")
                              : toast.info("Join link not available yet")
                          }
                        >
                          {past ? "Ended" : "Join Webinar"}
                        </GradientButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

        {tab === "sessions" &&
          (sessions.length === 0 ? (
            <EmptyState
              icon="📞"
              title="No sessions booked"
              subtitle="1:1 expert sessions you book will appear here."
              action={
                <GradientButton onClick={() => navigate("/app/sessions")}>
                  Find an Expert
                </GradientButton>
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sessions.map((s) => {
                const other = s.receiver || s.expert || {};
                const status = String(s.status || "").toUpperCase();
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: colors.user.card,
                      border: `1px solid ${colors.user.border}`,
                      borderRadius: 14,
                      padding: "14px 18px",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: other.profile_image
                          ? `url(${other.profile_image}) center/cover`
                          : colors.gradients.heroWarm,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {!other.profile_image && (
                        <Phone size={18} color="rgba(255,255,255,0.85)" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 14.5,
                          color: colors.user.text,
                        }}
                      >
                        {other.name || "Expert"}
                      </div>
                      <div
                        style={{
                          color: colors.user.subHeading,
                          fontSize: 12.5,
                          marginTop: 2,
                        }}
                      >
                        Video call ·{" "}
                        {s.scheduled_at
                          ? new Date(s.scheduled_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {s.duration > 0 && (
                        <Badge
                          color={colors.user.accent}
                          bg="rgba(189,194,255,0.1)"
                        >
                          {s.duration} min
                        </Badge>
                      )}
                      {s.amount > 0 && (
                        <Badge color="#F0C040" bg="rgba(240,192,64,0.1)">
                          {formatCurrency(s.amount)}
                        </Badge>
                      )}
                      <Badge color={STATUS_COLORS[status] || "#9CA3AF"}>
                        {status || "—"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
      </main>
    </div>
  );
}