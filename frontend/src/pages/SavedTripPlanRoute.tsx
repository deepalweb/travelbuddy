import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { tripService, type TripPlan } from '../services/tripService'
import { TripDetailPage } from './TripDetailPage'
import { TripPlanningResetPage } from './TripPlanningResetPage'

export const SavedTripPlanRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [trip, setTrip] = useState<TripPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadTrip = async () => {
      if (!id) {
        setIsLoading(false)
        return
      }

      const savedTrip = await tripService.getTripById(id)
      if (active) {
        setTrip(savedTrip)
        setIsLoading(false)
      }
    }

    void loadTrip()
    return () => {
      active = false
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <RefreshCw className="mx-auto h-9 w-9 animate-spin text-[#e96855]" />
          <p className="mt-4 font-semibold text-slate-600">Loading saved trip...</p>
        </div>
      </div>
    )
  }

  const metadata = trip?.metadata as { generatedPlan?: unknown } | undefined
  if (trip && metadata?.generatedPlan) {
    return <TripPlanningResetPage savedTrip={trip} />
  }

  // Older saved plans do not contain the original structured generation payload.
  return <TripDetailPage />
}
