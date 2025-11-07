import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { 
  User, Store, Truck, MapPin, 
  CheckCircle, Clock, AlertCircle,
  ArrowRight, Shield, Star
} from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  requiresVerification: boolean
  icon: React.ReactNode
  color: string
  benefits: string[]
}

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [currentRole, setCurrentRole] = useState<string>('user')
  const [isLoading, setIsLoading] = useState(false)

  const roles: Role[] = [
    {
      id: 'user',
      name: 'Regular User',
      description: 'Browse and book travel services, share experiences',
      permissions: ['Search places', 'Create posts', 'Book services', 'Write reviews'],
      requiresVerification: false,
      icon: <User className="w-8 h-8" />,
      color: 'bg-blue-500',
      benefits: [
        'Access to all travel content',
        'Book services and experiences',
        'Share travel stories',
        'Connect with other travelers'
      ]
    },
    {
      id: 'merchant',
      name: 'Merchant',
      description: 'Create and manage deals for your business',
      permissions: ['Create deals', 'Manage business profile', 'View analytics', 'Customer management'],
      requiresVerification: true,
      icon: <Store className="w-8 h-8" />,
      color: 'bg-green-500',
      benefits: [
        'Create promotional deals',
        'Reach thousands of travelers',
        'Business analytics dashboard',
        'Customer engagement tools'
      ]
    },
    {
      id: 'transport_provider',
      name: 'Transport Provider',
      description: 'Offer transportation services to travelers',
      permissions: ['Manage fleet', 'Accept bookings', 'Route management', 'Service listings'],
      requiresVerification: true,
      icon: <Truck className="w-8 h-8" />,
      color: 'bg-orange-500',
      benefits: [
        'List transport services',
        'Manage vehicle fleet',
        'Accept online bookings',
        'Route optimization tools'
      ]
    },
    {
      id: 'travel_agent',
      name: 'Travel Agent',
      description: 'Provide professional travel planning services',
      permissions: ['Create packages', 'Client management', 'Agent tools', 'Itinerary builder'],
      requiresVerification: true,
      icon: <MapPin className="w-8 h-8" />,
      color: 'bg-purple-500',
      benefits: [
        'Professional agent profile',
        'Create travel packages',
        'Client booking system',
        'Advanced planning tools'
      ]
    }
  ]

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
  }

  const handleContinue = () => {
    if (!selectedRole) return

    const role = roles.find(r => r.id === selectedRole)
    if (!role) return

    if (role.requiresVerification) {
      // Navigate to appropriate registration page
      switch (selectedRole) {
        case 'merchant':
          navigate('/merchant-registration')
          break
        case 'transport_provider':
          navigate('/transport-registration')
          break
        case 'travel_agent':
          navigate('/agent-registration')
          break
        default:
          break
      }
    } else {
      // For regular user, just update role
      setIsLoading(true)
      setTimeout(() => {
        setCurrentRole(selectedRole)
        setIsLoading(false)
        navigate('/')
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Role</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select the role that best describes how you want to use TravelBuddy. 
            You can always change this later in your profile settings.
          </p>
        </div>

        {/* Current Role Indicator */}
        {currentRole && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Current Role: {roles.find(r => r.id === currentRole)?.name}
            </div>
          </div>
        )}

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {roles.map((role) => (
            <Card 
              key={role.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                selectedRole === role.id 
                  ? 'border-blue-500 shadow-lg transform scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <CardContent className="p-6">
                {/* Role Header */}
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${role.color} text-white rounded-full mb-3`}>
                    {role.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{role.name}</h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>

                {/* Verification Status */}
                <div className="mb-4">
                  {role.requiresVerification ? (
                    <div className="flex items-center justify-center text-orange-600 bg-orange-50 rounded-lg py-2 px-3">
                      <Shield className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Requires Verification</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-green-600 bg-green-50 rounded-lg py-2 px-3">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Instant Access</span>
                    </div>
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {role.benefits.slice(0, 3).map((benefit, index) => (
                      <li key={index} className="flex items-start text-xs text-gray-600">
                        <Star className="w-3 h-3 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Selection Indicator */}
                {selectedRole === role.id && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center text-blue-600 font-medium">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Selected
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Role Details */}
        {selectedRole && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 ${roles.find(r => r.id === selectedRole)?.color} text-white rounded-lg flex items-center justify-center`}>
                  {roles.find(r => r.id === selectedRole)?.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {roles.find(r => r.id === selectedRole)?.name}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {roles.find(r => r.id === selectedRole)?.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Permissions */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Permissions:</h4>
                      <ul className="space-y-1">
                        {roles.find(r => r.id === selectedRole)?.permissions.map((permission, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* All Benefits */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Benefits:</h4>
                      <ul className="space-y-1">
                        {roles.find(r => r.id === selectedRole)?.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <Star className="w-4 h-4 mr-2 text-yellow-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Verification Notice */}
                  {roles.find(r => r.id === selectedRole)?.requiresVerification && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-orange-900">Verification Required</h5>
                          <p className="text-sm text-orange-700 mt-1">
                            This role requires verification of your business credentials. 
                            You'll need to provide documentation and wait for approval (typically 3-5 business days).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="px-8 py-3"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need help choosing? <a href="#" className="text-blue-600 hover:underline">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  )
}