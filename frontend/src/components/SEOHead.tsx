import React, { useEffect } from 'react'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "TravelBuddy - AI Travel Planner & Trip Planning App | Discover Destinations Worldwide",
  description = "Plan your perfect trip with TravelBuddy's AI-powered travel planner. Explore millions of destinations, create custom itineraries, find deals, and manage everything in one app. Download for iOS & Android.",
  keywords = "trip planner, travel app, AI travel planning, itinerary builder, discover destinations, travel deals, vacation planner, travel guide, flight booking, hotel booking"
}) => {
  useEffect(() => {
    // Update document title
    document.title = title
    
    // Update meta tags
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = name
        document.head.appendChild(meta)
      }
      meta.content = content
    }
    
    updateMeta('description', description)
    updateMeta('keywords', keywords)
    updateMeta('robots', 'index, follow')
    
    // Add structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "TravelBuddy",
      "description": description,
      "applicationCategory": "TravelApplication",
      "operatingSystem": ["iOS", "Android", "Web"]
    }
    
    let script = document.querySelector('script[type="application/ld+json"]')
    if (!script) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(structuredData)
  }, [title, description, keywords])

  return null
}
