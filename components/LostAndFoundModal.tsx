import React from 'react';

interface LostAndFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCity: string;
}

export const LostAndFoundModal: React.FC<LostAndFoundModalProps> = ({
  isOpen,
  onClose,
  userCity
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Lost & Found</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Lost something in {userCity}? Here are some helpful resources:
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded">
              <h3 className="font-semibold text-blue-800">Local Police</h3>
              <p className="text-sm text-blue-600">Contact local authorities for lost items</p>
            </div>

            <div className="p-3 bg-green-50 rounded">
              <h3 className="font-semibold text-green-800">Transportation Hubs</h3>
              <p className="text-sm text-green-600">Check airports, train stations, bus terminals</p>
            </div>

            <div className="p-3 bg-orange-50 rounded">
              <h3 className="font-semibold text-orange-800">Hotels & Restaurants</h3>
              <p className="text-sm text-orange-600">Contact places you recently visited</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};