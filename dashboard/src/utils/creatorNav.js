export const CREATOR_KEY_TO_PATH = {
  dashboard: "/creator",
  overview: "/creator/overview",
  courses: "/creator/courses",
  coursestats: "/creator/courses/stats",
  studio: "/creator/studio",
  "course-analytics": "/creator/studio",
  "course-preview": "/creator/studio",
  "course-duplicate": "/creator/studio",
  "course-manage": "/creator/studio",
  reels: "/creator/reels",
  webinars: "/creator/webinars",
  "webinar-create": "/creator/webinars",
  sessions: "/creator/sessions",
  "creator-hub": "/creator/hub",
  creator: "/creator/hub",
  community: "/creator/community",
  ai: "/creator/ai",
  "course-planner": "/creator/course-planner",
  wallet: "/creator/wallet",
  withdraw: "/creator/wallet",
  kyc: "/creator/kyc",
  "kyc-verification": "/creator/kyc",
  notifications: "/creator/notifications",
  help: "/creator/help",
  settings: "/creator/settings",
};

const CREATOR_DYNAMIC_KEY_TO_PATH = {
  "course-create": (params) =>
    params?.courseId ? `/creator/courses/new/${params.courseId}` : "/creator/courses/new",
  "course-create-video": (params) => `/creator/courses/new/${params?.courseId}/video`,
  "course-create-preview": (params) => `/creator/courses/new/${params?.courseId}/preview`,
  "course-studio": (params) =>
    params?.courseId
      ? `/creator/studio?courseId=${params.courseId}`
      : "/creator/studio",
};

export function creatorPathFor(key, params) {
  const dynamic = CREATOR_DYNAMIC_KEY_TO_PATH[key];
  if (dynamic) return dynamic(params);
  return CREATOR_KEY_TO_PATH[key] || "/creator";
}