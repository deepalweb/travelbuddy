import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '../Card'
import { ImageWithFallback } from '../ImageWithFallback'
import { Button } from '../Button'
import { motion, AnimatePresence } from 'framer-motion'
import { getMonthlyDestinations, vibes } from './homeData'

export const DestinationVibes: React.FC = () => {
  const [selectedVibe, setSelectedVibe] = useState('All')
  const featuredDestinations = getMonthlyDestinations()

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Explore by Vibe
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Destinations curated for your travel mood
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {vibes.map((vibe) => (
              <button
                key={vibe}
                onClick={() => setSelectedVibe(vibe)}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 ${selectedVibe === vibe
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                aria-pressed={selectedVibe === vibe ? 'true' : 'false'}
                aria-label={`Filter by ${vibe} vibe`}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <AnimatePresence mode="popLayout">
            {featuredDestinations
              .filter(dest => selectedVibe === 'All' || dest.vibe === selectedVibe)
              .map((destination) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={destination.id}
                >
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                    <div className="relative">
                      <ImageWithFallback
                        src={destination.image}
                        fallbackSrc={`https://picsum.photos/400/300?random=${destination.id}`}
                        alt={`${destination.name}, ${destination.country}`}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {destination.popular && (
                        <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </div>
                      )}
                      {destination.trending && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Trending
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {destination.vibe}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{destination.name}</h3>
                          <p className="text-gray-600">{destination.country}</p>
                        </div>
                        <div className="flex items-center gap-1" aria-label={`${destination.rating} out of 5 rating`}>
                          <Star className="w-4 h-4 text-yellow-500 fill-current" aria-hidden="true" />
                          <span className="text-sm font-medium">{destination.rating}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600 font-medium">{destination.reason}</span>
                        <Link to="/places">
                          <Button className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
                            Explore
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* Single CTA */}
        <div className="text-center">
          <Link to="/places">
            <Button className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 text-lg rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
              View All Destinations
              <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
