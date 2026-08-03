export function formatCurrency(amount = 0) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function timeAgo(date) {
  if (!date) return "";

  const diff = Date.now() - new Date(date).getTime();

  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "Just now";

  if (mins < 60)
    return `${mins} minute${mins > 1 ? "s" : ""} ago`;

  const hrs = Math.floor(mins / 60);

  if (hrs < 24)
    return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;

  const days = Math.floor(hrs / 24);

  if (days < 30)
    return `${days} day${days > 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);

  if (months < 12)
    return `${months} month${months > 1 ? "s" : ""} ago`;

  const years = Math.floor(months / 12);

  return `${years} year${years > 1 ? "s" : ""} ago`;
}