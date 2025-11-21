import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Check, MapPin, Clock, DollarSign, Users, Shield, Camera, FileText, Star } from 'lucide-react'

interface FormData {
  // Company Info
  companyLogo: File | null
  companyName: string
  ownerName: string
  email: string
  phone: string
  address: string
  description: string
  
  // Verification
  businessRegNumber: string
  licenseNumber: string
  businessRegDoc: File | null
  insuranceCert: File | null
  verificationPhotos: File[]
  
  // Fleet
  fleetSize: string
  vehicleTypes: string[]
  vehiclePhotos: File[]
  amenities: string[]
  
  // Service Area
  country: string
  serviceAreas: string[]
  islandWide: boolean
  airportTransfers: boolean
  airportPricing: string
  
  // Pricing
  pricingModel: string
  basePrice: string
  minBookingHours: string
  
  // Availability
  availability: { [key: string]: { available: boolean; hours: string } }
  
  // Drivers
  driverCount: string
  driverCertifications: string[]
  driverIds: File[]
  
  // Documents
  documents: File[]
  
  // Account
  password: string
  confirmPassword: string
  
  // Agreement
  agreements: boolean[]
}

export const TransportRegistration: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isDraft, setIsDraft] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    companyLogo: null,
    companyName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    businessRegNumber: '',
    licenseNumber: '',
    businessRegDoc: null,
    insuranceCert: null,
    verificationPhotos: [],
    fleetSize: '',
    vehicleTypes: [],
    vehiclePhotos: [],
    amenities: [],
    country: 'Sri Lanka',
    serviceAreas: [],
    islandWide: false,
    airportTransfers: false,
    airportPricing: '',
    pricingModel: '',
    basePrice: '',
    minBookingHours: '',
    availability: {
      monday: { available: true, hours: '9:00-17:00' },
      tuesday: { available: true, hours: '9:00-17:00' },
      wednesday: { available: true, hours: '9:00-17:00' },
      thursday: { available: true, hours: '9:00-17:00' },
      friday: { available: true, hours: '9:00-17:00' },
      saturday: { available: true, hours: '9:00-17:00' },
      sunday: { available: false, hours: '' }
    },
    driverCount: '',
    driverCertifications: [],
    driverIds: [],
    documents: [],
    password: '',
    confirmPassword: '',
    agreements: [false, false, false]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const vehicleTypeOptions = [
    { id: 'car', label: 'Car / Taxi', icon: '🚗' },
    { id: 'van', label: 'Van / Minibus', icon: '🚐' },
    { id: 'bus', label: 'Bus', icon: '🚌' },
    { id: 'luxury', label: 'Luxury Car', icon: '🚖' },
    { id: 'motorcycle', label: 'Motorcycle / Tuk-tuk', icon: '🏍️' },
    { id: 'boat', label: 'Boat / Ferry', icon: '⛴️' },
    { id: 'helicopter', label: 'Helicopter', icon: '🚁' },
    { id: 'train', label: 'Train / Private Rail Car', icon: '🚆' }
  ]

  const amenityOptions = [
    'AC', 'WiFi', 'Charging Ports', 'GPS', 'Baby Seat', 'Wheelchair Access',
    'Luggage Compartment', 'Bottled Water', 'English-speaking Driver', 'First Aid Kit'
  ]

  const serviceAreaOptions = [
    'Colombo', 'Kandy', 'Galle', 'Negombo', 'Ella', 'Sigiriya',
    'Anuradhapura', 'Nuwara Eliya', 'Bentota', 'Mirissa', 'Jaffna', 'Trincomalee'
  ]

  const pricingModels = [
    'Kilometer-based', 'Fixed-route pricing', 'Package pricing (day hire)', 
    'Mixed', 'Enquiry-based'
  ]

  const driverCertOptions = [
    'Professional license', 'Tourist driver badge', 'First aid training', 'Defensive driving certificate'
  ]

  const steps = [
    { id: 1, title: 'Company Info', icon: '🏢' },
    { id: 2, title: 'Verification', icon: '✅' },
    { id: 3, title: 'Fleet Details', icon: '🚗' },
    { id: 4, title: 'Service Area', icon: '🗺️' },
    { id: 5, title: 'Pricing', icon: '💰' },
    { id: 6, title: 'Availability', icon: '📅' },
    { id: 7, title: 'Drivers', icon: '👨‍💼' },
    { id: 8, title: 'Documents', icon: '📄' },
    { id: 9, title: 'Account', icon: '🔐' }
  ]

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (field: keyof FormData, files: FileList | null, multiple = false) => {
    if (!files) return
    if (multiple) {
      handleInputChange(field, Array.from(files))
    } else {
      handleInputChange(field, files[0])
    }
  }

  const handleArrayToggle = (field: keyof FormData, item: string) => {
    const currentArray = formData[field] as string[]
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item]
    handleInputChange(field, newArray)
  }

  const handleAvailabilityChange = (day: string, field: 'available' | 'hours', value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }))
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 9))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const saveAsDraft = () => {
    setIsDraft(true)
    localStorage.setItem('transportRegistrationDraft', JSON.stringify(formData))
    alert('Draft saved successfully!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.agreements.every(Boolean)) {
      alert('Please accept all terms and conditions')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    setIsSubmitting(true)
    try {
      const submitData = {
        companyName: formData.companyName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        description: formData.description,
        businessRegNumber: formData.businessRegNumber,
        licenseNumber: formData.licenseNumber,
        fleetSize: formData.fleetSize || '1',
        vehicleTypes: formData.vehicleTypes.length > 0 ? formData.vehicleTypes : ['car'],
        amenities: formData.amenities,
        country: formData.country,
        serviceAreas: formData.islandWide ? ['Island Wide'] : formData.serviceAreas,
        islandWide: formData.islandWide,
        airportTransfers: formData.airportTransfers,
        airportPricing: formData.airportPricing,
        pricingModel: formData.pricingModel,
        basePrice: formData.basePrice,
        minBookingHours: formData.minBookingHours,
        availability: formData.availability,
        driverCount: formData.driverCount,
        driverCertifications: formData.driverCertifications
      }
      
      const response = await fetch('https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/transport-providers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })
      
      if (response.ok) {
        localStorage.removeItem('transportRegistrationDraft')
        setSubmitted(true)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Registration error:', errorData)
        alert(`Registration failed: ${errorData.error || errorData.details || 'Unknown error'}`)
        throw new Error('Registration failed')
      }
    } catch (error) {
      alert('Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const FileUploadComponent = ({ label, accept, multiple = false, onChange, files }: any) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => onChange(e.target.files)}
        className="hidden"
        id={label.replace(/\s+/g, '-').toLowerCase()}
      />
      <label htmlFor={label.replace(/\s+/g, '-').toLowerCase()} className="cursor-pointer">
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xs text-gray-400">{accept} {multiple ? '(Multiple files)' : ''}</p>
      </label>
      {files && (
        <div className="mt-2 text-xs text-green-600">
          {multiple ? `${files.length} files selected` : files.name}
        </div>
      )}
    </div>
  )

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-8">
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
              <p className="text-gray-600">Tell us about your transport business</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <FileUploadComponent
                  label="Upload Company Logo"
                  accept=".jpg,.jpeg,.png"
                  onChange={(files: FileList) => handleFileUpload('companyLogo', files)}
                  files={formData.companyLogo}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="EasyRide Travels"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner / Representative Name *</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Full legal name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+94-XX-XXX-XXXX"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Full physical address"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Short description about your business, services, or specialty"
                />
              </div>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification & Legal Info</h2>
              <p className="text-gray-600">Upload required documents for verification</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Registration Number</label>
                <input
                  type="text"
                  value={formData.businessRegNumber}
                  onChange={(e) => handleInputChange('businessRegNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="BRN-2024-XXXX"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transport License Number *</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="TL-2024-XXXX"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Registration Document *</label>
                <FileUploadComponent
                  label="Upload Document"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(files: FileList) => handleFileUpload('businessRegDoc', files)}
                  files={formData.businessRegDoc}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Certificate *</label>
                <FileUploadComponent
                  label="Upload Certificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(files: FileList) => handleFileUpload('insuranceCert', files)}
                  files={formData.insuranceCert}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Verification Photos (Optional)</label>
                <FileUploadComponent
                  label="Upload office/vehicle yard photos (up to 3 images)"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onChange={(files: FileList) => handleFileUpload('verificationPhotos', files, true)}
                  files={formData.verificationPhotos}
                />
                <p className="text-xs text-gray-500 mt-1">Increases trust and improves approval chances</p>
              </div>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Fleet & Service Details</h2>
              <p className="text-gray-600">Tell us about your vehicles and services</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fleet Size *</label>
                <select
                  value={formData.fleetSize}
                  onChange={(e) => handleInputChange('fleetSize', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select fleet size</option>
                  {Array.from({length: 20}, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} vehicle{num > 1 ? 's' : ''}</option>
                  ))}
                  <option value="20+">20+ vehicles</option>
                  <option value="50+">50+ vehicles</option>
                  <option value="100+">100+ vehicles</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-4">Vehicle Types Provided *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {vehicleTypeOptions.map((type) => (
                    <label key={type.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.vehicleTypes.includes(type.id)}
                        onChange={() => handleArrayToggle('vehicleTypes', type.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Photos (Highly Recommended)</label>
                <FileUploadComponent
                  label="Upload up to 10 vehicle images (exterior + interior)"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onChange={(files: FileList) => handleFileUpload('vehiclePhotos', files, true)}
                  files={formData.vehiclePhotos}
                />
                <p className="text-xs text-gray-500 mt-1">Required for premium listing and builds customer trust</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-4">Amenities Provided</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {amenityOptions.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleArrayToggle('amenities', amenity)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Area Coverage</h2>
              <p className="text-gray-600">Where do you provide transport services?</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country/Region *</label>
                <select
                  value={formData.country || 'Sri Lanka'}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Sri Lanka">🇱🇰 Sri Lanka</option>
                  <option value="India">🇮🇳 India</option>
                  <option value="Maldives">🇲🇻 Maldives</option>
                  <option value="Bangladesh">🇧🇩 Bangladesh</option>
                  <option value="Nepal">🇳🇵 Nepal</option>
                  <option value="Bhutan">🇧🇹 Bhutan</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.islandWide}
                  onChange={(e) => handleInputChange('islandWide', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-blue-900">✅ Country-wide Service</span>
              </div>
              
              {!formData.islandWide && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Select Service Areas *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {serviceAreaOptions.map((area) => (
                      <label key={area} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.serviceAreas.includes(area)}
                          onChange={() => handleArrayToggle('serviceAreas', area)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Airport Transfers</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.airportTransfers}
                      onChange={(e) => handleInputChange('airportTransfers', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">✈️ We provide airport transfer services</span>
                  </label>
                  
                  {formData.airportTransfers && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Airport Pricing (Optional)</label>
                      <input
                        type="text"
                        value={formData.airportPricing}
                        onChange={(e) => handleInputChange('airportPricing', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., LKR 2500 from Airport to Colombo"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing & Availability</h2>
              <p className="text-gray-600">Set your pricing model and rates</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Pricing Model *</label>
                <div className="space-y-3">
                  {pricingModels.map((model) => (
                    <label key={model} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="pricingModel"
                        value={model}
                        checked={formData.pricingModel === model}
                        onChange={(e) => handleInputChange('pricingModel', e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium">{model}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (Optional)</label>
                  <input
                    type="text"
                    value={formData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., LKR 120 per KM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Booking Hours</label>
                  <select
                    value={formData.minBookingHours}
                    onChange={(e) => handleInputChange('minBookingHours', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No minimum</option>
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="3">3 hours</option>
                    <option value="4">4 hours</option>
                    <option value="8">8 hours (full day)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Availability Schedule</h2>
              <p className="text-gray-600">Set your weekly operating schedule</p>
            </div>
            
            <div className="space-y-4">
              {Object.entries(formData.availability).map(([day, schedule]) => (
                <div key={day} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-24">
                    <span className="font-medium capitalize">{day}</span>
                  </div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={schedule.available}
                      onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Available</span>
                  </label>
                  {schedule.available && (
                    <input
                      type="text"
                      value={schedule.hours}
                      onChange={(e) => handleAvailabilityChange(day, 'hours', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 9:00-17:00"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      
      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Driver / Staff Information</h2>
              <p className="text-gray-600">Optional but improves customer trust</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Drivers</label>
                <select
                  value={formData.driverCount}
                  onChange={(e) => handleInputChange('driverCount', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select number</option>
                  {Array.from({length: 20}, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} driver{num > 1 ? 's' : ''}</option>
                  ))}
                  <option value="20+">20+ drivers</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-4">Driver Certifications</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {driverCertOptions.map((cert) => (
                    <label key={cert} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.driverCertifications.includes(cert)}
                        onChange={() => handleArrayToggle('driverCertifications', cert)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{cert}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Driver IDs (Optional)</label>
                <FileUploadComponent
                  label="Upload driver license/ID documents"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={(files: FileList) => handleFileUpload('driverIds', files, true)}
                  files={formData.driverIds}
                />
              </div>
            </div>
          </div>
        )
      
      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Required Documents</h2>
              <p className="text-gray-600">Upload all necessary legal documents</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">📋 Required Documents Checklist</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Transport License *</li>
                  <li>• Insurance Certificate *</li>
                  <li>• Vehicle Registration *</li>
                  <li>• Business Registration (optional)</li>
                  <li>• Driver Licenses (optional)</li>
                </ul>
              </div>
              
              <FileUploadComponent
                label="Upload All Required Documents"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={(files: FileList) => handleFileUpload('documents', files, true)}
                files={formData.documents}
              />
            </div>
          </div>
        )
      
      case 9:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account & Security</h2>
              <p className="text-gray-600">Create your provider account</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Create Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Agreement</h3>
                
                {[
                  'I confirm that all submitted information is accurate',
                  'I agree to TravelBuddy\'s Provider Terms & Conditions',
                  'I understand that my account must be verified before listing services'
                ].map((text, index) => (
                  <label key={index} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreements[index]}
                      onChange={(e) => {
                        const newAgreements = [...formData.agreements]
                        newAgreements[index] = e.target.checked
                        handleInputChange('agreements', newAgreements)
                      }}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">{text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🚀 Transport Service Provider Registration</h1>
          <p className="text-xl text-gray-600">Join TravelBuddy's transport network and offer your services to thousands of travelers</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step) => (
              <div key={step.id} className={`flex flex-col items-center ${
                step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step.id < currentStep ? 'bg-blue-600 text-white' :
                  step.id === currentStep ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span className="text-xs mt-1 hidden md:block">{step.title}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 9) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {renderStep()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <div className="flex space-x-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                )}
                <button
                  type="button"
                  onClick={saveAsDraft}
                  className="px-6 py-3 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  💾 Save as Draft
                </button>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                
                {currentStep < 9 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.agreements.every(Boolean)}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      '🚀 Submit Application'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
