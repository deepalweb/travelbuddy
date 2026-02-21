import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  icon: string
  question: string
  answer: string
}

export const FAQAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      icon: "🤖",
      question: "How does TravelBuddy create my itinerary?",
      answer: "Our AI analyzes your preferences, budget, travel dates, and interests to create personalized itineraries in under 2 minutes. We consider factors like weather, local events, opening hours, and travel distances to optimize your trip."
    },
    {
      icon: "💰",
      question: "Is the AI trip planner free?",
      answer: "Yes! Our basic AI trip planner is completely free forever. You can create unlimited itineraries, discover places, and plan trips without any cost. Premium features like offline access and advanced weather AI are available for $9.99/month."
    },
    {
      icon: "📱",
      question: "Can I use the app offline?",
      answer: "Premium users can download their complete itineraries, maps, and place details for offline access. This includes photos, descriptions, contact information, and navigation - perfect for international travel without roaming charges."
    },
    {
      icon: "✅",
      question: "Are deals verified?",
      answer: "All deals are verified in real-time through our partner network. We work directly with hotels, airlines, and activity providers to ensure accurate pricing and availability. Deals are updated every 15 minutes."
    },
    {
      icon: "🎯",
      question: "How accurate are the AI recommendations?",
      answer: "Our AI has a 94% satisfaction rate based on user feedback. It learns from 125,000+ successful trips and considers 200+ factors including weather, crowds, local events, and personal preferences to make recommendations."
    },
    {
      icon: "👥",
      question: "Can I share my itinerary with friends?",
      answer: "Yes! You can share itineraries via link, export to PDF, or collaborate in real-time. Friends can add suggestions, vote on activities, and make changes together - perfect for group travel planning."
    }
  ]

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="group">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              aria-expanded={openIndex === index ? 'true' : 'false'}
              aria-controls={`faq-answer-${index}`}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl">{faq.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                    {faq.question}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Click to see answer</p>
                </div>
              </div>
              <div className={`w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center transition-all duration-300 ${openIndex === index ? 'rotate-180 bg-blue-600' : 'group-hover:bg-blue-200'
                }`}>
                <ChevronDown className={`w-4 h-4 transition-colors duration-300 ${openIndex === index ? 'text-white' : 'text-blue-600'
                  }`} />
              </div>
            </button>

            <div 
              id={`faq-answer-${index}`}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
              role="region"
            >
              <div className="px-6 pb-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-l-4 border-blue-500">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
