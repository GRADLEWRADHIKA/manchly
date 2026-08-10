import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Copy, Radio } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { FullLoader, EmptyState, ProgressBar, GradientButton, Badge } from "../../components/ui";
import { toast } from "../../utils/toast";
import { formatCurrency } from "../../utils/formatters";
import UserSidebar from "./UserSidebar";

export default function Learning() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("courses");
  const [courses, setCourses] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/courses/enrolled/me?page=1&limit=100").then((r) => {
        const d = unwrap(r);
        setCourses(d?.enrollments || d?.courses || (Array.isArray(d) ? d : []));
      }),
      apiFetch("/webinars/enrolled/me?page=1&limit=50&upcoming=true").then((r) => {
        const d = unwrap(r);
        setWebinars(d?.webinars || d?.enrollments || (Array.isArray(d) ? d : []));
      }),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullLoader label="Loading your library..." />;

  const isToday = (dt) => dt && new Date(dt).toDateString() === new Date().toDateString();

  const tabBtn = (t, label, count) => (
    <button
      onClick={() => setTab(t)}
      style={{
        padding: "12px 36px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 16, fontWeight: 800,
        background: tab === t ? colors.gradients.indigo : "transparent",
        color: tab === t ? "#fff" : colors.user.subHeading,
        display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s ease",
      }}
    >
      {label}
      <span style={{ background: tab === t ? "rgba(255,255,255,0.25)" : colors.user.cardSoft, borderRadius: 99, padding: "1px 8px", fontSize: 11.5 }}>{count}</span>
    </button>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.user.bg, color: colors.user.text }}>
      

      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <h1 style={{ margin: "0 0 18px", fontSize: 26, fontWeight: 900 }}>My Purchases</h1>
        <div style={{ display: "inline-flex", background: colors.user.card, borderRadius: 999, padding: 4, marginBottom: 24, border: `1px solid ${colors.user.border}` }}>
          {tabBtn("courses", "Courses", courses.length)}
          {tabBtn("webinars", "Webinars", webinars.length)}
        </div>

        {tab === "courses" ? (
          courses.length === 0 ? (
            <EmptyState icon="🎓" title="No courses yet" subtitle="Courses you enroll in will appear here." action={<GradientButton onClick={() => navigate("/app/explore")}>Browse Courses</GradientButton>} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {courses.map((en) => {
                const c = en.course || en;
                const progress = Number(en.progress) || 0;
                const lessons = c.videos?.length ?? c.total_videos ?? 0;
                return (
                  <div
                    key={en.id || c.id}
                    onClick={() => navigate(`/app/player/${c.id}`)}
                    style={{ background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", display: "flex" }}
                  >
                    <div style={{ width: 120, background: c.thumbnail ? `url(${c.thumbnail}) center/cover` : colors.gradients.heroNavy, flexShrink: 0 }} />
                    <div style={{ padding: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14.5, lineHeight: 1.35 }}>{c.title}</div>
                      <div style={{ color: colors.user.subHeading, fontSize: 12.5, margin: "6px 0 10px" }}>
                        {progress >= 100 ? "✅ Completed" : `${lessons} lessons · ${progress}% complete`}
                      </div>
                      <ProgressBar percent={progress} />
                      <div style={{ marginTop: 12 }}>
                        <GradientButton size="sm" gradient={progress >= 100 ? colors.gradients.teal : colors.gradients.indigo}>
                          {progress >= 100 ? "Review Course" : "Resume Lesson"}
                        </GradientButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : webinars.length === 0 ? (
          <EmptyState icon="📡" title="No webinars booked" subtitle="Webinars you register for will appear here." action={<GradientButton onClick={() => navigate("/app/explore?tab=webinars")}>Browse Webinars</GradientButton>} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {webinars.map((en) => {
              const w = en.webinar || en;
              const past = w.scheduled_at && new Date(w.scheduled_at).getTime() + (Number(w.duration) || 60) * 60000 < Date.now();
              const shown = revealed[w.id];
              return (
                <div key={en.id || w.id} style={{ background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ height: 110, background: w.thumbnail ? `url(${w.thumbnail}) center/cover` : colors.gradients.purple, position: "relative" }}>
                    {isToday(w.scheduled_at) && (
                      <span style={{ position: "absolute", top: 10, left: 10 }}>
                        <Badge color="#F87171" bg="rgba(0,0,0,0.55)"><Radio size={10} style={{ marginRight: 4 }} />Today</Badge>
                      </span>
                    )}
                    <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.6)", borderRadius: 99, padding: "3px 10px", fontSize: 11.5, fontWeight: 700 }}>{w.duration || 60} min</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{w.title}</div>
                    <div style={{ color: colors.user.subHeading, fontSize: 12.5, marginTop: 5 }}>
                      {w.scheduled_at
                        ? isToday(w.scheduled_at)
                          ? `Today, ${new Date(w.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                          : new Date(w.scheduled_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : ""}
                      {" · "}{w.creator?.name || "Host"}
                    </div>

                    {(w.zoom_meeting_id || w.zoom_password) && (
                      <div style={{ background: "rgba(79,96,250,0.1)", border: "1px solid rgba(79,96,250,0.3)", borderRadius: 10, padding: 12, marginTop: 12, fontSize: 13 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>ID: <b>{shown ? w.zoom_meeting_id : "••••••••"}</b> · Pass: <b>{shown ? w.zoom_password : "••••"}</b></span>
                          <span style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => setRevealed((r) => ({ ...r, [w.id]: !r[w.id] }))} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: 2 }}>
                              {shown ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                            <button
                              onClick={() => { navigator.clipboard.writeText(`Meeting ID: ${w.zoom_meeting_id}\nPassword: ${w.zoom_password}`); toast.success("Zoom credentials copied"); }}
                              style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: 2 }}
                            >
                              <Copy size={15} />
                            </button>
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                      <span style={{ fontSize: 13, color: colors.user.subHeading }}>Paid {formatCurrency(w.price || 0)}</span>
                      <GradientButton
                        size="sm"
                        disabled={past}
                        gradient={past ? undefined : colors.gradients.teal}
                        onClick={() => (w.zoom_join_url ? window.open(w.zoom_join_url, "_blank") : toast.info("Join link not available yet"))}
                      >
                        {past ? "Ended" : "Join Webinar"}
                      </GradientButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}