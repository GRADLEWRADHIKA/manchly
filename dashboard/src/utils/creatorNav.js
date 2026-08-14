// Single source of truth for creator-shell navigation keys → routes.
// Radhika's screens navigate with semantic keys ("course-create", "withdraw");
// the layout and standalone screens both resolve them here.
export const CREATOR_KEY_TO_PATH = {
  dashboard: "/creator",
  overview: "/creator/overview",
  courses: "/creator/courses",
  studio: "/creator/studio",
  "course-create": "/creator/courses/new",
  "course-analytics": "/creator/studio",
  "course-preview": "/creator/studio",
  "course-duplicate": "/creator/studio",
  "course-manage": "/creator/studio",
  webinars: "/creator/webinars",
  "webinar-create": "/creator/webinars",
  sessions: "/creator/sessions",
  "creator-hub": "/creator/hub",  // ← Added
  creator: "/creator/hub",        // ← Added fallback for "creator"
  community: "/creator/community",// ← Added
  ai: "/creator/ai",
  wallet: "/creator/wallet",
  withdraw: "/creator/wallet",
  kyc: "/creator/kyc",
  "kyc-verification": "/creator/kyc",
  notifications: "/creator/notifications",
  help: "/creator/help",
  settings: "/creator/settings",
};

// Keys whose destination needs a courseId baked into the URL.
// params is the second argument onNavigate(key, params) is called with.
const CREATOR_DYNAMIC_KEY_TO_PATH = {
  "course-create-video": (params) => `/creator/courses/new/${params?.courseId}/video`,
  "course-create-preview": (params) => `/creator/courses/new/${params?.courseId}/preview`,
};

export function creatorPathFor(key, params) {
  const dynamic = CREATOR_DYNAMIC_KEY_TO_PATH[key];
  if (dynamic) return dynamic(params);
  return CREATOR_KEY_TO_PATH[key] || "/creator";
}