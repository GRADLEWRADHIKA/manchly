// Course details + purchase — free preview video, GST/platform-fee breakdown,
// Cashfree modal checkout → verify, real free-enroll, share link, enrolled state.
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  PlayCircle,
  Share2,
  CheckCircle2,
  Clock,
  BarChart2,
  Lock,
  ChevronRight,
} from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { runPurchase, priceBreakdown } from "../../utils/payments";
import colors from "../../utils/colors";
import { GradientButton, FullLoader, Badge } from "../../components/ui";
import { LegalModal } from "../../components/LegalModals";
import { toast } from "../../utils/toast";
import { formatCurrency } from "../../utils/formatters";
import HlsVideo from "../../components/HlsVideo";

const fmtDuration = (totalSeconds) => {
  const s = Number(totalSeconds) || 0;
  if (s <= 0) return "";
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null);

  const theme = colors.user;

  const load = async () => {
    try {
      const [c, e] = await Promise.allSettled([
        apiFetch(`/courses/${courseId}`),
        apiFetch("/courses/enrolled/me?page=1&limit=100"),
      ]);
      if (c.status === "fulfilled") {
        const d = unwrap(c.value);
        setCourse(d?.course || d);
      }
      if (e.status === "fulfilled") {
        const d = unwrap(e.value);
        const list =
          d?.enrollments || d?.courses || (Array.isArray(d) ? d : []);
        setEnrolled(
          list.some(
            (en) => (en.course?.id || en.course_id || en.id) === courseId,
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <FullLoader label="Loading course..." />;
  if (!course)
    return (
      <div style={{ padding: 40, textAlign: "center", color: theme?.text }}>
        Course not found.
      </div>
    );

  const price = Number(course.price) || 0;
  const bd = priceBreakdown(price);
  const videos = (course.videos || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const preview = videos.find((v) => v.playback_url);
  const isFree = price <= 0;
  const isEnrolled = course.is_enrolled ?? enrolled;
  const totalVideos = course.total_videos ?? videos.length;
  const totalDurationLabel = fmtDuration(course.total_duration);

  // Access summary — derived only from fields the backend actually returns.
  let accessLabel = "Lifetime access";
  if (isEnrolled) {
    if (course.access_expired) accessLabel = "Access expired";
    else if (course.access_expires_at) accessLabel = `Access until ${fmtDate(course.access_expires_at)}`;
  } else if (course.access_duration_days) {
    const unit = course.access_duration_unit || "day";
    const n = course.access_duration_days;
    accessLabel = `${n} ${unit}${n > 1 ? "s" : ""} access from purchase`;
  }

  const share = async () => {
    const url = `https://manchly.onelink.me/Ne3P?deep_link_value=course/${course.id}&af_dp=manchly://course/${course.id}`;
    try {
      if (navigator.share) await navigator.share({ title: course.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Course link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  const buy = async () => {
    setPaying(true);
    try {
      if (isFree) {
        await apiFetch(`/courses/${course.id}/enroll`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        toast.success("Enrolled successfully 🎉");
        setEnrolled(true);
        return;
      }
      await runPurchase({
        createOrder: async () =>
          unwrap(
            await apiFetch(`/payments/create-order/${course.id}`, {
              method: "POST",
              body: JSON.stringify({}),
            }),
          ),
        verifyPath: "/payments/verify",
      });
      toast.success("Course purchased successfully 🎉");
      setEnrolled(true);
    } catch (err) {
      toast.error(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const row = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    padding: "7px 0",
    color: theme?.text || "rgba(255,255,255,0.85)",
  };

  const summaryRow = {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: `1px solid ${theme?.border || colors.user.border}`,
    fontSize: 13.5,
  };

  return (
    <div style={{ color: theme?.text }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: theme?.subHeading || colors.user.subHeading,
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => navigate("/app/explore")}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", fontSize: "inherit" }}
        >
          Explore
        </button>
        {course.category && (
          <>
            <ChevronRight size={13} />
            <span>{course.category}</span>
          </>
        )}
        <ChevronRight size={13} />
        <span style={{ color: theme?.text, fontWeight: 600 }}>{course.title}</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.7fr 1fr",
          gap: 26,
          alignItems: "start",
        }}
      >
        {/* Left: media + info */}
        <div>
          {preview ? (
            <div>
              <HlsVideo src={preview.playback_url} poster={course.thumbnail} autoPlay muted/>
              <div style={{ marginTop: 8 }}>
                <Badge color={theme?.highlight || "#F0C040"}>Free preview</Badge>
              </div>
            </div>
          ) : (
            <div
              style={{
                height: 320,
                borderRadius: 16,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {course.thumbnail ? (
                <>
                  <div
                    style={{
                      position: "absolute",
                      inset: -10,
                      backgroundImage: `url(${course.thumbnail})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "blur(22px) brightness(0.7)",
                      transform: "scale(1.15)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url(${course.thumbnail})`,
                      backgroundSize: "contain",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                </>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      colors.gradients.heroWarm || colors.gradients.heroNavy,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BookOpen size={54} color="rgba(255,255,255,0.5)" />
                </div>
              )}

              {/* Stats badges overlaid on the hero, bottom-left */}
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  bottom: 14,
                  display: "flex",
                  gap: 10,
                }}
              >
                <span style={heroPillStyle}>
                  <PlayCircle size={13} /> {totalVideos} Videos
                </span>
                {totalDurationLabel && (
                  <span style={heroPillStyle}>
                    <Clock size={13} /> {totalDurationLabel}
                  </span>
                )}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              marginTop: 20,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 25,
                fontWeight: 900,
                color: theme?.text,
                lineHeight: 1.25,
              }}
            >
              {course.title}
            </h1>
            <button
              onClick={share}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: theme?.card || colors.user.card,
                border: `1px solid ${theme?.border || colors.user.border}`,
                borderRadius: 10,
                color: theme?.text || "#fff",
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Share2 size={15} /> Share
            </button>
          </div>

          <button
            onClick={() =>
              course.creator &&
              navigate(`/app/creator/${course.creator.id}`, {
                state: { creator: course.creator },
              })
            }
            style={{
              background: "transparent",
              border: "none",
              color: theme?.accent || colors.user.accentSoft,
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
              fontSize: 14.5,
              marginTop: 6,
            }}
          >
            by {course.creator?.name || "Creator"}
          </button>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              margin: "14px 0",
            }}
          >
            {course.level && (
              <span style={metaPillStyle}>
                <BarChart2 size={13} /> {course.level}
              </span>
            )}
            <span style={metaPillStyle}>
              <PlayCircle size={13} /> {totalVideos} Videos
            </span>
            {totalDurationLabel && (
              <span style={metaPillStyle}>
                <Clock size={13} /> {totalDurationLabel}
              </span>
            )}
          </div>

          {/* Course Summary */}
          <div
            style={{
              background: theme?.card || colors.user.card,
              border: `1px solid ${theme?.border || colors.user.border}`,
              borderRadius: 14,
              padding: "6px 18px",
              marginTop: 20,
            }}
          >
            <h3
              style={{
                margin: "12px 0 2px",
                fontSize: 15,
                fontWeight: 800,
                color: theme?.text,
              }}
            >
              Course Summary
            </h3>
            <div style={summaryRow}>
              <span style={{ color: theme?.subHeading }}>Title</span>
              <span style={{ fontWeight: 700 }}>{course.title}</span>
            </div>
            <div style={summaryRow}>
              <span style={{ color: theme?.subHeading }}>Level</span>
              <span style={{ fontWeight: 700 }}>{course.level || "—"}</span>
            </div>
            <div style={summaryRow}>
              <span style={{ color: theme?.subHeading }}>Price</span>
              <span style={{ fontWeight: 700 }}>{isFree ? "Free" : formatCurrency(price)}</span>
            </div>
            <div style={summaryRow}>
              <span style={{ color: theme?.subHeading }}>Status</span>
              <span style={{ fontWeight: 700 }}>{course.status || "—"}</span>
            </div>
            <div style={summaryRow}>
              <span style={{ color: theme?.subHeading }}>Videos</span>
              <span style={{ fontWeight: 700 }}>{totalVideos}</span>
            </div>
            <div style={summaryRow}>
              <span style={{ color: theme?.subHeading }}>Duration</span>
              <span style={{ fontWeight: 700 }}>{totalDurationLabel || "—"}</span>
            </div>
            <div style={{ ...summaryRow, borderBottom: "none" }}>
              <span style={{ color: theme?.subHeading }}>Access</span>
              <span style={{ fontWeight: 700 }}>{accessLabel}</span>
            </div>
          </div>

          <h3
            style={{
              margin: "26px 0 8px",
              fontSize: 17,
              fontWeight: 800,
              color: theme?.text,
            }}
          >
            About this course
          </h3>
          <p
            style={{
              margin: 0,
              lineHeight: 1.7,
              color: theme?.subHeading || "rgba(255,255,255,0.8)",
              fontSize: 14.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {course.description || "No description."}
          </p>

          {/* Lesson list (locked until enrolled), two-column like the reference layout */}
          {videos.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: theme?.text }}>
                  Course Content
                </h3>
                <span style={{ fontSize: 12.5, color: theme?.subHeading }}>
                  {totalVideos} Lessons{totalDurationLabel ? ` · ${totalDurationLabel}` : ""}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px 16px",
                }}
              >
                {videos.map((v, i) => (
                  <div
                    key={v.id || i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background:
                        theme?.cardSoft || theme?.card || colors.user.card,
                      border: `1px solid ${theme?.border || colors.user.border}`,
                      borderRadius: 12,
                      padding: "12px 16px",
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background:
                          colors.gradients?.heroWarm || colors.gradients.heroWarm,
                        color: "#FFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11.5,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: theme?.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v.title}
                    </span>
                    <span
                      style={{
                        color: theme?.subHeading || colors.user.subHeading,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {v.duration
                        ? `${Math.max(1, Math.round(v.duration / 60))} min`
                        : ""}
                    </span>
                    {!isEnrolled && !v.is_free && (
                      <Lock size={13} color={theme?.subHeading} style={{ flexShrink: 0 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: purchase card */}
        <div style={{ position: "sticky", top: 90 }}>
          <div
            style={{
              background: theme?.card || colors.user.card,
              border: `1px solid ${theme?.border || colors.user.border}`,
              borderRadius: 18,
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 900, color: theme?.text }}>
                {isFree ? "Free" : formatCurrency(bd.total)}
              </span>
              <button
                onClick={share}
                style={{
                  background: "transparent",
                  border: `1px solid ${theme?.border || colors.user.border}`,
                  borderRadius: 10,
                  color: theme?.text || "#fff",
                  padding: 8,
                  cursor: "pointer",
                }}
                title="Share"
              >
                <Share2 size={17} />
              </button>
            </div>

            {!isFree && (
              <div
                style={{
                  margin: "16px 0",
                  borderTop: `1px dashed ${theme?.border || colors.user.border}`,
                  paddingTop: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color: theme?.subHeading || colors.user.subHeading,
                    marginBottom: 6,
                  }}
                >
                  Payment details
                </div>
                <div style={row}>
                  <span>Course Fee</span>
                  <span>{formatCurrency(bd.fee)}</span>
                </div>
                <div style={row}>
                  <span>GST (18%)</span>
                  <span>{formatCurrency(bd.gst)}</span>
                </div>
                <div style={row}>
                  <span>Platform Fee (2%)</span>
                  <span>{formatCurrency(bd.platform)}</span>
                </div>
                <div
                  style={{
                    ...row,
                    fontWeight: 900,
                    borderTop: `1px solid ${theme?.border || colors.user.border}`,
                    marginTop: 6,
                    paddingTop: 10,
                  }}
                >
                  <span>Total</span>
                  <span>{formatCurrency(bd.total)}</span>
                </div>
              </div>
            )}

            {isEnrolled ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: colors.status.success,
                    fontWeight: 800,
                    margin: "14px 0",
                  }}
                >
                  <CheckCircle2 size={18} /> Already Enrolled
                </div>
                <GradientButton
                  full
                  size="lg"
                  onClick={() => navigate(`/app/player/${course.id}`)}
                  gradient={
                    colors.gradients?.greenButton || colors.gradients.greenButton
                  }
                >
                  Continue Learning
                </GradientButton>
              </>
            ) : (
              /* Purchase / Enroll Button */
              <GradientButton
                full
                size="lg"
                loading={paying}
                onClick={buy}
                gradient={colors.gradients.greenButton}
                style={{ marginTop: 8 }}
              >
                {isFree
                  ? "Enroll for Free"
                  : `Purchase for ${formatCurrency(bd.total)}`}
              </GradientButton>
            )}

            <p
              style={{
                fontSize: 11.5,
                color: theme?.subHeading || colors.user.subHeading,
                marginTop: 14,
                lineHeight: 1.6,
              }}
            >
              Secure payment via Cashfree. Refunds only for duplicate or failed
              transactions within 48 hours — see{" "}
              {[
                ["terms", "Terms"],
                ["privacy", "Privacy"],
                ["refund", "Refund Policy"],
              ].map(([key, label], i) => (
                <React.Fragment key={key}>
                  {i > 0 && " · "}
                  <button
                    onClick={() => setLegalDoc(key)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: theme?.accent || colors.user.accentSoft,
                      fontWeight: 700,
                      fontSize: "inherit",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                    }}
                  >
                    {label}
                  </button>
                </React.Fragment>
              ))}
              .
            </p>
          </div>

          {/* Basic course stats — real counts only */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 14,
            }}
          >
            <div style={statBoxStyle(theme)}>
              <Users size={16} color={theme?.accent} />
              <span style={{ fontSize: 12, color: theme?.subHeading }}>
                {course.total_students ?? 0} students
              </span>
            </div>
            <div style={statBoxStyle(theme)}>
              <PlayCircle size={16} color={theme?.accent} />
              <span style={{ fontSize: 12, color: theme?.subHeading }}>
                {totalVideos} Videos
              </span>
            </div>
          </div>
        </div>
      </div>

      {legalDoc && (
        <LegalModal
          doc={legalDoc}
          dark={!colors.user}
          onClose={() => setLegalDoc(null)}
        />
      )}
    </div>
  );
}

const heroPillStyle = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  background: "rgba(8,12,37,0.7)",
  backdropFilter: "blur(4px)",
  color: "#FFFFFF",
  padding: "5px 12px",
  borderRadius: 99,
  fontSize: 12,
  fontWeight: 700,
};

const metaPillStyle = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12.5,
  fontWeight: 600,
  color: "inherit",
  opacity: 0.85,
};

const statBoxStyle = (theme) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: theme?.card || colors.user.card,
  border: `1px solid ${theme?.border || colors.user.border}`,
  borderRadius: 12,
  padding: "10px 12px",
});