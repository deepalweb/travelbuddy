import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Filter, Grid, List, Star, TrendingUp, Users, DollarSign, Clock, Share2, Heart, Ticket } from 'lucide-react';
import { Card, CardContent } from '../components/Card';

interface Event {
  id: string;
  name: string;
  description: string;
  category: string;
  location: { city: string; country: string };
  date: string;
  endDate?: string;
  time: string;
  price: number;
  currency: string;
  image: string;
  rating: number;
  attendees: number;
  organizer: string;
  isTrending?: boolean;
  isFree?: boolean;
  isVerified?: boolean;
}

const categories = [
  { id: 'all', label: 'All Events', icon: '🎉' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'cultural', label: 'Cultural', icon: '🎭' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'food', label: 'Food & Drink', icon: '🍽️' },
  { id: 'festivals', label: 'Festivals', icon: '🎪' }
];

export const EventsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    dateRange: 'all',
    rating: 0,
    location: ''
  });

  useEffect(() => {
    // Mock data - replace with API call
    setEvents([
      {
        id: '1',
        name: 'Summer Music Festival 2024',
        description: 'The biggest music festival of the year featuring top artists',
        category: 'music',
        location: { city: 'Barcelona', country: 'Spain' },
        date: '2024-07-15',
        endDate: '2024-07-17',
        time: '18:00',
        price: 150,
        currency: 'EUR',
        image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
        rating: 4.8,
        attendees: 5000,
        organizer: 'Global Events Co.',
        isTrending: true,
        isVerified: true
      },
      {
        id: '2',
        name: 'Tokyo Food Festival',
        description: 'Experience authentic Japanese cuisine from top chefs',
        category: 'food',
        location: { city: 'Tokyo', country: 'Japan' },
        date: '2024-06-20',
        time: '12:00',
        price: 0,
        currency: 'JPY',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
        rating: 4.9,
        attendees: 3000,
        organizer: 'Tokyo Tourism Board',
        isFree: true,
        isVerified: true
      },
      {
        id: '3',
        name: 'Tech Innovation Summit',
        description: 'Leading tech conference with industry experts',
        category: 'tech',
        location: { city: 'San Francisco', country: 'USA' },
        date: '2024-08-10',
        time: '09:00',
        price: 500,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        rating: 4.7,
        attendees: 2000,
        organizer: 'Tech Leaders Inc.',
        isTrending: true,
        isVerified: true
      }
    ]);
  }, []);

  const filteredEvents = events.filter(event => {
    if (selectedCategory !== 'all' && event.category !== selectedCategory) return false;
    if (searchQuery && !event.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !event.location.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.rating > 0 && event.rating < filters.rating) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4">Discover Amazing Events</h1>
            <p className="text-xl text-white/90">Find concerts, festivals, workshops, and experiences worldwide</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-2xl p-2 flex items-center">
              <Search className="w-6 h-6 text-gray-400 ml-4" />
              <input
                type="text"
                placeholder="Search events, locations, or dates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-4 text-gray-900 text-lg focus:outline-none"
              />
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all">
                Search
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold">{events.length}+</div>
              <div className="text-white/80">Events This Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">50+</div>
              <div className="text-white/80">Cities Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">8</div>
              <div className="text-white/80">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 overflow-x-auto">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-purple-600 transition-all"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </button>
              <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                <select className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none">
                  <option>All Dates</option>
                  <option>This Weekend</option>
                  <option>Next 7 Days</option>
                  <option>Next Month</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                <select className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none">
                  <option>All Prices</option>
                  <option>Free</option>
                  <option>Under $50</option>
                  <option>$50 - $200</option>
                  <option>$200+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <select 
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                  value={filters.rating}
                  onChange={(e) => setFilters({...filters, rating: Number(e.target.value)})}
                >
                  <option value={0}>All Ratings</option>
                  <option value={4.0}>4.0+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                  <option value={4.8}>4.8+ Stars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City or Country"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Grid/List */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredEvents.length} Events Found
          </h2>
          <select className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none">
            <option>Sort by: Recommended</option>
            <option>Date: Soonest First</option>
            <option>Price: Low to High</option>
            <option>Rating: Highest First</option>
            <option>Most Popular</option>
          </select>
        </div>

        {/* Create Event Button for Organizers */}
        <div className="mb-6">
          <button
            onClick={() => window.location.href = '/events/create'}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <span>+ Create New Event</span>
          </button>
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredEvents.map(event => (
            <Card key={event.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative">
                <img src={event.image} alt={event.name} className="w-full h-48 object-cover" />
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  {event.isTrending && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" /> Trending
                    </span>
                  )}
                  {event.isFree && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Free Entry
                    </span>
                  )}
                  {event.isVerified && (
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <button className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all">
                  <Heart className="w-5 h-5 text-gray-700" />
                </button>
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-purple-600 uppercase">{event.category}</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold">{event.rating}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{event.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {event.location.city}, {event.location.country}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    {event.attendees.toLocaleString()} attendees
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    {event.isFree ? (
                      <span className="text-2xl font-bold text-green-600">Free</span>
                    ) : (
                      <span className="text-2xl font-bold text-gray-900">
                        {event.currency === 'USD' ? '$' : event.currency === 'EUR' ? '€' : '¥'}
                        {event.price}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setSelectedEvent(event)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img src={selectedEvent.image} alt={selectedEvent.name} className="w-full h-64 object-cover rounded-t-2xl" />
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all"
              >
                <Share2 className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-semibold text-purple-600 uppercase">{selectedEvent.category}</span>
                  <h2 className="text-3xl font-bold text-gray-900 mt-2">{selectedEvent.name}</h2>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xl font-bold">{selectedEvent.rating}</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">{selectedEvent.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-semibold">{selectedEvent.location.city}, {selectedEvent.location.country}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-semibold">{new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-semibold">{selectedEvent.time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Attendees</p>
                    <p className="font-semibold">{selectedEvent.attendees.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Organized by</p>
                    <p className="text-lg font-bold text-gray-900">{selectedEvent.organizer}</p>
                  </div>
                  <div className="text-right">
                    {selectedEvent.isFree ? (
                      <span className="text-3xl font-bold text-green-600">Free</span>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600">Price</p>
                        <span className="text-3xl font-bold text-gray-900">
                          {selectedEvent.currency === 'USD' ? '$' : selectedEvent.currency === 'EUR' ? '€' : '¥'}
                          {selectedEvent.price}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all">
                  Book Now
                </button>
                <button className="px-6 py-4 border-2 border-gray-300 rounded-xl hover:border-purple-600 transition-all">
                  <Heart className="w-6 h-6 text-gray-600" />
                </button>
                <button className="px-6 py-4 border-2 border-gray-300 rounded-xl hover:border-purple-600 transition-all">
                  <Share2 className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Are You an Event Organizer?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join TravelBuddy and reach millions of travelers worldwide
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => window.location.href = '/event-organizer-registration'}
              className="bg-white text-purple-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
            >
              Register as Organizer
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
