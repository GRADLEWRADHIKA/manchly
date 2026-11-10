const DEVICE_ID_KEY = "manchly_device_id";

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    // crypto.randomUUID() is available in all modern browsers (Chrome 92+,
    // Firefox 95+, Safari 15.4+) and in secure contexts (https / localhost).
    id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : // Fallback for older environments — Math.random-based v4-like UUID
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
          });
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Parses the userAgent string into a human-readable label.
 * Used to show the user which device/browser is active on the backend.
 */
function parseDeviceName() {
  const ua = navigator.userAgent;
  let browser = "Browser";
  let os = "Unknown OS";

  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("like Mac")) os = "iOS";

  return `${browser} on ${os}`;
}

/**
 * Returns the full device payload expected by auth endpoints.
 *   { device_id, device_name, platform }
 */
export function getDeviceInfo() {
  return {
    device_id: getDeviceId(),
    device_name: parseDeviceName(),
    platform: "web",
  };
}