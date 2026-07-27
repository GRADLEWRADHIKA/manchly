/**
 * Auth helpers for frontend - use existing backend JWT.
 */
var API_BASE = window.location.origin;
var TOKEN_KEY = "manchly_admin_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
function isAuthenticated() {
  return !!getToken();
}
function apiFetch(url, options) {
  options = options || {};
  var token = getToken();
  var headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
  if (token) headers["Authorization"] = "Bearer " + token;
  return fetch(url, Object.assign({}, options, { headers: headers })).then(function(res) {
    if (res.status === 401 || res.status === 403) {
      clearToken();
      if (window.location.pathname !== "/" && window.location.pathname !== "/index.html")
        window.location.href = "/";
      throw new Error("Session expired or access denied");
    }
    return res;
  });
}

window.getToken = getToken;
window.setToken = setToken;
window.clearToken = clearToken;
window.isAuthenticated = isAuthenticated;
window.apiFetch = apiFetch;
window.API_BASE = API_BASE;
