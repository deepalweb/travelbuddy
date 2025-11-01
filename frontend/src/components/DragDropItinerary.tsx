import React, { useState } from 'react'
import { GripVertical, Clock, MapPin, Plus, X } from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'

interface Activity {
  id: string
  name: string
  duration: string
  time: string
  location: string
  type: 'attraction' | 'restaurant' | 'hotel' | 'transport'
}

interface DayPlan {
  day: number
  date: string
  activities: Activity[]
}

interface DragDropItineraryProps {
  initialPlan: DayPlan[]
  onPlanChange: (plan: DayPlan[]) => void
}

export const DragDropItinerary: React.FC<DragDropItineraryProps> = ({
  initialPlan,
  onPlanChange
}) => {
  const [plan, setPlan] = useState<DayPlan[]>(initialPlan)
  const [draggedItem, setDraggedItem] = useState<{ dayIndex: number; activityIndex: number } | null>(null)

  const handleDragStart = (dayIndex: number, activityIndex: number) => {
    setDraggedItem({ dayIndex, activityIndex })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetDayIndex: number, targetActivityIndex: number) => {
    if (!draggedItem) return

    const newPlan = [...plan]
    const draggedActivity = newPlan[draggedItem.dayIndex].activities[draggedItem.activityIndex]
    
    // Remove from source
    newPlan[draggedItem.dayIndex].activities.splice(draggedItem.activityIndex, 1)
    
    // Add to target
    newPlan[targetDayIndex].activities.splice(targetActivityIndex, 0, draggedActivity)
    
    setPlan(newPlan)
    onPlanChange(newPlan)
    setDraggedItem(null)
  }

  const addActivity = (dayIndex: number) => {
    const newActivity: Activity = {
      id: `activity-${Date.now()}`,
      name: 'New Activity',
      duration: '2 hours',
      time: '10:00 AM',
      location: 'Location',
      type: 'attraction'
    }
    
    const newPlan = [...plan]
    newPlan[dayIndex].activities.push(newActivity)
    setPlan(newPlan)
    onPlanChange(newPlan)
  }

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const newPlan = [...plan]
    newPlan[dayIndex].activities.splice(activityIndex, 1)
    setPlan(newPlan)
    onPlanChange(newPlan)
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'attraction': return '🏛️'
      case 'restaurant': return '🍽️'
      case 'hotel': return '🏨'
      case 'transport': return '🚗'
      default: return '📍'
    }
  }

  return (
    <div className="space-y-6">
      {plan.map((day, dayIndex) => (
        <Card key={day.day} className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
            <h3 className="text-lg font-semibold">Day {day.day}</h3>
            <p className="text-blue-100">{day.date}</p>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-3">
              {day.activities.map((activity, activityIndex) => (
                <div
                  key={activity.id}
                  draggable
                  onDragStart={() => handleDragStart(dayIndex, activityIndex)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(dayIndex, activityIndex)}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 cursor-move transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  
                  <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {activity.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {activity.location}
                      </div>
                      <span>{activity.duration}</span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeActivity(dayIndex, activityIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={() => addActivity(dayIndex)}
                className="w-full border-dashed border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}