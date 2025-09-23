const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rooms = new Map();
const users = new Map();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join_room':
          handleJoinRoom(ws, data);
          break;
        case 'chat_message':
          handleChatMessage(ws, data);
          break;
        case 'location_share':
          handleLocationShare(ws, data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    // Clean up user from rooms
    for (const [roomId, room] of rooms.entries()) {
      room.users = room.users.filter(user => user.ws !== ws);
      if (room.users.length === 0) {
        rooms.delete(roomId);
      }
    }
  });
});

function handleJoinRoom(ws, data) {
  const { roomId, userId } = data;
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { users: [], messages: [] });
  }
  
  const room = rooms.get(roomId);
  room.users.push({ ws, userId, username: data.username || 'Anonymous' });
  
  // Notify other users
  broadcastToRoom(roomId, {
    type: 'user_joined',
    userId,
    username: data.username || 'Anonymous'
  }, ws);
  
  console.log(`User ${userId} joined room ${roomId}`);
}

function handleChatMessage(ws, data) {
  const { roomId, message, userId, username } = data;
  
  const messageData = {
    type: 'chat_message',
    roomId,
    message,
    userId,
    username,
    timestamp: Date.now()
  };
  
  // Store message
  if (rooms.has(roomId)) {
    rooms.get(roomId).messages.push(messageData);
  }
  
  // Broadcast to all users in room
  broadcastToRoom(roomId, messageData);
  
  console.log(`Message in room ${roomId}: ${message}`);
}

function handleLocationShare(ws, data) {
  const { roomId, userId, location } = data;
  
  const locationData = {
    type: 'location_update',
    roomId,
    userId,
    location,
    timestamp: Date.now()
  };
  
  // Broadcast location to all users in room
  broadcastToRoom(roomId, locationData);
  
  console.log(`Location shared in room ${roomId}: ${location.latitude}, ${location.longitude}`);
}

function broadcastToRoom(roomId, data, excludeWs = null) {
  if (!rooms.has(roomId)) return;
  
  const room = rooms.get(roomId);
  room.users.forEach(user => {
    if (user.ws !== excludeWs && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(JSON.stringify(data));
    }
  });
}

const PORT = process.env.WS_PORT || 3002;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

module.exports = { server, wss };