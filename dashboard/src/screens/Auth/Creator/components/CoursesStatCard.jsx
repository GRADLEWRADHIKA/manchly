import { useEffect, useState, useCallback } from "react";
import { BookOpen } from "lucide-react";
import { apiFetch, unwrap } from "../../../../utils/api";
import colors from "../../../../utils/colors";
import Sidebar from "../../../../components/Sidebar";
import TopHeader from "../../../../components/TopHeader";

function val(result) {
  if (result.status !== "fulfilled") return null;
  return unwrap(result.value);
}

export default function CourseStatsScreen({ user, onNavigate, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [courseList, setCourseList] = useState([]);
  const [courseStats, setCourseStats] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");

    const [courses, stats, wallet] = await Promise.allSettled([
      apiFetch("/courses"),
      apiFetch("/courses/stats/creator"),
      apiFetch("/settlements/wallet"),
    ]);

    const coursesData = val(courses);
    setCourseList(Array.isArray(coursesData) ? coursesData : coursesData?.courses || []);

    setCourseStats(val(stats)?.statistics || val(stats) || null);

    const wd = val(wallet);
    setWalletData(wd?.wallet || wd || null);

    if ([courses, stats, wallet].every((r) => r.status === "rejected")) {
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
    loadStats();
    loadNotifications();
  }, [loadStats, loadNotifications]);

  // ---- Derived values — same math as CoursesScreen, computed independently
  // since this is a separate route with its own fetched data. ----
  const totalCourses = courseStats?.total_courses ?? courseList.length ?? 0;
  const publishedCourses = courseStats?.published_courses ?? 0;
  const draftCourses = Math.max(totalCourses - publishedCourses, 0);

  const lifetimeEarnings =
    walletData?.lifetime_earnings ?? walletData?.total_earnings ?? walletData?.total_revenue ?? 0;
  const walletBalance =
    walletData?.available_balance ?? walletData?.balance ?? walletData?.available ?? 0;

  const handleWithdraw = () => onNavigate?.("withdraw");
  const handleNotifications = () => onNavigate?.("notifications");

  if (loading) {
    return (
      <div style={{ display: "flex", backgroundColor: colors.base.appBackground, minHeight: "100vh" }}>
        <Sidebar active="courses" onNavigate={onNavigate} onLogout={onLogout} />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: colors.typography.primary,
          }}
        >
          Loading course stats...
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

        <h1
          style={{
            margin: "4px 0 4px",
            fontSize: 24,
            fontWeight: 700,
            color: colors.typography.primaryText,
          }}
        >
          Course Stats
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: colors.typography.secondaryText }}>
          A breakdown of your total, published, and draft courses.
        </p>

        {error && <div style={{ color: "red", padding: 16 }}>{error}</div>}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
          }}
        >
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
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.typography.secondaryText,
                  textTransform: "uppercase",
                }}
              >
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
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.typography.secondaryText,
                  textTransform: "uppercase",
                }}
              >
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
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.typography.secondaryText,
                  textTransform: "uppercase",
                }}
              >
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
  );
}