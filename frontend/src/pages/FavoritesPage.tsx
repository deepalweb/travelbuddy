import React, { useState, useEffect } from 'react'
import { Heart, MapPin, Star, Loader } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { favoritesService } from '../services/favoritesService'
import { Link } from 'react-router-dom'

interface FavoritePlace {
  _id: string
  name: string
  location: string
  description: string
  imageUrl?: string
  rating?: number
  category?: string
}

export const FavoritesPage: React.FC = () => {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoritePlace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadFavorites()
    }
  }, [user])

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const places = await favoritesService.getFavoritePlaces()
      setFavorites(places)
    } catch (error) {
      console.error('Failed to load favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (placeId: string) => {
    const success = await favoritesService.removeFavorite(placeId)
    if (success) {
      setFavorites(favorites.filter(f => f._id !== placeId))
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view favorites</h2>
          <p className="text-gray-600 mb-6">Save your favorite places and access them anytime</p>
          <Link to="/login" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-sm text-gray-600">
                {favorites.length} {favorites.length === 1 ? 'place' : 'places'} saved
              </p>
            </div>
          </div>
        </div>

        {/* Favorites Grid */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
            <Loader className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading your favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6">
              Start exploring and save your favorite places to see them here
            </p>
            <Link to="/places" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-block">
              Explore Places
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((place) => (
              <div
                key={place._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
              >
                {place.imageUrl && (
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFavorite(place._id)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                    >
                      <Heart className="w-5 h-5 text-red-600 fill-red-600" />
                    </button>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{place.name}</h3>
                    {place.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold text-gray-700">{place.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{place.location}</span>
                  </div>
                  {place.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{place.description}</p>
                  )}
                  {place.category && (
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mb-3">
                      {place.category}
                    </span>
                  )}
                  <Link
                    to={`/places/${place._id}`}
                    className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
