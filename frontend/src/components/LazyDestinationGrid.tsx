import React from 'react'
import { Card, CardContent } from './Card'
import { ImageWithFallback } from './ImageWithFallback'
import { Star } from 'lucide-react'

const additionalDestinations = [
  {
    id: 4,
    name: 'Rome',
    country: 'Italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop&auto=format&q=60',
    rating: 4.7,
    price: '€60-120'
  },
  {
    id: 5,
    name: 'London',
    country: 'UK',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop&auto=format&q=60',
    rating: 4.6,
    price: '£70-140'
  },
  {
    id: 6,
    name: 'Dubai',
    country: 'UAE',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format&q=60',
    rating: 4.6,
    price: '$80-200'
  }
]

const LazyDestinationGrid: React.FC = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          More Amazing Destinations
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {additionalDestinations.map((destination) => (
            <Card key={destination.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <ImageWithFallback
                src={destination.image}
                fallbackSrc={`https://picsum.photos/400/300?random=${destination.id + 10}`}
                alt={destination.name}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{destination.name}</h4>
                    <p className="text-gray-600 text-sm">{destination.country}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm">{destination.rating}</span>
                  </div>
                </div>
                <div className="mt-2 text-blue-600 font-semibold">{destination.price}/day</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LazyDestinationGrid