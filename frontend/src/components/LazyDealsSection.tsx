import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from './Button'

const LazyDealsSection: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Special Deals</h2>
          <p className="text-gray-600 mb-8">Check out our latest travel deals and offers</p>
          <Link to="/deals">
            <Button className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3">
              View All Deals
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default LazyDealsSection
