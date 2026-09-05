import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Video, Users } from "lucide-react";
import { apiFetch, unwrap } from "../../utils/api";
import colors from "../../utils/colors";
import {
  GradientButton,
  Spinner,
  EmptyState,
  Badge,
} from "../../components/ui";
import { formatCurrency } from "../../utils/formatters";

const PAGE_SIZE = 12;

export default function ExploreWebinars() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("soonest");
  const debounce = useRef(null);

  const fetchPage = async (p, q, append = false) => {
    setLoading(true);
    try {
      const path = `/webinars?page=${p}&limit=${PAGE_SIZE}&upcoming=true${q ? `&search=${encodeURIComponent(q)}` : ""}`;
      const res = await apiFetch(path);
      const d = unwrap(res);
      const list = (d?.webinars || (Array.isArray(d) ? d : [])).filter(
        (w) => !w.is_enrolled,
      );
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

  const categories = useMemo(() => {
    const set = new Set(items.map((w) => w.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  const creators = useMemo(() => {
    const set = new Set(items.map((w) => w.creator?.name).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];

    if (categoryFilter !== "All") {
      list = list.filter((w) => w.category === categoryFilter);
    }
    if (priceFilter === "free") {
      list = list.filter((w) => Number(w.price) === 0);
    } else if (priceFilter === "paid") {
      list = list.filter((w) => Number(w.price) > 0);
    }
    if (creatorFilter !== "all") {
      list = list.filter((w) => w.creator?.name === creatorFilter);
    }

    list.sort((a, b) => {
      if (sortOrder === "price_desc") return (b.price || 0) - (a.price || 0);
      if (sortOrder === "price_asc") return (a.price || 0) - (b.price || 0);
      return new Date(a.scheduled_at || 0) - new Date(b.scheduled_at || 0); // soonest first
    });

    return list;
  }, [items, categoryFilter, priceFilter, creatorFilter, sortOrder]);

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
          Explore Webinars
        </h1>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            color: colors.user.subHeading,
          }}
        >
          Join live sessions hosted by creators. Learn directly, in real time.
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
            placeholder="Search webinars, topics, or creators..."
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

        {/* Category chips */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: `1px solid ${categoryFilter === c ? "transparent" : colors.user.border}`,
                background:
                  categoryFilter === c
                    ? colors.gradients.heroWarm
                    : colors.user.card,
                color: categoryFilter === c ? "#FFFFFF" : colors.user.text,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Sort + filters */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 14,
            alignItems: "center",
          }}
        >
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="soonest">Soonest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
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

          <span style={{ marginLeft: "auto" }}>
            <Badge color={colors.user.accent} bg="rgba(189,194,255,0.12)">
              📅 {filtered.length} upcoming
            </Badge>
          </span>
        </div>

        {loading && items.length === 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="mn-shimmer"
                style={{
                  height: 240,
                  borderRadius: 16,
                  background: colors.user.cardSoft,
                  border: `1px solid ${colors.user.border}`,
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📡"
            title="No webinars found"
            subtitle={
              search ? `Nothing matches "${search}"` : "Check back soon."
            }
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((w) => (
              <div
                key={w.id}
                onClick={() => navigate(`/app/webinar/${w.id}`)}
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
                  {w.thumbnail_url || w.thumbnail ? (
                    <img
                      src={w.thumbnail_url || w.thumbnail}
                      alt={w.title}
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
                  {w.max_participants && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 6,
                        fontSize: 12,
                        color: colors.user.subHeading,
                      }}
                    >
                      <Users size={12} />{" "}
                      {w._count?.enrollments ?? w.enrollment_count ?? 0} /{" "}
                      {w.max_participants} seats
                    </div>
                  )}
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
              {loading ? <Spinner size={16} light /> : "Load more webinars"}
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
