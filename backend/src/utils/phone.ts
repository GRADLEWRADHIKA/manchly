/**
 * Sanitize a stored phone number into the 10-digit local format Cashfree expects.
 * Only trims a country code when there are more than 10 digits, so bare 10-digit
 * numbers starting with "91" (e.g. 9161299402) are left intact.
 */
export function sanitizePhoneForCashfree(phone: string | null | undefined): string {
  const digits = (phone || "").replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return local.length === 10 ? local : "9999999999";
}

/**
 * Reduce any phone string to its 10-digit local form, or null if it doesn't
 * contain a usable 10-digit number. Used for tolerant phone lookups so a bare
 * 10-digit number matches a stored "+91…"/"91…" variant of the same number.
 */
export function toLocalPhone(phone: string | null | undefined): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return local.length === 10 ? local : null;
}
