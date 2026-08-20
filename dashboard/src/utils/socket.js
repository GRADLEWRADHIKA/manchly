import { io } from "socket.io-client";
import { BACKEND_ORIGIN, getToken } from "./api";
import { getDeviceId } from "./deviceId";

const SOCKET_URL = BACKEND_ORIGIN;

let socket = null;
const listeners = new Map(); // event -> Set<cb>
const onlineUsers = new Set();

function attach(event, cb) {
  if (socket) socket.on(event, cb);
}

export function connectSocket() {
  const token = getToken();
  if (!token) return null;
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();

  const deviceId = getDeviceId();

  socket = io(SOCKET_URL, {
    // 1. Pass both JWT token and unique deviceId in auth handshake
    auth: { 
      token,
      deviceId 
    },
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    socket.emit("user_online");

    // Re-attach registered listeners on reconnect
    for (const [event, cbs] of listeners) {
      for (const cb of cbs) {
        socket.off(event, cb);
        socket.on(event, cb);
      }
    }
  });

  // 2. Real-time Single Device Logout Listener
  // Catches active invalidation when logged in from another device
  socket.on("force_logout", (data) => {
    const message =
      data?.message ||
      "You have been logged out because your account was signed in on another device.";

    // Emit the same window event used by your Axios interceptor
    window.dispatchEvent(
      new CustomEvent("manchly:force-logout", {
        detail: { message },
      })
    );

    disconnectSocket();
  });

  socket.on("user_status", ({ userId, status }) => {
    if (status === "online") onlineUsers.add(userId);
    else onlineUsers.delete(userId);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  onlineUsers.clear();
}

export function onSocket(event, cb) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(cb);
  attach(event, cb);
  return () => offSocket(event, cb);
}

export function offSocket(event, cb) {
  listeners.get(event)?.delete(cb);
  if (socket) socket.off(event, cb);
}

export function emitSocket(event, payload) {
  connectSocket()?.emit(event, payload);
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}