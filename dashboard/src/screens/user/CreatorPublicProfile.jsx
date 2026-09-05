import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, BadgeCheck, PlayCircle } from "lucide-react";

import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { Avatar, Spinner, EmptyState } from "../../components/ui";
import { formatCurrency } from "../../utils/formatters";

export default function CreatorPublicProfile() {
  const { creatorId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCreatorProfile = async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await apiFetch(`/creator/${creatorId}/public`);
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

    if (creatorId) {
      fetchCreatorProfile();
    } else {
      setError(true);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [creatorId]);

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

  // Safely format external URLs to protect against invalid or malicious protocol inputs
  const sanitizeUrl = (url) => {
    if (!url) return null;
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  const socialLinks = [
    { key: "instagram", label: "Instagram", url: sanitizeUrl(data.links?.instagram) },
    { key: "linkedin", label: "LinkedIn", url: sanitizeUrl(data.links?.linkedin) },
    { key: "youtube", label: "YouTube", url: sanitizeUrl(data.links?.youtube) },
    { key: "facebook", label: "Facebook", url: sanitizeUrl(data.links?.facebook) },
  ].filter((link) => Boolean(link.url));

  const courses = Array.isArray(data.courses) ? data.courses : [];
  const creatorName = data.name || "Creator";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1000,
        margin: "0 auto",
        padding: "20px 16px",
        boxSizing: "border-box",
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
          background: "transparent",
          border: "none",
          color: colors.user?.subHeading || "#64748B",
          fontSize: 13.5,
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 20,
          fontFamily: "inherit",
          padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Profile Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <Avatar
          src={data.profile_image}
          name={creatorName}
          size={88}
        />

        <div style={{ flex: 1, minWidth: 200 }}>
          {/* Name + Verification */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 900,
                color: colors.user?.text || "#0F172A",
              }}
            >
              {creatorName}
            </h1>

            {data.kyc_verified && (
              <BadgeCheck
                size={18}
                color="#2563EB"
                aria-label="Verified creator"
              />
            )}
          </div>

          {/* Niche + City */}
          {(data.niche || data.city) && (
            <div
              style={{
                marginTop: 4,
                fontSize: 13.5,
                color: colors.user?.subHeading || "#64748B",
              }}
            >
              {[data.niche, data.city].filter(Boolean).join(" · ")}
            </div>
          )}

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              {socialLinks.map(({ key, label, url }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  style={{
                    width: "auto",
                    height: 34,
                    padding: "0 12px",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    border: `1px solid ${colors.user?.border || "#E2E8F0"}`,
                    color: colors.user?.text || "#0F172A",
                    fontSize: 12.5,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  {label} <ExternalLink size={13} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {data.bio && (
        <p
          style={{
            marginTop: 20,
            marginBottom: 0,
            fontSize: 14.5,
            lineHeight: 1.6,
            color: colors.user?.text || "#0F172A",
          }}
        >
          {data.bio}
        </p>
      )}

      {/* Courses Section */}
      <h2
        style={{
          marginTop: 36,
          marginBottom: 16,
          fontSize: 17,
          fontWeight: 800,
          color: colors.user?.text || "#0F172A",
        }}
      >
        Courses by {creatorName}
      </h2>

      {/* Courses Grid / Empty State */}
      {courses.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No published courses yet"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {courses.map((course) => {
            const videoCount = Number(course.total_videos) || 0;
            const coursePrice = Number(course.price) || 0;
            const thumbnailUrl = course.thumbnail_url || course.thumbnail;

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
                  background: colors.user?.card || "#FFFFFF",
                  border: `1px solid ${colors.user?.border || "#E2E8F0"}`,
                  borderRadius: 16,
                  overflow: "hidden",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {/* Course Thumbnail */}
                <div
                  style={{
                    aspectRatio: "16 / 9",
                    width: "100%",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={course.title || "Course thumbnail"}
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
                        background:
                          colors.gradients?.heroWarm || "#F8FAFC",
                      }}
                    />
                  )}
                </div>

                {/* Course Details */}
                <div style={{ padding: 14 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 14,
                      color: colors.user?.text || "#0F172A",
                      lineHeight: 1.4,
                    }}
                  >
                    {course.title || "Untitled Course"}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 10,
                    }}
                  >
                    {/* Video Count */}
                    <span
                      style={{
                        fontSize: 12,
                        color: colors.user?.subHeading || "#64748B",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <PlayCircle size={12} />
                      {videoCount} {videoCount === 1 ? "video" : "videos"}
                    </span>

                    {/* Price */}
                    <span
                      style={{
                        fontWeight: 900,
                        fontSize: 14,
                        color: colors.user?.accent || "#2563EB",
                      }}
                    >
                      {coursePrice > 0
                        ? formatCurrency(coursePrice)
                        : "Free"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}