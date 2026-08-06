import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BookOpen,
  Users,
  Star,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  MoreHorizontal,
  BarChart2,
  Sparkles,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { apiFetch, unwrap } from "../../../utils/api";
import colors from "../../../utils/colors";
import Sidebar from "../../../components/Sidebar";
import TopHeader from "../../../components/TopHeader";
import computer from "../../../assets/Images/computer.png";

// Helper — mirrors the pattern used on DashboardScreen
function val(result) {
  if (result.status !== "fulfilled") return null;
  return unwrap(result.value);
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

// "3 days ago" / "just now" style relative time, no extra dependency
function timeAgo(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Updated just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Updated 1 day ago";
  if (days < 30) return `Updated ${days} days ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `Updated ${months}mo ago`;

  const years = Math.floor(months / 12);
  return `Updated ${years}y ago`;
}

function VerificationBanner({ isKycVerified, onVerify }) {
  if (isKycVerified) {
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: "rgba(34,197,94,0.08)",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <span style={{ color: colors.brand.successGreen, fontSize: 18 }}>
          🛡️
        </span>
        <span
          style={{
            color: colors.brand.successGreen,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Profile Verified! Your account has been successfully verified.
        </span>
      </div>
    );
  }
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        background: colors.brand.noticeBlue,
        borderRadius: 12,
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: colors.brand.actionBlue, fontSize: 18 }}>
          🛡️
        </span>
        <span
          style={{
            color: colors.brand.actionBlue,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Profile KYC not completed? Get verified tick for free now!
        </span>
      </div>
      <button
        type="button"
        onClick={onVerify}
        style={{
          background: colors.brand.actionBlue,
          color: colors.typography.white,
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Verify now
      </button>
    </div>
  );
}

// Quiet placeholder standing in for the 3D video-player illustration until a
// final asset is dropped in. Swap for an <img src="..." /> once available.
function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 320 240"
      style={{ width: "100%", height: "100%", maxWidth: 320, objectFit: "contain" }}
    >
      <rect
        x="40" y="30" width="220" height="150" rx="20"
        fill={colors.charts?.purple || "#8b5cf6"} opacity="0.12"
        transform="rotate(-6 150 105)"
      />
      <rect
        x="55" y="45" width="210" height="140" rx="18"
        fill="#ffffff" stroke={colors.base.border} strokeWidth="1.5"
      />
      <rect x="72" y="62" width="176" height="90" rx="10" fill={colors.brand.primaryOrange} opacity="0.1" />
      <circle cx="160" cy="107" r="26" fill={colors.brand.primaryOrange} />
      <path d="M152 94 L176 107 L152 120 Z" fill={colors.typography.white} />
      <rect x="72" y="162" width="176" height="6" rx="3" fill={colors.base.border} />
      <rect x="72" y="162" width="96" height="6" rx="3" fill={colors.brand.primaryOrange} />
      <circle cx="270" cy="55" r="8" fill={colors.charts?.teal || "#14b8a6"} opacity="0.7" />
      <circle cx="45" cy="190" r="6" fill={colors.charts?.blue || "#3b82f6"} opacity="0.7" />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, subtext, iconColor }) {
  return (
    <div
      style={{
        background: colors.base.cardBackground,
        border: `1px solid ${colors.base.border}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon size={16} color={iconColor} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: colors.typography.secondaryText,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: colors.typography.primaryText }}>
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: 12, color: colors.typography.secondaryText, marginTop: 4 }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

// Circular gauge — only renders a real value if the backend actually supplies
// one (courseStats?.health_score). No fabricated number is ever shown.
function HealthGauge({ score }) {
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const offset = circumference * (1 - pct / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={colors.base.border} strokeWidth={stroke}
      />
      {score != null && (
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={colors.brand.primaryOrange}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text
        x="50%" y="46%" textAnchor="middle"
        fontSize="26" fontWeight="700"
        fill={colors.typography.primaryText}
      >
        {score != null ? score : "--"}
      </text>
      <text
        x="50%" y="62%" textAnchor="middle"
        fontSize="11" fill={colors.typography.secondaryText}
      >
        /100
      </text>
    </svg>
  );
}

function HealthMetricRow({ label, value, dotColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
        <span style={{ fontSize: 13, color: colors.typography.secondaryText }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: colors.typography.primaryText }}>
        {value != null ? `${value}/100` : "--"}
      </span>
    </div>
  );
}

function InsightRow({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
      <span style={{ fontSize: 13, color: colors.typography.secondaryText }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: colors.typography.primaryText }}>
        {value ?? "--"}
      </span>
    </div>
  );
}

function CourseCard({ course, onEdit, onView, onDuplicate, onMore }) {
  const title = course?.title || course?.name || "Untitled course";
  const category = course?.category || course?.tags?.[0] || null;
  const isPublished =
    course?.status === "published" || course?.is_published === true;
  const price = course?.price ?? 0;
  const lessons = course?.lessons_count ?? course?.total_lessons ?? course?.videos?.length ?? 0;
  const students = course?.enrolled_count ?? course?.students_count ?? course?.total_students ?? 0;
  const rating = course?.rating ?? course?.average_rating ?? null;
  const reviewCount = course?.reviews_count ?? course?.rating_count ?? null;
  const progress = course?.completion_percentage ?? course?.setup_progress ?? null;
  const updated = timeAgo(course?.updated_at || course?.updatedAt);
  const thumbnail = course?.thumbnail_url || course?.thumbnail || course?.cover_image || null;

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: 16,
        border: `1px solid ${colors.base.border}`,
        borderRadius: 14,
        background: colors.base.cardBackground,
        marginBottom: 12,
        alignItems: "center",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 88,
          height: 64,
          borderRadius: 10,
          flexShrink: 0,
          background: thumbnail
            ? `url(${thumbnail}) center/cover no-repeat`
            : "rgba(0,0,0,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!thumbnail && <BookOpen size={22} color={colors.typography.secondaryText} />}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          {category && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                color: colors.charts?.blue || "#3b82f6",
                background: "rgba(59,130,246,0.1)",
                borderRadius: 6,
                padding: "2px 8px",
              }}
            >
              {category}
            </span>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: isPublished ? colors.brand.successGreen : colors.typography.secondaryText,
              background: isPublished ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.06)",
              borderRadius: 6,
              padding: "2px 8px",
            }}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: colors.typography.primaryText }}>
            {title}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: colors.brand.primaryOrange, whiteSpace: "nowrap" }}>
            {formatCurrency(price)}
          </span>
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: colors.typography.secondaryText, display: "flex", alignItems: "center", gap: 4 }}>
            <BookOpen size={13} /> {lessons} Lessons
          </span>
          <span style={{ fontSize: 12, color: colors.typography.secondaryText, display: "flex", alignItems: "center", gap: 4 }}>
            <Users size={13} /> {students} Students
          </span>
          {rating != null ? (
            <span style={{ fontSize: 12, color: colors.typography.secondaryText, display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={13} color={colors.brand.primaryOrange} fill={colors.brand.primaryOrange} />
              {rating} {reviewCount != null ? `(${reviewCount})` : ""}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: colors.typography.secondaryText }}>No ratings yet</span>
          )}
        </div>

        {progress != null && (
          <div style={{ marginTop: 10 }}>
            <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)" }}>
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, progress))}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: isPublished ? colors.brand.successGreen : colors.brand.primaryOrange,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onEdit?.(course)} title="Analytics" style={iconButtonStyle}>
            <BarChart2 size={15} color={colors.typography.secondaryText} />
          </button>
          <button onClick={() => onView?.(course)} title="View" style={iconButtonStyle}>
            <Eye size={15} color={colors.typography.secondaryText} />
          </button>
          <button onClick={() => onDuplicate?.(course)} title="Duplicate" style={iconButtonStyle}>
            <Copy size={15} color={colors.typography.secondaryText} />
          </button>
          <button onClick={() => onMore?.(course)} title="More" style={iconButtonStyle}>
            <MoreHorizontal size={15} color={colors.typography.secondaryText} />
          </button>
        </div>
        {updated && (
          <span style={{ fontSize: 11, color: colors.typography.secondaryText }}>{updated}</span>
        )}
      </div>
    </div>
  );
}

const iconButtonStyle = {
  width: 28,
  height: 28,
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

  // Filter / sort / pagination — all operate on real fetched data, nothing fabricated.
  const [statusFilter, setStatusFilter] = useState("all"); // all | published | draft
  const [sortOrder, setSortOrder] = useState("newest"); // newest | oldest | price_desc | price_asc
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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
    setCourseList(Array.isArray(coursesData) ? coursesData : coursesData?.courses || []);

    setCourseStats(val(stats)?.statistics || val(stats) || null);

    const wd = val(wallet);
    setWalletData(wd?.wallet || wd || null);

    setKycStatus(val(kyc));

    if ([courses, stats, wallet, kyc].every((r) => r.status === "rejected")) {
      setError("Unable to connect to the server.");
    }

    setLoading(false);
  }, []);

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

  // ---- Derived values (all from real API data — "--" / 0 shown when absent) ----

  const isKycVerified = kycStatus
    ? !!(kycStatus.verified ?? kycStatus.is_verified ?? kycStatus.status === "verified")
    : !!user?.kyc_verified;

  const totalCourses = courseStats?.total_courses ?? courseList.length ?? 0;
  const publishedCourses = courseStats?.published_courses ?? 0;
  const draftCourses = Math.max(totalCourses - publishedCourses, 0);

  const totalRevenue = courseStats?.revenue ?? 0;
  const totalUsers = courseStats?.total_students ?? courseStats?.total_enrollments ?? null;
  const avgRating = courseStats?.average_rating ?? null;
  const completionRate = courseStats?.completion_rate ?? null;

  const healthScore = courseStats?.health_score ?? null;
  const contentQuality = courseStats?.content_quality_score ?? null;
  const seoScore = courseStats?.seo_score ?? null;
  const accessibilityScore = courseStats?.accessibility_score ?? null;
  const publishReadiness = courseStats?.publish_readiness_score ?? null;

  const profileCompletion = courseStats?.profile_completion ?? user?.profile_completion ?? null;
  const kycLabel = isKycVerified ? "Verified" : "Pending";
  const monthlyGrowth = courseStats?.monthly_growth != null ? `${courseStats.monthly_growth}%` : null;
  const conversionRate = courseStats?.conversion_rate != null ? `${courseStats.conversion_rate}%` : null;
  const refundRate = courseStats?.refund_rate != null ? `${courseStats.refund_rate}%` : null;
  const avgOrderValue = courseStats?.avg_order_value != null ? formatCurrency(courseStats.avg_order_value) : null;

  // Lifetime earnings / withdrawable balance for the top header come from the wallet endpoint —
  // it's the account-wide source of truth, not course-specific revenue.
  const lifetimeEarnings =
    walletData?.lifetime_earnings ?? walletData?.total_earnings ?? walletData?.total_revenue ?? 0;
  const walletBalance =
    walletData?.available_balance ?? walletData?.balance ?? walletData?.available ?? 0;

  const filteredCourses = useMemo(() => {
    let list = [...courseList];

    if (statusFilter !== "all") {
      list = list.filter((c) => {
        const isPublished = c?.status === "published" || c?.is_published === true;
        return statusFilter === "published" ? isPublished : !isPublished;
      });
    }

    list.sort((a, b) => {
      if (sortOrder === "price_desc") return (b?.price ?? 0) - (a?.price ?? 0);
      if (sortOrder === "price_asc") return (a?.price ?? 0) - (b?.price ?? 0);

      const aDate = new Date(a?.created_at || a?.updated_at || 0).getTime();
      const bDate = new Date(b?.created_at || b?.updated_at || 0).getTime();
      return sortOrder === "oldest" ? aDate - bDate : bDate - aDate;
    });

    return list;
  }, [courseList, statusFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const visibleCourses = filteredCourses.slice(pageStart, pageStart + pageSize);

  const handleNewCourse = () => onNavigate?.("course-create");
  const handleVerify = () => onNavigate?.("kyc-verification");
  const handleWithdraw = () => onNavigate?.("withdraw");
  const handleNotifications = () => onNavigate?.("notifications");
  const handleCourseEdit = (course) => onNavigate?.("course-analytics", { courseId: course?.id });
  const handleCourseView = (course) => onNavigate?.("course-preview", { courseId: course?.id });
  const handleCourseDuplicate = (course) => onNavigate?.("course-duplicate", { courseId: course?.id });
  const handleCourseMore = (course) => onNavigate?.("course-manage", { courseId: course?.id });

  if (loading) {
    return (
      <div style={{ display: "flex", backgroundColor: colors.base.appBackground, minHeight: "100vh" }}>
        <Sidebar active="courses" onNavigate={onNavigate} onLogout={onLogout} />
        <div
          style={{
            flex: 1, minWidth: 0, display: "flex",
            justifyContent: "center", alignItems: "center",
            color: colors.typography.primary,
          }}
        >
          Loading courses...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", backgroundColor: colors.base.appBackground, minHeight: "100vh" }}>
      <Sidebar active="courses" onNavigate={onNavigate} onLogout={onLogout} />

      <div style={{ flex: 1, minWidth: 0, padding: 32 }}>
        <TopHeader
          totalRevenue={lifetimeEarnings}
          walletBalance={walletBalance}
          hasUnreadNotifications={hasUnreadNotifications}
          onWithdraw={handleWithdraw}
          onNotifications={handleNotifications}
        />

        <VerificationBanner isKycVerified={isKycVerified} onVerify={handleVerify} />

        {error && <div style={{ color: "red", padding: 16 }}>{error}</div>}

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
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
            <span
              style={{
                textTransform: "uppercase", fontSize: 12, fontWeight: 700,
                letterSpacing: 1, color: colors.brand.primaryOrange,
              }}
            >
              Course Studio
            </span>

            <h1
              style={{
                margin: 0, fontSize: 40, fontWeight: 800, lineHeight: 1.15,
                color: colors.typography.primaryText,
              }}
            >
              Create Once. Sell Forever.
              <br />
              <span style={{ color: colors.brand.primaryOrange }}>Scale Infinitely.</span>
            </h1>

            <p
              style={{
                margin: 0, fontSize: 16, lineHeight: 1.5,
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
                alignSelf: "flex-start", marginTop: 8,
                background: colors.brand.primaryOrange, color: colors.typography.white,
                border: "none", borderRadius: 9999, padding: "12px 24px",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              + New Course
            </button>
          </div>

          <div
            style={{
              flexShrink: 0, width: 320, height: 240,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <img src={computer} style={{ width: "100%", maxWidth: 320, objectFit: "contain" }} />
          </div>
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
            icon={Star}
            iconColor={colors.brand.primaryOrange}
            label="Avg Rating"
            value={avgRating != null ? avgRating : "--"}
            subtext={avgRating != null ? null : "No ratings yet"}
          />
          <StatCard
            icon={TrendingUp}
            iconColor={colors.charts?.teal}
            label="Completion Rate"
            value={completionRate != null ? `${completionRate}%` : "--"}
            subtext="--vs last month"
          />
        </div>

        {/* Health / Insights / AI Recommendations */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
            marginBottom: 24,
            alignItems: "start",
          }}
        >
          {/* Course Health */}
          <div
            style={{
              background: colors.base.cardBackground,
              border: `1px solid ${colors.base.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.typography.primaryText, marginBottom: 12 }}>
              Course Health
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <HealthGauge score={healthScore} />
            </div>

            <HealthMetricRow label="Content Quality" value={contentQuality} dotColor={colors.brand.successGreen} />
            <HealthMetricRow label="SEO Score" value={seoScore} dotColor={colors.brand.primaryOrange} />
            <HealthMetricRow label="Accessibility" value={accessibilityScore} dotColor={colors.charts?.teal} />
            <HealthMetricRow label="Publish Readiness" value={publishReadiness} dotColor={colors.charts?.purple} />

            <button
              type="button"
              onClick={() => onNavigate?.("course-health")}
              style={{
                marginTop: 14, width: "100%",
                background: colors.brand.primaryOrange, color: colors.typography.white,
                border: "none", borderRadius: 10, padding: "10px 0",
                fontWeight: 700, cursor: "pointer",
              }}
            >
              Improve Score
            </button>
          </div>

          {/* Creator Insights */}
          <div
            style={{
              background: colors.base.cardBackground,
              border: `1px solid ${colors.base.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.typography.primaryText }}>
                Creator Insights
              </span>
              <button
                onClick={() => onNavigate?.("creator-insights")}
                style={{ background: "none", border: "none", color: colors.brand.primaryOrange, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                View All →
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.typography.secondaryText, marginBottom: 6 }}>
                <span>Profile Completion</span>
                <span>{profileCompletion != null ? `${profileCompletion}%` : "--"}</span>
              </div>
              <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)" }}>
                <div
                  style={{
                    width: `${profileCompletion != null ? Math.max(0, Math.min(100, profileCompletion)) : 0}%`,
                    height: "100%", borderRadius: 3, background: colors.brand.primaryOrange,
                  }}
                />
              </div>
            </div>

            <InsightRow label="KYC Status" value={kycLabel} />
            <InsightRow label="Monthly Growth" value={monthlyGrowth} />
            <InsightRow label="Conversion Rate" value={conversionRate} />
            <InsightRow label="Refund Rate" value={refundRate} />
            <InsightRow label="Avg. Order Value" value={avgOrderValue} />
          </div>

          {/* AI Recommendations — navigational shortcuts, not analytics values */}
          <div
            style={{
              background: colors.base.cardBackground,
              border: `1px solid ${colors.base.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.typography.primaryText, marginBottom: 12 }}>
              AI Recommendations
            </div>

            {[
              { icon: Sparkles, label: "Add more lessons", target: "course-create", color: colors.charts?.purple },
              { icon: BarChart2, label: "Course Health", target: "course-health", color: colors.charts?.blue },
              { icon: MessageSquare, label: "Feedback", target: "course-feedback", color: colors.brand.primaryOrange },
              { icon: TrendingUp, label: "Revenue", target: "course-revenue", color: colors.brand.successGreen },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => onNavigate?.(item.target)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    background: "none", border: "none", cursor: "pointer",
                    padding: "10px 0", textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: "rgba(0,0,0,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon size={15} color={item.color} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.typography.primaryText }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Your Courses + right-side summary */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 16, alignItems: "start" }}>
          {/* Course list */}
          <div
            style={{
              background: colors.base.cardBackground,
              border: `1px solid ${colors.base.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: colors.typography.primaryText }}>
                Your Courses ({filteredCourses.length})
              </span>

              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  style={{
                    border: `1px solid ${colors.base.border}`, borderRadius: 999,
                    padding: "6px 12px", fontSize: 12, color: colors.typography.primaryText,
                    background: colors.base.cardBackground, cursor: "pointer",
                  }}
                >
                  <option value="all">Filters: All</option>
                  <option value="published">Published only</option>
                  <option value="draft">Draft only</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                  style={{
                    border: `1px solid ${colors.base.border}`, borderRadius: 999,
                    padding: "6px 12px", fontSize: 12, color: colors.typography.primaryText,
                    background: colors.base.cardBackground, cursor: "pointer",
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="price_asc">Price: Low to High</option>
                </select>
              </div>
            </div>

            {visibleCourses.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: colors.typography.secondaryText, fontSize: 14 }}>
                No courses yet. Create your first course to see it here.
              </div>
            ) : (
              visibleCourses.map((course) => (
                <CourseCard
                  key={course?.id || course?._id || course?.title}
                  course={course}
                  onEdit={handleCourseEdit}
                  onView={handleCourseView}
                  onDuplicate={handleCourseDuplicate}
                  onMore={handleCourseMore}
                />
              ))
            )}

            {filteredCourses.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <span style={{ fontSize: 12, color: colors.typography.secondaryText }}>
                  Showing {pageStart + 1} to {Math.min(pageStart + pageSize, filteredCourses.length)} of {filteredCourses.length} courses
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ ...iconButtonStyle, opacity: currentPage === 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: "none",
                        background: page === currentPage ? colors.brand.primaryOrange : "rgba(0,0,0,0.04)",
                        color: page === currentPage ? colors.typography.white : colors.typography.primaryText,
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ ...iconButtonStyle, opacity: currentPage === totalPages ? 0.4 : 1 }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right-side summary cards — derived from real courseStats/courseList, no fabricated figures */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: colors.base.cardBackground,
                border: `1px solid ${colors.base.border}`,
                borderRadius: 16,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <BookOpen size={16} color={colors.charts?.blue} />
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.typography.secondaryText, textTransform: "uppercase" }}>
                  Total Courses
                </span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: colors.typography.primaryText }}>
                {totalCourses}
              </div>
              <div style={{ fontSize: 12, color: colors.typography.secondaryText, marginTop: 4 }}>
                {publishedCourses} published · {draftCourses} draft
              </div>
            </div>

            <div
              style={{
                background: colors.base.cardBackground,
                border: `1px solid ${colors.base.border}`,
                borderRadius: 16,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <BookOpen size={16} color={colors.brand.successGreen} />
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.typography.secondaryText, textTransform: "uppercase" }}>
                  Published Courses
                </span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: colors.typography.primaryText }}>
                {publishedCourses}
              </div>
              <div style={{ fontSize: 12, color: colors.typography.secondaryText, marginTop: 4 }}>
                Currently live
              </div>
            </div>

            <div
              style={{
                background: colors.base.cardBackground,
                border: `1px solid ${colors.base.border}`,
                borderRadius: 16,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <BookOpen size={16} color={colors.brand.primaryOrange} />
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.typography.secondaryText, textTransform: "uppercase" }}>
                  Draft Courses
                </span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: colors.typography.primaryText }}>
                {draftCourses}
              </div>
              <div style={{ fontSize: 12, color: colors.typography.secondaryText, marginTop: 4 }}>
                {draftCourses} in progress
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}