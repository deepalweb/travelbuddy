import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Bell, Mail, MessageSquare, MapPin, Calendar, Save } from 'lucide-react'

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    email: {
      tripUpdates: true,
      deals: false,
      newsletter: true,
      reminders: true
    },
    push: {
      tripUpdates: true,
      deals: true,
      messages: true,
      location: false
    },
    frequency: 'daily'
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    // Save notification settings logic here
    setTimeout(() => setLoading(false), 1000)
  }

  const toggleSetting = (category: 'email' | 'push', setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting as keyof typeof prev[category]]
      }
    }))
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600">Please log in to manage your notifications</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Manage how you receive updates</p>
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'tripUpdates', label: 'Trip Updates', desc: 'Get notified about your trip plans and changes', icon: MapPin },
                { key: 'deals', label: 'Deals & Offers', desc: 'Special offers and discounts on travel', icon: Bell },
                { key: 'newsletter', label: 'Newsletter', desc: 'Weekly travel tips and destination guides', icon: Mail },
                { key: 'reminders', label: 'Trip Reminders', desc: 'Reminders about upcoming trips', icon: Calendar }
              ].map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email[key as keyof typeof settings.email]}
                      onChange={() => toggleSetting('email', key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Push Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'tripUpdates', label: 'Trip Updates', desc: 'Real-time updates about your trips', icon: MapPin },
                { key: 'deals', label: 'Flash Deals', desc: 'Time-sensitive travel deals', icon: Bell },
                { key: 'messages', label: 'Messages', desc: 'Messages from travel agents and support', icon: MessageSquare },
                { key: 'location', label: 'Location-based', desc: 'Suggestions based on your current location', icon: MapPin }
              ].map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.push[key as keyof typeof settings.push]}
                      onChange={() => toggleSetting('push', key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { value: 'instant', label: 'Instant', desc: 'Get notified immediately' },
                  { value: 'daily', label: 'Daily Digest', desc: 'Once per day summary' },
                  { value: 'weekly', label: 'Weekly Summary', desc: 'Weekly roundup of updates' }
                ].map(({ value, label, desc }) => (
                  <label key={value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="frequency"
                      value={value}
                      checked={settings.frequency === value}
                      onChange={(e) => setSettings({...settings, frequency: e.target.value})}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}