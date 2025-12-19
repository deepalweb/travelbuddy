import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { configService } from '../services/configService'
import { LocationPicker } from '../components/LocationPicker'

interface FormData {
  companyName: string
  businessType: string
  country: string
  city: string
  address: string
  location: {
    address: string
    coordinates: { lat: number; lng: number }
  }
  ownerName: string
  email: string
  phone: string
  website: string
  fleetSize: string
  vehicleTypes: string[]
  operatingCountry: string
  serviceCities: string[]
  instantBooking: boolean
  requestBooking: boolean
  availability247: boolean
  agreed: boolean
}

export const TransportRegistration: React.FC = () => {
  const navigate = useNavigate()
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    businessType: '',
    country: '',
    city: '',
    address: '',
    location: {
      address: '',
      coordinates: { lat: 0, lng: 0 }
    },
    ownerName: '',
    email: '',
    phone: '',
    website: '',
    fleetSize: '1',
    vehicleTypes: [],
    operatingCountry: '',
    serviceCities: [],
    instantBooking: false,
    requestBooking: true,
    availability247: false,
    agreed: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    configService.getConfig().then(config => setApiBaseUrl(config.apiBaseUrl))
  }, [])

  const businessTypes = ['Individual Driver', 'Transport Company', 'Car Rental Agency', 'Shuttle/Bus Operator', 'Ferry/Boat Operator', 'Train Operator', 'Airline/Air Charter']
  const countries = ['Sri Lanka', 'Thailand', 'India', 'Japan', 'USA', 'UK', 'France', 'Spain', 'Italy', 'Greece', 'UAE', 'Singapore', 'Malaysia']
  const vehicleTypes = ['Car', 'Van', 'Minibus', 'Bus', 'SUV', 'Motorbike', 'Tuk-tuk', 'Rickshaw', 'Electric Vehicle', 'Ferry/Boat', 'Yacht', 'Train/Railcar', 'Helicopter', 'Small Aircraft']
  const fleetSizes = ['1 vehicle', '2-5 vehicles', '6-20 vehicles', '21-50 vehicles', '50+ vehicles']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.agreed) {
      setError('Please accept the terms and conditions')
      return
    }

    if (formData.vehicleTypes.length === 0) {
      setError('Please select at least one vehicle type')
      return
    }

    if (formData.serviceCities.length === 0) {
      setError('Please add at least one service city')
      return
    }

    setIsSubmitting(true)

    try {
      const userId = localStorage.getItem('travelbuddy_userId') || `user_${Date.now()}`
      localStorage.setItem('travelbuddy_userId', userId)
      
      // Map new form fields to backend expected fields
      const backendData = {
        userId,
        companyName: formData.companyName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        licenseNumber: 'GLOBAL-' + Date.now(), // Generate temp license number
        vehicleTypes: formData.vehicleTypes,
        serviceAreas: formData.serviceCities, // Backend expects serviceAreas
        fleetSize: formData.fleetSize,
        country: formData.country,
        description: `${formData.businessType} operating in ${formData.city}, ${formData.country}`
      }

      const response = await fetch(`${apiBaseUrl}/api/transport-providers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
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

  const toggleVehicleType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter(t => t !== type)
        : [...prev.vehicleTypes, type]
    }))
  }

  const [cityInput, setCityInput] = useState('')
  
  const addCity = () => {
    if (cityInput.trim() && !formData.serviceCities.includes(cityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        serviceCities: [...prev.serviceCities, cityInput.trim()]
      }))
      setCityInput('')
    }
  }
  
  const removeCity = (city: string) => {
    setFormData(prev => ({
      ...prev,
      serviceCities: prev.serviceCities.filter(c => c !== city)
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
            Welcome to TravelBuddy's transport network! Your account is now active.
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">✅ You're All Set!</h3>
            <p className="text-sm text-green-700">
              You can now access your provider dashboard and start managing your transport services.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/transport-provider-dashboard')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Go to Provider Dashboard
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🌐 Global Transport Provider Registration</h1>
          <p className="text-xl text-gray-600">Join TravelBuddy's Worldwide Transport Network</p>
          <p className="text-sm text-gray-500 mt-2">Serving travelers in 50+ countries</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-1">🏢 Section 1: Business Information</h3>
              <p className="text-sm text-gray-600">Tell us about your transport business</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select business type...</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value, operatingCountry: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select country...</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City / Region *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Colombo, Bangkok, Tokyo"
                  required
                />
              </div>
            </div>

            {/* GPS Location Picker */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-900 mb-1">📍 Business Location (GPS)</h4>
              <p className="text-sm text-gray-600">Accurate location helps travelers find your services nearby</p>
            </div>
            
            <LocationPicker
              value={formData.location}
              onChange={(location) => setFormData({ ...formData, location, address: location.address })}
              required
            />

            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-1">📞 Section 2: Contact Details</h3>
              <p className="text-sm text-gray-600">How can travelers reach you?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner / Manager Name *</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+94 77 123 4567"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website (Optional)</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-1">📄 Section 3: Verification Documents</h3>
              <p className="text-sm text-gray-600">Upload documents to earn "Verified Provider" badge</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Driver License</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Registration</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Certificate</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">National ID / Passport</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">✓ Accepted formats: JPG, PNG, PDF (Max 5MB each)</p>

            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-1">🚗 Section 4: Fleet & Service Details</h3>
              <p className="text-sm text-gray-600">What vehicles do you operate?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fleet Size *</label>
              <select
                value={formData.fleetSize}
                onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select fleet size...</option>
                {fleetSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Vehicle Types * (Select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {vehicleTypes.map(type => (
                  <label key={type} className={`flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.vehicleTypes.includes(type) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.vehicleTypes.includes(type)}
                      onChange={() => toggleVehicleType(type)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Photos *</label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-2">📸 Upload multiple photos of your vehicles (exterior, interior, features)</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-1">🗺️ Section 5: Operating Areas & Routes</h3>
              <p className="text-sm text-gray-600">Where do you provide services?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Service Cities *</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCity())}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Type city name and press Enter (e.g., Paris, Tokyo, Colombo)"
                />
                <button
                  type="button"
                  onClick={addCity}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add
                </button>
              </div>
              {formData.serviceCities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.serviceCities.map(city => (
                    <span key={city} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {city}
                      <button
                        type="button"
                        onClick={() => removeCity(city)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">Add all cities where you operate</p>
            </div>

            <div className="bg-teal-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-1">📱 Section 6: Booking Options</h3>
              <p className="text-sm text-gray-600">How do you accept bookings?</p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.instantBooking}
                  onChange={(e) => setFormData({ ...formData, instantBooking: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">⚡ Instant Booking</span>
                  <p className="text-sm text-gray-600">Travelers can book immediately without approval</p>
                </div>
              </label>
              <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.requestBooking}
                  onChange={(e) => setFormData({ ...formData, requestBooking: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">📝 Request to Book</span>
                  <p className="text-sm text-gray-600">You review and approve each booking request</p>
                </div>
              </label>
              <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.availability247}
                  onChange={(e) => setFormData({ ...formData, availability247: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">🕒 24/7 Availability</span>
                  <p className="text-sm text-gray-600">Available for bookings anytime, day or night</p>
                </div>
              </label>
            </div>

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
                  I confirm that all information is accurate and agree to TravelBuddy's Terms & Conditions
                </span>
              </label>
            </div>

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
                className="flex-1 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {isSubmitting ? 'Submitting...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
