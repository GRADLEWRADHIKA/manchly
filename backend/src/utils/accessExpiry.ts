/**
 * Access-expiry helpers for Feature #8 (custom access expiration).
 *
 * The expiry policy lives on the course/webinar (set by the creator at publish
 * time) and is evaluated against each enrollment's `enrolled_at` at access-check
 * time. This keeps a single source of truth on the product and avoids having to
 * freeze a value into every enrollment-creation path.
 *
 *   access_duration_days -> access lasts N days from the user's enrollment
 *   access_expires_at    -> access ends on this fixed date for everyone
 *
 * If both are set, the earlier (more restrictive) date wins. If neither is set,
 * access is permanent (null).
 */

export interface AccessPolicy {
  access_duration_days?: number | null;
  access_expires_at?: Date | string | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compute the effective access-expiry date for an enrollment, or null if the
 * product grants permanent access.
 */
export function computeAccessExpiry(
  policy: AccessPolicy,
  enrolledAt: Date | string,
): Date | null {
  const enrolled = new Date(enrolledAt);
  const candidates: Date[] = [];

  if (policy.access_duration_days && policy.access_duration_days > 0) {
    candidates.push(new Date(enrolled.getTime() + policy.access_duration_days * MS_PER_DAY));
  }
  if (policy.access_expires_at) {
    const d = new Date(policy.access_expires_at);
    if (!isNaN(d.getTime())) candidates.push(d);
  }

  if (candidates.length === 0) return null;
  return candidates.reduce((earliest, d) => (d < earliest ? d : earliest));
}

/** True if the enrollment's access has expired as of `now`. */
export function isAccessExpired(
  policy: AccessPolicy,
  enrolledAt: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!enrolledAt) return false;
  const expiry = computeAccessExpiry(policy, enrolledAt);
  return expiry !== null && expiry.getTime() <= now.getTime();
}

/**
 * Normalize the access-policy fields from a request body into storable values.
 * Returns `{ access_duration_days, access_expires_at }` with invalid/empty
 * inputs coerced to null so they clear any previous policy.
 */
export function parseAccessPolicyInput(body: any): {
  access_duration_days: number | null;
  access_expires_at: Date | null;
} {
  // Cap the duration so an absurd value (e.g. via a direct API call) can't
  // overflow the Date range in computeAccessExpiry and flip to "never expires".
  const MAX_DURATION_DAYS = 36500; // 100 years
  let days: number | null = null;
  const rawDays = body?.access_duration_days;
  if (rawDays !== undefined && rawDays !== null && rawDays !== '') {
    const n = Number(rawDays);
    days = Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), MAX_DURATION_DAYS) : null;
  }

  let date: Date | null = null;
  if (body?.access_expires_at) {
    const d = new Date(body.access_expires_at);
    if (!isNaN(d.getTime())) date = d;
  }

  return { access_duration_days: days, access_expires_at: date };
}
