import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    if (this.socket?.connected) return;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const wsUrl = API_BASE_URL.replace('/api', '').replace('http', 'ws');

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Admin WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Admin WebSocket disconnected');
    });

    // Real-time API usage updates
    this.socket.on('api_usage_update', (data) => {
      this.emit('usage_update', data);
    });

    // Real-time cost updates
    this.socket.on('api_cost_update', (data) => {
      this.emit('cost_update', data);
    });

    // System alerts
    this.socket.on('system_alert', (data) => {
      this.emit('system_alert', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }
}

export const websocketService = new WebSocketService();
export default websocketService;