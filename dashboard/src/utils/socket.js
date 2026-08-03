// Socket.IO singleton — same event contract as the mobile app
// (manApp/src/services/SocketService.ts). Connects with the JWT, emits
// user_online, re-attaches listeners on reconnect, tracks online users.
import { io } from "socket.io-client";
import { API_BASE, getToken } from "./api";

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

  socket = io(API_BASE, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    socket.emit("user_online");
    // re-attach every registered listener after (re)connect
    for (const [event, cbs] of listeners) {
      for (const cb of cbs) {
        socket.off(event, cb);
        socket.on(event, cb);
      }
    }
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
