// Auth state — token + user persisted to localStorage (same keys the legacy
// dashboard used), hydrated from GET /auth/me on load, role helpers matching
// the mobile app's routing rules (CREATOR → creator shell, else user shell).
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch, unwrap } from "../utils/api";
import { connectSocket, disconnectSocket } from "../utils/socket";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function roleOf(user) {
  const raw = Array.isArray(user?.user_type)
    ? (user.user_type.includes("ADMIN") ? "ADMIN" : user.user_type.includes("CREATOR") ? "CREATOR" : user.user_type[0] || "")
    : user?.user_type || user?.role || "";
  const r = String(raw).toUpperCase();
  if (r.includes("ADMIN")) return "ADMIN";
  if (r.includes("CREATOR")) return "CREATOR";
  return "USER"; // USER, BRAND, AGENCY all use the user shell
}

export function canAccessMarketplace(user) {
  const r = String(user?.user_type || "").toUpperCase();
  return r === "BRAND" || r === "AGENCY";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [booted, setBooted] = useState(false);

  const login = useCallback(({ user: u, token }) => {
    if (token) localStorage.setItem("manchly_token", token);
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
    }
    connectSocket();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("manchly_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      // Preserve the login-time user_type (app parity: profile refreshes never
      // overwrite the role picked at login).
      const merged = { ...(prev || {}), ...patch, user_type: prev?.user_type ?? patch?.user_type };
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
  }, []);

  // Hydrate from /auth/me + connect socket when a token exists.
  useEffect(() => {
    const token = localStorage.getItem("manchly_token") || localStorage.getItem("token");
    if (!token) {
      setBooted(true);
      return;
    }
    connectSocket();
    apiFetch("/auth/me")
      .then((body) => {
        const fresh = unwrap(body);
        const u = fresh?.user || fresh;
        if (u && (u.email || u.id)) updateUser(u);
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 403) logout();
      })
      .finally(() => setBooted(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    user,
    token: localStorage.getItem("manchly_token") || localStorage.getItem("token") || "",
    role: roleOf(user),
    isAuthed: !!user && !!(localStorage.getItem("manchly_token") || localStorage.getItem("token")),
    booted,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
