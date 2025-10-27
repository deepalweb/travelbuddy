import { useEffect, useState } from 'react'
import { useConfig } from '../contexts/ConfigContext'

export const useGoogleMaps = () => {
  const { config } = useConfig()
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!config?.googleMapsApiKey) return

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&libraries=places`
    script.async = true
    script.defer = true

    script.onload = () => setIsLoaded(true)
    script.onerror = () => setError('Failed to load Google Maps')

    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [config?.googleMapsApiKey])

  return { isLoaded, error, apiKey: config?.googleMapsApiKey }
}