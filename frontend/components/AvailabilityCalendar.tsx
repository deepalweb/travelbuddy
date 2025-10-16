import React, { useState } from 'react';

interface AvailabilityCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (availability: string[]) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ isOpen, onClose, onSave }) => {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState({
    morning: false,
    afternoon: false,
    evening: false
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    const availability = selectedDays.map(day => {
      const slots = Object.entries(timeSlots)
        .filter(([_, selected]) => selected)
        .map(([slot]) => slot);
      return `${day}: ${slots.join(', ')}`;
    });
    onSave(availability);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Set Availability</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-3">Available Days</h3>
            <div className="grid grid-cols-2 gap-2">
              {days.map(day => (
                <label key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="mr-2"
                  />
                  <span className="text-sm">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Time Slots</h3>
            <div className="space-y-2">
              {Object.entries(timeSlots).map(([slot, checked]) => (
                <label key={slot} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setTimeSlots(prev => ({ ...prev, [slot]: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">{slot}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;