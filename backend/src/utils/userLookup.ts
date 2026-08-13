import prisma from "../prismaClient";
import { toLocalPhone } from "./phone";

/**
 * Resolve a target user by explicit `user_id`, by `email`, or by `phone`,
 * tolerating country-code / formatting differences in how the phone was
 * stored. A bare 10-digit lookup will still match a user whose number is
 * stored with a "+91…"/"91…" prefix, and email is matched case-insensitively.
 *
 * Precedence: user_id > email > phone.
 *
 * Returns the user, or null if not found or ambiguous (more than one match on
 * the tolerant phone fallback — never guess in that case).
 */
export async function resolveUser(opts: {
  user_id?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  const { user_id, phone } = opts;
  const email = opts.email?.trim();

  if (user_id) {
    return prisma.users.findUnique({ where: { id: user_id } });
  }

  // Email is `@unique`; match case-insensitively so "User@x.com" resolves a
  // stored "user@x.com".
  if (email) {
    return prisma.users.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
  }

  if (!phone) return null;

  // Exact match first — indexed, fast, and the common case (numbers stored
  // as bare 10 digits).
  const exact = await prisma.users.findFirst({ where: { phone } });
  if (exact) return exact;

  // Fallback: tolerate a stored country-code prefix (e.g. "+919161299402")
  // by matching on the 10-digit local suffix. Only accept an unambiguous
  // single match so we never grant to the wrong account.
  const local = toLocalPhone(phone);
  if (!local) return null;
  const candidates = await prisma.users.findMany({
    where: { phone: { endsWith: local } },
    take: 2,
  });
  return candidates.length === 1 ? candidates[0] : null;
}

/** @deprecated use {@link resolveUser} — kept for backwards compatibility. */
export const resolveUserByIdOrPhone = resolveUser;
