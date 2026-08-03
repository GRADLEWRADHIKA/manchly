// Webinar details — live countdown, price breakdown, Cashfree enroll with
// verify polling (5×2s), Zoom join once enrolled.
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { CalendarDays, Clock, Video, Users, Tag } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import { openCheckout, pollVerify, priceBreakdown } from "../../utils/payments";
import colors from "../../utils/colors";
import { GradientButton, FullLoader, Badge } from "../../components/ui";
import { LegalModal } from "../../components/LegalModals";
import { toast } from "../../utils/toast";
import { formatCurrency } from "../../utils/formatters";

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return { started: true };
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { started: false, d, h, m, s };
}

export default function WebinarDetails() {
  const { webinarId } = useParams();
  const location = useLocation();
  const [webinar, setWebinar] = useState(location.state?.webinar || null);
  const [loading, setLoading] = useState(!location.state?.webinar);
  const [paying, setPaying] = useState(false);
  const [enrolled, setEnrolled] = useState(!!location.state?.webinar?.is_enrolled);
  const [legalDoc, setLegalDoc] = useState(null);

  useEffect(() => {
    apiFetch(`/webinars/${webinarId}`)
      .then((r) => {
        const d = unwrap(r);
        const w = d?.webinar || d;
        setWebinar(w);
        setEnrolled(!!w?.is_enrolled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [webinarId]);

  const countdown = useCountdown(webinar?.scheduled_at);

  if (loading) return <FullLoader label="Loading webinar..." />;
  if (!webinar) return <div style={{ padding: 40, textAlign: "center" }}>Webinar not found.</div>;

  const price = Number(webinar.price) || 0;
  const bd = priceBreakdown(price);
  const isFree = price <= 0;
  const ended = webinar.scheduled_at && new Date(webinar.scheduled_at).getTime() + (Number(webinar.duration) || 60) * 60000 < Date.now();

  const enroll = async () => {
    setPaying(true);
    try {
      const orderRes = unwrap(
        await apiFetch(`/webinars/${webinar.id}/enroll`, { method: "POST", body: JSON.stringify({ webinar_id: webinar.id, amount: bd.total }) })
      );
      const cf = orderRes?.cashfree_order || orderRes;
      if (!cf?.payment_session_id) {
        // free webinar or instant enrollment
        toast.success("Registered for webinar 🎉");
        setEnrolled(true);
        return;
      }
      await openCheckout({ payment_session_id: cf.payment_session_id, env: orderRes?.cashfree_env });
      await pollVerify("/webinars/payment/verify", { order_id: cf.order_id });
      toast.success("Webinar booked successfully 🎉");
      setEnrolled(true);
    } catch (err) {
      toast.error(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const joinZoom = () => {
    if (webinar.zoom_join_url) window.open(webinar.zoom_join_url, "_blank");
    else toast.info("Join link will be available soon");
  };

  const infoRow = { display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.85)", fontSize: 14.5, padding: "7px 0" };
  const payRow = { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "7px 0", color: "rgba(255,255,255,0.85)" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 26, alignItems: "start" }}>
      <div>
        <div style={{ height: 300, borderRadius: 18, background: webinar.thumbnail ? `url(${webinar.thumbnail}) center/cover` : colors.gradients.purple, position: "relative", overflow: "hidden" }}>
          {countdown && !countdown.started && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.85))", padding: "40px 22px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", opacity: 0.8, marginBottom: 8 }}>Starts in</div>
              <div style={{ display: "flex", gap: 12 }}>
                {[["d", countdown.d], ["h", countdown.h], ["m", countdown.m], ["s", countdown.s]].map(([u, v]) => (
                  <div key={u} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 56 }}>
                    <div style={{ fontSize: 20, fontWeight: 900 }}>{String(v).padStart(2, "0")}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase" }}>{u === "d" ? "days" : u === "h" ? "hrs" : u === "m" ? "min" : "sec"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {countdown?.started && !ended && (
            <span style={{ position: "absolute", top: 14, left: 14 }}><Badge color="#F87171" bg="rgba(248,113,113,0.18)">● Live now</Badge></span>
          )}
          {ended && <span style={{ position: "absolute", top: 14, left: 14 }}><Badge color="#9CA3AF">Ended</Badge></span>}
        </div>

        <h1 style={{ margin: "20px 0 6px", fontSize: 26, fontWeight: 900 }}>{webinar.title}</h1>
        <div style={{ color: colors.user.accentSoft, fontWeight: 700, fontSize: 14.5 }}>Hosted by {webinar.creator?.name || "Creator"}</div>

        <div style={{ marginTop: 16 }}>
          <div style={infoRow}><CalendarDays size={17} color={colors.user.accentSoft} /> {webinar.scheduled_at ? new Date(webinar.scheduled_at).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Date TBA"}</div>
          <div style={infoRow}><Clock size={17} color={colors.user.accentSoft} /> {webinar.scheduled_at ? new Date(webinar.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""} ({webinar.duration || 60} mins)</div>
          <div style={infoRow}><Video size={17} color={colors.user.accentSoft} /> Zoom Meeting</div>
          {webinar.max_participants && <div style={infoRow}><Users size={17} color={colors.user.accentSoft} /> Max participants: {webinar.max_participants}</div>}
        </div>

        {Array.isArray(webinar.tags) && webinar.tags.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {webinar.tags.map((t, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 99, padding: "5px 12px", fontSize: 12.5 }}>
                <Tag size={11} /> {t}
              </span>
            ))}
          </div>
        )}

        <h3 style={{ margin: "22px 0 8px", fontSize: 17, fontWeight: 800 }}>About</h3>
        <p style={{ margin: 0, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", fontSize: 14.5, whiteSpace: "pre-wrap" }}>{webinar.description || "No description."}</p>
      </div>

      {/* Purchase / join card */}
      <div style={{ position: "sticky", top: 90 }}>
        <div style={{ background: colors.user.card, border: `1px solid ${colors.user.border}`, borderRadius: 18, padding: 22 }}>
          <div style={{ fontSize: 26, fontWeight: 900 }}>{isFree ? "Free" : formatCurrency(bd.total)}</div>

          {!isFree && !enrolled && (
            <div style={{ margin: "16px 0", borderTop: `1px dashed ${colors.user.border}`, paddingTop: 12 }}>
              <div style={payRow}><span>Webinar Fee</span><span>{formatCurrency(bd.fee)}</span></div>
              <div style={payRow}><span>GST (18%)</span><span>{formatCurrency(bd.gst)}</span></div>
              <div style={payRow}><span>Platform Fee (2%)</span><span>{formatCurrency(bd.platform)}</span></div>
              <div style={{ ...payRow, fontWeight: 900, borderTop: `1px solid ${colors.user.border}`, marginTop: 6, paddingTop: 10 }}><span>Total</span><span>{formatCurrency(bd.total)}</span></div>
            </div>
          )}

          {enrolled ? (
            <>
              <div style={{ color: colors.status.success, fontWeight: 800, margin: "14px 0" }}>✓ You're registered</div>
              {(webinar.zoom_meeting_id || webinar.zoom_password) && (
                <div style={{ background: "rgba(79,96,250,0.1)", border: `1px solid rgba(79,96,250,0.3)`, borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 13.5 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Zoom credentials</div>
                  <div>Meeting ID: <b>{webinar.zoom_meeting_id}</b></div>
                  <div>Password: <b>{webinar.zoom_password}</b></div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`Meeting ID: ${webinar.zoom_meeting_id}\nPassword: ${webinar.zoom_password}`); toast.success("Copied"); }}
                    style={{ marginTop: 8, background: "transparent", border: `1px solid ${colors.user.border}`, borderRadius: 8, color: "#fff", padding: "5px 12px", cursor: "pointer", fontSize: 12.5 }}
                  >
                    Copy ID & Password
                  </button>
                </div>
              )}
              <GradientButton full size="lg" disabled={ended} onClick={joinZoom} gradient={ended ? undefined : colors.gradients.teal}>
                {ended ? "Webinar Ended" : "Join Webinar"}
              </GradientButton>
            </>
          ) : (
            <GradientButton full size="lg" loading={paying} disabled={ended} onClick={enroll} style={{ marginTop: 8 }}>
              {ended ? "Webinar Ended" : isFree ? "Register Free" : `Purchase for ${formatCurrency(bd.total)}`}
            </GradientButton>
          )}
          <p style={{ fontSize: 11.5, color: colors.user.subHeading, marginTop: 14, lineHeight: 1.6 }}>
            Secure payment via Cashfree ·{" "}
            {[["terms", "Terms"], ["privacy", "Privacy"], ["refund", "Refund Policy"]].map(([key, label], i) => (
              <React.Fragment key={key}>
                {i > 0 && " · "}
                <button onClick={() => setLegalDoc(key)} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: colors.user.accentSoft, fontWeight: 700, fontSize: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>
                  {label}
                </button>
              </React.Fragment>
            ))}{" "}
            apply.
          </p>
        </div>
      </div>

      {legalDoc && <LegalModal doc={legalDoc} dark onClose={() => setLegalDoc(null)} />}
    </div>
  );
}
