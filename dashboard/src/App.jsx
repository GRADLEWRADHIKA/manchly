import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { useAuth } from "./context/AuthContext";
import { logout } from "./store/authSlice";
import { creatorPathFor } from "./utils/creatorNav";
import { connectSocket, onSocket, disconnectSocket } from "./utils/socket";
import { toast } from "./utils/toast";
import { Toaster, FullLoader } from "./components/ui";
import CallManager from "./components/CallManager";

// Auth
import AuthFlow from "./screens/unAuth/AuthFlow";

// User side
import UserLayout from "./layouts/UserLayout";
import UserHome from "./screens/user/UserHome";
//import Explore from "./screens/user/Explore";
import ExploreCourses from "./screens/user/ExploreCourses";
import ExploreWebinars from "./screens/user/ExploreWebinars";
import Reels from "./screens/user/Reels";
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
import UserHelpCenter from "./screens/user/UserHelpCenter";
import UserCommunityScreen from "./screens/user/UserCommunityScreen.jsx";
import UserHubScreen from "./screens/user/UserHubScreen.jsx";
import CreatorPublicProfile from "./screens/user/CreatorPublicProfile.jsx";

// Creator side
import CreatorLayout from "./layouts/CreatorLayout";
import DashboardScreen from "./screens/Auth/Creator/DashboardScreen";
import CoursesScreen from "./screens/Auth/Creator/CoursesScreen";
import CreatorProfile from "./screens/creator/CreatorProfile";
import StudioScreen from "./screens/creator/StudioScreen";
import WebinarsScreen from "./screens/creator/WebinarsScreen";
import ReelsScreen from "./screens/creator/ReelsScreen";
import SessionsScreen from "./screens/creator/SessionsScreen";
import WalletScreen from "./screens/creator/WalletScreen";
import KycScreen from "./screens/creator/KycScreen";
import AiScreen from "./screens/creator/AiScreen";
import HelpCenter from "./HelpCenter";
import CreatorOverview from "./CreatorOverview";
import AdminPanel from "./AdminPanel";
import CourseCreateScreen from "./screens/Auth/Creator/CourseCreateScreen";
import CourseVideoScreen from "./screens/Auth/Creator/CourseVideoScreen";
import CoursePreviewScreen from "./screens/Auth/Creator/CoursePreiewScreen";
import CommunityScreen from "./screens/creator/CommunityScreen";
import CreatorHubScreen from "./screens/creator/CreatorHubScreen";
import CoursePlannerScreen from "./screens/creator/CourseplannerScreen";
import CourseStatsScreen from "./screens/Auth/Creator/components/CoursesStatCard.jsx";
import { AssistantProvider } from "./context/AssistantContext.jsx";
import AiAssistant from "./screens/creator/AiAssistant.jsx"
import AssistantLauncher from "./components/AssistantLaucher.jsx";

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

// Deep links: /course/:id and /webinar/:id
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

// Standalone wrapper for Creator screens embedding their own sidebar
function StandaloneCreatorScreen({ Screen }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  return (
    <Screen
      user={user}
      onNavigate={(key, params) => navigate(creatorPathFor(key, params))}
      onLogout={() => {
        logout();
        navigate("/auth", { replace: true });
      }}
    />
  );
}

// Global realtime toasts
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

function ForceLogoutBridge() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reduxToken = useSelector((s) => s.auth?.token);
  const { isAuthed, logout: ctxLogout, token: ctxToken } = useAuth();

  const activeToken = reduxToken || ctxToken;
  const authed = isAuthed || !!reduxToken;

  useEffect(() => {
    if (!authed || !activeToken) {
      disconnectSocket();
      return;
    }

    connectSocket();

    const handleForceLogout = (data) => {
      const msg =
        data?.message ||
        "Your account was signed in on another device. You have been logged out.";

      toast.error(msg, { duration: 5000 });

      dispatch(logout());
      ctxLogout();
      disconnectSocket();

      localStorage.removeItem("manchly_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate("/auth", { replace: true });
    };

    const unsubForceLogout = onSocket("force_logout", handleForceLogout);
    const unsubDeviceRevoked = onSocket("device_revoked", handleForceLogout);

    return () => {
      unsubForceLogout();
      unsubDeviceRevoked();
    };
  }, [authed, activeToken, dispatch, ctxLogout, navigate]);

  useEffect(() => {
    const handleGlobalLogoutEvent = (e) => {
      const msg =
        e?.detail?.message ||
        "Your account was signed in on another device. You have been logged out.";
      toast.error(msg, { duration: 5000 });
      dispatch(logout());
      ctxLogout();
      disconnectSocket();
      localStorage.removeItem("manchly_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/auth", { replace: true });
    };

    const handleStorageChange = (e) => {
      if (
        (e.key === "manchly_token" || e.key === "token" || e.key === "auth_token") &&
        !e.newValue
      ) {
        handleGlobalLogoutEvent();
      }
    };

    window.addEventListener("manchly:force-logout", handleGlobalLogoutEvent);
    window.addEventListener("manchly:device-conflict", handleGlobalLogoutEvent);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("manchly:force-logout", handleGlobalLogoutEvent);
      window.removeEventListener("manchly:device-conflict", handleGlobalLogoutEvent);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch, ctxLogout, navigate]);

  return null;
}

export default function App() {
  const { user,isAuthed, role  } = useAuth();
  const isCreator = isAuthed && role === "CREATOR";

  return (
    <>
      <AssistantProvider>
      <Toaster />
      <NotificationBridge />
      <ForceLogoutBridge />
      <CallManager />
      {isCreator && <AiAssistant/>}
      {isCreator && <AssistantLauncher />}

      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/auth" element={<AuthFlow />} />

        {/* Deep links */}
        <Route path="/course/:courseId" element={<DeepLink kind="course" />} />
        <Route path="/webinar/:webinarId" element={<DeepLink kind="webinar" />} />

        {/* Call room (both roles) */}
        <Route path="/call" element={<RequireAuth><CallRoom /></RequireAuth>} />

        {/* ---------- USER SHELL ---------- */}
        <Route path="/app" element={<RequireAuth roles={["USER", "BRAND", "AGENCY"]}><UserLayout /></RequireAuth>}>
          <Route index element={<UserHome />} />
          <Route path="explore" element={<Navigate to="/app/explore/courses" replace />} />
<Route path="explore/courses" element={<ExploreCourses />} />
<Route path="explore/webinars" element={<ExploreWebinars />} />
          <Route path="reels" element={<Reels />} />
          <Route path="course/:courseId" element={<CourseDetails />} />
          <Route path="webinar/:webinarId" element={<WebinarDetails />} />
          <Route path="learning" element={<Learning />} />
          <Route path="player/:courseId" element={<Player />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="experts/:expertId" element={<ExpertDetail />} />
          <Route path="creator/:creatorId" element={<CreatorPublicProfile />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="notifications" element={<Notifications role="user" />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={<UserProfile />} />
          <Route path="rate/:sessionId" element={<SessionRating />} />
          <Route path="help" element={<UserHelpCenter />} />
          <Route path="communities" element={<UserCommunityScreen />} />
          <Route path="useHub" element={<UserHubScreen />} />
        </Route>

        {/* ---------- CREATOR SHELL ---------- */}
        {/* Standalone screens that mount their own custom sidebar */}
        <Route path="/creator" element={<RequireAuth roles={["CREATOR"]}><StandaloneCreatorScreen Screen={DashboardScreen} /></RequireAuth>} />
        <Route path="/creator/courses" element={<RequireAuth roles={["CREATOR"]}><StandaloneCreatorScreen Screen={CoursesScreen} /></RequireAuth>} />
        <Route path="/creator/courses/stats" element={<RequireAuth roles={["CREATOR"]}><StandaloneCreatorScreen Screen={CourseStatsScreen} /></RequireAuth>} />
        <Route path="/creator/courses/new" element={<RequireAuth roles={["CREATOR"]}><StandaloneCreatorScreen Screen={CourseCreateScreen} /></RequireAuth>} />
        <Route path="/creator/courses/new/:courseId/video" element={<RequireAuth roles={["CREATOR"]}><StandaloneCreatorScreen Screen={CourseVideoScreen} /></RequireAuth>} />
        <Route path="/creator/courses/new/:courseId/preview" element={<RequireAuth roles={["CREATOR"]}><StandaloneCreatorScreen Screen={CoursePreviewScreen} /></RequireAuth>} />

        <Route path="/creator/hub" element={<RequireAuth roles={["CREATOR"]}><StandaloneCreatorScreen Screen={CreatorHubScreen} /></RequireAuth>} />
        <Route path="/creator/creator-hub" element={<RequireAuth roles={["CREATOR"]}><StandaloneCreatorScreen Screen={CreatorHubScreen} /></RequireAuth>} />
        <Route path="/creator/community" element={<RequireAuth roles={["CREATOR"]}><StandaloneCreatorScreen Screen={CommunityScreen} /></RequireAuth>} />

        {/* Layout-wrapped creator routes */}
        <Route path="/creator/*" element={<RequireAuth roles={["CREATOR"]}><CreatorLayout /></RequireAuth>}>
          <Route path="overview" element={<CreatorOverview user={user} />} />
          <Route path="studio" element={<StudioScreen />} />
          <Route path="webinars" element={<WebinarsScreen />} />
          <Route path="reels" element={<ReelsScreen />} />
          <Route path="sessions" element={<SessionsScreen />} />
          <Route path="ai" element={<AiScreen />} />
          <Route path="course-planner" element={<CoursePlannerScreen />} />
          <Route path="wallet" element={<WalletScreen />} />
          <Route path="kyc" element={<KycScreen />} />
          <Route path="notifications" element={<Notifications role="creator" />} />
          <Route path="help" element={<HelpCenter role="CREATOR" />} />
          <Route path="settings" element={<CreatorProfile />} />
        </Route>

        {/* ---------- ADMIN ---------- */}
        <Route path="/admin" element={<RequireAuth roles={["ADMIN"]}><AdminPanel /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AssistantProvider>
    </>
  );
}