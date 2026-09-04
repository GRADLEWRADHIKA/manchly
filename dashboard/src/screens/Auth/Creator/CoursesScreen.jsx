import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BookOpen,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { apiFetch, unwrap } from "../../../utils/api";
import colors from "../../../utils/colors";
import computer from "../../../assets/Images/computer.png";
import Sidebar from "../../../components/Sidebar";
import TopHeader from "../../../components/TopHeader";
import { formatCurrency } from "../../../utils/formatters";
import VerificationBanner from "../../../components/VerificationBanner";
import StatCard from "./components/StatCard";
import InsightRow from "./components/InsightRow";
import CourseCard from "./components/CourseCard";
import { toast } from "../../../utils/toast";

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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");

    const [courses, stats, wallet, kyc] = await Promise.allSettled([
      apiFetch("/courses"),
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
      c?.is_published === true
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
          (c.id || c._id) === id ? { ...c, ...(saved || updatedCourse) } : c
        )
      );
    } catch (err) {
      console.error("Failed to save course", err);
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

  const kycLabel = isKycVerified ? "Verified" : "Pending";
  const monthlyGrowth =
    courseStats?.monthly_growth != null
      ? `${courseStats.monthly_growth}%`
      : null;
  const conversionRate =
    courseStats?.conversion_rate != null
      ? `${courseStats.conversion_rate}%`
      : null;
  const refundRate =
    courseStats?.refund_rate != null ? `${courseStats.refund_rate}%` : null;
  const avgOrderValue =
    courseStats?.avg_order_value != null
      ? formatCurrency(courseStats.avg_order_value)
      : null;

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

  const categories = useMemo(() => {
    const set = new Set(courseList.map((c) => c?.category).filter(Boolean));
    return Array.from(set);
  }, [courseList]);

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

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((c) =>
        (c?.title || c?.name || " ").toLowerCase().includes(q)
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
  }, [courseList, statusFilter, categoryFilter, searchQuery, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const visibleCourses = filteredCourses.slice(pageStart, pageStart + pageSize);

  const handleNewCourse = () => onNavigate?.("course-create");
  const handleVerify = () => onNavigate?.("kyc-verification");
  const handleWithdraw = () => onNavigate?.("withdraw");
  const handleNotifications = () => onNavigate?.("notifications");
  const handleCourseEdit = (course) =>
    onNavigate?.("course-studio", { courseId: course?.id });
  const handleCourseView = (course) =>
    onNavigate?.("course-preview", { courseId: course?.id });
  const handleCourseDuplicate = (course) =>
    onNavigate?.("course-duplicate", { courseId: course?.id });
  const handleCourseMore = (course) =>
    onNavigate?.("course-manage", { courseId: course?.id });

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

        <VerificationBanner
          isKycVerified={isKycVerified}
          onVerify={handleVerify}
        />

        {error && (
          <div style={{ color: colors.brand.errorRed || "red", padding: 16 }}>
            {error}
          </div>
        )}

        {/* Hero Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 32,
            background: colors.brand.noticeBlue,
            borderRadius: 24,
            padding: 40,
            marginBottom: 32,
            border: `1px solid ${colors.base.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 560,
            }}
          >
            <span
              style={{
                textTransform: "uppercase",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                color: colors.brand.primaryOrange,
              }}
            >
              Course Studio
            </span>

            <h1
              style={{
                margin: 0,
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1.15,
                color: colors.typography.primaryText,
              }}
            >
              Create Once. Sell Forever.
              <br />
              <span style={{ color: colors.brand.primaryOrange }}>
                Scale Infinitely.
              </span>
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 16,
                lineHeight: 1.5,
                color: colors.typography.secondaryText,
              }}
            >
              Manage your courses, track performance, engage students, and grow
              your teaching business — all in one place.
            </p>

            <button
              type="button"
              onClick={handleNewCourse}
              style={{
                alignSelf: "flex-start",
                marginTop: 8,
                background: colors.brand.primaryOrange,
                color: colors.typography.white,
                border: "none",
                borderRadius: 12,
                padding: "12px 20px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(255, 107, 0, 0.25)",
                transition: "transform 0.15s ease",
              }}
            >
              + New Course
            </button>
          </div>

          <img
            src={computer}
            alt="Course Computer Illustration"
            style={{
              width: 350,
              maxHeight: 250,
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard
            icon={DollarSign}
            iconColor={colors.brand.primaryOrange}
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtext="--vs last month"
          />
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
            icon={TrendingUp}
            iconColor={colors.charts?.teal}
            label="Completion Rate"
            value={completionRate != null ? `${completionRate}%` : "--"}
            subtext="--vs last month"
          />
        </div>

        {/* Main Content Layout Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Your Courses Section */}
          <div
            style={{
              background: colors.base.cardBackground,
              border: `1px solid ${colors.base.border}`,
              borderRadius: 20,
              padding: 24,
            }}
          >
            {/* Header row: title + Create Course button */}
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
              <button
                type="button"
                onClick={handleNewCourse}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: colors.brand.primaryOrange,
                  color: colors.typography.white,
                  border: "none",
                  borderRadius: 10,
                  padding: "9px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Create Course
              </button>
            </div>

            {/* Tabs: All / Published / Drafts */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
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
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "none",
                    background:
                      statusFilter === tab.key
                        ? "rgba(255,107,0,0.12)"
                        : "transparent",
                    color:
                      statusFilter === tab.key
                        ? colors.brand.primaryOrange
                        : colors.typography.secondaryText,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Search + filters row */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search your courses..."
                style={{
                  flex: 1,
                  minWidth: 200,
                  border: `1px solid ${colors.base.border}`,
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 13,
                  color: colors.typography.primaryText,
                  background: colors.base.cardBackground,
                  outline: "none",
                }}
              />

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  border: `1px solid ${colors.base.border}`,
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
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
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  border: `1px solid ${colors.base.border}`,
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
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
                      style={{ borderBottom: `1px solid ${colors.base.border}` }}
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
                        onDelete={handleCourseMore}
                        onAddUser={handleAddUser}
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
                    )
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

          {/* Right Side Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Creator Insights Card */}
            <div
              style={{
                position: "relative",
                background: `linear-gradient(135deg, ${colors.base.cardBackground} 0%, rgba(255, 107, 0, 0.08) 100%)`,
                border: `1.5px solid ${colors.brand.primaryOrange}`,
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 8px 24px rgba(255, 107, 0, 0.12)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: colors.brand.primaryOrange,
                      letterSpacing: 0.8,
                    }}
                  >
                    CREATOR INSIGHTS
                  </span>
                </div>

                <InsightRow label="KYC Status" value={kycLabel} />
                <InsightRow label="Monthly Growth" value={monthlyGrowth} />
                <InsightRow label="Conversion Rate" value={conversionRate} />
                <InsightRow label="Refund Rate" value={refundRate} />
                <InsightRow label="Avg. Order Value" value={avgOrderValue} />
              </div>
            </div>

            {/* AI Planner Card */}
            <div
              onClick={() => onNavigate?.("course-planner")}
              style={{
                position: "relative",
                background: `linear-gradient(135deg, ${colors.base.cardBackground} 0%, rgba(255,107,0,0.1) 100%)`,
                border: `1.5px solid ${colors.brand.primaryOrange}`,
                borderRadius: 16,
                padding: 20,
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(255,107,0,0.14)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Rocket size={18} color={colors.brand.primaryOrange} />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: colors.brand.primaryOrange,
                        letterSpacing: 0.8,
                      }}
                    >
                      AI PLANNER
                    </span>
                  </div>
                  <span
                    style={{
                      background: colors.brand.primaryOrange,
                      color: colors.typography.white,
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    NEW
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: colors.typography.primaryText,
                    lineHeight: 1.2,
                    marginBottom: 6,
                  }}
                >
                  Plan Your Next Course
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: colors.typography.secondaryText,
                    lineHeight: 1.4,
                    marginBottom: 14,
                  }}
                >
                  Generate an AI-driven curriculum, target audience strategy,
                  and launch timeline in seconds.
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.brand.primaryOrange,
                }}
              >
                Launch Planner <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}