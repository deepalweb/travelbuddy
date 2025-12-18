import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { configService } from '../services/configService'
import { LocationPicker } from '../components/LocationPicker'

interface FormData {
  fullName: string
  email: string
  phone: string
  country: string
  city: string
  location: {
    address: string
    coordinates: { lat: number; lng: number }
  }
  languages: string[]
  experience: string
  specializations: string[]
  agencyName: string
  agencyType: string
  licenseNumber: string
  consultationFee: string
  dayRate: string
  description: string
  agreed: boolean
}

const countries = ['Sri Lanka', 'Thailand', 'India', 'Japan', 'USA', 'UK', 'France', 'Spain', 'Italy', 'Greece', 'UAE', 'Singapore', 'Malaysia', 'Indonesia', 'Vietnam', 'Cambodia', 'Philippines', 'South Korea', 'China', 'Australia']
const languages = ['English', 'Sinhala', 'Tamil', 'Hindi', 'Japanese', 'Chinese', 'French', 'Spanish', 'German', 'Italian', 'Arabic', 'Thai', 'Korean', 'Portuguese']
const specializations = ['Adventure & Hiking', 'Cultural Tours', 'Family Travel', 'Honeymoon & Romance', 'Luxury & VIP', 'Wildlife & Safari', 'Beach & Coastal', 'Photography Tours', 'Budget Backpacking', 'Pilgrimage Tours', 'Eco-Tourism', 'Road Trip Specialists', 'Digital Nomad Support', 'Educational Tours', 'Solo Travel', 'Business Travel', 'Food & Culinary', 'Scuba & Diving', 'Shopping Tours', 'Skiing & Snow', 'Historical Tours', 'Religious Tours', 'LGBTQ+ Friendly', 'Accessible Travel']
const agencyTypes = ['Independent Guide', 'Travel Agency', 'Tour Operator', 'Concierge Specialist', 'Freelance Consultant']
const experienceLevels = ['1-3 years', '3-7 years', '7-10 years', '10+ years']

export const TravelAgentRegistration: React.FC = () => {
  const navigate = useNavigate()
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    location: {
      address: '',
      coordinates: { lat: 0, lng: 0 }
    },
    languages: [],
    experience: '',
    specializations: [],
    agencyName: '',
    agencyType: '',
    licenseNumber: '',
    consultationFee: '0',
    dayRate: '',
    description: '',
    agreed: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    configService.getConfig().then(config => setApiBaseUrl(config.apiBaseUrl))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.agreed) {
      setError('Please accept the terms and conditions')
      return
    }

    if (formData.languages.length === 0) {
      setError('Please select at least one language')
      return
    }

    if (formData.specializations.length === 0) {
      setError('Please select at least one specialization')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/travel-agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
      } else {
        setError(data.details || data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }))
  }

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">
            Welcome to TravelBuddy's global agent network! Your profile is now active.
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">✅ You're All Set!</h3>
            <p className="text-sm text-green-700">
              You can now access your agent dashboard and start connecting with travelers worldwide.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/travel-agent-dashboard')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Go to Agent Dashboard
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🌍 Global Travel Agent Registration</h1>
          <p className="text-xl text-gray-600">Join TravelBuddy's Worldwide Agent Network</p>
          <p className="text-sm text-gray-500 mt-2">Connect with travelers from 100+ countries</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">👤 Personal Information</h3>
              <p className="text-sm text-gray-600">Tell us about yourself</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
            </div>

            {/* GPS Location */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-900 mb-1">📍 Your Business Location</h4>
              <p className="text-sm text-gray-600">Help travelers find you with accurate GPS coordinates</p>
            </div>
            
            <LocationPicker
              value={formData.location}
              onChange={(location) => setFormData({ ...formData, location })}
              required
            />

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Languages Spoken * (Select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {languages.map(lang => (
                  <label key={lang} className={`flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.languages.includes(lang) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Professional Details */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">💼 Professional Details</h3>
              <p className="text-sm text-gray-600">Your experience and credentials</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agency/Business Name</label>
                <input
                  type="text"
                  value={formData.agencyName}
                  onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave blank if independent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agency Type *</label>
                <select
                  value={formData.agencyType}
                  onChange={(e) => setFormData({ ...formData, agencyType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select type...</option>
                  {agencyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience *</label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select experience...</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tourism board license (optional)"
                />
              </div>
            </div>

            {/* Specializations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Specializations * (Select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {specializations.map(spec => (
                  <label key={spec} className={`flex items-center space-x-2 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.specializations.includes(spec) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.specializations.includes(spec)}
                      onChange={() => toggleSpecialization(spec)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm">{spec}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">💰 Pricing</h3>
              <p className="text-sm text-gray-600">Your service rates</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (USD)</label>
                <input
                  type="number"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0 for free"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Day Rate (USD) *</label>
                <input
                  type="number"
                  value={formData.dayRate}
                  onChange={(e) => setFormData({ ...formData, dayRate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 150"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">About You *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Tell travelers about your expertise, experience, and what makes you unique..."
                required
              />
            </div>

            {/* Terms */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreed}
                  onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  required
                />
                <span className="text-sm text-gray-700">
                  I confirm that all information is accurate and agree to TravelBuddy's Terms & Conditions, Privacy Policy, and Agent Code of Conduct
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {isSubmitting ? 'Submitting...' : 'Register as Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
