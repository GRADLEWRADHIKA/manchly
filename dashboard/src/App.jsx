// Manchly web app — role-routed shells mirroring the mobile app:
//   /auth       → OTP auth wizard (role select → OTP → signup)
//   /app/*      → USER (also BRAND/AGENCY) shell, dark navy + indigo gradients
//   /creator/*  → CREATOR shell (light Creator Suite + gold gradients)
//   /admin      → admin panel
//   /course/:id, /webinar/:id → deep links (saved & replayed if logged out)
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import { creatorPathFor } from "./utils/creatorNav";
import { onSocket } from "./utils/socket";
import { toast } from "./utils/toast";
import { Toaster, FullLoader } from "./components/ui";
import CallManager from "./components/CallManager";

// Auth
import AuthFlow from "./screens/unAuth/AuthFlow";

// User side (new)
import UserLayout from "./layouts/UserLayout";
import UserHome from "./screens/user/UserHome";
import Explore from "./screens/user/Explore";
import CourseDetails from "./screens/user/CourseDetails";
import WebinarDetails from "./screens/user/WebinarDetails";
import Learning from "./screens/user/Learning";
import Player from "./screens/user/Player";
import Sessions from "./screens/user/Sessions";
import ExpertDetail from "./screens/user/ExpertDetail";
import Marketplace from "./screens/user/Marketplace";
import UserProfile from "./screens/user/UserProfile";
import Notifications from "./screens/user/Notifications";
import SessionRating from "./screens/user/SessionRating";
import CallRoom from "./screens/CallRoom";

// Creator side — Radhika's screens + legacy feature screens
import CreatorLayout from "./layouts/CreatorLayout";
import DashboardScreen from "./screens/Auth/Creator/DashboardScreen";
import CoursesScreen from "./screens/Auth/Creator/CoursesScreen";
import CreatorProfile from "./screens/creator/CreatorProfile";
import StudioScreen from "./screens/creator/StudioScreen";
import WebinarManager from "./WebinarManager";
import SessionHubCreator from "./SessionHubCreator";
import PaymentsDashboard from "./PaymentsDashboard";
import CreatorSettlementsPortal from "./CreatorSettlementsPortal";
import CreateKycDashboard from "./CreateKycDashboard.jsx";
import AIAssistant from "./AIAssistant";
import GroupsPanel from "./GroupsPanel";
import TelegramChannels from "./TelegramChannels";
import HelpCenter from "./HelpCenter";
import CreatorOverview from "./CreatorOverview";
import AdminPanel from "./AdminPanel";

function RequireAuth({ children, roles }) {
  const { isAuthed, booted, role } = useAuth();
  const location = useLocation();
  if (!booted) return <FullLoader label="Starting Manchly..." />;
  if (!isAuthed) return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(role)) {
    return <Navigate to={role === "CREATOR" ? "/creator" : role === "ADMIN" ? "/admin" : "/app"} replace />;
  }
  return children;
}

function HomeRedirect() {
  const { isAuthed, booted, role } = useAuth();
  if (!booted) return <FullLoader label="Starting Manchly..." />;
  if (!isAuthed) return <Navigate to="/auth" replace />;
  return <Navigate to={role === "CREATOR" ? "/creator" : role === "ADMIN" ? "/admin" : "/app"} replace />;
}

// Deep links: /course/:id and /webinar/:id (same shape as manchly.chottu.link).
// Logged out → park the destination and send to auth (app parity).
function DeepLink({ kind }) {
  const { isAuthed, booted } = useAuth();
  const params = useParams();
  const id = params.courseId || params.webinarId;
  const dest = kind === "course" ? `/app/course/${id}` : `/app/webinar/${id}`;
  if (!booted) return <FullLoader />;
  if (!isAuthed) {
    localStorage.setItem("manchly_pending_link", dest);
    return <Navigate to="/auth" replace />;
  }
  return <Navigate to={dest} replace />;
}

// Radhika's dashboard screens render their own Sidebar, so they mount
// standalone with the shared key→path navigation map.
function StandaloneCreatorScreen({ Screen }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  return (
    <Screen
      user={user}
      onNavigate={(key) => navigate(creatorPathFor(key))}
      onLogout={() => {
        logout();
        navigate("/auth", { replace: true });
      }}
    />
  );
}

// Global realtime toasts (new notifications) — mirrors the app's bell updates.
function NotificationBridge() {
  const { isAuthed } = useAuth();
  useEffect(() => {
    if (!isAuthed) return;
    return onSocket("new_notification", (n) => {
      if (n?.title) toast.info(`${n.title}${n.message ? ` — ${n.message}` : ""}`);
    });
  }, [isAuthed]);
  return null;
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <Toaster />
      <NotificationBridge />
      <CallManager />

      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/auth" element={<AuthFlow />} />

        {/* Deep links (chottu.link shape) */}
        <Route path="/course/:courseId" element={<DeepLink kind="course" />} />
        <Route path="/webinar/:webinarId" element={<DeepLink kind="webinar" />} />

        {/* Call room (both roles) */}
        <Route path="/call" element={<RequireAuth><CallRoom /></RequireAuth>} />

        {/* ---------- USER SHELL ---------- */}
        <Route path="/app" element={<RequireAuth roles={["USER"]}><UserLayout /></RequireAuth>}>
          <Route index element={<UserHome />} />
          <Route path="explore" element={<Explore />} />
          <Route path="course/:courseId" element={<CourseDetails />} />
          <Route path="webinar/:webinarId" element={<WebinarDetails />} />
          <Route path="learning" element={<Learning />} />
          <Route path="player/:courseId" element={<Player />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="experts/:expertId" element={<ExpertDetail />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="notifications" element={<Notifications role="user" />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="rate/:sessionId" element={<SessionRating />} />
        </Route>

        {/* ---------- CREATOR SHELL ---------- */}
        {/* Dashboard + Courses render standalone (they embed the sidebar). */}
        <Route path="/creator" element={<RequireAuth roles={["CREATOR"]}><StandaloneCreatorScreen Screen={DashboardScreen} /></RequireAuth>} />
        <Route path="/creator/courses" element={<RequireAuth roles={["CREATOR"]}><StandaloneCreatorScreen Screen={CoursesScreen} /></RequireAuth>} />

        <Route path="/creator" element={<RequireAuth roles={["CREATOR"]}><CreatorLayout /></RequireAuth>}>
          <Route path="overview" element={<CreatorOverview user={user} />} />
          <Route path="studio" element={<StudioScreen />} />
          <Route path="webinars" element={<WebinarManager />} />
          <Route path="sessions" element={<SessionHubCreator />} />
          <Route path="ai" element={<AIAssistant />} />
          <Route path="payments" element={<PaymentsDashboard role="CREATOR" />} />
          <Route path="wallet" element={<CreatorSettlementsPortal />} />
          <Route path="kyc" element={<CreateKycDashboard />} />
          <Route path="notifications" element={<Notifications role="creator" />} />
          <Route path="community" element={<GroupsPanel currentUser={user} />} />
          <Route path="telegram" element={<TelegramChannels />} />
          <Route path="help" element={<HelpCenter role="CREATOR" />} />
          <Route path="settings" element={<CreatorProfile />} />
        </Route>

        {/* ---------- ADMIN ---------- */}
        <Route path="/admin" element={<RequireAuth roles={["ADMIN"]}><AdminPanel /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
