import { io, Socket } from 'socket.io-client';
import { getWebSocketBase } from './config';

export interface RealTimeMessage {
  id: string;
  type: 'chat' | 'location' | 'deal_alert' | 'trip_update';
  userId: string;
  content: any;
  timestamp: Date;
}

export interface LocationShare {
  userId: string;
  username: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  tripId?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(userId: string) {
    if (this.socket) return;

  this.socket = io(getWebSocketBase(), {
      auth: { userId },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('WebSocket disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Real-time chat
  sendMessage(roomId: string, message: string) {
    if (!this.socket) return;
    this.socket.emit('chat_message', { roomId, message });
  }

  onMessage(callback: (data: RealTimeMessage) => void) {
    if (!this.socket) return;
    this.socket.on('chat_message', callback);
  }

  // Live location sharing
  shareLocation(location: LocationShare) {
    if (!this.socket) return;
    this.socket.emit('location_share', location);
  }

  onLocationUpdate(callback: (location: LocationShare) => void) {
    if (!this.socket) return;
    this.socket.on('location_update', callback);
  }

  // Deal alerts
  onDealAlert(callback: (deal: any) => void) {
    if (!this.socket) return;
    this.socket.on('deal_alert', callback);
  }

  // Join/leave rooms
  joinRoom(roomId: string) {
    if (!this.socket) return;
    this.socket.emit('join_room', roomId);
  }

  leaveRoom(roomId: string) {
    if (!this.socket) return;
    this.socket.emit('leave_room', roomId);
  }

  get connected() {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();