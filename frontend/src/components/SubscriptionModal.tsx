import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { useAuth } from '../contexts/AuthContext'
import { useConfig } from '../contexts/ConfigContext'
import { X, Check, Crown, Zap, Star, Sparkles } from 'lucide-react'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier?: string
  upgradeRequired?: boolean
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ 
  isOpen, 
  onClose, 
  currentTier = 'free',
  upgradeRequired = false 
}) => {
  const { user } = useAuth()
  const { config } = useConfig()
  const [loading, setLoading] = useState(false)
  const [tiers, setTiers] = useState<any>({})
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      fetchTiers()
      fetchSubscriptionStatus()
    }
  }, [isOpen])

  const fetchTiers = async () => {
    try {
      const apiUrl = config?.apiBaseUrl || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
      const response = await fetch(`${apiUrl}/api/subscriptions/tiers`)
      if (response.ok) {
        const data = await response.json()
        setTiers(data)
      }
    } catch (error) {
      console.error('Failed to fetch tiers:', error)
    }
  }

  const fetchSubscriptionStatus = async () => {
    if (!user?.id) return
    
    try {
      const apiUrl = config?.apiBaseUrl || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
      const response = await fetch(`${apiUrl}/api/subscriptions/status`, {
        headers: {
          'x-user-id': user.id
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSubscriptionStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error)
    }
  }

  const handleUpgrade = async (tier: string) => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const apiUrl = config?.apiBaseUrl || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
      const response = await fetch(`${apiUrl}/api/subscriptions/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ tier })
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`Successfully upgraded to ${tier} plan!`)
        onClose()
        // Refresh the page to update user data
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Upgrade failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Upgrade failed:', error)
      alert('Upgrade failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const tierOrder = ['free', 'basic', 'premium', 'pro']
  const currentTierIndex = tierOrder.indexOf(currentTier)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-2xl font-bold">
              <Crown className="w-6 h-6 mr-3" />
              {upgradeRequired ? 'Upgrade Required' : 'Choose Your Plan'}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-full w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {upgradeRequired && (
            <p className="text-blue-100 mt-2">
              You've reached your plan limit. Upgrade to continue using this feature.
            </p>
          )}
        </CardHeader>
        
        <CardContent className="p-8">
          {subscriptionStatus && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Current Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(subscriptionStatus.usage).map(([feature, usage]: [string, any]) => (
                  <div key={feature} className="text-sm">
                    <div className="font-medium capitalize">{feature.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-gray-600">
                      {usage.current} / {usage.limit === -1 ? '∞' : usage.limit} per {usage.period}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: usage.limit === -1 ? '100%' : `${Math.min(100, (usage.current / usage.limit) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tierOrder.map((tierId, index) => {
              const tier = tiers[tierId]
              if (!tier) return null

              const isCurrentTier = tierId === currentTier
              const canUpgrade = index > currentTierIndex
              const isRecommended = tierId === 'premium'

              return (
                <div
                  key={tierId}
                  className={`relative border-2 rounded-xl p-6 ${
                    isCurrentTier
                      ? 'border-green-500 bg-green-50'
                      : isRecommended
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white'
                  } ${canUpgrade ? 'hover:shadow-lg transition-shadow' : ''}`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {isCurrentTier && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className="flex justify-center mb-2">
                      {tierId === 'free' && <Sparkles className="w-8 h-8 text-blue-500" />}
                      {tierId === 'basic' && <Zap className="w-8 h-8 text-green-500" />}
                      {tierId === 'premium' && <Star className="w-8 h-8 text-purple-500" />}
                      {tierId === 'pro' && <Crown className="w-8 h-8 text-yellow-500" />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                    <div className="text-3xl font-bold text-gray-900 mt-2">
                      ${tier.price}
                      {tier.price > 0 && <span className="text-sm text-gray-500">/month</span>}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleUpgrade(tierId)}
                    disabled={loading || isCurrentTier || !canUpgrade}
                    className={`w-full ${
                      isCurrentTier
                        ? 'bg-green-600 text-white cursor-default'
                        : canUpgrade
                        ? isRecommended
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading
                      ? 'Processing...'
                      : isCurrentTier
                      ? 'Current Plan'
                      : canUpgrade
                      ? `Upgrade to ${tier.name}`
                      : 'Downgrade Not Available'
                    }
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>All plans include basic features and customer support.</p>
            <p className="mt-2">
              <strong>Note:</strong> This is a demo subscription system. No actual payment is processed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
