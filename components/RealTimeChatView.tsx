import React, { useState, useEffect, useRef } from 'react';
import { websocketService } from '../services/websocketService.ts';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface RealTimeChatViewProps {
  currentUser: any;
  roomId: string;
  onClose: () => void;
}

const RealTimeChatView: React.FC<RealTimeChatViewProps> = ({
  currentUser,
  roomId,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Connect to WebSocket
    websocketService.connect();
    
    // Subscribe to chat messages
    websocketService.subscribe('chat_message', (data: ChatMessage) => {
      setMessages(prev => [...prev, { ...data, id: Date.now().toString() }]);
    });

    websocketService.subscribe('user_joined', (data: any) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        userId: 'system',
        username: 'System',
        message: `${data.username} joined the chat`,
        timestamp: Date.now()
      }]);
    });

    // Join room
    websocketService.joinRoom(roomId, currentUser.mongoId || currentUser.username);
    setIsConnected(true);

    return () => {
      websocketService.unsubscribe('chat_message');
      websocketService.unsubscribe('user_joined');
      websocketService.disconnect();
    };
  }, [currentUser, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    websocketService.sendMessage(
      roomId,
      newMessage.trim(),
      currentUser.mongoId || currentUser.username,
      currentUser.username || 'Anonymous'
    );

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-medium">Travel Chat</h3>
          <div className="text-xs opacity-80">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 text-xl"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.userId === (currentUser?.mongoId || currentUser?.username) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.userId === (currentUser?.mongoId || currentUser?.username)
                    ? 'bg-blue-600 text-white'
                    : msg.userId === 'system'
                    ? 'bg-gray-200 text-gray-600 italic'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.userId !== (currentUser?.mongoId || currentUser?.username) && msg.userId !== 'system' && (
                  <div className="font-medium text-xs mb-1">{msg.username}</div>
                )}
                <div>{msg.message}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealTimeChatView;