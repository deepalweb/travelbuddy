import React, { useState, useEffect } from 'react';
import { websocketService, LocationShare } from '../services/websocketService';
import { CurrentUser } from '../types';

interface LocationSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
  userLocation: { latitude: number; longitude: number } | null;
}

const LocationSharingModal: React.FC<LocationSharingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userLocation
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [sharedLocations, setSharedLocations] = useState<LocationShare[]>([]);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    websocketService.connect(currentUser.username);
    websocketService.onLocationUpdate((location) => {
      setSharedLocations(prev => {
        const filtered = prev.filter(l => l.userId !== location.userId);
        return [...filtered, location];
      });
    });

    return () => {
      websocketService.disconnect();
    };
  }, [isOpen, currentUser]);

  const handleShareLocation = () => {
    if (!currentUser || !userLocation) return;

    const locationData: LocationShare = {
      userId: currentUser.username,
      username: currentUser.username,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      timestamp: new Date()
    };

    websocketService.shareLocation(locationData);
    setIsSharing(true);
    setTimeout(() => setIsSharing(false), 3000);
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share Location</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-4">
          {/* Share current location */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Share Your Location</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="Add a message (optional)"
                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleShareLocation}
                disabled={!userLocation || isSharing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isSharing ? '📍 Shared!' : '📍 Share'}
              </button>
            </div>
          </div>

          {/* Shared locations from others */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Nearby Travelers</h3>
            {sharedLocations.length === 0 ? (
              <p className="text-gray-500 text-sm">No shared locations yet</p>
            ) : (
              <div className="space-y-2">
                {sharedLocations.map((location) => (
                  <div key={location.userId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{location.username}</div>
                      <div className="text-sm text-gray-500">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(location.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ Only share your location with trusted travelers. Your location will be visible to others in this area.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSharingModal;