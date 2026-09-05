import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock, BookOpen } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import { GradientButton, Spinner, EmptyState } from "../../components/ui";
import { formatCurrency } from "../../utils/formatters";

const PAGE_SIZE = 12;

export default function ExploreCourses() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const debounce = useRef(null);

  const fetchPage = async (p, q, append = false) => {
    setLoading(true);
    try {
      const path = `/courses?page=${p}&limit=${PAGE_SIZE}${q ? `&search=${encodeURIComponent(q)}` : ""}`;
      const res = await apiFetch(path);
      const d = unwrap(res);
      const list = d?.courses || (Array.isArray(d) ? d : []);
      setItems((prev) => (append ? [...prev, ...list] : list));
      setTotalPages(d?.pagination?.total_pages || 1);
    } catch {
      if (!append) setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1, search);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (v) => {
    setSearch(v);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setPage(1);
      fetchPage(1, v);
    }, 400);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, search, true);
  };

  // Derive real filter option sets from loaded data
  const categories = useMemo(() => {
    const set = new Set(items.map((c) => c.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  const creators = useMemo(() => {
    const set = new Set(items.map((c) => c.creator?.name).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];

    if (categoryFilter !== "All") {
      list = list.filter((c) => c.category === categoryFilter);
    }
    if (levelFilter !== "all") {
      list = list.filter((c) => (c.level || "").toLowerCase() === levelFilter);
    }
    if (priceFilter === "free") {
      list = list.filter((c) => Number(c.price) === 0);
    } else if (priceFilter === "paid") {
      list = list.filter((c) => Number(c.price) > 0);
    }
    if (creatorFilter !== "all") {
      list = list.filter((c) => c.creator?.name === creatorFilter);
    }

    list.sort((a, b) => {
      if (sortOrder === "price_desc") return (b.price || 0) - (a.price || 0);
      if (sortOrder === "price_asc") return (a.price || 0) - (b.price || 0);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return list;
  }, [
    items,
    categoryFilter,
    levelFilter,
    priceFilter,
    creatorFilter,
    sortOrder,
  ]);

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
            margin: "0 0 6px",
            fontSize: 26,
            fontWeight: 900,
            color: colors.user.text,
          }}
        >
          Explore Courses
        </h1>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            color: colors.user.subHeading,
          }}
        >
          Learn new skills from top creators. Choose what interests you and
          start today.
        </p>

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
            placeholder="Search courses, topics, or creators..."
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

        {/* Sort + filters */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="all">All Prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>

          <select
            value={creatorFilter}
            onChange={(e) => setCreatorFilter(e.target.value)}
            style={filterSelectStyle}
          >
            {creators.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Creators" : c}
              </option>
            ))}
          </select>

          <span
            style={{
              marginLeft: "auto",
              fontSize: 13,
              color: colors.user.subHeading,
            }}
          >
            {filtered.length} courses
          </span>
        </div>

        {loading && items.length === 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="mn-shimmer"
                style={{
                  height: 260,
                  borderRadius: 16,
                  background: colors.user.cardSoft,
                  border: `1px solid ${colors.user.border}`,
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No courses found"
            subtitle={
              search ? `Nothing matches "${search}"` : "Try a different filter."
            }
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((c) => {
              const duration =
                Array.isArray(c.videos) && c.videos.length
                  ? Math.round(
                      c.videos.reduce(
                        (s, v) => s + (Number(v.duration) || 0),
                        0,
                      ) / 60,
                    )
                  : 0;
              const lessons = c.videos?.length ?? c.total_videos ?? 0;
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/app/course/${c.id}`)}
                  style={{
                    background: colors.user.card,
                    border: `1px solid ${colors.user.border}`,
                    borderRadius: 16,
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "16 / 9",
                      width: "100%",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {c.thumbnail_url || c.thumbnail ? (
                      <img
                        src={c.thumbnail_url || c.thumbnail}
                        alt={c.title}
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
                          background: colors.gradients?.heroWarm,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BookOpen size={34} color="rgba(255,255,255,0.55)" />
                      </div>
                    )}
            
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
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (c.creator?.id)
                          navigate(`/app/creator/${c.creator.id}`);
                      }}
                      style={{
                        fontSize: 12.5,
                        color: colors.user.subHeading,
                        marginTop: 6,
                        cursor: c.creator?.id ? "pointer" : "default",
                        width: "fit-content",
                      }}
                      onMouseEnter={(e) => {
                        if (c.creator?.id)
                          e.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = "none";
                      }}
                    >
                      by {c.creator?.name || "Creator"}
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
  {c.level && (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        fontWeight: 700,
        color: colors.user.text,
      }}
    >
      {c.level}
    </span>
  )}
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
    <BookOpen size={12} /> {lessons} Videos
  </span>
</div>
                    <GradientButton
                      size="sm"
                      gradient={colors.gradients.greenButtonDark}
                      full
                      style={{ marginTop: 10 }}
                    >
                     {Number(c.price) > 0 ? formatCurrency(c.price) : "Free"}
                    </GradientButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
              }}
            >
              {loading ? <Spinner size={16} light /> : "Load more courses"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

const filterSelectStyle = {
  border: `1px solid ${colors.user.border}`,
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 600,
  background: colors.user.card,
  color: colors.user.text,
  cursor: "pointer",
};
