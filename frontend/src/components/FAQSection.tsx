import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    question: "How does TravelBuddy create my itinerary?",
    answer: "Our AI analyzes your preferences, budget, travel dates, and interests to create personalized itineraries in under 2 minutes. We consider factors like weather, local events, opening hours, and travel distances to optimize your trip."
  },
  {
    question: "Is the AI trip planner free?",
    answer: "Yes! Our basic AI trip planner is completely free forever. You can create unlimited itineraries, discover places, and plan trips without any cost. Premium features like offline access and advanced weather AI are available for $9.99/month."
  },
  {
    question: "Can I use the app offline?",
    answer: "Premium users can download their complete itineraries, maps, and place details for offline access. This includes photos, descriptions, contact information, and navigation - perfect for international travel without roaming charges."
  },
  {
    question: "What makes TravelBuddy different from other travel apps?",
    answer: "TravelBuddy uses advanced AI to discover hidden gems that 90% of tourists miss. Our algorithm learns from millions of traveler experiences to recommend authentic local spots, optimize your budget, and save you 3+ hours of planning time."
  },
  {
    question: "Can I collaborate with friends on trip planning?",
    answer: "Absolutely! Share your itinerary with travel companions, vote on activities, and make real-time changes together. Everyone stays synced with instant notifications."
  }
]

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-blue-100 text-green-600 px-6 py-3 rounded-full text-sm font-semibold mb-6 shadow-sm">
            ❓ Frequently Asked Questions
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Got Questions? We've Got Answers
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about TravelBuddy
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-blue-200 transition-colors">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-bold text-gray-900 pr-4">{faq.question}</h3>
                {openIndex === index ? (
                  <ChevronUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-8 pb-6">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <a href="/contact" className="text-blue-600 hover:text-blue-700 font-semibold">
            Contact our support team →
          </a>
        </div>
      </div>
    </section>
  )
}
