// Course details + purchase — free preview video, GST/platform-fee breakdown,
// Cashfree modal checkout → verify, real free-enroll, share link, enrolled state.
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Users, PlayCircle, Share2, CheckCircle2 } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { runPurchase, priceBreakdown } from "../../utils/payments";
import colors from "../../utils/colors";
import { GradientButton, FullLoader, Badge } from "../../components/ui";
import { LegalModal } from "../../components/LegalModals";
import { toast } from "../../utils/toast";
import { formatCurrency } from "../../utils/formatters";
import HlsVideo from "../../components/HlsVideo";

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null);

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
        const list = d?.enrollments || d?.courses || (Array.isArray(d) ? d : []);
        setEnrolled(list.some((en) => (en.course?.id || en.course_id || en.id) === courseId));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <FullLoader label="Loading course..." />;
  if (!course) return <div style={{ padding: 40, textAlign: "center" }}>Course not found.</div>;

  const price = Number(course.price) || 0;
  const bd = priceBreakdown(price);
  const preview = (course.videos || []).find((v) => v.playback_url);
  const isFree = price <= 0;

  const share = async () => {
    const url = `https://manchly.chottu.link/course/${course.id}`;
    try {
      if (navigator.share) await navigator.share({ title: course.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Course link copied");
      }
    } catch { /* user cancelled */ }
  };

  const buy = async () => {
    setPaying(true);
    try {
      if (isFree) {
        await apiFetch(`/courses/${course.id}/enroll`, { method: "POST", body: JSON.stringify({}) });
        toast.success("Enrolled successfully 🎉");
        setEnrolled(true);
        return;
      }
      await runPurchase({
        createOrder: async () => unwrap(await apiFetch(`/payments/create-order/${course.id}`, { method: "POST", body: JSON.stringify({}) })),
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

  const row = { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "7px 0", color: "rgba(255,255,255,0.85)" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 26, alignItems: "start" }}>
      {/* Left: media + info */}
      <div>
        {preview ? (
          <div>
            <HlsVideo src={preview.playback_url} poster={course.thumbnail} />
            <div style={{ marginTop: 8 }}><Badge color="#F0C040">Free preview</Badge></div>
          </div>
        ) : (
          <div style={{ height: 320, borderRadius: 16, background: course.thumbnail ? `url(${course.thumbnail}) center/cover` : colors.gradients.heroNavy, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {!course.thumbnail && <BookOpen size={54} color="rgba(255,255,255,0.5)" />}
          </div>
        )}

        <h1 style={{ margin: "20px 0 6px", fontSize: 27, fontWeight: 900 }}>{course.title}</h1>
        <button
          onClick={() => course.creator && navigate(`/app/creator/${course.creator.id}`, { state: { creator: course.creator } })}
          style={{ background: "transparent", border: "none", color: colors.user.accentSoft, fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 14.5 }}
        >
          by {course.creator?.name || "Creator"}
        </button>

        <div style={{ display: "flex", gap: 20, margin: "16px 0", color: colors.user.subHeading, fontSize: 14 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Users size={16} /> {course.total_students ?? course.enrollments?.length ?? 0} students</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><PlayCircle size={16} /> {course.videos?.length ?? course.total_videos ?? 0} lessons</span>
          {course.level && <Badge color={colors.user.accentSoft} bg="rgba(189,194,255,0.12)">{course.level}</Badge>}
        </div>

        <h3 style={{ margin: "18px 0 8px", fontSize: 17, fontWeight: 800 }}>About this course</h3>
        <p style={{ margin: 0, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", fontSize: 14.5, whiteSpace: "pre-wrap" }}>{course.description || "No description."}</p>

        {/* Lesson list (locked until enrolled) */}
        {(course.videos || []).length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800 }}>Course content</h3>
            {(course.videos || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((v, i) => (
              <div key={v.id || i} style={{ display: "flex", alignItems: "center", gap: 12, background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: colors.gradients.indigo, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{v.title}</span>
                <span style={{ color: colors.user.subHeading, fontSize: 12.5 }}>{v.duration ? `${Math.max(1, Math.round(v.duration / 60))} min` : ""}</span>
                {!enrolled && i > 0 && <span style={{ fontSize: 13 }}>🔒</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: purchase card */}
      <div style={{ position: "sticky", top: 90 }}>
        <div style={{ background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 18, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 26, fontWeight: 900 }}>{isFree ? "Free" : formatCurrency(bd.total)}</span>
            <button onClick={share} style={{ background: "transparent", border: `1px solid ${colors.user.border}`, borderRadius: 10, color: "#fff", padding: 8, cursor: "pointer" }} title="Share">
              <Share2 size={17} />
            </button>
          </div>

          {!isFree && (
            <div style={{ margin: "16px 0", borderTop: `1px dashed ${colors.user.border}`, paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: colors.user.subHeading, marginBottom: 6 }}>Payment details</div>
              <div style={row}><span>Course Fee</span><span>{formatCurrency(bd.fee)}</span></div>
              <div style={row}><span>GST (18%)</span><span>{formatCurrency(bd.gst)}</span></div>
              <div style={row}><span>Platform Fee (2%)</span><span>{formatCurrency(bd.platform)}</span></div>
              <div style={{ ...row, fontWeight: 900, borderTop: `1px solid ${colors.user.border}`, marginTop: 6, paddingTop: 10 }}><span>Total</span><span>{formatCurrency(bd.total)}</span></div>
            </div>
          )}

          {enrolled ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.status.success, fontWeight: 800, margin: "14px 0" }}>
                <CheckCircle2 size={18} /> Already Enrolled
              </div>
              <GradientButton full size="lg" onClick={() => navigate(`/app/player/${course.id}`)}>
                Continue Learning
              </GradientButton>
            </>
          ) : (
            <GradientButton full size="lg" loading={paying} onClick={buy} gradient={isFree ? colors.gradients.teal : colors.gradients.indigo} style={{ marginTop: 8 }}>
              {isFree ? "Enroll for Free" : `Purchase for ${formatCurrency(bd.total)}`}
            </GradientButton>
          )}

          <p style={{ fontSize: 11.5, color: colors.user.subHeading, marginTop: 14, lineHeight: 1.6 }}>
            Secure payment via Cashfree. Refunds only for duplicate or failed transactions within 48 hours — see{" "}
            {[["terms", "Terms"], ["privacy", "Privacy"], ["refund", "Refund Policy"]].map(([key, label], i) => (
              <React.Fragment key={key}>
                {i > 0 && " · "}
                <button onClick={() => setLegalDoc(key)} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: colors.user.accentSoft, fontWeight: 700, fontSize: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>
                  {label}
                </button>
              </React.Fragment>
            ))}
            .
          </p>
        </div>
      </div>

      {legalDoc && <LegalModal doc={legalDoc} dark onClose={() => setLegalDoc(null)} />}
    </div>
  );
}
