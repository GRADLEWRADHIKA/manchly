import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BookOpen,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Rocket,
  ArrowRight,
  FileText,
  Target,
  Sparkles,
  Search,
  IndianRupee,
} from "lucide-react";
import { apiFetch, unwrap } from "../../../utils/api";
import colors from "../../../utils/colors";
import Sidebar from "../../../components/Sidebar";
import TopHeader from "../../../components/TopHeader";
import { formatCurrency } from "../../../utils/formatters";
import VerificationBanner from "../../../components/VerificationBanner";
import StatCard from "./components/StatCard";
import CourseCard from "./components/CourseCard";
import { toast } from "../../../utils/toast";
import { withLegacyCategories } from "../../../utils/categories";

function val(result) {
  if (result.status !== "fulfilled") return null;
  return unwrap(result.value);
}

const iconButtonStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "none",
  background: "rgba(0,0,0,0.04)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export default function CoursesScreen({ user, onNavigate, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [courseList, setCourseList] = useState([]);
  const [courseStats, setCourseStats] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [plannerNiche, setPlannerNiche] = useState("");
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerError, setPlannerError] = useState("");

  const handleGeneratePlan = async (nicheOverride) => {
    const query = (nicheOverride ?? plannerNiche).trim();
    if (!query) return;

    setPlannerLoading(true);
    setPlannerError("");

    try {
      const response = await apiFetch("/ai/course/plan", {
        method: "POST",
        body: JSON.stringify({ niche: query }),
      });
      const plan = unwrap(response);
      if (!plan || typeof plan !== "object") {
        throw new Error("No plan returned");
      }
      onNavigate?.("course-planner", { plan, niche: query });
    } catch (err) {
      console.error("Failed to generate course plan", err);
      setPlannerError(err?.message || "Couldn't generate a plan. Try again.");
    } finally {
      setPlannerLoading(false);
    }
  };

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");

    const [courses, stats, wallet, kyc] = await Promise.allSettled([
      apiFetch("/courses?my_courses=true"),
      apiFetch("/courses/stats/creator"),
      apiFetch("/settlements/wallet"),
      apiFetch("/kyc/status"),
    ]);

    const coursesData = val(courses);
    const allCourses = Array.isArray(coursesData)
      ? coursesData
      : coursesData?.courses || [];

    const currentUserId = user?.id ?? user?._id ?? user?.user_id;

    const myCourses = allCourses.filter((c) => {
      if (!currentUserId) return true;

      const targetIdStr = String(currentUserId);

      const possibleCreatorIds = [
        c?.creator_id,
        c?.creator?.id,
        c?.creator?._id,
        c?.user_id,
        c?.userId,
        c?.creatorId,
        c?.author_id,
        c?.authorId,
        c?.created_by,
        c?.createdBy,
      ]
        .filter((v) => v !== undefined && v !== null)
        .map((v) => String(v));

      if (possibleCreatorIds.length === 0) return true;
      return possibleCreatorIds.includes(targetIdStr);
    });

    setCourseList(myCourses);
    setCourseStats(val(stats)?.statistics || val(stats) || null);

    const wd = val(wallet);
    setWalletData(wd?.wallet || wd || null);

    setKycStatus(val(kyc));

    if ([courses, stats, wallet, kyc].every((r) => r.status === "rejected")) {
      setError("Unable to connect to the server.");
    }

    setLoading(false);
  }, [user]);

  const allCount = courseList.length;
  const publishedCount = courseList.filter(
    (c) =>
      String(c?.status || "").toLowerCase() === "published" ||
      c?.is_published === true,
  ).length;
  const draftCount = allCount - publishedCount;

  const handleAddUser = async (course, identifier) => {
    const id = course?.id || course?._id;
    if (!id) return;
    const response = await apiFetch(`/courses/${id}/grant`, {
      method: "POST",
      body: JSON.stringify(identifier),
    });
    const data = unwrap(response);
    if (data?.alreadyEnrolled) {
      toast.info("This user already has access to the course.");
    } else {
      toast.success("Access granted successfully.");
    }
  };

  const handleCourseSave = async (updatedCourse) => {
    const id = updatedCourse?.id || updatedCourse?._id;
    if (!id) return;

    try {
      const response = await apiFetch(`/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: updatedCourse.title,
          description: updatedCourse.description,
          thumbnail: updatedCourse.thumbnail,
          thumbnail_url: updatedCourse.thumbnail_url,
          price: updatedCourse.price,
          status: (updatedCourse.status || "draft").toUpperCase(),
        }),
      });

      const saved = unwrap(response)?.course;

      setCourseList((prev) =>
        prev.map((c) =>
          (c.id || c._id) === id ? { ...c, ...(saved || updatedCourse) } : c,
        ),
      );
    } catch (err) {
      console.error("Failed to save course", err);
    }
  };

  const handleCourseDelete = async (course) => {
    const id = course?.id || course?._id;
    if (!id) return;

    const confirmed = window.confirm(
      `Delete "${course?.title || "this course"}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/courses/${id}`, { method: "DELETE" });
      setCourseList((prev) => prev.filter((c) => (c.id || c._id) !== id));
      toast.success("Course deleted successfully.");
    } catch (err) {
      console.error("Failed to delete course:", err);
      toast.error(err?.message || "Failed to delete course.");
    }
  };

  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiFetch("/notifications/unread-count");
      const data = unwrap(response);
      const count = Number(data?.count ?? data?.unread_count ?? data ?? 0) || 0;
      setHasUnreadNotifications(count > 0);
    } catch (err) {
      console.error("Failed to load notifications", err);
      setHasUnreadNotifications(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
    loadNotifications();
  }, [loadCourses, loadNotifications]);

  useEffect(() => {
    console.log("USER OBJECT:", user);
  }, [user]);

  useEffect(() => {
    if (courseList.length) console.log("SAMPLE COURSE:", courseList[0]);
  }, [courseList]);

  const isKycVerified = kycStatus
    ? !!(
        kycStatus.verified ??
        kycStatus.is_verified ??
        kycStatus.status === "verified"
      )
    : !!user?.kyc_verified;

  const totalRevenue = courseStats?.revenue ?? 0;
  const totalUsers =
    courseStats?.total_students ?? courseStats?.total_enrollments ?? null;
  const totalCourses = courseStats?.total_courses ?? courseList.length ?? 0;
  const publishedCourses = courseStats?.published_courses ?? 0;
  const draftCourses = Math.max(totalCourses - publishedCourses, 0);
  const completionRate = courseStats?.completion_rate ?? null;

  const lifetimeEarnings =
    walletData?.lifetime_earnings ??
    walletData?.total_earnings ??
    walletData?.total_revenue ??
    0;
  const walletBalance =
    walletData?.available_balance ??
    walletData?.balance ??
    walletData?.available ??
    0;

 const categories = useMemo(
  () => withLegacyCategories(courseList.map((c) => c?.category)),
  [courseList],
);

  const filteredCourses = useMemo(() => {
    let list = [...courseList];

    if (statusFilter !== "all") {
      list = list.filter((c) => {
        const isPublished =
          String(c?.status || "").toLowerCase() === "published" ||
          c?.is_published === true;
        return statusFilter === "published" ? isPublished : !isPublished;
      });
    }

    if (categoryFilter !== "all") {
      list = list.filter((c) => c?.category === categoryFilter);
    }

    if (dateFilter !== "all") {
      const days = Number(dateFilter);
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      list = list.filter((c) => {
        const created = new Date(c?.created_at || c?.updated_at || 0).getTime();
        return created >= cutoff;
      });
      console.log(
        "DATE FILTER:",
        dateFilter,
        "→",
        list.length,
        "courses match",
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((c) =>
        (c?.title || c?.name || " ").toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      if (sortOrder === "price_desc") return (b?.price ?? 0) - (a?.price ?? 0);
      if (sortOrder === "price_asc") return (a?.price ?? 0) - (b?.price ?? 0);

      const aDate = new Date(a?.created_at || a?.updated_at || 0).getTime();
      const bDate = new Date(b?.created_at || b?.updated_at || 0).getTime();
      return sortOrder === "oldest" ? aDate - bDate : bDate - aDate;
    });

    return list;
  }, [
    courseList,
    statusFilter,
    categoryFilter,
    dateFilter,
    searchQuery,
    sortOrder,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const visibleCourses = filteredCourses.slice(pageStart, pageStart + pageSize);

  const handleNewCourse = () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("activeCourseId");
    }
    onNavigate?.("course-create");
  };
  const handleWithdraw = () => onNavigate?.("withdraw");
  const handleNotifications = () => onNavigate?.("notifications");
  const handleCourseEdit = (course) =>
    onNavigate?.("course-edit", { courseId: course?.id });
  const handleCourseView = (course) =>
    onNavigate?.("course-preview", { courseId: course?.id });
  const handleCourseDuplicate = (course) =>
    onNavigate?.("course-duplicate", { courseId: course?.id });
  const handleCourseEditVideos = (course) =>
    onNavigate?.("course-create-video", { courseId: course?.id });

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          backgroundColor: colors.base.appBackground,
          minHeight: "100vh",
        }}
      >
        <Sidebar active="courses" onNavigate={onNavigate} onLogout={onLogout} />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: colors.typography.primaryText,
          }}
        >
          Loading courses...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        backgroundColor: colors.base.appBackground,
        minHeight: "100vh",
      }}
    >
      <Sidebar active="courses" onNavigate={onNavigate} onLogout={onLogout} />

      <div style={{ flex: 1, minWidth: 0, padding: 32 }}>
        <TopHeader
          totalRevenue={lifetimeEarnings}
          walletBalance={walletBalance}
          hasUnreadNotifications={hasUnreadNotifications}
          onWithdraw={handleWithdraw}
          onNotifications={handleNotifications}
        />

        {!isKycVerified && (
          <VerificationBanner
            isKycVerified={isKycVerified}
            onVerify={() => onNavigate?.("kyc")}
          />
        )}
        {error && (
          <div style={{ color: colors.brand.errorRed || "red", padding: 16 }}>
            {error}
          </div>
        )}

        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
            marginTop: 12,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 800,
                color: colors.typography.primaryText,
              }}
            >
              Live{" "}
              <span style={{ color: colors.brand.primaryOrange }}>Courses</span>
            </h1>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: 14,
                color: colors.typography.secondaryText,
              }}
            >
              Create online courses, structure modules, and publish content.
            </p>
          </div>

          <button
            type="button"
            onClick={handleNewCourse}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: colors.brand.primaryOrange,
              color: colors.typography.white,
              border: "none",
              borderRadius: 15,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
              transition: "transform 0.15s ease",
            }}
          >
            + Create Course
          </button>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard
            icon={Users}
            iconColor={colors.charts?.blue}
            label="Total Users"
            value={totalUsers != null ? totalUsers : "--"}
            subtext="--vs last month"
          />
          <StatCard
            icon={BookOpen}
            iconColor={colors.charts?.blue}
            label="Total Courses"
            value={totalCourses}
            subtext={`${publishedCourses} published · ${draftCourses} draft`}
          />
          <StatCard
            icon={IndianRupee}
            iconColor={colors.brand.primaryOrange}
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtext="--vs last month"
            highlight
          />
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Your Courses Section */}
          <div
            style={{
              background: colors.base.cardBackground,
              border: `1px solid ${colors.base.border}`,
              borderRadius: 20,
              padding: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: colors.typography.primaryText,
                }}
              >
                Your Courses{" "}
                <span
                  style={{
                    color: colors.typography.secondaryText,
                    fontWeight: 600,
                  }}
                >
                  {allCount}
                </span>
              </span>
            </div>

            {/* Search + filters row */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search your courses..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: `1px solid ${colors.base.border}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: colors.typography.primaryText,
                    background: colors.base.cardBackground,
                    outline: "none",
                  }}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  border: `1px solid ${colors.base.border}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.typography.primaryText,
                  background: colors.base.cardBackground,
                  cursor: "pointer",
                }}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  border: `1px solid ${colors.base.border}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.typography.primaryText,
                  background: colors.base.cardBackground,
                  cursor: "pointer",
                }}
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 1 year</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  border: `1px solid ${colors.base.border}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.typography.primaryText,
                  background: colors.base.cardBackground,
                  cursor: "pointer",
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="price_asc">Price: Low to High</option>
              </select>
            </div>

            {/* Tabs: All / Published / Drafts */}
            <div
              style={{
                display: "flex",
                background: "rgba(0,0,0,0.03)",
                borderRadius: 12,
                padding: 4,
                marginBottom: 20,
              }}
            >
              {[
                { key: "all", label: "All", count: allCount },
                { key: "published", label: "Published", count: publishedCount },
                { key: "draft", label: "Drafts", count: draftCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setCurrentPage(1);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 9,
                    border: "none",
                    background:
                      statusFilter === tab.key
                        ? colors.base.cardBackground
                        : "transparent",
                    color:
                      statusFilter === tab.key
                        ? colors.brand.primaryOrange
                        : colors.typography.secondaryText,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow:
                      statusFilter === tab.key
                        ? "0 1px 4px rgba(0,0,0,0.08)"
                        : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Table */}
            {visibleCourses.length === 0 ? (
              <div
                style={{
                  padding: "40px 0",
                  textAlign: "center",
                  color: colors.typography.secondaryText,
                  fontSize: 14,
                }}
              >
                No courses yet. Create your first course to see it here.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: `1px solid ${colors.base.border}`,
                      }}
                    >
                      {[
                        "",
                        "Course",
                        "Status",
                        "Price",
                        "Students",
                        "Revenue",
                        "Updated",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: h === "Actions" ? "right" : "left",
                            padding: "10px 8px",
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: colors.typography.secondaryText,
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCourses.map((course) => (
                      <CourseCard
                        key={course?.id || course?._id || course?.title}
                        course={course}
                        onEdit={handleCourseEdit}
                        onSave={handleCourseSave}
                        onView={handleCourseView}
                        onDuplicate={handleCourseDuplicate}
                        onDelete={handleCourseDelete}
                        onAddUser={handleAddUser}
                        onEditVideos={handleCourseEditVideos}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredCourses.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: `1px solid ${colors.base.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: colors.typography.secondaryText,
                  }}
                >
                  Showing {pageStart + 1} to{" "}
                  {Math.min(pageStart + pageSize, filteredCourses.length)} of{" "}
                  {filteredCourses.length} courses
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      ...iconButtonStyle,
                      opacity: currentPage === 1 ? 0.4 : 1,
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: "none",
                          background:
                            page === currentPage
                              ? colors.brand.primaryOrange
                              : "rgba(0,0,0,0.04)",
                          color:
                            page === currentPage
                              ? colors.typography.white
                              : colors.typography.primaryText,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      ...iconButtonStyle,
                      opacity: currentPage === totalPages ? 0.4 : 1,
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Planner Card */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 24,
              padding: "34px 38px",
              background:
                "linear-gradient(120deg, #FFF7EE 0%, #FFE7C7 55%, #FFD9A6 100%)",
              border: `1px solid ${colors.brand.primaryOrange}22`,
              boxShadow: "0 8px 24px rgba(255,107,0,0.14)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              <div style={{ maxWidth: 560 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#fff",
                    border: `1px solid ${colors.brand.primaryOrange}55`,
                    color: colors.brand.primaryOrange,
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 11.5,
                    fontWeight: 800,
                    letterSpacing: 0.6,
                    marginBottom: 16,
                  }}
                >
                  <Rocket size={13} /> AI COURSE PLANNER
                </div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 34,
                    fontWeight: 900,
                    color: "#0F172A",
                    lineHeight: 1.15,
                  }}
                >
                  Plan Your Next Course
                </h1>
                <p
                  style={{
                    margin: "10px 0 20px",
                    fontSize: 14.5,
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  Turn your knowledge into a complete go-to-market plan —
                  curriculum, audience strategy and launch timeline, in seconds.
                </p>

                {/* Working search + generate row */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
                    <Search
                      size={17}
                      color="#94A3B8"
                      style={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                    <input
                      value={plannerNiche}
                      onChange={(e) => setPlannerNiche(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleGeneratePlan()
                      }
                      placeholder="e.g. Stock Market for Beginners, Freelance Design, Yoga…"
                      disabled={plannerLoading}
                      style={{
                        width: "100%",
                        padding: "13px 17px 13px 42px",
                        borderRadius: 10,
                        border: "1.5px solid rgba(0,0,0,0.08)",
                        fontSize: 14,
                        color: "#0F172A",
                        background: "#fff",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGeneratePlan()}
                    disabled={!plannerNiche.trim() || plannerLoading}
                    style={{
                      background: colors.brand.primaryOrange,
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "13px 24px",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor:
                        plannerNiche.trim() && !plannerLoading
                          ? "pointer"
                          : "not-allowed",
                      opacity: plannerNiche.trim() && !plannerLoading ? 1 : 0.5,
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {plannerLoading ? "Generating…" : "Generate Plan"}
                    {!plannerLoading && <ArrowRight size={15} />}
                  </button>
                </div>

                {plannerError && (
                  <div
                    style={{ color: "#DC2626", fontSize: 12.5, marginTop: 10 }}
                  >
                    {plannerError}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 22 }}>
                {[
                  {
                    icon: <FileText size={20} color="#FF6B00" />,
                    bg: "rgba(255,107,0,0.14)",
                    label: ["Curriculum", "Outline"],
                  },
                  {
                    icon: <Target size={20} color="#E23F7A" />,
                    bg: "rgba(226,63,122,0.12)",
                    label: ["Audience", "Strategy"],
                  },
                  {
                    icon: <TrendingUp size={20} color="#16A34A" />,
                    bg: "rgba(22,163,74,0.12)",
                    label: ["Launch", "Timeline"],
                  },
                ].map((f) => (
                  <div
                    key={f.label.join(" ")}
                    style={{ textAlign: "center", minWidth: 74 }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        background: f.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 8px",
                      }}
                    >
                      {f.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "#1E293B",
                        lineHeight: 1.35,
                      }}
                    >
                      {f.label[0]}
                      <br />
                      {f.label[1]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative floating card */}
            <div
              style={{
                position: "absolute",
                right: -10,
                bottom: -18,
                width: 130,
                height: 90,
                background: "#fff",
                borderRadius: 14,
                boxShadow: "0 14px 30px rgba(0,0,0,0.12)",
                transform: "rotate(8deg)",
                padding: 14,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: "70%",
                  height: 6,
                  background: "#E2E8F0",
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  width: "90%",
                  height: 6,
                  background: "#E2E8F0",
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  width: "55%",
                  height: 6,
                  background: "#E2E8F0",
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -10,
                  right: -10,
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: colors.brand.primaryOrange,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                AI
              </div>
              <Sparkles
                size={14}
                color={colors.brand.primaryOrange}
                style={{ position: "absolute", top: -10, right: 10 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
