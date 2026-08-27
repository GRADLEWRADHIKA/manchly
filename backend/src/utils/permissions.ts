/**
 * Ownership checks that admins are allowed through.
 *
 * Controllers used to compare `resource.creator_id !== userId` directly, which
 * locked admins out of the very content they are meant to moderate. Route those
 * comparisons through here instead so an ADMIN can act on anyone's resource.
 */
import prisma from "../prismaClient";
import { isAdmin } from "./userTypeHelper";

/** True when this user id carries the ADMIN role. */
export async function isAdminId(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { user_type: true },
  });
  return isAdmin(user?.user_type);
}

/**
 * True when the user owns the resource, or is an admin.
 *
 * The owner check is done first so the common path costs nothing — only a
 * non-owner triggers the lookup, and that is a primary-key hit.
 */
export async function canManageResource(
  userId: string | undefined | null,
  ownerId: string | undefined | null,
): Promise<boolean> {
  if (!userId) return false;
  if (ownerId && userId === ownerId) return true;
  return isAdminId(userId);
}
