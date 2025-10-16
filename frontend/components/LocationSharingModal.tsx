import React, { useState, useEffect } from 'react';
import { websocketService } from '../services/websocketService.ts';

interface LocationSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  userLocation?: { latitude: number; longitude: number };
}

const LocationSharingModal: React.FC<LocationSharingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userLocation
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [sharedLocations, setSharedLocations] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (isOpen && currentUser) {
      websocketService.connect();
      
      websocketService.subscribe('location_update', (data) => {
        setSharedLocations(prev => {
          const filtered = prev.filter(loc => loc.userId !== data.userId);
          return [...filtered, data];
        });
      });

      websocketService.subscribe('share_code_created', (data) => {
        setShareCode(data.code);
      });
    }

    return () => {
      websocketService.unsubscribe('location_update');
      websocketService.unsubscribe('share_code_created');
    };
  }, [isOpen, currentUser]);

  const startSharing = () => {
    if (!userLocation || !currentUser) return;

    setIsSharing(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setShareCode(code);

    // Share location every 30 seconds
    const interval = setInterval(() => {
      if (userLocation) {
        websocketService.shareLocation(code, currentUser.mongoId || currentUser.username, userLocation);
      }
    }, 30000);

    // Initial share
    websocketService.shareLocation(code, currentUser.mongoId || currentUser.username, userLocation);

    return () => clearInterval(interval);
  };

  const stopSharing = () => {
    setIsSharing(false);
    setShareCode('');
    setSharedLocations([]);
  };

  const joinSharing = () => {
    if (!joinCode.trim()) return;
    
    websocketService.joinRoom(joinCode, currentUser?.mongoId || currentUser?.username);
    websocketService.subscribe('location_update', (data) => {
      setSharedLocations(prev => {
        const filtered = prev.filter(loc => loc.userId !== data.userId);
        return [...filtered, data];
      });
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Share Location</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {!isSharing ? (
          <div className="space-y-6">
            {/* Start Sharing */}
            <div className="text-center">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-lg font-medium mb-2">Share Your Location</h3>
              <p className="text-gray-600 text-sm mb-4">
                Share your real-time location with friends and family
              </p>
              <button
                onClick={startSharing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                disabled={!userLocation}
              >
                Start Sharing
              </button>
              {!userLocation && (
                <p className="text-red-500 text-xs mt-2">Location access required</p>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-3">Join Someone's Share</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter share code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                />
                <button
                  onClick={joinSharing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={!joinCode.trim()}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sharing Active */}
            <div className="text-center">
              <div className="text-4xl mb-4">🟢</div>
              <h3 className="text-lg font-medium mb-2">Sharing Active</h3>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">Share this code:</p>
                <div className="text-2xl font-bold text-blue-600 tracking-wider">
                  {shareCode}
                </div>
              </div>
              <button
                onClick={stopSharing}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium"
              >
                Stop Sharing
              </button>
            </div>

            {/* Shared Locations */}
            {sharedLocations.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Shared Locations</h3>
                <div className="space-y-2">
                  {sharedLocations.map((location) => (
                    <div key={location.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{location.username || 'Anonymous'}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(location.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const url = `https://maps.google.com/?q=${location.location.latitude},${location.location.longitude}`;
                          window.open(url, '_blank');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View on Map
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500 text-center">
          🔒 Location sharing is temporary and secure
        </div>
      </div>
    </div>
  );
};

export default LocationSharingModal;