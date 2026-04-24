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
      answer: "TravelBuddy uses the details you provide, such as destination, trip length, interests, and planning preferences, to help structure an itinerary. You can then refine the result by saving places, adjusting pace, and exploring alternatives."
    },
    {
      icon: "💰",
      question: "Is the AI trip planner free?",
      answer: "There is a free traveler tier for getting started, and paid plans unlock additional planning features. The subscription page is the best place to compare what each tier currently includes."
    },
    {
      icon: "📱",
      question: "Can I use the app offline?",
      answer: "Offline capabilities depend on your plan. If offline access matters for your trips, check the current subscription features before you rely on it for navigation or saved itinerary details."
    },
    {
      icon: "✅",
      question: "What can I do on the home page?",
      answer: "The home page is designed to help you quickly understand the product, start a trip plan, browse destination inspiration, and jump into discovery, community, or subscriptions without hunting through the app."
    },
    {
      icon: "🎯",
      question: "Do I need to know my exact destination first?",
      answer: "No. You can start with a rough idea, a travel vibe, or just a shortlist of destinations. TravelBuddy is more useful when it helps you narrow options, not only after every decision is already made."
    },
    {
      icon: "👥",
      question: "Where should I go if I want deeper planning features?",
      answer: "If you are ready to build a trip, go to Trips. If you still want ideas, use Discovery first. If you want to compare tiers like AI trip limits or offline tools, head to Subscription."
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
