class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  connect(url: string = 'ws://localhost:3001') {
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const handler = this.messageHandlers.get(data.type);
          if (handler) {
            handler(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectInterval);
    }
  }

  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  subscribe(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  unsubscribe(type: string) {
    this.messageHandlers.delete(type);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Chat specific methods
  joinRoom(roomId: string, userId: string) {
    this.send('join_room', { roomId, userId });
  }

  sendMessage(roomId: string, message: string, userId: string, username: string) {
    this.send('chat_message', { roomId, message, userId, username, timestamp: Date.now() });
  }

  // Location sharing
  shareLocation(roomId: string, userId: string, location: { latitude: number; longitude: number }) {
    this.send('location_share', { roomId, userId, location, timestamp: Date.now() });
  }
}

export const websocketService = new WebSocketService();