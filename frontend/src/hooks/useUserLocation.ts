import { useState, useEffect } from 'react'

interface LocationData {
  country: string
  countryCode: string
  city: string
  currency: string
  emergencyNumber: string
}

const locationDefaults: Record<string, LocationData> = {
  GB: {
    country: 'United Kingdom',
    countryCode: 'GB',
    city: 'London',
    currency: 'GBP',
    emergencyNumber: '999'
  },
  US: {
    country: 'United States',
    countryCode: 'US', 
    city: 'New York',
    currency: 'USD',
    emergencyNumber: '911'
  },
  LK: {
    country: 'Sri Lanka',
    countryCode: 'LK',
    city: 'Colombo',
    currency: 'LKR',
    emergencyNumber: '119'
  }
}

export const useUserLocation = () => {
  const [location, setLocation] = useState<LocationData>(locationDefaults.LK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Use browser's built-in geolocation or timezone as fallback
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        let countryCode = 'LK'
        
        // Simple timezone to country mapping
        if (timezone.includes('America')) countryCode = 'US'
        else if (timezone.includes('Europe/London')) countryCode = 'GB'
        else if (timezone.includes('Asia/Colombo')) countryCode = 'LK'
        
        const detectedLocation = locationDefaults[countryCode] || locationDefaults.LK
        setLocation(detectedLocation)
      } catch (error) {
        console.log('Location detection failed, using default')
        setLocation(locationDefaults.LK)
      } finally {
        setLoading(false)
      }
    }

    detectLocation()
  }, [])

  return { location, loading }
}