import React from 'react'
import { Calendar, MapPin, Clock, Users, CheckCircle } from 'lucide-react'
import { Card } from './Card'
import { Badge } from './Badge'

interface TripPlan {
  id: string
  tripTitle: string
  destination: string
  duration: string
  dailyPlans: DailyPlan[]
  createdAt?: string
}

interface DailyPlan {
  day: number
  title: string
  activities: Activity[]
}

interface Activity {
  activityTitle: string
  isVisited?: boolean
}

interface TripPlanCardProps {
  trip: TripPlan
  onView: (trip: TripPlan) => void
  onEdit?: (trip: TripPlan) => void
  onDelete?: (tripId: string) => void
}

export const TripPlanCard: React.FC<TripPlanCardProps> = ({
  trip,
  onView,
  onEdit,
  onDelete
}) => {
  const totalActivities = trip.dailyPlans.reduce((sum, day) => sum + day.activities.length, 0)
  const completedActivities = trip.dailyPlans.reduce(
    (sum, day) => sum + day.activities.filter(activity => activity.isVisited).length, 
    0
  )
  const progressPercentage = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div onClick={() => onView(trip)}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {trip.tripTitle}
            </h3>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{trip.destination}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              <span className="text-sm">{trip.duration}</span>
            </div>
          </div>
          
          {progressPercentage > 0 && (
            <Badge variant={progressPercentage === 100 ? 'success' : 'info'}>
              {Math.round(progressPercentage)}% Complete
            </Badge>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>{trip.dailyPlans.length} days planned</span>
            <span>{totalActivities} activities</span>
          </div>
          
          {progressPercentage > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>
              {trip.createdAt 
                ? new Date(trip.createdAt).toLocaleDateString()
                : 'Recently created'
              }
            </span>
          </div>
          
          {completedActivities > 0 && (
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span>{completedActivities} completed</span>
            </div>
          )}
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(trip)
              }}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(trip.id)
              }}
              className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </Card>
  )
}