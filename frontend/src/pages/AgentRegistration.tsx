import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Check, MapPin, Camera, FileText, Star, Globe, Phone, Mail } from 'lucide-react'

interface FormData {
  // Agency & Contact
  agencyName: string
  ownerName: string
  profilePhoto: File | null
  email: string
  phone: string
  whatsapp: string
  website: string
  address: string
  location: { lat: number; lng: number } | null
  
  // Professional
  licenseNumber: string
  licenseDocument: File | null
  experienceYears: string
  about: string
  priceRange: string
  operatingRegions: string[]
  
  // Specializations & Languages
  specialties: string[]
  languages: string[]
  
  // Documents & Verification
  businessLicense: File | null
  insuranceCert: File | null
  professionalCert: File | null
  portfolioImages: File[]
  idVerification: File | null
  selfieVerification: File | null
}

export const AgentRegistration: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    agencyName: '',
    ownerName: '',
    profilePhoto: null,
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    address: '',
    location: null,
    licenseNumber: '',
    licenseDocument: null,
    experienceYears: '',
    about: '',
    priceRange: '',
    operatingRegions: [],
    specialties: [],
    languages: [],
    businessLicense: null,
    insuranceCert: null,
    professionalCert: null,
    portfolioImages: [],
    idVerification: null,
    selfieVerification: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const specialtyOptions = [
    'Adventure & Hiking', 'Cultural Tours', 'Family Travel', 'Honeymoon & Romance',
    'Luxury & VIP', 'Wildlife & Safari', 'Beach & Coastal', 'Photography Tours',
    'Budget Backpacking', 'Pilgrimage Tours', 'Eco-Tourism', 'Road Trip Specialists',
    'Digital Nomad Support', 'Educational Tours', 'Solo Travel', 'Business Travel',
    'Cruise & Maritime Tours', 'Food & Culinary Tours', 'City Walks & Historical Tours', 'Festival & Seasonal Tours'
  ]

  const languageOptions = [
    'English', 'Sinhala', 'Tamil', 'Hindi', 'French', 'German', 'Spanish', 'Chinese', 'Arabic', 'Japanese'
  ]

  const regionOptions = [
    'Colombo', 'Kandy', 'Galle', 'Negombo', 'Ella', 'Sigiriya', 'Anuradhapura', 'Nuwara Eliya', 'Mirissa', 'Bentota', 'Jaffna', 'Trincomalee'
  ]

  const priceRanges = [
    'LKR 5,000 - 15,000', 'LKR 15,000 - 30,000', 'LKR 30,000 - 50,000', 
    'LKR 50,000 - 75,000', 'LKR 75,000 - 100,000', 'LKR 100,000+'
  ]

  const steps = [
    { id: 1, title: 'Agency & Contact', icon: '🏢' },
    { id: 2, title: 'Professional Details', icon: '👨‍💼' },
    { id: 3, title: 'Specializations', icon: '🎯' },
    { id: 4, title: 'Documents', icon: '📄' },
    { id: 5, title: 'Review', icon: '✅' }
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

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const saveAsDraft = () => {
    localStorage.setItem('agentRegistrationDraft', JSON.stringify(formData))
    alert('Draft saved successfully!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData = {
        agencyName: formData.agencyName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        website: formData.website,
        address: formData.address,
        location: formData.location,
        licenseNumber: formData.licenseNumber,
        experienceYears: formData.experienceYears,
        about: formData.about,
        priceRange: formData.priceRange,
        operatingRegions: formData.operatingRegions,
        specialties: formData.specialties,
        languages: formData.languages,
        // File names for now - in production, upload files first
        profilePhoto: formData.profilePhoto?.name,
        portfolioImages: formData.portfolioImages.map(f => f.name),
        documents: {
          businessLicense: formData.businessLicense?.name,
          insuranceCert: formData.insuranceCert?.name,
          professionalCert: formData.professionalCert?.name,
          idVerification: formData.idVerification?.name
        }
      }

      const response = await fetch('https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/travel-agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        localStorage.removeItem('agentRegistrationDraft')
        setSubmitted(true)
      } else {
        throw new Error('Registration failed')
      }
    } catch (error) {
      alert('Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const FileUploadComponent = ({ label, accept, multiple = false, onChange, files }: any) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Submitted Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for joining TravelBuddy's agent network. Your comprehensive application has been received.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Document verification (1-2 days)</li>
                <li>• Profile review (2-3 days)</li>
                <li>• Account activation email</li>
                <li>• Access to agent dashboard</li>
              </ul>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/travel-agents')}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Browse Travel Agents
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Agency & Contact Information</h2>
              <p className="text-gray-600">Tell us about your travel agency and contact details</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo *</label>
                <FileUploadComponent
                  label="Upload Profile Photo (Max 5MB)"
                  accept=".jpg,.jpeg,.png"
                  onChange={(files: FileList) => handleFileUpload('profilePhoto', files)}
                  files={formData.profilePhoto}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agency Name *</label>
                <input
                  type="text"
                  value={formData.agencyName}
                  onChange={(e) => handleInputChange('agencyName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your Travel Agency Name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner / Agent Full Name *</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your Full Name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone (International Format) *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="+94-XX-XXX-XXXX"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Business Number</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="+94-XX-XXX-XXXX"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Complete business address"
                  required
                />
              </div>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Details</h2>
              <p className="text-gray-600">Your licensing and professional information</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Travel Agent License Number *</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="TA-2024-XXX"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                <select
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select experience</option>
                  {Array.from({length: 30}, (_, i) => i + 1).map(year => (
                    <option key={year} value={year}>{year} year{year > 1 ? 's' : ''}</option>
                  ))}
                  <option value="30+">30+ years</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Typical Price Range *</label>
                <select
                  value={formData.priceRange}
                  onChange={(e) => handleInputChange('priceRange', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select price range</option>
                  {priceRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">About You / Agency Description *</label>
                <textarea
                  value={formData.about}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your agency, experience, and what makes you special (200-500 characters)"
                  minLength={200}
                  maxLength={500}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">{formData.about.length}/500 characters</div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-4">Operating Regions *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {regionOptions.map(region => (
                    <label key={region} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.operatingRegions.includes(region)}
                        onChange={() => handleArrayToggle('operatingRegions', region)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">{region}</span>
                    </label>
                  ))}
                </div>
                <label className="flex items-center space-x-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.operatingRegions.includes('Island-wide')}
                    onChange={() => handleArrayToggle('operatingRegions', 'Island-wide')}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-indigo-600">✓ Island-wide Service</span>
                </label>
              </div>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Specializations & Languages</h2>
              <p className="text-gray-600">What you specialize in and languages you speak</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Travel Specialties (Pick 2-10) *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {specialtyOptions.map(specialty => (
                  <label key={specialty} className="flex items-center space-x-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={() => handleArrayToggle('specialties', specialty)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">Selected: {formData.specialties.length}/10</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Languages Spoken *</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {languageOptions.map(language => (
                  <label key={language} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(language)}
                      onChange={() => handleArrayToggle('languages', language)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">{language}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents & Verification</h2>
              <p className="text-gray-600">Upload required documents and verification materials</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business License *</label>
                <FileUploadComponent
                  label="Upload Business License"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(files: FileList) => handleFileUpload('businessLicense', files)}
                  files={formData.businessLicense}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Certificate *</label>
                <FileUploadComponent
                  label="Upload Insurance Certificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(files: FileList) => handleFileUpload('insuranceCert', files)}
                  files={formData.insuranceCert}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Certification *</label>
                <FileUploadComponent
                  label="Upload Professional Certification"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(files: FileList) => handleFileUpload('professionalCert', files)}
                  files={formData.professionalCert}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Verification (Optional)</label>
                <FileUploadComponent
                  label="Upload NIC/Passport Scan"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(files: FileList) => handleFileUpload('idVerification', files)}
                  files={formData.idVerification}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio of Past Tours (Optional)</label>
                <FileUploadComponent
                  label="Upload up to 10 images of tours you conducted"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onChange={(files: FileList) => handleFileUpload('portfolioImages', files, true)}
                  files={formData.portfolioImages}
                />
              </div>
            </div>
          </div>
        )
      
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
              <p className="text-gray-600">Please review your information before submitting</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Agency Information</h3>
                  <p className="text-sm text-gray-600">Agency: {formData.agencyName}</p>
                  <p className="text-sm text-gray-600">Owner: {formData.ownerName}</p>
                  <p className="text-sm text-gray-600">Email: {formData.email}</p>
                  <p className="text-sm text-gray-600">Phone: {formData.phone}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Professional Details</h3>
                  <p className="text-sm text-gray-600">License: {formData.licenseNumber}</p>
                  <p className="text-sm text-gray-600">Experience: {formData.experienceYears} years</p>
                  <p className="text-sm text-gray-600">Price Range: {formData.priceRange}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Specializations</h3>
                  <p className="text-sm text-gray-600">{formData.specialties.join(', ')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Languages</h3>
                  <p className="text-sm text-gray-600">{formData.languages.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🚀 Travel Agent Registration</h1>
          <p className="text-xl text-gray-600">Join TravelBuddy's elite network of verified travel professionals</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step) => (
              <div key={step.id} className={`flex flex-col items-center ${
                step.id <= currentStep ? 'text-indigo-600' : 'text-gray-400'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step.id < currentStep ? 'bg-indigo-600 text-white' :
                  step.id === currentStep ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600' :
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
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
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
                  className="px-6 py-3 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  💾 Save Draft
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
                
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
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
