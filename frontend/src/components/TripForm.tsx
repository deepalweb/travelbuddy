import React, { useState } from 'react'
import { Button } from './Button'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { X, MapPin, Calendar, Clock, Plus, Trash2 } from 'lucide-react'

interface DailyPlan {
  day: number
  activities: string[]
}

interface TripFormData {
  tripTitle: string
  destination: string
  duration: string
  dailyPlans: DailyPlan[]
}

interface TripFormProps {
  onSubmit: (tripData: TripFormData) => void
  onClose: () => void
}

export const TripForm: React.FC<TripFormProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState<TripFormData>({
    tripTitle: '',
    destination: '',
    duration: '',
    dailyPlans: [{ day: 1, activities: [''] }]
  })

  const addDay = () => {
    setFormData(prev => ({
      ...prev,
      dailyPlans: [...prev.dailyPlans, { day: prev.dailyPlans.length + 1, activities: [''] }]
    }))
  }

  const removeDay = (dayIndex: number) => {
    if (formData.dailyPlans.length > 1) {
      setFormData(prev => ({
        ...prev,
        dailyPlans: prev.dailyPlans.filter((_, index) => index !== dayIndex)
          .map((day, index) => ({ ...day, day: index + 1 }))
      }))
    }
  }

  const addActivity = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      dailyPlans: prev.dailyPlans.map((day, index) => 
        index === dayIndex 
          ? { ...day, activities: [...day.activities, ''] }
          : day
      )
    }))
  }

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    setFormData(prev => ({
      ...prev,
      dailyPlans: prev.dailyPlans.map((day, index) => 
        index === dayIndex 
          ? { ...day, activities: day.activities.filter((_, aIndex) => aIndex !== activityIndex) }
          : day
      )
    }))
  }

  const updateActivity = (dayIndex: number, activityIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      dailyPlans: prev.dailyPlans.map((day, index) => 
        index === dayIndex 
          ? { 
              ...day, 
              activities: day.activities.map((activity, aIndex) => 
                aIndex === activityIndex ? value : activity
              )
            }
          : day
      )
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.tripTitle && formData.destination && formData.duration) {
      const cleanedData = {
        ...formData,
        dailyPlans: formData.dailyPlans.map(day => ({
          ...day,
          activities: day.activities.filter(activity => activity.trim() !== '')
        })).filter(day => day.activities.length > 0)
      }
      onSubmit(cleanedData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Create New Trip</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-full w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Trip Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Title
                </label>
                <input
                  type="text"
                  value={formData.tripTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripTitle: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter trip title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Destination
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter destination"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 5 days, 1 week"
                  required
                />
              </div>
            </div>

            {/* Daily Plans */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Daily Plans
                </h3>
                <Button
                  type="button"
                  onClick={addDay}
                  className="bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full px-4 py-2 text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Day
                </Button>
              </div>

              <div className="space-y-4">
                {formData.dailyPlans.map((day, dayIndex) => (
                  <div key={dayIndex} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">Day {day.day}</h4>
                      {formData.dailyPlans.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeDay(dayIndex)}
                          className="text-red-500 hover:text-red-700 p-1"
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {day.activities.map((activity, activityIndex) => (
                        <div key={activityIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={activity}
                            onChange={(e) => updateActivity(dayIndex, activityIndex, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Enter activity"
                          />
                          {day.activities.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeActivity(dayIndex, activityIndex)}
                              className="text-red-500 hover:text-red-700 p-2"
                              variant="outline"
                              size="sm"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => addActivity(dayIndex)}
                        className="text-blue-600 hover:text-blue-700 text-sm p-2"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Activity
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 py-3 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium"
              >
                Create Trip
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}