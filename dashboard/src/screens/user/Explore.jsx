import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Star, Clock, BookOpen, Video } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import {
  GradientButton,
  Spinner,
  EmptyState,
  Badge,
} from "../../components/ui";
import { formatCurrency } from "../../utils/formatters";

const PAGE_SIZE = 8;

export default function Explore() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(
    params.get("tab") === "webinars" ? "webinars" : "courses",
  );
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const debounce = useRef(null);

  const fetchPage = async (p, q, t, append = false) => {
    setLoading(true);
    try {
      const path =
        t === "courses"
          ? `/courses?page=${p}&limit=${PAGE_SIZE}${q ? `&search=${encodeURIComponent(q)}` : ""}`
          : `/webinars?page=${p}&limit=${PAGE_SIZE}&upcoming=true${q ? `&search=${encodeURIComponent(q)}` : ""}`;
      const res = await apiFetch(path);
      const d = unwrap(res);
      const list = d?.courses || d?.webinars || (Array.isArray(d) ? d : []);
      const filtered =
        t === "webinars" ? list.filter((w) => !w.is_enrolled) : list;
      setItems((prev) => (append ? [...prev, ...filtered] : filtered));
      setTotalPages(d?.pagination?.total_pages || 1);
    } catch {
      if (!append) setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPage(1, search, tab);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearch = (v) => {
    setSearch(v);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setPage(1);
      fetchPage(1, v, tab);
    }, 400);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, search, tab, true);
  };

  const cardBase = {
    background: colors.user.card,
    border: `1px solid ${colors.user.border}`,
    borderRadius: 16,
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.15s ease, border-color 0.15s ease",
  };

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
          Explore
        </h1>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: colors.user.card,
            border: `1px solid ${colors.user.border}`,
            borderRadius: 14,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <Search size={18} color={colors.user.subHeading} />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search webinars, topics, or experts..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: colors.user.text,
              fontSize: 15,
            }}
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "inline-flex",
            background: colors.user.card,
            borderRadius: 999,
            padding: 4,
            marginBottom: 22,
            border: `1px solid ${colors.user.border}`,
          }}
        >
          {["courses", "webinars"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "12px 36px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 800,
                textTransform: "capitalize",
                background:
                  tab === t ? colors.gradients.heroWarm : "transparent",
                color: tab === t ? "#FFFFFF" : colors.user.subHeading,
                transition: "all 0.2s ease",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && items.length === 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="mn-shimmer"
                style={{
                  height: 220,
                  borderRadius: 16,
                  background: colors.user.cardSoft,
                  border: `1px solid ${colors.user.border}`,
                }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={`No ${tab} found`}
            subtitle={
              search ? `Nothing matches "${search}"` : "Check back soon."
            }
          />
        ) : tab === "courses" ? (
          <>
            <h3
              style={{
                margin: "0 0 14px",
                fontSize: 16,
                fontWeight: 800,
                color: colors.user.subHeading,
              }}
            >
              Popular Courses
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              {items.map((c) => {
                const duration =
                  Array.isArray(c.videos) && c.videos.length
                    ? Math.round(
                        c.videos.reduce(
                          (s, v) => s + (Number(v.duration) || 0),
                          0,
                        ) / 60,
                      )
                    : c.duration || 0;
                return (
                  <div
                    key={c.id}
                    style={cardBase}
                    onClick={() => navigate(`/app/course/${c.id}`)}
                  >
                    <div
                      style={{
                        height: 140,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {c.thumbnail_url || c.thumbnail ? (
                        <>
                          <div
                            style={{
                              position: "absolute",
                              inset: -10,
                              backgroundImage: `url(${c.thumbnail_url || c.thumbnail})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              filter: "blur(18px) brightness(0.7)",
                              transform: "scale(1.15)",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              backgroundImage: `url(${c.thumbnail})`,
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
                              colors.gradients?.heroWarm ||
                              "linear-gradient(135deg, #1F2937 0%, #2B52F6 60%, #22C55E 130%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <BookOpen size={34} color="rgba(255,255,255,0.55)" />
                        </div>
                      )}
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          background: colors.user.card,
                          border: `1px solid ${colors.user.border}`,
                          color: colors.user.text,
                          padding: "3px 10px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {c.level || "Beginner"}
                      </span>
                    </div>
                    <div style={{ padding: 14 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 14.5,
                          minHeight: 38,
                          lineHeight: 1.35,
                          color: colors.user.text,
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginTop: 8,
                          color: colors.user.subHeading,
                          fontSize: 12.5,
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Star size={12} color="#F0C040" />{" "}
                          {c.average_rating || c.rating || "New"}
                        </span>
                        {duration > 0 && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Clock size={12} /> {duration} min
                          </span>
                        )}
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <BookOpen size={12} />{" "}
                          {c.videos?.length ?? c.total_videos ?? 0} lessons
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          fontWeight: 900,
                          fontSize: 16,
                          color: colors.user.accent,
                        }}
                      >
                        {Number(c.price) > 0 ? formatCurrency(c.price) : "Free"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <Badge color={colors.user.accent} bg="rgba(189,194,255,0.12)">
                📅 {items.length} upcoming
              </Badge>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 16,
              }}
            >
              {items.map((w) => (
                <div
                  key={w.id}
                  style={cardBase}
                  onClick={() => navigate(`/app/webinar/${w.id}`)}
                >
                  <div
                    style={{
                      height: 140,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {w.thumbnail_url || w.thumbnail ? (
                      <>
                        <div
                          style={{
                            position: "absolute",
                            inset: -10,
                            backgroundImage: `url(${w.thumbnail_url || w.thumbnail})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "blur(18px) brightness(0.7)",
                            transform: "scale(1.15)",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${w.thumbnail})`,
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
                            colors.gradients?.heroWarm ||
                            "linear-gradient(135deg, #1F2937 0%, #2B52F6 60%, #22C55E 130%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Video size={34} color="rgba(255,255,255,0.55)" />
                      </div>
                    )}
                    <span
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        background: "rgba(0,0,0,0.65)",
                        color: "#FFFFFF",
                        padding: "4px 12px",
                        borderRadius: 99,
                        fontSize: 13,
                        fontWeight: 800,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {Number(w.price) > 0 ? formatCurrency(w.price) : "Free"}
                    </span>
                  </div>
                  <div style={{ padding: 14 }}>
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
                        marginTop: 6,
                      }}
                    >
                      📅{" "}
                      {w.scheduled_at
                        ? new Date(w.scheduled_at).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "TBA"}{" "}
                      · {w.creator?.name || "Creator"}
                    </div>
                    <GradientButton
                      size="sm"
                      gradient={colors.gradients.greenButtonDark}
                      full
                      style={{ marginTop: 12 }}
                    >
                      Register Now
                    </GradientButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Load more */}
        {page < totalPages && (
          <div style={{ textAlign: "center", marginTop: 26 }}>
            <button
              onClick={loadMore}
              disabled={loading}
              style={{
                background: colors.user.card,
                border: `1px solid ${colors.user.border}`,
                color: colors.user.text,
                borderRadius: 999,
                padding: "10px 28px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {loading ? <Spinner size={16} light /> : "Load more"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
