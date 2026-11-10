// Tiny global toast bus (no provider needed) — components fire toasts via
// showToast(); the <Toaster/> mounted once in App renders them.
export function showToast(message, type = "success") {
  window.dispatchEvent(
    new CustomEvent("manchly:toast", { detail: { message, type, id: Date.now() + Math.random() } })
  );
}

export const toast = {
  success: (m) => showToast(m, "success"),
  error: (m) => showToast(m, "error"),
  info: (m) => showToast(m, "info"),
};
