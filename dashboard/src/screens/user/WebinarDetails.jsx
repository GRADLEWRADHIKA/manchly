// Webinar details — live countdown, price breakdown, Cashfree enroll with
// verify polling (5×2s), Zoom join once enrolled.
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Clock, Video, Users, Tag, Share2, ChevronRight, ShieldCheck, Smartphone, Radio as RadioIcon } from "lucide-react";
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

const fmtRegisteredCount = (n) => {
  const num = Number(n);
  if (!num || num <= 0) return null;
  if (num >= 1000) {
    const k = num / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K+ registered`;
  }
  return `${num} registered`;
};

export default function WebinarDetails() {
  const { webinarId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [webinar, setWebinar] = useState(location.state?.webinar || null);
  const [loading, setLoading] = useState(!location.state?.webinar);
  const [paying, setPaying] = useState(false);
  const [enrolled, setEnrolled] = useState(
    !!location.state?.webinar?.is_enrolled,
  );
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
  if (!webinar)
    return (
      <div style={{ padding: 40, textAlign: "center" }}>Webinar not found.</div>
    );

  const price = Number(webinar.price) || 0;
  const bd = priceBreakdown(price);
  const isFree = price <= 0;
  const ended =
    webinar.scheduled_at &&
    new Date(webinar.scheduled_at).getTime() +
      (Number(webinar.duration) || 60) * 60000 
      Date.now();
  const registeredLabel = fmtRegisteredCount(webinar._count?.enrollments ?? webinar.total_registered);

  const share = async () => {
    const url = `https://manchly.onelink.me/Ne3P?deep_link_value=webinar/${webinar.id}&af_dp=manchly://webinar/${webinar.id}`;
    try {
      if (navigator.share) await navigator.share({ title: webinar.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Webinar link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  const enroll = async () => {
    setPaying(true);
    try {
      const orderRes = unwrap(
        await apiFetch(`/webinars/${webinar.id}/enroll`, {
          method: "POST",
          body: JSON.stringify({ webinar_id: webinar.id, amount: bd.total }),
        }),
      );
      const cf = orderRes?.cashfree_order || orderRes;
      if (!cf?.payment_session_id) {
        // free webinar or instant enrollment
        toast.success("Registered for webinar 🎉");
        setEnrolled(true);
        return;
      }
      await openCheckout({
        payment_session_id: cf.payment_session_id,
        env: orderRes?.cashfree_env,
      });
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

  // Body copy — dark text on the new light theme, not the old white-on-dark values.
  const infoRow = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: colors.user.text,
    fontSize: 14.5,
    padding: "7px 0",
  };
  const payRow = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    padding: "7px 0",
    color: colors.user.subHeading,
  };
  const summaryRow = {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: `1px solid ${colors.user.border}`,
    fontSize: 13.5,
  };

  return (
    <div style={{ color: colors.user.text }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: colors.user.subHeading,
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => navigate("/app/explore?tab=webinars")}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", fontSize: "inherit" }}
        >
          Live Webinars
        </button>
        {webinar.category && (
          <>
            <ChevronRight size={13} />
            <span>{webinar.category}</span>
          </>
        )}
        <ChevronRight size={13} />
        <span style={{ color: colors.user.text, fontWeight: 600 }}>{webinar.title}</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.7fr 1fr",
          gap: 26,
          alignItems: "start",
        }}
      >
        <div>
          {/* Hero image banner */}
          <div
            style={{
              height: 300,
              borderRadius: 18,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {webinar.thumbnail_url ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    inset: -10,
                    backgroundImage: `url(${webinar.thumbnail_url})`,
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
                    backgroundImage: `url(${webinar.thumbnail_url})`,
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
                    "linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%)",
                }}
              />
            )}
            {!webinar.thumbnail_url && (
              <Video
                size={52}
                color="rgba(255,255,255,0.55)"
                style={{ position: "relative" }}
              />
            )}

            {/* LIVE WEBINAR tag, top-left */}
            <span
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: colors.gradients?.greenButtonDark || "#22C55E",
                color: "#fff",
                padding: "5px 12px",
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}
            >
              <RadioIcon size={12} /> Live Webinar
            </span>

            {countdown && !countdown.started && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: colors.greenButton,
                  padding: "40px 22px 18px",
                  color: "#fff",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    opacity: 0.8,
                    marginBottom: 8,
                  }}
                >
                  Starts in
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    ["d", countdown.d],
                    ["h", countdown.h],
                    ["m", countdown.m],
                    ["s", countdown.s],
                  ].map(([u, v]) => (
                    <div
                      key={u}
                      style={{
                        background: colors.gradients.gold,
                        borderRadius: 10,
                        padding: "8px 14px",
                        textAlign: "center",
                        minWidth: 56,
                      }}
                    >
                      <div style={{ fontSize: 20, fontWeight: 900 }}>
                        {String(v).padStart(2, "0")}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.7,
                          textTransform: "uppercase",
                        }}
                      >
                        {u === "d"
                          ? "days"
                          : u === "h"
                            ? "hrs"
                            : u === "m"
                              ? "min"
                              : "sec"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {countdown?.started && !ended && (
              <span style={{ position: "absolute", top: 14, right: 14 }}>
                <Badge color="#F87171" bg="rgba(248,113,113,0.18)">
                  ● Live now
                </Badge>
              </span>
            )}
            {ended && (
              <span style={{ position: "absolute", top: 14, right: 14 }}>
                <Badge color="#9CA3AF">Ended</Badge>
              </span>
            )}
          </div>

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
                fontSize: 24,
                fontWeight: 900,
                color: colors.user.text,
                lineHeight: 1.25,
              }}
            >
              {webinar.title}
            </h1>
            <button
              onClick={share}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: colors.user.card,
                border: `1px solid ${colors.user.border}`,
                borderRadius: 10,
                color: colors.user.text,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Share2 size={15} /> Share
            </button>
          </div>

          <div
            style={{ color: colors.user.accent, fontWeight: 700, fontSize: 14.5, marginTop: 4 }}
          >
            Hosted by {webinar.creator?.name || "Creator"}
          </div>

          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "14px 0" }}
          >
            <span style={metaPillStyle}>
              <Video size={13} /> Live Webinar
            </span>
            {registeredLabel && (
              <span style={metaPillStyle}>
                <Users size={13} /> {registeredLabel}
              </span>
            )}
          </div>

          {/* Session Summary — mirrors Course Summary's structure/style */}
          <div
            style={{
              background: colors.user.card,
              border: `1px solid ${colors.user.border}`,
              borderRadius: 14,
              padding: "6px 18px",
              marginTop: 6,
            }}
          >
            <h3
              style={{
                margin: "12px 0 2px",
                fontSize: 15,
                fontWeight: 800,
                color: colors.user.text,
              }}
            >
              Session Details
            </h3>
            <div style={summaryRow}>
              <span style={{ color: colors.user.subHeading }}>Date</span>
              <span style={{ fontWeight: 700 }}>
                {webinar.scheduled_at
                  ? new Date(webinar.scheduled_at).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "TBA"}
              </span>
            </div>
            <div style={summaryRow}>
              <span style={{ color: colors.user.subHeading }}>Time</span>
              <span style={{ fontWeight: 700 }}>
                {webinar.scheduled_at
                  ? new Date(webinar.scheduled_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
                {webinar.duration ? ` (${webinar.duration} mins)` : ""}
              </span>
            </div>
            {registeredLabel && (
              <div style={summaryRow}>
                <span style={{ color: colors.user.subHeading }}>Registered</span>
                <span style={{ fontWeight: 700 }}>{registeredLabel.replace(" registered", "")}</span>
              </div>
            )}
            <div style={summaryRow}>
              <span style={{ color: colors.user.subHeading }}>Format</span>
              <span style={{ fontWeight: 700 }}>Live Webinar (Zoom)</span>
            </div>
            {webinar.max_participants && (
              <div style={{ ...summaryRow, borderBottom: "none" }}>
                <span style={{ color: colors.user.subHeading }}>Max Participants</span>
                <span style={{ fontWeight: 700 }}>{webinar.max_participants}</span>
              </div>
            )}
          </div>

          {Array.isArray(webinar.tags) && webinar.tags.length > 0 && (
            <div
              style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}
            >
              {webinar.tags.map((t, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: colors.user.cardSoft,
                    border: `1px solid ${colors.user.border}`,
                    borderRadius: 99,
                    padding: "5px 12px",
                    fontSize: 12.5,
                    color: colors.user.text,
                  }}
                >
                  <Tag size={11} /> {t}
                </span>
              ))}
            </div>
          )}

          <h3
            style={{
              margin: "26px 0 8px",
              fontSize: 17,
              fontWeight: 800,
              color: colors.user.text,
            }}
          >
            About this webinar
          </h3>
          <p
            style={{
              margin: 0,
              lineHeight: 1.7,
              color: colors.user.subHeading,
              fontSize: 14.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {webinar.description || "No description."}
          </p>
        </div>

        {/* Purchase / join card */}
        <div style={{ position: "sticky", top: 90 }}>
          <div
            style={{
              background: colors.user.card,
              border: `1px solid ${colors.user.border}`,
              borderRadius: 18,
              padding: 22,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{ fontSize: 26, fontWeight: 900, color: colors.user.text }}
              >
                {isFree ? "Free" : formatCurrency(bd.total)}
              </span>
              <button
                onClick={share}
                style={{
                  background: "transparent",
                  border: `1px solid ${colors.user.border}`,
                  borderRadius: 10,
                  color: colors.user.text,
                  padding: 8,
                  cursor: "pointer",
                }}
                title="Share"
              >
                <Share2 size={17} />
              </button>
            </div>

            {enrolled ? (
              <>
                <div
                  style={{
                    color: colors.status.success,
                    fontWeight: 800,
                    margin: "14px 0",
                  }}
                >
                  ✓ You're registered
                </div>
                {(webinar.zoom_meeting_id || webinar.zoom_password) && (
                  <div
                    style={{
                      background: "rgba(43,82,246,0.08)",
                      border: `1px solid rgba(43,82,246,0.25)`,
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 14,
                      fontSize: 13.5,
                      color: colors.user.text,
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                      Zoom credentials
                    </div>
                    <div>
                      Meeting ID: <b>{webinar.zoom_meeting_id}</b>
                    </div>
                    <div>
                      Password: <b>{webinar.zoom_password}</b>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `Meeting ID: ${webinar.zoom_meeting_id}\nPassword: ${webinar.zoom_password}`,
                        );
                        toast.success("Copied");
                      }}
                      style={{
                        marginTop: 8,
                        background: "transparent",
                        border: `1px solid ${colors.user.border}`,
                        borderRadius: 8,
                        color: colors.user.text,
                        padding: "5px 12px",
                        cursor: "pointer",
                        fontSize: 12.5,
                      }}
                    >
                      Copy ID & Password
                    </button>
                  </div>
                )}
                <GradientButton
                  full
                  size="lg"
                  disabled={ended}
                  onClick={joinZoom}
                  gradient={ended ? undefined : colors.gradients.teal}
                >
                  {ended ? "Webinar Ended" : "Join Webinar"}
                </GradientButton>
              </>
            ) : (
              /* Register / Purchase Button */
              <GradientButton
                full
                size="lg"
                loading={paying}
                disabled={ended}
                onClick={enroll}
                gradient={ended ? undefined : colors.gradients.greenButton}
                style={{ marginTop: 8 }}
              >
                {ended
                  ? "Webinar Ended"
                  : isFree
                    ? "Register Free"
                    : `Register Now for ${formatCurrency(bd.total)}`}
              </GradientButton>
            )}

            {/* Trust row — generic, no fabricated claims */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 14,
                paddingTop: 14,
                borderTop: `1px solid ${colors.user.border}`,
              }}
            >
              <span style={trustPillStyle}>
                <ShieldCheck size={13} /> Secure Payments
              </span>
              <span style={trustPillStyle}>
                <Smartphone size={13} /> Any Device
              </span>
            </div>

            {!isFree && !enrolled && (
              <div
                style={{
                  margin: "16px 0 0",
                  borderTop: `1px dashed ${colors.user.border}`,
                  paddingTop: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color: colors.user.subHeading,
                    marginBottom: 6,
                  }}
                >
                  Payment details
                </div>
                <div style={payRow}>
                  <span>Webinar Fee</span>
                  <span>{formatCurrency(bd.fee)}</span>
                </div>
                <div style={payRow}>
                  <span>GST (18%)</span>
                  <span>{formatCurrency(bd.gst)}</span>
                </div>
                <div style={payRow}>
                  <span>Platform Fee (2%)</span>
                  <span>{formatCurrency(bd.platform)}</span>
                </div>
                <div
                  style={{
                    ...payRow,
                    fontWeight: 900,
                    color: colors.user.text,
                    borderTop: `1px solid ${colors.user.border}`,
                    marginTop: 6,
                    paddingTop: 10,
                  }}
                >
                  <span>Total</span>
                  <span>{formatCurrency(bd.total)}</span>
                </div>
              </div>
            )}

            <p
              style={{
                fontSize: 11.5,
                color: colors.user.subHeading,
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
                      color: colors.user.accent,
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
        </div>
      </div>

      {legalDoc && (
        <LegalModal doc={legalDoc} dark onClose={() => setLegalDoc(null)} />
      )}
    </div>
  );
}

const metaPillStyle = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12.5,
  fontWeight: 600,
  color: colors.user.subHeading,
  background: colors.user.cardSoft,
  border: `1px solid ${colors.user.border}`,
  borderRadius: 99,
  padding: "5px 12px",
};

const trustPillStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  fontSize: 11,
  fontWeight: 700,
  color: colors.user.subHeading,
};