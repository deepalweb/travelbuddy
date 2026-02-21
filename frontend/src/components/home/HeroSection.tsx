import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Calendar, Sparkles, Star, Clock } from 'lucide-react'
import { Button } from '../Button'
import { ImageWithFallback } from '../ImageWithFallback'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

interface HeroSectionProps {
  personalizedSublines?: string[]
  currentSublineIndex?: number
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  personalizedSublines = [],
  currentSublineIndex = 0 
}) => {
  const { user } = useAuth()
  const [quickPlanDestination, setQuickPlanDestination] = useState('')
  const [quickPlanDays, setQuickPlanDays] = useState('3')
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

  const defaultSublines = user ? [
    "You have a trip draft in progress.",
    "There are 3 new deals near your location.",
    "Perfect weather in Ella this weekend!",
    "2 friends shared new travel photos.",
    "Your saved places have price drops."
  ] : []

  const sublines = personalizedSublines.length > 0 ? personalizedSublines : defaultSublines

  return (
    <section className="relative h-screen bg-gradient-to-b from-blue-600 via-indigo-700 to-purple-800 overflow-hidden">
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&auto=format&q=80"
          fallbackSrc="https://picsum.photos/1920/1080?random=1"
          alt="Travel essentials - map, camera, passport and planning items"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent"></div>

      <div className="relative z-10 h-screen flex items-center px-4 py-8">
        <div className="w-full max-w-7xl mx-auto">
          {/* Compact Header */}
          <div className="text-center text-white mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
            >
              {user ? `Welcome back, ${user.fullName?.split(' ')[0] || user.username?.split(' ')[0] || 'Explorer'}!` : 'Your Perfect Trip in'}
              <span className="block text-yellow-400">
                {user ? 'Your next adventure is waiting.' : '2 Minutes'}
              </span>
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl mb-6 text-white/90 max-w-2xl mx-auto"
            >
              {user ? (
                <span className="inline-block transition-all duration-500 ease-in-out transform">
                  {sublines[currentSublineIndex] || 'Your next adventure is waiting.'}
                </span>
              ) : (
                'AI plans everything. You just pack and go.'
              )}
            </motion.h2>
          </div>

          {/* ⚡ Interactive Quick Plan Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-2xl relative group overflow-hidden"
            role="region"
            aria-label="Quick trip planning"
          >
            <div className="flex flex-col md:flex-row gap-3 relative z-10">
              <div className="flex-1 relative">
                <label htmlFor="destination" className="sr-only">Destination</label>
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-yellow-400" aria-hidden="true" />
                <input
                  id="destination"
                  type="text"
                  placeholder="Where to? (e.g. Kyoto, Paris, Ella)"
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/10 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all font-medium"
                  value={quickPlanDestination}
                  onChange={(e) => setQuickPlanDestination(e.target.value)}
                  aria-label="Travel destination"
                />
              </div>
              <div className="w-full md:w-32 relative">
                <label htmlFor="days" className="sr-only">Number of days</label>
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-yellow-400" aria-hidden="true" />
                <select
                  id="days"
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all font-medium appearance-none selection:bg-gray-800"
                  value={quickPlanDays}
                  onChange={(e) => setQuickPlanDays(e.target.value)}
                  aria-label="Trip duration in days"
                >
                  {[1, 2, 3, 4, 5, 7, 10, 14].map(d => (
                    <option key={d} value={d} className="bg-gray-900 text-white">{d} Days</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={() => {
                  if (!quickPlanDestination) return;
                  setIsGeneratingPreview(true);
                  setTimeout(() => {
                    setIsGeneratingPreview(false);
                    window.location.href = `/trips?destination=${encodeURIComponent(quickPlanDestination)}&days=${quickPlanDays}&quick=true`;
                  }, 1500);
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-8 py-4 rounded-2xl font-bold shadow-lg transform hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                aria-busy={isGeneratingPreview}
              >
                {isGeneratingPreview ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <>
                    <span>Plan My Trip</span>
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>

            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-white/60 font-medium">
              <span className="flex items-center gap-1.5"><Star className="w-3 h-3 text-yellow-400" aria-hidden="true" /> 4.9/5 satisfaction</span>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-blue-400" aria-hidden="true" /> Itinerary in 2m</span>
            </div>
          </motion.div>

          {/* Secondary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            {user ? (
              <>
                <Link to="/trips">
                  <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-xl transition-all duration-300">
                    Start Trip Planning
                  </Button>
                </Link>
                <Link to="/places">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300">
                    Explore Destinations
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-xl transition-all duration-300">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
