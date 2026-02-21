import React, { useState } from 'react'
import { Sparkles, ArrowRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export const AIAssistantBubble: React.FC = () => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'assistant', text: "Hi! I'm your TravelBuddy AI. Ask me anything about your next trip!" }
  ])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiMessage.trim()) return

    setChatHistory([...chatHistory, { role: 'user', text: aiMessage }])
    setAiMessage('')

    // Simulate AI response
    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "Great question! I'm analyzing top traveler data for you. Would you like me to start a trip plan based on that?"
        }
      ])
    }, 1000)
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isAIChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[600px]"
            role="dialog"
            aria-label="AI Travel Assistant"
            aria-modal="true"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">TravelBuddy AI</h3>
                  <p className="text-xs text-white/70">Online & ready to help</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAIChatOpen(false)} 
                className="hover:rotate-90 transition-transform focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full p-1"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col no-scrollbar">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  aria-label="Message input"
                />
                <button 
                  type="submit" 
                  className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Send message"
                >
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAIChatOpen(!isAIChatOpen)}
        className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white relative group focus:outline-none focus:ring-4 focus:ring-blue-400/50"
        aria-label={isAIChatOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={isAIChatOpen}
        aria-controls="ai-chat-dialog"
      >
        {isAIChatOpen ? <X className="w-8 h-8" aria-hidden="true" /> : <Sparkles className="w-8 h-8" aria-hidden="true" />}
        {!isAIChatOpen && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-white animate-bounce"></div>
        )}
        <div className="absolute right-20 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform translate-x-2 group-hover:translate-x-0">
          Need travel advice?
        </div>
      </motion.button>
    </div>
  )
}
