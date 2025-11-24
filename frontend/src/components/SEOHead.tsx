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
    
    // Add comprehensive structured data
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
          "@type": "LocalBusiness",
          "@id": "https://travelbuddy.com/#business",
          "name": "TravelBuddy",
          "description": "AI-powered travel planning platform helping travelers discover, plan and experience the world effortlessly",
          "url": "https://travelbuddy.com/",
          "telephone": "+1-800-TRAVEL",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "US"
          },
          "sameAs": [
            "https://facebook.com/travelbuddy",
            "https://twitter.com/travelbuddy",
            "https://instagram.com/travelbuddy"
          ]
        },
        {
          "@type": "TravelAgency",
          "@id": "https://travelbuddy.com/#travelagency",
          "name": "TravelBuddy",
          "description": "AI-powered travel planning and booking platform",
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
                  "description": "Personalized itinerary creation using artificial intelligence"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Destination Discovery",
                  "description": "Find hidden gems and popular attractions worldwide"
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
          "operatingSystem": ["iOS", "Android", "Web"],
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "50000",
            "bestRating": "5",
            "worstRating": "1"
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
                "text": "Our AI analyzes your preferences, budget, travel dates, and interests to create personalized itineraries in under 2 minutes. We consider factors like weather, local events, opening hours, and travel distances to optimize your trip."
              }
            },
            {
              "@type": "Question",
              "name": "Is the AI trip planner free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! Our basic AI trip planner is completely free forever. You can create unlimited itineraries, discover places, and plan trips without any cost. Premium features like offline access and advanced weather AI are available for $9.99/month."
              }
            },
            {
              "@type": "Question",
              "name": "Can I use the app offline?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Premium users can download their complete itineraries, maps, and place details for offline access. This includes photos, descriptions, contact information, and navigation - perfect for international travel without roaming charges."
              }
            }
          ]
        },
        {
          "@type": "Review",
          "@id": "https://travelbuddy.com/#review1",
          "author": {
            "@type": "Person",
            "name": "Sarah Chen"
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5"
          },
          "reviewBody": "TravelBuddy helped me discover amazing local cafes in Tokyo I would never have found!",
          "itemReviewed": {
            "@type": "SoftwareApplication",
            "name": "TravelBuddy"
          }
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
