import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Check, Crown, Zap, Star, AlertCircle, CreditCard, Calendar, X } from 'lucide-react'
import { subscriptionService } from '../services/subscriptionService'
import { apiService, subscriptionHelpers } from '../lib/api'

export const EnhancedSubscriptionPage: React.FC = () => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [tiers, setTiers] = useState<any[]>([])
  
  const currentTier = subscription?.tier || user?.tier || 'free'

  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData()
    }
  }, [user])

  const loadSubscriptionData = async () => {
    if (!user?.id) return
    
    try {
      const [subscriptionData, usageData, historyData, tiersData] = await Promise.all([
        apiService.getUserSubscription(user.id).catch(() => null),
        apiService.getSubscriptionUsage(user.id).catch(() => null),
        apiService.getPaymentHistory(user.id).catch(() => []),
        apiService.getSubscriptionTiers().catch(() => getDefaultTiers())
      ])
      
      setSubscription(subscriptionData)
      setUsage(usageData)
      setPaymentHistory(historyData)
      setTiers(tiersData)
    } catch (error) {
      console.error('Failed to load subscription data:', error)
      setTiers(getDefaultTiers())
    }
  }

  const getDefaultTiers = () => [
    {
      id: 'free',
      name: 'Explorer',
      price: 0,
      features: ['10 places per day', '3 deals per day', 'Basic trip planning', 'Community access', '10 favorites max']
    },
    {
      id: 'basic',
      name: 'Globetrotter',
      price: 4.99,
      features: ['30 places per day', 'Basic trip planning', 'Save up to 50 favorites', 'Standard support', '5 trips per month']
    },
    {
      id: 'premium',
      name: 'WanderPro',
      price: 9.99,
      features: ['100 places per day', '20 AI queries per month', 'Unlimited favorites', 'Advanced trip planning', 'Offline maps', 'Priority support']
    },
    {
      id: 'pro',
      name: 'WanderPro+',
      price: 19.99,
      features: ['Unlimited places', '100 AI queries per month', 'Business travel features', 'Team collaboration', 'Custom integrations', 'Dedicated support']
    }
  ]

  const handleUpgrade = async (planId: string, isFreeTrial: boolean = false) => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      if (isFreeTrial) {
        const hasUsedTrial = await apiService.checkTrialUsage(user.id)
        if (hasUsedTrial) {
          alert('You have already used your free trial. Please choose "Upgrade Now" for immediate access.')
          return
        }
        
        const success = await apiService.startFreeTrial(user.id, planId)
        if (success) {
          alert(`Started 7-day free trial for ${planId} plan!`)
          await loadSubscriptionData()
        }
      } else {
        const plan = tiers.find(t => t.id === planId)
        if (plan) {
          const paymentResult = await apiService.processPayment(user.id, planId, plan.price)
          if (paymentResult.success) {
            alert(`Successfully upgraded to ${plan.name} plan!`)
            await loadSubscriptionData()
          }
        }
      }
    } catch (error) {
      console.error('Upgrade failed:', error)
      alert(`Upgrade failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const success = await apiService.cancelSubscription(user.id)
      if (success) {
        alert('Subscription cancelled. You\'ll receive a refund confirmation email.')
        await loadSubscriptionData()
        setShowCancelDialog(false)
      }
    } catch (error) {
      console.error('Cancellation failed:', error)
      alert(`Cancellation failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Subscription Management</h1>
          <p className="text-xl text-gray-600">Manage your subscription and billing</p>
        </div>

        {/* Current Subscription Status */}
        {subscription && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="w-5 h-5 mr-2" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-lg">{subscription.tier.toUpperCase()} Plan</h3>
                  <p className="text-gray-600">Status: {subscription.status}</p>
                  {subscription.trialEndDate && (
                    <p className="text-sm text-orange-600">
                      Trial ends: {new Date(subscription.trialEndDate).toLocaleDateString()}
                    </p>
                  )}
                  {subscription.endDate && (
                    <p className="text-sm text-gray-600">
                      Next billing: {new Date(subscription.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                {usage && (
                  <div>
                    <h4 className="font-semibold mb-2">Usage This Period</h4>
                    <div className="space-y-1 text-sm">
                      <div>Places: {usage.placesToday}/day</div>
                      <div>AI Queries: {usage.aiQueriesThisMonth}/month</div>
                      <div>Favorites: {usage.totalFavorites}</div>
                      <div>Trips: {usage.tripsThisMonth}/month</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  {subscription.status === 'active' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(true)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentHistory.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{payment.plan}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(payment.date).toLocaleDateString()} • {payment.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${payment.amount}</div>
                      <Badge variant={payment.status === 'completed' ? 'default' : 'outline'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8 text-blue-600">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((plan) => {
              const Icon = plan.id === 'free' ? Star : plan.id === 'basic' ? Zap : Crown
              const isCurrentPlan = plan.id === currentTier
              const isPopular = plan.id === 'premium'
              
              return (
                <Card key={plan.id} className={`relative ${isPopular ? 'ring-2 ring-blue-500' : ''}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="primary">Most Popular</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">
                      <Icon className="w-8 h-8 text-blue-500" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      ${plan.price}
                      <span className="text-sm font-normal text-gray-600">/month</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {plan.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4">
                      {isCurrentPlan ? (
                        <Badge variant="outline" className="w-full justify-center py-2">
                          Current Plan
                        </Badge>
                      ) : (
                        <div className="space-y-2">
                          {plan.price > 0 && (
                            <Button 
                              className="w-full" 
                              variant="default"
                              onClick={() => handleUpgrade(plan.id, true)}
                              disabled={loading}
                            >
                              {loading ? 'Processing...' : 'Start 7-Day Free Trial'}
                            </Button>
                          )}
                          <Button 
                            className="w-full" 
                            variant={plan.price === 0 ? 'default' : 'outline'}
                            onClick={() => handleUpgrade(plan.id, false)}
                            disabled={loading}
                          >
                            {loading ? 'Processing...' : plan.price === 0 ? 'Downgrade to Free' : `Upgrade - $${plan.price}/month`}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Cancellation Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Cancel Subscription
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelDialog(false)}
                    className="rounded-full w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Are you sure you want to cancel?</p>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1">
                        <li>• You'll lose access to premium features</li>
                        <li>• Full refund available within 7 days</li>
                        <li>• You can resubscribe anytime</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(false)}
                      className="flex-1"
                    >
                      Keep Subscription
                    </Button>
                    <Button
                      onClick={handleCancelSubscription}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {loading ? 'Processing...' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-12 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Cancel anytime. Full refund within 7 days.</span>
            </div>
          </div>
          <p className="text-gray-600">
            Need help choosing? <a href="/contact" className="text-blue-600 hover:underline">Contact our team</a>
          </p>
        </div>
      </div>
    </div>
  )
}