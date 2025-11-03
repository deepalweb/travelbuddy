import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from './Card'
import { Button } from './Button'
import { Users, MessageCircle } from 'lucide-react'

const LazyDealsSection: React.FC = () => {
  return (
    <section className="py-20 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Community Preview */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Join 50,000+ Travelers
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Get insider tips, share experiences, and connect with fellow adventurers worldwide.
            </p>
            <div className="space-y-4 mb-8">
              {[
                { icon: <MessageCircle className="w-5 h-5" />, text: 'Travel forums & advice' },
                { icon: <Users className="w-5 h-5" />, text: 'Find travel companions' },
                { icon: <span className="text-lg">📸</span>, text: 'Share your adventures' }
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
            <Link to="/community">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-xl">
                Join Community
              </Button>
            </Link>
          </div>

          {/* Mobile App Promotion */}
          <Card className="p-8 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-2xl font-bold mb-4">Download Our App</h3>
              <p className="text-purple-100 mb-6">
                Plan trips offline, get real-time updates, and access exclusive mobile deals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-white text-purple-600 hover:bg-gray-100 px-4 py-2 rounded-lg">
                  📱 App Store
                </Button>
                <Button className="bg-white text-purple-600 hover:bg-gray-100 px-4 py-2 rounded-lg">
                  🤖 Google Play
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

export default LazyDealsSection