import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { 
  Calendar, MapPin, Users, Trophy, Clock, Star, 
  Camera, Globe, Award, Fire, Heart, TrendingUp 
} from './Icons.tsx';
// Unsplash removed: using placeholder images for events

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  type: 'challenge' | 'meetup' | 'contest' | 'workshop';
  startDate: string;
  endDate?: string;
  location?: string;
  participants: number;
  maxParticipants?: number;
  prize?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  image: string;
  organizer: string;
  status: 'upcoming' | 'active' | 'completed';
}

const baseEvents = [
  {
    id: '1',
    title: 'Photo Challenge: Hidden Gems',
    description: 'Share photos of lesser-known beautiful places in your city. Winner gets featured on our homepage!',
    type: 'challenge' as const,
    startDate: '2024-01-15',
    endDate: '2024-01-31',
    participants: 156,
    maxParticipants: 500,
    prize: '$100 Travel Voucher',
    difficulty: 'Easy' as const,
    tags: ['photography', 'exploration', 'local'],
    imageQuery: 'photography travel hidden gems',
    organizer: 'Travel Buddy Team',
    status: 'active' as const
  },
  {
    id: '2',
    title: 'Tokyo Meetup: Street Food Tour',
    description: 'Join fellow travelers for an authentic street food experience in Shibuya district.',
    type: 'meetup' as const,
    startDate: '2024-01-20',
    location: 'Tokyo, Japan',
    participants: 12,
    maxParticipants: 20,
    difficulty: 'Medium' as const,
    tags: ['food', 'meetup', 'tokyo'],
    imageQuery: 'tokyo street food',
    organizer: 'Tokyo Explorers',
    status: 'upcoming' as const
  },
  {
    id: '3',
    title: 'Budget Travel Tips Contest',
    description: 'Share your best money-saving travel tips. Top 3 entries win amazing prizes!',
    type: 'contest' as const,
    startDate: '2024-01-10',
    endDate: '2024-02-10',
    participants: 89,
    prize: 'Travel Gear Bundle',
    difficulty: 'Easy' as const,
    tags: ['budget', 'tips', 'contest'],
    imageQuery: 'budget travel backpack',
    organizer: 'Budget Travelers Club',
    status: 'active' as const
  },
  {
    id: '4',
    title: 'Travel Photography Workshop',
    description: 'Learn professional photography techniques from award-winning travel photographers.',
    type: 'workshop' as const,
    startDate: '2024-01-25',
    participants: 45,
    maxParticipants: 50,
    difficulty: 'Hard' as const,
    tags: ['photography', 'workshop', 'skills'],
    imageQuery: 'camera photography workshop',
    organizer: 'Photo Masters',
    status: 'upcoming' as const
  }
];

const CommunityEvents: React.FC = () => {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<'all' | 'challenge' | 'meetup' | 'contest' | 'workshop'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');
  const [events, setEvents] = useState<CommunityEvent[]>([]);

  // Load event images
  useEffect(() => {
    const eventsWithImages = baseEvents.map((event) => ({ ...event, image: '/images/placeholder.svg' }));
    setEvents(eventsWithImages);
  }, []);

  const filteredEvents = events.filter(event => {
    const typeMatch = selectedType === 'all' || event.type === selectedType;
    const statusMatch = selectedStatus === 'all' || event.status === selectedStatus;
    return typeMatch && statusMatch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'challenge': return <Trophy className="text-yellow-500" size={20} />;
      case 'meetup': return <Users className="text-blue-500" size={20} />;
      case 'contest': return <Award className="text-purple-500" size={20} />;
      case 'workshop': return <Star className="text-green-500" size={20} />;
      default: return <Calendar className="text-gray-500" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Active</span>;
      case 'upcoming':
        return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">Upcoming</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Completed</span>;
      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
          <Fire className="text-orange-500" size={28} />
          Community Events & Challenges
        </h2>
        <p className="text-gray-600">Join exciting events, challenges, and connect with fellow travelers</p>
      </div>

      {/* Filters */}
      <div className="card-base p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">All Types</option>
              <option value="challenge">Challenges</option>
              <option value="meetup">Meetups</option>
              <option value="contest">Contests</option>
              <option value="workshop">Workshops</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map(event => (
          <div key={event.id} className="card-base overflow-hidden hover:shadow-lg transition-all duration-300">
            {/* Event Image */}
            <div className="relative h-48 overflow-hidden">
              <img 
                src={event.image} 
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {getTypeIcon(event.type)}
                {getStatusBadge(event.status)}
              </div>
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(event.difficulty)}`}>
                  {event.difficulty}
                </span>
              </div>
            </div>

            {/* Event Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex-1">{event.title}</h3>
                {event.prize && (
                  <div className="ml-2 flex items-center gap-1 text-yellow-600">
                    <Trophy size={16} />
                    <span className="text-xs font-medium">Prize</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

              {/* Event Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>{new Date(event.startDate).toLocaleDateString()}</span>
                  {event.endDate && (
                    <>
                      <span>-</span>
                      <span>{new Date(event.endDate).toLocaleDateString()}</span>
                    </>
                  )}
                </div>

                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span>{event.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={14} />
                  <span>
                    {event.participants} participants
                    {event.maxParticipants && ` / ${event.maxParticipants} max`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Star size={14} />
                  <span>Organized by {event.organizer}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {event.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {event.status === 'active' || event.status === 'upcoming' ? (
                  <button className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    {event.type === 'meetup' ? 'Join Meetup' : 'Participate'}
                  </button>
                ) : (
                  <button className="flex-1 bg-gray-300 text-gray-600 px-4 py-2 rounded-lg font-medium cursor-not-allowed">
                    Completed
                  </button>
                )}
                
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  <Heart size={16} />
                </button>
              </div>

              {/* Progress Bar for Limited Events */}
              {event.maxParticipants && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Participants</span>
                    <span>{Math.round((event.participants / event.maxParticipants) * 100)}% full</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(event.participants / event.maxParticipants) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Event CTA */}
      <div className="card-base p-8 text-center bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="text-xl font-bold mb-2">Want to organize an event?</h3>
        <p className="text-gray-600 mb-4">Create your own community event and bring travelers together!</p>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Create Event
        </button>
      </div>
    </div>
  );
};

export default CommunityEvents;