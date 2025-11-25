import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './Button'
import { dealsService } from '../services/dealsService'
import { MapPin, TrendingUp } from 'lucide-react'

const LazyDealsSection: React.FC = () => {
  const [deals, setDeals] = useState<any[]>([])

  useEffect(() => {
    dealsService.getDeals('all').then(data => setDeals(data.deals?.slice(0, 3) || []))
  }, [])

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">🎯 Dynamic Deal Radar</h2>
          <p className="text-gray-600 mb-8">AI-curated deals personalized for you</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {deals.map(deal => (
            <div key={deal._id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
              <img 
                src={deal.images?.[0] || 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&auto=format&fit=crop'} 
                alt={deal.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{deal.title}</h3>
                <div className="flex items-center text-gray-600 text-sm mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{deal.businessName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-600 font-bold">${deal.discountedPrice}</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{deal.discount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Link to="/deals">
            <Button className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3">
              <TrendingUp className="w-4 h-4 mr-2 inline" />
              View All Deals
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default LazyDealsSection
