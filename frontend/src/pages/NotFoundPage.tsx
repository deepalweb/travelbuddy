import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, MapPin } from 'lucide-react'
import { Button } from '../components/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            404
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
            Oops! Page Not Found
          </h2>
          <p className="text-xl text-gray-600">
            Looks like you've wandered off the map. Let's get you back on track!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link to="/">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 text-lg">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link to="/discovery">
            <Button className="bg-white text-gray-900 border-2 border-gray-300 px-8 py-4 text-lg hover:bg-gray-50">
              <Search className="w-5 h-5 mr-2" />
              Explore Destinations
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Pages</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/discovery" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Discovery
            </Link>
            <Link to="/deals" className="text-blue-600 hover:text-blue-700">
              Deals
            </Link>
            <Link to="/community" className="text-blue-600 hover:text-blue-700">
              Community
            </Link>
            <Link to="/about" className="text-blue-600 hover:text-blue-700">
              About Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
