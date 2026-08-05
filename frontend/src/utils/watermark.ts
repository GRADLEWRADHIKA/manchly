/**
 * Builds the per-viewer watermark label overlaid on recordings (Feature #1).
 * Uses the viewer's name + last 4 phone digits (falling back to a short user id)
 * so a leaked recording traces back to the account.
 */
export function buildWatermark(user: any): string {
  const name = user?.name || 'Manchly User';
  const phone = user?.phone ? String(user.phone) : '';
  const tail = phone
    ? phone.slice(-4)
    : user?.id
    ? String(user.id).slice(0, 6)
    : '';
  return tail ? `${name} • ${tail}` : name;
}
