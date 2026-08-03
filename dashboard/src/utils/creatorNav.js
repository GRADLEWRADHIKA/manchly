// Single source of truth for creator-shell navigation keys → routes.
// Radhika's screens navigate with semantic keys ("course-create", "withdraw");
// the layout and standalone screens both resolve them here.
export const CREATOR_KEY_TO_PATH = {
  dashboard: "/creator",
  overview: "/creator/overview",
  courses: "/creator/courses",
  studio: "/creator/studio",
  "course-create": "/creator/studio",
  "course-analytics": "/creator/studio",
  "course-preview": "/creator/studio",
  "course-duplicate": "/creator/studio",
  "course-manage": "/creator/studio",
  webinars: "/creator/webinars",
  "webinar-create": "/creator/webinars",
  sessions: "/creator/sessions",
  ai: "/creator/ai",
  wallet: "/creator/wallet",
  withdraw: "/creator/wallet",
  kyc: "/creator/kyc",
  "kyc-verification": "/creator/kyc",
  notifications: "/creator/notifications",
  help: "/creator/help",
  settings: "/creator/settings",
};

export function creatorPathFor(key) {
  return CREATOR_KEY_TO_PATH[key] || "/creator";
}
