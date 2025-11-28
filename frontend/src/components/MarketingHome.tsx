import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Compass, Globe, Star, MapPin, DollarSign } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { ImageWithFallback } from './ImageWithFallback'

const destinations = [
  {
    id: 1,
    name: 'Paris',
    tagline: 'City of Light',
    image: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=600&h=400&fit=crop',
    rating: 4.9,
    season: 'Apr-Oct',
    budget: '€80-150/day'
  },
  {
    id: 2,
    name: 'Tokyo',
    tagline: 'Modern Metropolis',
    image: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=600&h=400&fit=crop',
    rating: 4.8,
    season: 'Mar-May',
    budget: '¥8000-15000/day'
  },
  {
    id: 3,
    name: 'Bali',
    tagline: 'Island Paradise',
    image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&h=400&fit=crop',
    rating: 4.8,
    season: 'Apr-Oct',
    budget: '$30-80/day'
  }
]

export const MarketingHome: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Two Column Layout */}
      <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop"
            fallbackSrc="https://picsum.photos/1920/1080"
            alt="Travel destination"
            className="h-full w-full object-cover opacity-20"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="relative z-10 flex min-h-screen items-center p-4 py-20">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Column - Content */}
              <div className="text-white">
                <div className="inline-block mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <span className="text-sm font-medium">🚀 Join 50,000+ travelers worldwide</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
                  Discover, Plan &
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300">
                    Experience the World
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl mb-8 text-white/90">
                  Your AI travel assistant — plan smarter, travel better.
                </p>
                
                {/* Feature List */}
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🤖</span>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Smart AI Trip Planning</div>
                      <div className="text-white/70 text-sm">Saves 3+ hours by analyzing your preferences</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">💎</span>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Hidden Gem Discovery</div>
                      <div className="text-white/70 text-sm">AI finds local spots 90% of tourists miss</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">💰</span>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Budget Optimization</div>
                      <div className="text-white/70 text-sm">Automatically finds deals saving $200/trip</div>
                    </div>
                  </div>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/register">
                    <Button className="group bg-white text-gray-900 hover:bg-gray-100 px-10 py-5 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300">
                      Start Planning Free
                      <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 px-10 py-5 text-xl font-semibold rounded-2xl transition-all duration-300">
                      Sign In
                    </Button>
                  </Link>
                </div>
                
                <p className="mt-6 text-white/70 text-sm">No credit card required • Free forever • Web app - no download needed</p>
              </div>
              
              {/* Right Column - Phone Mockup */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Phone Mockup */}
                  <div className="relative w-72 h-[580px] bg-gradient-to-b from-gray-900 to-black rounded-[3rem] p-3 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                      {/* Status Bar */}
                      <div className="bg-gray-900 h-8 flex items-center justify-between px-6 text-white text-xs">
                        <span className="font-medium">9:41</span>
                        <div className="flex gap-1">
                          <div className="w-4 h-2 bg-white rounded-sm"></div>
                          <div className="w-1 h-2 bg-white rounded-sm"></div>
                        </div>
                      </div>
                      
                      {/* App Content */}
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 h-full p-4">
                        <div className="bg-white rounded-2xl p-4 shadow-lg mb-4">
                          <div className="flex items-center gap-3 mb-3">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <span className="font-bold text-gray-900">Paris Trip</span>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-blue-100 rounded-lg p-3">
                              <div className="text-xs text-blue-600 font-medium">Day 1</div>
                              <div className="text-sm font-semibold text-gray-900">Eiffel Tower</div>
                            </div>
                            <div className="bg-purple-100 rounded-lg p-3">
                              <div className="text-xs text-purple-600 font-medium">Day 2</div>
                              <div className="text-sm font-semibold text-gray-900">Louvre Museum</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 text-white shadow-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4" />
                            <span className="text-xs font-semibold">AI Recommendation</span>
                          </div>
                          <div className="text-sm font-medium">Hidden café near Notre Dame</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-600 px-6 py-3 rounded-full text-sm font-semibold mb-6 shadow-sm">
              <Globe className="w-5 h-5" />
              Popular Destinations
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Explore Top Destinations
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Handpicked destinations that offer unforgettable experiences
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {destinations.map((dest) => (
              <Card key={dest.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 rounded-2xl">
                <div className="relative overflow-hidden">
                  <ImageWithFallback
                    src={dest.image}
                    fallbackSrc={`https://picsum.photos/600/400?random=${dest.id}`}
                    alt={dest.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold">{dest.rating}</span>
                  </div>
                  
                  <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Best: {dest.season}
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{dest.name}</h3>
                    <p className="text-white/90 text-sm mb-4">{dest.tagline}</p>
                    
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm font-medium">{dest.budget}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/discovery">
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 text-lg rounded-xl hover:shadow-lg transition-all hover:scale-105">
                View All Destinations
                <Compass className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600 px-6 py-3 rounded-full text-sm font-semibold mb-6 shadow-sm">
              <Compass className="w-5 h-5" />
              How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Plan Your Perfect Trip in 3 Steps
            </h2>
            <p className="text-xl text-gray-600">
              AI-powered planning makes travel simple
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: 1, title: 'Choose Destination', desc: 'Pick where you want to go', icon: '🌍', color: 'from-blue-500 to-blue-600' },
              { step: 2, title: 'AI Creates Itinerary', desc: 'Get personalized recommendations', icon: '🤖', color: 'from-purple-500 to-purple-600' },
              { step: 3, title: 'Book & Travel', desc: 'Everything in one place', icon: '✈️', color: 'from-green-500 to-green-600' }
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                  <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-r ${item.color} text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg`}>
                    {item.step}
                  </div>
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-6 mt-4 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 text-lg">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Link to="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 text-xl rounded-xl hover:shadow-lg transition-all hover:scale-105">
                Start Planning Free
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnpNNiAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTM2IDM0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <span className="text-sm font-medium">✨ Limited Time Offer</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-2xl mx-auto">
            Join 50,000+ travelers planning smarter trips
          </p>
          <Link to="/register">
            <Button className="group bg-white text-gray-900 hover:bg-gray-100 px-16 py-7 text-2xl font-black rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300">
              Get Started Free
              <ArrowRight className="w-7 h-7 ml-3 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
          <p className="mt-6 text-white/70 text-sm">No credit card required • Free forever</p>
        </div>
      </section>
    </div>
  )
}
