import { useEffect, useState, useCallback } from "react";
import { apiFetch, unwrap } from "../../../utils/api";
import colors from "../../../utils/colors";
import RevenueCard from "../../../components/RevenueCard";
import { BookOpen, MonitorPlay, Users, IndianRupee } from "lucide-react";
import RevenueOverviewChart from "../../../components/RevenueOverviewChart";
import RevenueMixChart from "../../../components/RevenueMixChart";
import ProductStatCard from "../../../components/ProductStatCard";
import AudienceGrowthChart from "../../../components/AudienceGrowthChart";
import ProductPerformanceChart from "../../../components/ProductPerformaceChart";
import RecentEnrollments from "../../../components/RecentEnrollments";
import TopProducts from "../../../components/TopProducts";
import ScaleImpactBanner from "../../../components/ScaleImpactBanner";
import Sidebar from "../../../components/Sidebar";
import TopHeader from "../../../components/TopHeader";

// Helper function
function val(result) {
  if (result.status !== "fulfilled") return null;
  return unwrap(result.value);
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
          borderBottom: `1px solid ${colors.base.border}`,
        }}
      >
        {/* Verified Icon */}
        <span
          style={{
            color: colors.brand.successGreen,
            fontSize: 18,
          }}
        >
          🛡️
        </span>

        {/* Verified Text */}
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
        borderBottom: `1px solid ${colors.base.border}`,
      }}
    >
      {/* Left Side */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            color: colors.brand.actionBlue,
            fontSize: 18,
          }}
        >
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

      {/* Verify Button */}
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

export default function DashboardScreen({ user, onNavigate, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for different dashboard modules
  const [dashboard, setDashboard] = useState(null); 
  const [walletData, setWalletData] = useState(null);
  const [courseStats, setCourseStats] = useState(null);
  const [webinarStats, setWebinarStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [earningsBreakdown, setEarningsBreakdown] = useState(null); 
  const [kycStatus, setKycStatus] = useState(null); 
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);


  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiFetch("/notifications/unread-count");
      const data = unwrap(response);
      const count = Number(data?.count ?? data?.unread_count ?? data ?? 0) || 0;
      setHasUnreadNotifications(count > 0);
    } catch (error) {
      console.error("Failed to load notifications", error);
      setHasUnreadNotifications(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const [dash, wallet, courses, webinars, sales, earnings, kyc] =
      await Promise.allSettled([
        apiFetch("/sessions/dashboard"),
        apiFetch("/settlements/wallet"),
        apiFetch("/courses/stats/creator"),
        apiFetch("/webinars/stats/creator"),
        apiFetch("/payments/creator-sales?page=1&limit=6"),
        apiFetch("/settlements/earnings-breakdown"),
        apiFetch("/kyc/status"),
      ]);

    // setDashboard
    setDashboard(val(dash));

    const wd = val(wallet);
    setWalletData(wd?.wallet || wd || null);

    setCourseStats(val(courses)?.statistics || null);
    setWebinarStats(val(webinars)?.statistics || null);

    const sd = val(sales);
    setRecentSales(Array.isArray(sd?.transactions) ? sd.transactions : []);

    setEarningsBreakdown(val(earnings));
    setKycStatus(val(kyc));

    if (
      [dash, wallet, courses, webinars, sales, earnings, kyc].every(
        (r) => r.status === "rejected",
      )
    ) {
      setError("Unable to connect to the server.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
    loadNotifications();
  }, [loadDashboard, loadNotifications]);

  const isKycVerified = kycStatus
    ? !!(
        kycStatus.verified ??
        kycStatus.is_verified ??
        kycStatus.status === "verified"
      )
    : !!user?.kyc_verified;

  const courseRevenue = courseStats?.revenue ?? 0;
  const webinarRevenue = webinarStats?.revenue ?? 0;
  const sessionRevenue = dashboard?.session_revenue ?? 0;

  const totalEarnings =
    dashboard?.total_revenue ?? courseRevenue + webinarRevenue + sessionRevenue;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.base.appBackground,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: colors.typography.primary,
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  const revenueChartData = earningsBreakdown?.monthly ||
    dashboard?.monthly_revenue || [
      {
        month: "Jan",
        courses: 0,
        webinars: 0,
        sessions: 0,
      },
      {
        month: "Feb",
        courses: 0,
        webinars: 0,
        sessions: 0,
      },
      {
        month: "Mar",
        courses: 0,
        webinars: 0,
        sessions: 0,
      },
      {
        month: "Apr",
        courses: 0,
        webinars: 0,
        sessions: 0,
      },
      {
        month: "May",
        courses: 0,
        webinars: 0,
        sessions: 0,
      },
      {
        month: "Jun",
        courses: 0,
        webinars: 0,
        sessions: 0,
      },
      {
        month: "Jul",
        courses: 0,
        webinars: 0,
        sessions: 0,
      },
    ];

  const handleTimeframeChange = (timeframe) => {
    console.log("Selected timeframe:", timeframe);

    // Later you can fetch 7M / 1Y / All data here
  };

  const totalStudents = dashboard?.total_students ?? 0;

  const totalSessions = dashboard?.total_sessions ?? 0;
  const activeSessions = dashboard?.active_sessions ?? 0;
  const inactiveSessions = totalSessions - activeSessions;

  const audienceGrowthData = dashboard?.audience_growth || [
    { month: "Jan", enrollments: 12 },
    { month: "Feb", enrollments: 24 },
    { month: "Mar", enrollments: 35 },
    { month: "Apr", enrollments: 48 },
    { month: "May", enrollments: 55 },
    { month: "Jun", enrollments: 67 },
    { month: "Jul", enrollments: 82 },
  ];

  const productPerformanceData = [
    {
      name: "React Native Course",
      value: courseRevenue,
    },
    {
      name: "Live Webinars",
      value: webinarRevenue,
    },
    {
      name: "1:1 Sessions",
      value: sessionRevenue,
    },
  ];

  const maxProductRevenue = Math.max(
    ...productPerformanceData.map((item) => item.value),
    1,
  );

  const topProducts = dashboard?.top_products || [];

  const walletBalance =
    walletData?.available_balance ??
    walletData?.balance ??
    walletData?.available ??
    0;

  const handleNotifications = () => {
    onNavigate?.("notifications");
  };

  return (
    <div
      style={{
        display: "flex",
        backgroundColor: colors.base.appBackground,
        minHeight: "100vh",
      }}
    >
      <Sidebar
        active="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: 32,
          background: colors.base.appBackground,
        }}
      >
        <TopHeader
          totalRevenue={totalEarnings}
          walletBalance={walletBalance}
          hasUnreadNotifications={hasUnreadNotifications}
          onWithdraw={() => onNavigate?.("withdraw")}
          onNotifications={handleNotifications}
        />

        {/* Verification Banner */}
        <VerificationBanner isKycVerified={isKycVerified} onVerify={() => onNavigate?.("kyc")} />
        {/* Error */}
        {error && (
          <div
            style={{
              color: "red",
              padding: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Dynamic Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            padding: "20px 24px 0",
          }}
        >
          {/* Left Side */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 700,
                color: colors.typography.primaryText,
              }}
            >
              Your{" "}
              <span
                style={{
                  color: colors.brand.primaryOrange,
                }}
              >
                Dashboard
              </span>
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: colors.typography.secondaryText,
              }}
            >
              Manage your content, track earnings, and grow your audience — all
              in one place.
            </p>
          </div>

          {/* Right Side */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            {[
              ["+ Course", "course-create"],
              ["+ Webinar", "webinar-create"],
              ["+ 1:1 Session", "sessions"],
            ].map(([label, key]) => (
              <button
                key={key}
                type="button"
                onClick={() => onNavigate?.(key)}
                style={{
                  background: colors.gradients.orange,
                  color: colors.typography.white,
                  border: "none",
                  borderRadius: 9999,
                  padding: "10px 18px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(245,166,35,0.35)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {/* Revenue Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <RevenueCard
            title="Course Revenue"
            amount={`₹${courseRevenue.toLocaleString()}`}
            percentage="+18%"
            icon={BookOpen}
            themeColor={colors.charts.blue}
          />

          <RevenueCard
            title="Webinar Revenue"
            amount={`₹${webinarRevenue.toLocaleString()}`}
            percentage="+12%"
            icon={MonitorPlay}
            themeColor={colors.charts.purple}
          />

          <RevenueCard
            title="1:1 Session Revenue"
            amount={`₹${sessionRevenue.toLocaleString()}`}
            percentage="+24%"
            icon={Users}
            themeColor={colors.charts.teal}
          />

          <RevenueCard
            title="Total Revenue"
            amount={`₹${totalEarnings.toLocaleString()}`}
            percentage="+20%"
            icon={IndianRupee}
            themeColor={colors.charts.orange}
          />
        </div>

        {/* Revenue Analytics Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 24,
            marginTop: 32,
            alignItems: "start",
          }}
        >
          {/* Revenue Overview */}
          <RevenueOverviewChart
            data={revenueChartData}
            onTimeframeChange={handleTimeframeChange}
          />

          {/* Revenue Mix */}
          <RevenueMixChart
            courseRev={courseRevenue}
            webinarRev={webinarRevenue}
            sessionRev={sessionRevenue}
            totalRevenue={totalEarnings}
          />
        </div>

        {/* Products Summary */}
        <div
          style={{
            marginTop: 32,
          }}
        >
          <div
            style={{
              marginBottom: 18,
              fontSize: 13,
              fontWeight: 700,
              color: colors.typography.secondaryText,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            PRODUCTS
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            <ProductStatCard
              value={courseStats?.total_courses ?? 0}
              title="TOTAL COURSES"
              activeCount={courseStats?.published_courses ?? 0}
              activeLabel="published"
              inactiveCount={
                (courseStats?.total_courses ?? 0) -
                (courseStats?.published_courses ?? 0)
              }
              inactiveLabel="draft"
              themeColor={colors.charts.blue}
            />

            <ProductStatCard
              value={webinarStats?.total_webinars ?? 0}
              title="TOTAL WEBINARS"
              activeCount={webinarStats?.upcoming_webinars ?? 0}
              activeLabel="upcoming"
              inactiveCount={
                (webinarStats?.total_webinars ?? 0) -
                (webinarStats?.upcoming_webinars ?? 0)
              }
              inactiveLabel="completed"
              themeColor={colors.charts.purple}
            />

            <ProductStatCard
              value={totalSessions}
              title="1:1 SESSIONS"
              activeCount={activeSessions}
              activeLabel="active"
              inactiveCount={inactiveSessions}
              inactiveLabel="inactive"
              themeColor={colors.charts.teal}
            />

            <ProductStatCard
              value={totalStudents}
              title="TOTAL ENROLLMENTS"
              activeCount={totalStudents}
              activeLabel="students"
              themeColor={colors.brand.primaryOrange}
            />
          </div>
        </div>

        {/* Secondary Data Visualizations */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 24,
            alignItems: "start",
          }}
        >
          <AudienceGrowthChart data={audienceGrowthData} />

          <ProductPerformanceChart
            data={productPerformanceData}
            maxValue={maxProductRevenue}
          />
        </div>

        {/* Activity & Ranking */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 24,
            alignItems: "start",
          }}
        >
          <RecentEnrollments enrollments={recentSales} />

          <TopProducts products={topProducts} />
        </div>

        {/* Scale Your Impact Banner */}

        <ScaleImpactBanner />

        {/* Your remaining dashboard components will be added here */}
      </div>
    </div>
  );
}