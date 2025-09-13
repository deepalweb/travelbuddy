import { Server } from 'socket.io';
import http from 'http';

class WebSocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    this.connectedUsers = new Map();
    this.activeRooms = new Map();
    this.sharedLocations = new Map();

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle user authentication
      socket.on('authenticate', (userId) => {
        this.connectedUsers.set(socket.id, userId);
        socket.userId = userId;
        console.log(`User ${userId} authenticated`);
      });

      // Handle joining rooms
      socket.on('join_room', (roomId) => {
        socket.join(roomId);
        if (!this.activeRooms.has(roomId)) {
          this.activeRooms.set(roomId, new Set());
        }
        this.activeRooms.get(roomId).add(socket.id);
        console.log(`User ${socket.userId} joined room ${roomId}`);
      });

      // Handle leaving rooms
      socket.on('leave_room', (roomId) => {
        socket.leave(roomId);
        if (this.activeRooms.has(roomId)) {
          this.activeRooms.get(roomId).delete(socket.id);
        }
      });

      // Handle chat messages
      socket.on('chat_message', (data) => {
        const message = {
          id: `msg-${Date.now()}-${Math.random()}`,
          type: 'chat',
          userId: socket.userId,
          content: data.message,
          timestamp: new Date()
        };

        socket.to(data.roomId).emit('chat_message', message);
      });

      // Handle location sharing
      socket.on('location_share', (locationData) => {
        this.sharedLocations.set(socket.userId, {
          ...locationData,
          socketId: socket.id,
          timestamp: new Date()
        });

        // Broadcast to nearby users (simplified - in production, use geospatial queries)
        socket.broadcast.emit('location_update', locationData);
      });

      // Handle deal alerts
      socket.on('deal_alert', (dealData) => {
        // Broadcast deal to all connected users
        this.io.emit('deal_alert', {
          id: `deal-${Date.now()}`,
          type: 'deal_alert',
          content: dealData,
          timestamp: new Date()
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Clean up user data
        this.connectedUsers.delete(socket.id);
        if (socket.userId) {
          this.sharedLocations.delete(socket.userId);
        }

        // Clean up room memberships
        this.activeRooms.forEach((members, roomId) => {
          members.delete(socket.id);
          if (members.size === 0) {
            this.activeRooms.delete(roomId);
          }
        });
      });
    });
  }

  // Method to send notifications to specific users
  sendNotificationToUser(userId, notification) {
    const userSocket = Array.from(this.connectedUsers.entries())
      .find(([socketId, uId]) => uId === userId);
    
    if (userSocket) {
      this.io.to(userSocket[0]).emit('notification', notification);
    }
  }

  // Method to broadcast to all users in a geographic area
  broadcastToArea(latitude, longitude, radius, message) {
    // Simplified implementation - in production, use proper geospatial calculations
    this.sharedLocations.forEach((location, userId) => {
      const distance = this.calculateDistance(
        latitude, longitude,
        location.latitude, location.longitude
      );
      
      if (distance <= radius) {
        this.io.to(location.socketId).emit('area_broadcast', message);
      }
    });
  }

  // Simple distance calculation (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(value) {
    return value * Math.PI / 180;
  }
}

export default WebSocketServer;