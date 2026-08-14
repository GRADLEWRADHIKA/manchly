import { io } from "socket.io-client";
import { BASE_URL } from "../utils/backendConfig";

class SocketService {
  constructor() {
    this.socket = null;
    this.currentToken = null;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.IO server using JWT auth
   */
  connect(token) {
    if (!token) return;

    // Skip if connected with the exact same token
    if (this.socket?.connected && this.currentToken === token) {
      return;
    }

    // Clean up old disconnected or stale token socket instance
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentToken = token;
    const SOCKET_URL = BASE_URL || "http://localhost:8080";

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    // Re-attach registered listeners on connect / reconnect
    this.socket.on("connect", () => {
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((cb) => {
          this.socket?.off(event, cb);
          this.socket?.on(event, cb);
        });
      });
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err.message);
    });
  }

  /**
   * Disconnect and cleanup socket instance
   */
  disconnect() {
    this.currentToken = null;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Register an event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.off(event, callback);
      this.socket.on(event, callback);
    }
  }

  /**
   * Unregister an event listener
   */
  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emit an event
   */
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Check connection status
   */
  isConnected() {
    return !!this.socket?.connected;
  }
}

export default new SocketService();