import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Globe,
  MapPin,
  Users,
  BookOpen,
  UsersRound,
  Clock,
  PlayCircle,
  Tag,
  Trophy,
  Calendar,
  ChevronRight,
  User,
  UserCheck
} from "lucide-react";

import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { Avatar, Spinner, EmptyState } from "../../components/ui";
import { formatCurrency } from "../../utils/formatters";

function formatCompact(num) {
  const n = Number(num) || 0;
  if (n <= 0) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M+";
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0) + "K+";
  return n.toLocaleString("en-IN");
}

// Branded Social Media Icons
function YouTubeIcon({ size = 16, color = "#FFFFFF" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function InstagramIcon({ size = 16, color = "#FFFFFF" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon({ size = 16, color = "#FFFFFF" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.81a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9z" />
    </svg>
  );
}

function XIcon({ size = 15, color = "#FFFFFF" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function CreatorPublicProfile() {
  const { handle } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  const primaryColor = colors.user.accent;
  const textColor = colors.user?.text ;
  const subHeadingColor = colors.user?.subHeading;
  const borderColor = colors.user?.border;
  const cardBg = colors.user?.card;
  const activeBg = colors.user?.activeBg;
  const hoverBg = colors.user?.hoverBg ;
  const activeAccent = colors.user?.activeAccent;

  useEffect(() => {
    let isMounted = true;

    const fetchCreatorProfile = async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await apiFetch(`/public/storefront/${handle}`);
        const result = unwrap(response);

        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch creator profile:", err);

        if (isMounted) {
          setError(true);
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (handle) {
      fetchCreatorProfile();
    } else {
      setError(true);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [handle]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px 0",
        }}
      >
        <Spinner size={28} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon="🙁"
        title="Creator not found"
        subtitle="This profile may have been removed or is temporarily unavailable."
      />
    );
  }

  // Safely format external URLs
  const sanitizeUrl = (url) => {
    if (!url || typeof url !== "string" || !url.trim()) return null;
    const trimmed = url.trim();
    return trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  };

  const creator = data.creator || {};
  const courses = Array.isArray(data.courses) ? data.courses : [];
  const webinars = Array.isArray(data.webinars) ? data.webinars : [];
  const sessions = Array.isArray(data.sessions) ? data.sessions : [];
  const counts = data.counts || {};

  const creatorName = creator.display_name || creator.name || "Creator";
  const profileImage = creator.profile_image;
  const tagline = creator.tagline;
  const bio = creator.bio || creator.pro_bio;
  const coverImage = creator.cover_image;
  const isVerified = Boolean(creator.kyc_verified);
  const expertise = Array.isArray(creator.expertise) ? creator.expertise : [];
  const experienceYears = creator.experience_years;
  const location = creator.location || [creator.city, creator.country].filter(Boolean).join(", ");
  const websiteUrl = sanitizeUrl(creator.socials?.website);

  // Branded social links (rendered only if URL exists)
  const socialLinks = [
    {
      key: "youtube",
      label: "YouTube",
      url: sanitizeUrl(creator.socials?.youtube),
      bg: "#FF0000",
      Icon: YouTubeIcon,
    },
    {
      key: "instagram",
      label: "Instagram",
      url: sanitizeUrl(creator.socials?.instagram),
      bg: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)",
      Icon: InstagramIcon,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      url: sanitizeUrl(creator.socials?.linkedin),
      bg: "#0A66C2",
      Icon: LinkedInIcon,
    },
    {
      key: "twitter",
      label: "X (Twitter)",
      url: sanitizeUrl(creator.socials?.twitter),
      bg: "#000000",
      Icon: XIcon,
    },
  ].filter((link) => Boolean(link.url));

  const stats = [
    {
      key: "learners",
      label: "Learners",
      value: formatCompact(counts.learners || 0),
      Icon: Users,
    },
    {
      key: "courses",
      label: "Courses",
      value: counts.courses !== undefined ? String(counts.courses) : String(courses.length),
      Icon: PlayCircle,
    },
    {
      key: "webinars",
      label: "Webinars",
      value: counts.webinars !== undefined ? String(counts.webinars) : String(webinars.length),
      Icon: Calendar,
    },
    {
      key: "sessions",
      label: "1:1 Sessions",
      value: formatCompact(counts.sessions !== undefined ? counts.sessions : sessions.length),
      Icon: UsersRound,
    },
  ];

  const tabs = [
    { key: "about", label: "About" },
    { key: "courses", label: `Courses (${counts.courses !== undefined ? counts.courses : courses.length})` },
    { key: "webinars", label: `Webinars (${counts.webinars !== undefined ? counts.webinars : webinars.length})` },
    { key: "sessions", label: `1:1 Sessions (${counts.sessions !== undefined ? counts.sessions : sessions.length})` },
  ];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1040,
        margin: "0 auto",
        padding: "0 0 40px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: coverImage ? "rgba(0,0,0,0.4)" : "transparent",
          border: coverImage ? "1px solid rgba(255,255,255,0.3)" : "none",
          backdropFilter: coverImage ? "blur(8px)" : "none",
          borderRadius: 8,
          color: coverImage ? "#FFFFFF" : subHeadingColor,
          fontSize: 13.5,
          fontWeight: 700,
          cursor: "pointer",
          margin: "16px 0 12px 16px",
          fontFamily: "inherit",
          padding: coverImage ? "6px 12px" : 0,
          position: coverImage ? "absolute" : "static",
          zIndex: 10,
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Cover Photo */}
      {coverImage ? (
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 5.5",
            maxHeight: 280,
            overflow: "hidden",
            position: "relative",
            borderRadius: "0 0 20px 20px",
          }}
        >
          <img
            src={coverImage}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: 140,
            background: colors.gradients?.greenButtonDark || "linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)",
            borderRadius: "0 0 20px 20px",
          }}
        />
      )}

      <div style={{ padding: "0 20px" }}>
        {/* Profile Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 20,
            flexWrap: "wrap",
            marginTop: -48,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
            {/* Avatar */}
            <div
              style={{
                border: `4px solid ${cardBg}`,
                borderRadius: "50%",
                background: cardBg,
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                flexShrink: 0,
              }}
            >
              <Avatar src={profileImage} name={creatorName} size={92} />
            </div>

            {/* Creator Info */}
            <div style={{ paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 900,
                    color: textColor,
                    letterSpacing: -0.4,
                  }}
                >
                  {creatorName}
                </h1>
                {isVerified && (
                  <BadgeCheck size={22} color={primaryColor} fill={primaryColor} stroke="#FFFFFF" aria-label="Verified creator" />
                )}
              </div>

              {tagline && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 14,
                    fontWeight: 500,
                    color: subHeadingColor,
                    maxWidth: 620,
                  }}
                >
                  {tagline}
                </p>
              )}

              {/* Location & Website Inline Row */}
              {(location || websiteUrl) && (
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                  {location && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: subHeadingColor, fontWeight: 500 }}>
                      <MapPin size={14} color={subHeadingColor} />
                      {location}
                    </div>
                  )}

                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 13,
                        fontWeight: 600,
                        color: primaryColor,
                        textDecoration: "none",
                      }}
                    >
                      <Globe size={14} />
                      {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Branded Social Icons */}
          {socialLinks.length > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", paddingBottom: 6 }}>
              {socialLinks.map(({ key, label, url, bg, Icon }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  aria-label={label}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    transition: "transform 0.15s ease, opacity 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Icon size={18} color="#FFFFFF" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginTop: 24,
            padding: "16px 20px",
            borderRadius: 16,
            background: cardBg,
            border: `1px solid ${borderColor}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {stats.map(({ key, label, value, Icon }) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                justifyContent: "center",
                padding: "4px 8px",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: activeBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color={activeAccent} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: textColor, lineHeight: 1.15 }}>
                  {value}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: subHeadingColor, marginTop: 2 }}>
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 24,
            borderBottom: `1px solid ${borderColor}`,
            overflowX: "auto",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "12px 20px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === t.key ? `3px solid ${primaryColor}` : "3px solid transparent",
                color: activeTab === t.key ? primaryColor : subHeadingColor,
                fontSize: 14,
                fontWeight: activeTab === t.key ? 800 : 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── About Tab ─────────────────────────────────────────────── */}
        {activeTab === "about" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 24 }}>
            {/* 1. About Me Card */}
            {(bio || expertise.length > 0 || experienceYears) && (
              <div
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 16,
                  padding: "24px 28px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <User size={20} color={textColor} strokeWidth={2.5} />
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: textColor }}>
                    About Me
                  </h2>
                </div>

                {bio && (
                  <p style={{ margin: "0 0 20px", fontSize: 14.5, lineHeight: 1.65, color: textColor }}>
                    {bio}
                  </p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {expertise.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, color: textColor, minWidth: 95 }}>
                        <Tag size={15} color={primaryColor} />
                        Expertise
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {expertise.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              background: activeBg,
                              color: activeAccent,
                              fontSize: 12.5,
                              fontWeight: 600,
                              padding: "5px 14px",
                              borderRadius: 999,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {experienceYears && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, color: textColor, minWidth: 95 }}>
                        <Trophy size={15} color={primaryColor} />
                        Experience
                      </div>
                      <span
                        style={{
                          background: activeBg,
                          color: activeAccent,
                          fontSize: 12.5,
                          fontWeight: 700,
                          padding: "5px 14px",
                          borderRadius: 999,
                        }}
                      >
                        {experienceYears}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Popular Courses Showcase */}
            {courses.length > 0 && (
              <div
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 16,
                  padding: "24px 28px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BookOpen size={20} color={textColor} strokeWidth={2.5} />
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: textColor }}>
                      Popular Courses
                    </h2>
                  </div>
                  {courses.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("courses")}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)",
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                        padding: 0,
                      }}
                    >
                      View All <ChevronRight size={16} />
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
                  {courses.slice(0, 3).map((c) => {
                    const thumbnailUrl = c.thumbnail_url || c.thumbnail;
                    const price = Number(c.price) || 0;
                    const duration = c.duration || (c._count?.videos ? `${c._count.videos} videos` : "");
                    const enrolled = Number(c._count?.enrollments) || 0;

                    return (
                      <div
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/app/course/${c.id}`)}
                        style={{
                          background: cardBg,
                          border: `1px solid ${borderColor}`,
                          borderRadius: 14,
                          overflow: "hidden",
                          cursor: "pointer",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ aspectRatio: "16 / 9", width: "100%", position: "relative", overflow: "hidden", background: hoverBg }}>
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={c.title}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%", background: colors.gradients?.greenButton || "linear-gradient(135deg, #2B52F6 0%, #6B5CF6 100%)" }} />
                          )}
                          {duration && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: 8,
                                right: 8,
                                background: "rgba(0,0,0,0.75)",
                                color: "#FFFFFF",
                                padding: "3px 8px",
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                backdropFilter: "blur(4px)",
                              }}
                            >
                              <Clock size={12} />
                              {duration}
                            </div>
                          )}
                        </div>

                        <div style={{ padding: 14 }}>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 14.5,
                              color: textColor,
                              lineHeight: 1.35,
                              minHeight: 38,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {c.title || "Untitled Course"}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: subHeadingColor, fontWeight: 600 }}>
                              <Users size={13} color={activeAccent} />
                              {formatCompact(enrolled)} learners
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: activeAccent }}>
                              {price > 0 ? formatCurrency(price) : "Free"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Bottom Two-Column Showcase (Webinars & Sessions) */}
            {(webinars.length > 0 || sessions.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: webinars.length > 0 && sessions.length > 0 ? "1fr 1fr" : "1fr", gap: 20 }}>
                {/* Upcoming Webinars Card */}
                {webinars.length > 0 && (
                  <div
                    style={{
                      background: cardBg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: 16,
                      padding: "22px 24px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Calendar size={19} color={textColor} strokeWidth={2.5} />
                        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textColor }}>
                          Upcoming Webinars
                        </h2>
                      </div>
                      {webinars.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("webinars")}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            padding: 0,
                          }}
                        >
                          View All <ChevronRight size={15} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {webinars.slice(0, 2).map((w) => {
                        const dateObj = w.scheduled_at ? new Date(w.scheduled_at) : null;
                        const dayNum = dateObj ? dateObj.getDate() : "--";
                        const monthStr = dateObj ? dateObj.toLocaleDateString("en-IN", { month: "short" }) : "";
                        const fullDateStr = dateObj
                          ? dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
                          : "Date TBA";
                        const price = Number(w.price) || 0;
                        const registered = Number(w._count?.enrollments) || 0;

                        return (
                          <div
                            key={w.id}
                            style={{
                              display: "flex",
                              gap: 14,
                              alignItems: "center",
                              padding: "12px 14px",
                              borderRadius: 12,
                              background: hoverBg,
                              border: `1px solid ${borderColor}`,
                            }}
                          >
                            {/* Date Block */}
                            <div
                              style={{
                                width: 48,
                                height: 50,
                                borderRadius: 10,
                                background: activeBg,
                                border: `1px solid ${borderColor}`,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <span style={{ fontSize: 17, fontWeight: 900, color: primaryColor, lineHeight: 1 }}>{dayNum}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: primaryColor, textTransform: "uppercase" }}>{monthStr}</span>
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 800, fontSize: 13.5, color: textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {w.title}
                              </div>
                              <div style={{ fontSize: 11.5, color: subHeadingColor, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                <Clock size={11} /> {fullDateStr}
                              </div>
                              <div style={{ fontSize: 11.5, color: subHeadingColor, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                <Users size={11} /> {formatCompact(registered)} registered
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => navigate(`/app/webinar/${w.id}`)}
                              style={{
                                background: primaryColor,
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: 8,
                                padding: "8px 14px",
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                            >
                              {price > 0 ? formatCurrency(price) : "Register Free"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 1:1 Sessions Card */}
                {sessions.length > 0 && (
                  <div
                    style={{
                      background: cardBg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: 16,
                      padding: "22px 24px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <UserCheck size={19} color={textColor} strokeWidth={2.5} />
                        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textColor }}>
                          1:1 Sessions
                        </h2>
                      </div>
                      {sessions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("sessions")}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            padding: 0,
                          }}
                        >
                          View All <ChevronRight size={15} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {sessions.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          style={{
                            display: "flex",
                            gap: 14,
                            alignItems: "center",
                            padding: "12px 14px",
                            borderRadius: 12,
                            background: hoverBg,
                            border: `1px solid ${borderColor}`,
                          }}
                        >
                          <Avatar src={profileImage} name={creatorName} size={42} />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 13.5, color: textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {s.title || "Consultation Session"}
                            </div>
                            {s.description && (
                              <div style={{ fontSize: 11.5, color: subHeadingColor, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {s.description}
                              </div>
                            )}
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor, marginTop: 4 }}>
                              {formatCurrency(Number(s.price) || 0)}
                              {s.duration && <span style={{ fontWeight: 500, fontSize: 11.5, color: subHeadingColor }}> / {s.duration} mins</span>}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(`/app/sessions`)}
                            style={{
                              background: colors.user.accent,
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: 8,
                              padding: "8px 14px",
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            Book Session
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!bio && expertise.length === 0 && !experienceYears && courses.length === 0 && webinars.length === 0 && sessions.length === 0 && (
              <EmptyState icon="📝" title="This creator hasn't added an About section yet" />
            )}
          </div>
        )}

        {/* ── Courses Tab ───────────────────────────────────────────── */}
        {activeTab === "courses" && (
          <div style={{ marginTop: 24 }}>
            {courses.length === 0 ? (
              <EmptyState icon="📚" title="No published courses yet" />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
                {courses.map((course) => {
                  const videoCount = Number(course._count?.videos) || 0;
                  const coursePrice = Number(course.price) || 0;
                  const thumbnailUrl = course.thumbnail_url || course.thumbnail;
                  const duration = course.duration || (videoCount ? `${videoCount} videos` : "");
                  const enrolled = Number(course._count?.enrollments) || 0;

                  return (
                    <div
                      key={course.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`View course: ${course.title || "Untitled Course"}`}
                      onClick={() => navigate(`/app/course/${course.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/app/course/${course.id}`);
                        }
                      }}
                      style={{
                        background: cardBg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 16,
                        overflow: "hidden",
                        cursor: "pointer",
                        outline: "none",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ aspectRatio: "16 / 9", width: "100%", position: "relative", overflow: "hidden", background: hoverBg }}>
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={course.title || "Course thumbnail"}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: colors.gradients?.greenButton || "linear-gradient(135deg, #2B52F6 0%, #6B5CF6 100%)" }} />
                        )}
                        {duration && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 8,
                              right: 8,
                              background: "rgba(0,0,0,0.75)",
                              color: "#FFFFFF",
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              backdropFilter: "blur(4px)",
                            }}
                          >
                            <Clock size={12} />
                            {duration}
                          </div>
                        )}
                      </div>

                      <div style={{ padding: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 14.5, color: textColor, lineHeight: 1.4, minHeight: 40 }}>
                          {course.title || "Untitled Course"}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 12 }}>
                          <span style={{ fontSize: 12.5, color: subHeadingColor, display: "flex", alignItems: "center", gap: 5 }}>
                            <Users size={13} color={subHeadingColor} />
                            {formatCompact(enrolled)} learners
                          </span>

                          <span style={{ fontWeight: 900, fontSize: 15, color: textColor }}>
                            {coursePrice > 0 ? formatCurrency(coursePrice) : "Free"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Webinars Tab ──────────────────────────────────────────── */}
        {activeTab === "webinars" && (
          <div style={{ marginTop: 24 }}>
            {webinars.length === 0 ? (
              <EmptyState icon="📹" title="No upcoming webinars" />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
                {webinars.map((w) => {
                  const thumbnailUrl = w.thumbnail_url || w.thumbnail;
                  const price = Number(w.price) || 0;
                  const dateObj = w.scheduled_at ? new Date(w.scheduled_at) : null;
                  const scheduledDate = dateObj
                    ? dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : null;

                  return (
                    <div
                      key={w.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`View webinar: ${w.title || "Untitled Webinar"}`}
                      onClick={() => navigate(`/app/webinar/${w.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/app/webinar/${w.id}`);
                        }
                      }}
                      style={{
                        background: cardBg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 16,
                        overflow: "hidden",
                        cursor: "pointer",
                        outline: "none",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ aspectRatio: "16 / 9", width: "100%", position: "relative", overflow: "hidden", background: hoverBg }}>
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={w.title || "Webinar thumbnail"}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: colors.gradients?.greenButton || "linear-gradient(135deg, #2B52F6 0%, #6B5CF6 100%)" }} />
                        )}
                      </div>

                      <div style={{ padding: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 14.5, color: textColor, lineHeight: 1.4, minHeight: 40 }}>
                          {w.title || "Untitled Webinar"}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 12 }}>
                          <span style={{ fontSize: 12.5, color: subHeadingColor, display: "flex", alignItems: "center", gap: 5 }}>
                            <Clock size={13} color={subHeadingColor} />
                            {scheduledDate || "TBA"}
                          </span>

                          <span style={{ fontWeight: 900, fontSize: 15, color: textColor }}>
                            {price > 0 ? formatCurrency(price) : "Free"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Sessions Tab ──────────────────────────────────────────── */}
        {activeTab === "sessions" && (
          <div style={{ marginTop: 24 }}>
            {sessions.length === 0 ? (
              <EmptyState icon="👥" title="No 1:1 sessions available" />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: cardBg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: 16,
                      padding: 18,
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 15, color: textColor }}>
                      {s.title || "Untitled Session"}
                    </div>

                    {s.description && (
                      <p style={{ margin: "6px 0 0", fontSize: 13, color: subHeadingColor, lineHeight: 1.5 }}>
                        {s.description}
                      </p>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 14 }}>
                      <span style={{ fontSize: 12.5, color: subHeadingColor }}>
                        {s.duration ? `${s.duration} min` : ""}{s.duration && s.mode ? " · " : ""}{s.mode || ""}
                      </span>

                      <span style={{ fontWeight: 900, fontSize: 15, color: primaryColor }}>
                        {formatCurrency(Number(s.price) || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}