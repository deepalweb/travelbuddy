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
    <section className="bg-gray-50 py-14 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="mb-3 text-3xl font-bold text-gray-900 sm:mb-4 sm:text-4xl">
            Explore by Vibe
          </h2>
          <p className="mb-6 text-base text-gray-600 sm:mb-8 sm:text-xl">
            Destinations curated for your travel mood
          </p>

          <div className="mb-8 flex flex-wrap justify-center gap-2.5 sm:mb-10 sm:gap-3">
            {vibes.map((vibe) => (
              <button
                key={vibe}
                onClick={() => setSelectedVibe(vibe)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 sm:px-6 sm:text-base ${selectedVibe === vibe
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

        <div className="mb-8 grid gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
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
                        className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-48"
                        loading="lazy"
                      />
                      {destination.popular && (
                        <div className="absolute left-3 top-3 rounded-full bg-yellow-500 px-3 py-1 text-xs font-medium text-black sm:left-4 sm:top-4 sm:text-sm">
                          Most Popular
                        </div>
                      )}
                      {destination.trending && (
                        <div className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white sm:left-4 sm:top-4 sm:text-sm">
                          Trending
                        </div>
                      )}
                      <div className="absolute right-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white sm:right-4 sm:top-4">
                        {destination.vibe}
                      </div>
                    </div>
                    <CardContent className="p-5 sm:p-6">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{destination.name}</h3>
                          <p className="text-sm text-gray-600 sm:text-base">{destination.country}</p>
                        </div>
                        <div className="flex items-center gap-1" aria-label={`${destination.rating} out of 5 rating`}>
                          <Star className="w-4 h-4 text-yellow-500 fill-current" aria-hidden="true" />
                          <span className="text-sm font-medium">{destination.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-blue-600">{destination.reason}</span>
                        <Link to="/discovery">
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
          <Link to="/discovery">
            <Button className="rounded-xl bg-blue-600 px-6 py-3.5 text-base text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 sm:px-8 sm:py-4 sm:text-lg">
              View All Destinations
              <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
