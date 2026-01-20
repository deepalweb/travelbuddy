import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Trash2, Edit2, MapPin, Star, Clock, Phone, Globe, Sparkles } from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import { Badge } from '../components/Badge'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { usePlaceStore } from '../store/placeStore'

const SavedPlacesPage: React.FC = () => {
  const navigate = useNavigate()
  const { savedPlaces, removeSavedPlace, updatePlaceNotes } = usePlaceStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')

  const startEdit = (placeId: string, currentNotes?: string) => {
    setEditingId(placeId)
    setEditNotes(currentNotes || '')
  }

  const saveNotes = (placeId: string) => {
    updatePlaceNotes(placeId, editNotes)
    setEditingId(null)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      restaurant: 'bg-orange-100 text-orange-800',
      hotel: 'bg-blue-100 text-blue-800',
      attraction: 'bg-purple-100 text-purple-800',
      museum: 'bg-green-100 text-green-800',
      cafe: 'bg-yellow-100 text-yellow-800',
      shopping: 'bg-pink-100 text-pink-800',
      park: 'bg-emerald-100 text-emerald-800'
    }
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 via-pink-600 to-rose-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 mr-3 fill-current" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Saved Places
              </h1>
            </div>
            <p className="text-xl md:text-2xl mb-4 text-red-100">
              Your collection of favorite destinations and spots
            </p>
            <p className="text-red-200">
              {savedPlaces.length} place{savedPlaces.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {savedPlaces.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No saved places yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start exploring and save your favorite places to visit later
            </p>
            <Button
              onClick={() => navigate('/discovery')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Explore Places
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Saved Places Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPlaces.map((place) => (
                <Card key={place.id} className="overflow-hidden hover:shadow-lg transition-all">
                  {/* Image */}
                  <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={place.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(place.category)}`}
                      alt={place.name}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className={getCategoryColor(place.category)}>
                        {place.category}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Title & Location */}
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{place.name}</h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {place.location.city}, {place.location.country}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="mb-3 flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-semibold text-gray-900">{place.rating}</span>
                      <span className="text-gray-600 ml-1">
                        {place.priceLevel}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {place.description}
                    </p>

                    {/* Contact Info */}
                    <div className="space-y-1 text-xs text-gray-500 mb-3 border-t border-gray-100 pt-3">
                      {place.openHours && (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{place.openHours}</span>
                        </div>
                      )}
                      {place.contact?.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{place.contact.phone}</span>
                        </div>
                      )}
                      {place.contact?.website && (
                        <div className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          <a href={place.contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="mb-3">
                      {editingId === place.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add notes..."
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveNotes(place.id)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {place.notes && (
                            <p className="text-sm text-gray-600 mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                              {place.notes}
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(place.id, place.notes)}
                            className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            {place.notes ? 'Edit Notes' : 'Add Notes'}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                        onClick={() => navigate(`/places/${place.id}`, { state: { placeData: place } })}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeSavedPlace(place.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Save Date */}
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Saved {new Date(place.savedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedPlacesPage
