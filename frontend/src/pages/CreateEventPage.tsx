import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Users, Clock, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { LocationPicker } from '../components/LocationPicker';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useConfig();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category: 'music',
    description: '',
    date: '',
    endDate: '',
    time: '',
    price: '',
    currency: 'USD',
    capacity: '',
    isFree: false
  });
  const [locationData, setLocationData] = useState({
    address: '',
    coordinates: { lat: 0, lng: 0 },
    city: '',
    country: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const apiUrl = config?.apiBaseUrl || 'http://localhost:3001';
      
      const eventData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        location: {
          city: locationData.city,
          country: locationData.country,
          address: locationData.address,
          coordinates: locationData.coordinates
        },
        date: formData.date,
        endDate: formData.endDate || formData.date,
        time: formData.time,
        price: formData.isFree ? 0 : Number(formData.price),
        currency: formData.currency,
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        image: imagePreview || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
        isFree: formData.isFree
      };
      
      const token = await user?.getIdToken();
      const response = await fetch(`${apiUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Backend error:', error);
        throw new Error(error.error || 'Failed to create event');
      }
      
      setSuccess(true);
      setTimeout(() => navigate('/events'), 2000);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Event Created!</h2>
            <p className="text-gray-600 mb-6">
              Your event has been published successfully and is now visible to travelers worldwide.
            </p>
            <button
              onClick={() => navigate('/events')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              View All Events
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create New Event</h1>
          <p className="text-xl text-gray-600">Share your event with millions of travelers</p>
        </div>

        <Card className="bg-white shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Image *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-600 transition-all">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg mb-4" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(''); }}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm font-semibold text-gray-700 mb-2">Upload Event Banner</p>
                      <p className="text-xs text-gray-500 mb-4">JPG, PNG or WebP (Max 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-block px-6 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all cursor-pointer"
                      >
                        Choose Image
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Event Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                  placeholder="Summer Music Festival 2024"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                >
                  <option value="music">🎵 Music</option>
                  <option value="cultural">🎭 Cultural</option>
                  <option value="sports">⚽ Sports</option>
                  <option value="nightlife">🌃 Nightlife</option>
                  <option value="tech">💻 Tech</option>
                  <option value="food">🍽️ Food & Drink</option>
                  <option value="festivals">🎪 Festivals</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none h-32 resize-none"
                  placeholder="Describe your event, what attendees can expect, highlights, etc."
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time *</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">Event Location *</label>
                <LocationPicker
                  value={locationData}
                  onChange={setLocationData}
                  required
                />
              </div>

              {/* Pricing */}
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <input
                    type="checkbox"
                    id="isFree"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({...formData, isFree: e.target.checked, price: e.target.checked ? '0' : formData.price})}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <label htmlFor="isFree" className="text-sm font-semibold text-gray-700">
                    This is a free event
                  </label>
                </div>
                
                {!formData.isFree && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          required={!formData.isFree}
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                          placeholder="150"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Currency *</label>
                      <select
                        required={!formData.isFree}
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Attendees</label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                    placeholder="5000"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/events')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEventPage;
