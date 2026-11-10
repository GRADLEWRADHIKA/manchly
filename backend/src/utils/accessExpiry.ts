export interface AccessPolicy {
  /** Numeric amount of the relative duration; unit given by access_duration_unit. */
  access_duration_days?: number | null;
  /** 'day' | 'month' | 'year'. Null/absent is treated as 'day' (backwards compat). */
  access_duration_unit?: string | null;
  access_expires_at?: Date | string | null;
}

export function computeAccessExpiry(
  policy: AccessPolicy,
  enrolledAt: Date | string,
): Date | null {
  const enrolled = new Date(enrolledAt);
  const candidates: Date[] = [];

  if (policy.access_duration_days && policy.access_duration_days > 0) {
    // Calendar-accurate: "1 year" lands on the same day next year, "1 month"
    // on the same day next month (JS clamps overflow, e.g. Jan 31 + 1mo).
    const amount = policy.access_duration_days;
    const unit = (policy.access_duration_unit || "day").toLowerCase();
    const d = new Date(enrolled);
    if (unit === "year") {
      d.setFullYear(d.getFullYear() + amount);
    } else if (unit === "month") {
      d.setMonth(d.getMonth() + amount);
    } else {
      d.setDate(d.getDate() + amount);
    }
    if (!isNaN(d.getTime())) candidates.push(d);
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
  access_duration_unit: string | null;
  access_expires_at: Date | null;
} {
  // Per-unit caps so an absurd value (e.g. via a direct API call) can't overflow
  // the Date range in computeAccessExpiry and flip to "never expires".
  const MAX_BY_UNIT: Record<string, number> = { day: 36500, month: 1200, year: 100 };

  const rawUnit =
    typeof body?.access_duration_unit === 'string'
      ? body.access_duration_unit.toLowerCase()
      : null;
  let unit: string | null = rawUnit && rawUnit in MAX_BY_UNIT ? rawUnit : null;

  let days: number | null = null;
  const rawDays = body?.access_duration_days;
  if (rawDays !== undefined && rawDays !== null && rawDays !== '') {
    const n = Number(rawDays);
    if (Number.isFinite(n) && n > 0) {
      days = Math.min(Math.floor(n), MAX_BY_UNIT[unit ?? 'day']);
    }
  }

  // A duration requires a unit (default 'day'); no duration clears the unit.
  if (days === null) unit = null;
  else if (unit === null) unit = 'day';

  let date: Date | null = null;
  if (body?.access_expires_at) {
    const d = new Date(body.access_expires_at);
    if (!isNaN(d.getTime())) date = d;
  }

  return { access_duration_days: days, access_duration_unit: unit, access_expires_at: date };
}
