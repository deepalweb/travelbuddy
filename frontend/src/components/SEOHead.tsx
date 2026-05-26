import React, { useEffect } from 'react'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "TravelBuddy | AI Trip Planner, Travel Itineraries, Community Tips, and Deals",
  description = "TravelBuddy helps travelers create AI trip plans, build better travel itineraries, explore community travel tips, and discover useful travel deals.",
  keywords = "AI trip planner, travel itinerary planner, trip planner, itinerary generator, travel community, travel deals, Sri Lanka travel planner"
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
    
    // Add conservative structured data based on product-level details only.
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": "https://travelbuddy.com/",
          "url": "https://travelbuddy.com/",
          "name": title,
          "description": description,
          "inLanguage": "en-US",
          "isPartOf": {
            "@id": "https://travelbuddy.com/#website"
          }
        },
        {
          "@type": "TravelAgency",
          "@id": "https://travelbuddy.com/#travelagency",
          "name": "TravelBuddy",
          "description": "AI travel planning platform with trip itineraries, community travel tips, and travel deals",
          "url": "https://travelbuddy.com/",
          "priceRange": "Free - $19.99",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Travel Services",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "AI Trip Planning",
                  "description": "Personalized travel itinerary creation using artificial intelligence"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Travel Community and Deals",
                  "description": "Explore traveler stories, practical travel insight, and useful travel deals"
                }
              }
            ]
          }
        },
        {
          "@type": "SoftwareApplication",
          "@id": "https://travelbuddy.com/#app",
          "name": "TravelBuddy",
          "description": description,
          "applicationCategory": "TravelApplication",
          "operatingSystem": ["Android", "Web"],
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          }
        },
        {
          "@type": "FAQPage",
          "@id": "https://travelbuddy.com/#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How does TravelBuddy create my itinerary?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "TravelBuddy uses the details you provide, such as destination, trip length, interests, and planning preferences, to help structure an itinerary that you can refine."
              }
            },
            {
              "@type": "Question",
              "name": "Is the AI trip planner free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "TravelBuddy offers a free tier to get started, while paid plans unlock additional planning features."
              }
            },
            {
              "@type": "Question",
              "name": "Can I use the app offline?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Offline capabilities depend on the current plan and available features."
              }
            }
          ]
        }
      ]
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
