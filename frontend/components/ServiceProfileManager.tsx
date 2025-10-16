import React, { useState } from 'react';

const ServiceProfileManager: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [serviceData, setServiceData] = useState({
    serviceName: 'City Tour Guide',
    serviceType: 'guide',
    serviceDescription: 'Professional tour guide services',
    serviceArea: 'Downtown Area',
    hourlyRate: 50,
    dailyRate: 300,
    languages: ['English', 'Spanish'],
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });

  const handleSave = async () => {
    try {
      const response = await fetch('/api/services/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user-id', // Replace with actual user ID
          ...serviceData
        })
      });
      
      if (response.ok) {
        alert('Service profile updated successfully!');
        setIsEditing(false);
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Service Profile</h3>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
          <input
            type="text"
            value={serviceData.serviceName}
            onChange={(e) => setServiceData({...serviceData, serviceName: e.target.value})}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            readOnly={!isEditing}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
          <select
            value={serviceData.serviceType}
            onChange={(e) => setServiceData({...serviceData, serviceType: e.target.value})}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            disabled={!isEditing}
          >
            <option value="guide">🎯 Tour Guide</option>
            <option value="driver">🚗 Driver</option>
            <option value="tour_operator">🏢 Tour Operator</option>
            <option value="transport">🚌 Transport Service</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={serviceData.serviceDescription}
            onChange={(e) => setServiceData({...serviceData, serviceDescription: e.target.value})}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows={3}
            readOnly={!isEditing}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Area</label>
          <input
            type="text"
            value={serviceData.serviceArea}
            onChange={(e) => setServiceData({...serviceData, serviceArea: e.target.value})}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            readOnly={!isEditing}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
          <input
            type="text"
            value={serviceData.languages.join(', ')}
            onChange={(e) => setServiceData({...serviceData, languages: e.target.value.split(', ')})}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            readOnly={!isEditing}
            placeholder="English, Spanish, French"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
          <input
            type="number"
            value={serviceData.hourlyRate}
            onChange={(e) => setServiceData({...serviceData, hourlyRate: Number(e.target.value)})}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            readOnly={!isEditing}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate ($)</label>
          <input
            type="number"
            value={serviceData.dailyRate}
            onChange={(e) => setServiceData({...serviceData, dailyRate: Number(e.target.value)})}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            readOnly={!isEditing}
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Available Days</label>
          <div className="flex flex-wrap gap-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={serviceData.availability.includes(day)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setServiceData({...serviceData, availability: [...serviceData.availability, day]});
                    } else {
                      setServiceData({...serviceData, availability: serviceData.availability.filter(d => d !== day)});
                    }
                  }}
                  disabled={!isEditing}
                  className="mr-1"
                />
                <span className="text-sm">{day}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProfileManager;