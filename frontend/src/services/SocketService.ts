import {io, Socket} from 'socket.io-client';
import {BASE_URL} from '../utils/Urls';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) return;

    const url = BASE_URL.replace(/\/$/, '');
    this.socket = io(url, {
      auth: {token},
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      // Re-attach all registered listeners on reconnect
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(cb => {
          this.socket?.off(event, cb as any);
          this.socket?.on(event, cb as any);
        });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.onAny((event, ...args) => {
      console.log('Socket event received:', event, JSON.stringify(args));
    });

    // Attach already registered listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(cb => {
        this.socket?.on(event, cb as any);
      });
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    if (this.socket) {
      this.socket.on(event, callback as any);
      console.log(`Socket listener registered: ${event} (connected: ${this.socket.connected})`);
    } else {
      console.log(`Socket listener queued: ${event} (socket not connected yet)`);
    }
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback as any);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
