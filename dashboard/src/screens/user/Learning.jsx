import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Copy, Radio, BookOpen, Video, Phone } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import {
  FullLoader,
  EmptyState,
  ProgressBar,
  GradientButton,
  Badge,
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
  const [tab, setTab] = useState("courses");
  const [courses, setCourses] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});

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
    ]).then(([coursesRes, webinarsRes, sessionsRes]) => {
      if (!isMounted) return;
      if (coursesRes.status === "fulfilled") setCourses(coursesRes.value);
      if (webinarsRes.status === "fulfilled") setWebinars(webinarsRes.value);
      if (sessionsRes.status === "fulfilled") setSessions(sessionsRes.value);
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
              </button>
            );
          })}
        </div>

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
  key={en.id || c.id}
  onClick={() => navigate(`/app/player/${c.id}`)}
  style={{
    background: colors.user.card,
    border: `1px solid ${colors.user.border}`,
    borderRadius: 16,
    overflow: "hidden",
    cursor: "pointer",
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
        c.thumbnail_url || c.thumbnail
          ? `url(${c.thumbnail_url || c.thumbnail}) center/cover`
          : colors.gradients.heroWarm,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
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
                    <div style={{ padding: 16 }}>
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
