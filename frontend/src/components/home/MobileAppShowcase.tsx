import React, { useState, useEffect } from 'react'
import { MapPin, Search, Sparkles, Calendar, Star, Heart, Car } from 'lucide-react'
import { Button } from '../Button'
import { Card } from '../Card'
import { motion } from 'framer-motion'

interface AppScreen {
  title: string
  content: React.ReactNode
}

export const MobileAppShowcase: React.FC = () => {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0)

  // Mobile app screens for animation with real images
  const appScreens: AppScreen[] = [
    {
      title: 'Places Discovery',
      content: (
        <div className="bg-gray-50 h-full relative overflow-hidden">
          <div className="bg-white p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-gray-900">Explore Places</h4>
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-3 h-3 text-blue-600" aria-hidden="true" />
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" aria-hidden="true" />
              <input className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm" placeholder="Search places..." readOnly />
            </div>
            <div className="flex gap-2 mb-3">
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">All</div>
              <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">Food</div>
              <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">Culture</div>
            </div>
          </div>
          <div className="p-3 space-y-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="h-24 rounded-t-lg relative overflow-hidden">
                <img
                  src="https://picsum.photos/300/200?random=1"
                  alt="Eiffel Tower"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                  <Heart className="w-3 h-3 text-red-500" aria-hidden="true" />
                </div>
              </div>
              <div className="p-2">
                <h5 className="font-bold text-xs text-gray-900 mb-1">Eiffel Tower</h5>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" aria-hidden="true" />
                    <span className="text-xs font-medium">4.8</span>
                  </div>
                  <span className="text-xs text-gray-500">Landmark</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="h-24 rounded-t-lg relative overflow-hidden">
                <img
                  src="https://picsum.photos/300/200?random=2"
                  alt="Notre Dame"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <h5 className="font-bold text-xs text-gray-900 mb-1">Notre Dame</h5>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" aria-hidden="true" />
                    <span className="text-xs font-medium">4.7</span>
                  </div>
                  <span className="text-xs text-gray-500">Cathedral</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Smart Search',
      content: (
        <div className="bg-gray-50 h-full relative overflow-hidden">
          <div className="bg-white p-3 border-b border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-3">AI Search</h4>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-blue-600" aria-hidden="true" />
              <input className="w-full pl-9 pr-4 py-2 bg-blue-100 border-2 border-blue-300 rounded-lg text-sm font-medium" value="Romantic dinner Paris" readOnly />
            </div>
          </div>
          <div className="p-3 space-y-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-3 text-white">
              <div className="flex items-center mb-2">
                <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                <h5 className="font-bold text-sm">AI Suggestion</h5>
              </div>
              <p className="text-xs opacity-90">Found 12 romantic restaurants near Eiffel Tower</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg overflow-hidden mr-3">
                  <img
                    src="https://picsum.photos/100/100?random=3"
                    alt="Restaurant"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h6 className="font-bold text-xs text-gray-900">Le Jules Verne</h6>
                  <p className="text-xs text-gray-600">Michelin starred • €€€€</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" aria-hidden="true" />
                    <span className="text-xs font-medium">4.9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Trip Planning',
      content: (
        <div className="bg-gray-50 h-full relative overflow-hidden">
          <div className="bg-white p-3 border-b border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-3">My Trip</h4>
            <div className="bg-gradient-to-r from-green-100 to-blue-100 px-3 py-2 rounded-lg mb-3 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-800 font-bold">Paris Weekend</p>
                  <p className="text-xs text-green-600">Nov 25-27 • 2 days</p>
                </div>
                <Calendar className="w-4 h-4 text-green-600" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div className="p-3 space-y-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">Day 1: Iconic Paris</p>
                  <p className="text-xs text-gray-600">Eiffel Tower → Louvre Museum</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded overflow-hidden">
                  <img src="https://picsum.photos/50/50?random=4" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="w-8 h-8 rounded overflow-hidden">
                  <img src="https://picsum.photos/50/50?random=5" alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-bold text-purple-600">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">Day 2: Culture & Romance</p>
                  <p className="text-xs text-gray-600">Montmartre → Seine Cruise</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Map Navigation',
      content: (
        <div className="bg-gray-50 h-full relative overflow-hidden">
          <div className="bg-white p-3 border-b border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-3">Navigate</h4>
            <div className="bg-blue-100 px-3 py-2 rounded-lg mb-3 border border-blue-200">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-blue-600 mr-2" aria-hidden="true" />
                <p className="text-xs text-blue-700 font-medium">You are near Eiffel Tower</p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 h-full relative">
            {/* Map-like background */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-br from-green-200 to-blue-200"></div>
            </div>
            <div className="relative space-y-2">
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded overflow-hidden mr-3">
                    <img src="https://picsum.photos/50/50?random=6" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900">Eiffel Tower</p>
                    <p className="text-xs text-green-600">5 min walk • Open now</p>
                  </div>
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">→</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-orange-600 text-xs">🍽️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900">Café de Flore</p>
                    <p className="text-xs text-orange-600">2 min walk • Popular</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  // Rotate app screens every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreenIndex((prev) => (prev + 1) % appScreens.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [appScreens.length])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-14 sm:py-16 lg:py-20">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Phone Mockup with Animation */}
          <div className="relative order-2 flex justify-center lg:order-1 lg:justify-start">
            {/* Feature Tags Around Phone */}
            <div className="absolute -left-1 top-2 hidden rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg animate-pulse md:block lg:-left-8 lg:-top-8">
              🗺️ Nearby Places
            </div>
            <div className="absolute -right-2 top-32 hidden rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg animate-pulse md:block lg:-right-12" style={{ animationDelay: '1s' }}>
              📴 Offline Mode
            </div>
            <div className="absolute -left-6 bottom-32 hidden rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg animate-pulse md:block lg:-left-16" style={{ animationDelay: '2s' }}>
              🤖 AI Recommendations
            </div>
            <div className="absolute -right-2 bottom-16 hidden rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-lg animate-pulse md:block lg:-right-8" style={{ animationDelay: '3s' }}>
              🧭 Live Navigation
            </div>

            {/* Gradient Glow Behind Phone */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>

            {/* Phone Mockup */}
            <div className="relative phone-tilt-container z-10">
              <div className="relative h-[540px] w-[272px] rounded-[3rem] bg-gradient-to-b from-gray-900 to-black p-2 shadow-2xl sm:h-[580px] sm:w-72">
                {/* Phone Frame */}
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="bg-gray-900 h-8 flex items-center justify-between px-6 text-white text-xs">
                    <span className="font-medium">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-white rounded-sm"></div>
                      <div className="w-1 h-2 bg-white rounded-sm"></div>
                    </div>
                  </div>

                  {/* Animated Screen Content */}
                  <div className="h-full transition-all duration-1000 ease-in-out">
                    {appScreens[currentScreenIndex].content}
                  </div>

                  {/* Screen Indicator */}
                  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {appScreens.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentScreenIndex ? 'bg-blue-500 w-6' : 'bg-gray-300'
                          }`}
                        aria-label={`Screen ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Bottom Navigation */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
                    <div className="flex justify-around">
                      <div className={`text-xs text-center transition-colors duration-300 ${currentScreenIndex === 0 ? 'text-blue-500' : 'text-gray-400'
                        }`}>
                        <div className="w-5 h-5 mx-auto mb-1 bg-blue-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-3 h-3" aria-hidden="true" />
                        </div>
                        <span className="font-medium">Places</span>
                      </div>
                      <div className={`text-xs text-center transition-colors duration-300 ${currentScreenIndex === 2 ? 'text-blue-500' : 'text-gray-400'
                        }`}>
                        <div className="w-5 h-5 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                        </div>
                        <span>Trips</span>
                      </div>
                      <div className={`text-xs text-center transition-colors duration-300 ${currentScreenIndex === 3 ? 'text-blue-500' : 'text-gray-400'
                        }`}>
                        <div className="w-5 h-5 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center">
                          <Search className="w-3 h-3" aria-hidden="true" />
                        </div>
                        <span>Navigate</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Phone Reflection */}
                <div className="absolute -bottom-4 left-3 right-3 h-12 bg-gradient-to-b from-black/30 to-transparent rounded-[3rem] blur-2xl"></div>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-6 order-1 lg:order-2">
            <div>
              <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-3.5 py-2 sm:px-4">
                <span className="text-2xl mr-2">📱</span>
                <span className="text-sm font-semibold text-blue-800 sm:text-base">Mobile App</span>
              </div>
              <h2 className="mb-3 text-3xl font-bold leading-tight text-gray-900 sm:mb-4 sm:text-4xl lg:text-5xl">
                Your Travel Companion
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  In Your Pocket
                </span>
              </h2>
              <p className="text-base text-gray-600 sm:text-xl">
                Unique mobile features that make travel planning effortless
              </p>
            </div>

            {/* Mobile-Specific Features */}
            <div className="space-y-3 sm:space-y-4">
              <div className="group flex items-start gap-3 rounded-xl bg-white p-4 shadow-md transition-all duration-300 hover:shadow-lg sm:gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                  <MapPin className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Nearby Places Discovery</h3>
                  <p className="text-gray-600 text-sm">Find restaurants, attractions & hidden gems within walking distance using GPS</p>
                </div>
              </div>

              <div className="group flex items-start gap-3 rounded-xl bg-white p-4 shadow-md transition-all duration-300 hover:shadow-lg sm:gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Offline Access</h3>
                  <p className="text-gray-600 text-sm">Download maps, itineraries & place details - travel without internet or roaming</p>
                </div>
              </div>

              <div className="group flex items-start gap-3 rounded-xl bg-white p-4 shadow-md transition-all duration-300 hover:shadow-lg sm:gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                  <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Smart AI Recommendations</h3>
                  <p className="text-gray-600 text-sm">Get personalized suggestions based on time, weather, crowds & your preferences</p>
                </div>
              </div>

              <div className="group flex items-start gap-3 rounded-xl bg-white p-4 shadow-md transition-all duration-300 hover:shadow-lg sm:gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                  <Car className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Live Navigation</h3>
                  <p className="text-gray-600 text-sm">Turn-by-turn directions to your next destination with real-time traffic updates</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <p className="mb-4 font-semibold text-gray-600">Download the mobile app:</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://drive.google.com/uc?export=download&id=1GcZIfFRBHKoyflPJIwgRnVKSCJKIUxVk" 
                  className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  Download APK
                </a>
              </div>
              <p className="text-sm text-gray-500 mt-3">Android APK • iOS coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
