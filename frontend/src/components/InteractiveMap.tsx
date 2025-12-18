import React, { useEffect, useRef } from 'react'

interface InteractiveMapProps {
  lat: number
  lng: number
  onLocationChange: (lat: number, lng: number) => void
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ lat, lng, onLocationChange }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)

  useEffect(() => {
    if (!mapRef.current || !window.google) return

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    })
    mapInstanceRef.current = map

    // Add draggable marker
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      draggable: true,
      animation: google.maps.Animation.DROP,
      title: 'Drag to change location'
    })
    markerRef.current = marker

    // Update location when marker is dragged
    marker.addListener('dragend', () => {
      const position = marker.getPosition()
      if (position) {
        onLocationChange(position.lat(), position.lng())
      }
    })

    // Update location when map is clicked
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        marker.setPosition(e.latLng)
        onLocationChange(e.latLng.lat(), e.latLng.lng())
      }
    })

  }, [])

  // Update marker position when props change
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const newPos = { lat, lng }
      markerRef.current.setPosition(newPos)
      mapInstanceRef.current.setCenter(newPos)
    }
  }, [lat, lng])

  return <div ref={mapRef} className="w-full h-full" />
}
