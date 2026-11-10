/**
 * Storefront handles — the <handle> in https://<handle>.manchly.com.
 *
 * A handle is also a DNS label, so it has to satisfy DNS rules on top of being
 * readable: lowercase alphanumerics and hyphens only, no leading/trailing
 * hyphen, 3–30 characters. Everything is stored lowercased.
 */
import prisma from "../prismaClient";

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 30;

/**
 * Subdomains that must never belong to a creator — infrastructure hostnames,
 * routes we may want later, and words that would let someone impersonate
 * Manchly itself.
 */
export const RESERVED_HANDLES = new Set([
  // infrastructure
  "www", "api", "app", "admin", "server", "mail", "smtp", "imap", "pop", "ftp",
  "ns", "ns1", "ns2", "dns", "mx", "cdn", "static", "assets", "media", "img",
  "files", "download", "downloads", "webhook", "webhooks", "proxy", "vpn",
  // product surfaces
  "blog", "help", "support", "docs", "status", "dev", "staging", "stage",
  "test", "testing", "demo", "sandbox", "preview", "beta", "alpha",
  "dashboard", "creator", "creators", "user", "users", "account", "accounts",
  "login", "signup", "signin", "register", "auth", "oauth", "sso",
  "payments", "payment", "pay", "checkout", "billing", "invoice", "sdk",
  "store", "shop", "marketplace", "explore", "search", "settings",
  // brand / abuse
  "manchly", "manchlyofficial", "official", "team", "staff", "security",
  "abuse", "postmaster", "hostmaster", "webmaster", "root", "system", "null",
  "undefined", "none", "me", "my", "all",
]);

const HANDLE_RE = /^[a-z0-9]([a-z0-9-]{1,28})[a-z0-9]$/;

export type HandleRejection =
  | "TOO_SHORT" | "TOO_LONG" | "INVALID_CHARS" | "EDGE_HYPHEN"
  | "DOUBLE_HYPHEN" | "RESERVED" | "TAKEN";

export const HANDLE_MESSAGES: Record<HandleRejection, string> = {
  TOO_SHORT: `Handle must be at least ${HANDLE_MIN} characters`,
  TOO_LONG: `Handle must be at most ${HANDLE_MAX} characters`,
  INVALID_CHARS: "Handle can only contain lowercase letters, numbers, and hyphens",
  EDGE_HYPHEN: "Handle cannot start or end with a hyphen",
  DOUBLE_HYPHEN: "Handle cannot contain two hyphens in a row",
  RESERVED: "That handle is reserved",
  TAKEN: "That handle is already taken",
};

/** Turn arbitrary text (a name, an email local-part) into a handle-shaped string. */
export function slugifyHandle(input: string): string {
  return String(input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining accent marks
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, HANDLE_MAX)
    .replace(/-+$/g, "");              // slice may have left a trailing hyphen
}

/** Shape/reserved-word check only — does not hit the database. */
export function validateHandleFormat(handle: string): HandleRejection | null {
  const h = String(handle || "").toLowerCase().trim();
  if (h.length < HANDLE_MIN) return "TOO_SHORT";
  if (h.length > HANDLE_MAX) return "TOO_LONG";
  if (/^-|-$/.test(h)) return "EDGE_HYPHEN";
  if (/--/.test(h)) return "DOUBLE_HYPHEN";
  if (!/^[a-z0-9-]+$/.test(h)) return "INVALID_CHARS";
  if (!HANDLE_RE.test(h)) return "INVALID_CHARS";
  if (RESERVED_HANDLES.has(h)) return "RESERVED";
  return null;
}

/** Format check plus a uniqueness check. `exceptUserId` lets a creator keep their own. */
export async function validateHandle(
  handle: string,
  exceptUserId?: string,
): Promise<HandleRejection | null> {
  const format = validateHandleFormat(handle);
  if (format) return format;

  const existing = await prisma.users.findFirst({
    where: { handle: handle.toLowerCase().trim() },
    select: { id: true },
  });
  if (existing && existing.id !== exceptUserId) return "TAKEN";
  return null;
}

/**
 * Build a free handle from a name/email, appending a counter on collision.
 * Used when backfilling and when a creator signs up without choosing one.
 */
export async function generateUniqueHandle(seed: string): Promise<string> {
  let base = slugifyHandle(seed);
  if (base.length < HANDLE_MIN) base = "creator";
  if (RESERVED_HANDLES.has(base)) base = `${base}-manchly`;
  base = base.slice(0, HANDLE_MAX - 3); // leave room for a suffix

  let candidate = base;
  for (let n = 2; n < 1000; n++) {
    if (!(await validateHandle(candidate))) return candidate;
    candidate = `${base}${n}`;
  }
  // Astronomically unlikely; fall back to something certainly free.
  return `${base}-${Date.now().toString(36)}`.slice(0, HANDLE_MAX);
}

/**
 * Pull the handle out of a Host header.
 * Returns null for the apex domain, www, and any reserved subdomain, so callers
 * can 404 rather than trying to look those up as creators.
 */
export function handleFromHost(host?: string | null): string | null {
  if (!host) return null;
  const hostname = String(host).split(":")[0].toLowerCase().trim();

  const rootDomain = (process.env.STOREFRONT_ROOT_DOMAIN || "manchly.com").toLowerCase();
  if (!hostname.endsWith(`.${rootDomain}`)) return null;

  const sub = hostname.slice(0, -(rootDomain.length + 1));
  // Only a single label is a storefront: a.b.manchly.com is not.
  if (!sub || sub.includes(".")) return null;
  if (RESERVED_HANDLES.has(sub)) return null;
  if (validateHandleFormat(sub)) return null;

  return sub;
}
