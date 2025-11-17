import React from 'react'
import { Link } from 'react-router-dom'
import { Star, MapPin, Phone, Mail, Award, Users } from 'lucide-react'

const featuredAgents = [
  {
    id: 1,
    name: 'Paradise Travel Agency',
    owner: 'Emma Rodriguez',
    rating: 4.9,
    reviews: 127,
    location: 'Downtown',
    phone: '+1-555-0234',
    email: 'emma@paradisetravel.com',
    specialties: ['Beach Resorts', 'Adventure Tours', 'Family Packages'],
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop&auto=format&q=60',
    experience: '8 years'
  },
  {
    id: 2,
    name: 'Mountain Explorer Tours',
    owner: 'David Chen',
    rating: 4.8,
    reviews: 89,
    location: 'Uptown',
    phone: '+1-555-0567',
    email: 'david@mountainexplorer.com',
    specialties: ['Mountain Trekking', 'Wildlife Safari', 'Cultural Tours'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&auto=format&q=60',
    experience: '12 years'
  },
  {
    id: 3,
    name: 'City Break Specialists',
    owner: 'Lisa Thompson',
    rating: 4.7,
    reviews: 156,
    location: 'Central',
    phone: '+1-555-0890',
    email: 'lisa@citybreak.com',
    specialties: ['City Tours', 'Business Travel', 'Weekend Getaways'],
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=200&fit=crop&auto=format&q=60',
    experience: '5 years'
  }
]

export const TravelAgents: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Local Travel Agents</h1>
              <p className="text-gray-600 mt-2">Connect with experienced travel professionals in your area</p>
            </div>
            <Link
              to="/agent-registration"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Register as Agent
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">150+</div>
            <div className="text-gray-600">Verified Agents</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">5,000+</div>
            <div className="text-gray-600">Happy Travelers</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">4.8★</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
        </div>

        {/* Featured Agents */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Travel Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAgents.map((agent) => (
              <div key={agent.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <img 
                  src={agent.image} 
                  alt={agent.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-gray-600 text-sm">by {agent.owner}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{agent.rating}</span>
                      <span className="text-xs text-gray-500">({agent.reviews})</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {agent.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4" />
                      {agent.experience} experience
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Specialties:</div>
                    <div className="flex flex-wrap gap-1">
                      {agent.specialties.map((specialty, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Contact Agent
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Our Agents */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Choose Our Travel Agents?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verified & Licensed</h3>
              <p className="text-gray-600 text-sm">All agents are professionally licensed and verified</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Local Expertise</h3>
              <p className="text-gray-600 text-sm">Deep knowledge of local destinations and culture</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Highly Rated</h3>
              <p className="text-gray-600 text-sm">Top-rated agents with excellent customer reviews</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">Round-the-clock assistance for your travel needs</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Are You a Travel Professional?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join our network of trusted travel agents and connect with travelers looking for authentic local experiences. 
            Grow your business and help people discover amazing destinations.
          </p>
          <Link
            to="/agent-registration"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold inline-block"
          >
            Register as Agent
          </Link>
        </div>
      </div>
    </div>
  )
}
