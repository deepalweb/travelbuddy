import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { Badge } from './Badge'
import { Check, Crown, Zap, Star, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
}

const travelerPlans = [
  {
    id: 'explorer',
    name: 'Explorer',
    price: 0,
    icon: Star,
    features: ['1 trip/month', 'Basic discovery (10 results)', 'View-only community', 'Basic weather', '5 place searches/day'],
    restrictions: ['No AI trip generation', 'No community posting', 'No premium deals']
  },
  {
    id: 'globetrotter',
    name: 'Globetrotter',
    price: 9.99,
    icon: Zap,
    popular: true,
    features: ['Unlimited trips', '20 AI trips/month', 'Community posting', 'Advanced filters', 'Basic offline mode', 'Booking support'],
    restrictions: ['No live AI assistant', 'No business dashboards']
  },
  {
    id: 'wanderpro',
    name: 'WanderPro+',
    price: 19.99,
    icon: Crown,
    features: ['Unlimited AI trips', 'Live AI assistant', 'PDF export', 'Smart packing list', 'Full offline mode', 'Early deals access'],
    restrictions: []
  }
]

const businessPlans = [
  {
    id: 'travelagent',
    name: 'TravelAgent Pro',
    price: 49.99,
    icon: Crown,
    features: ['Agent dashboard', 'Transport dashboard', 'Add services', 'Booking requests', 'Route planner', 'Customer chat', 'Analytics'],
    restrictions: []
  }
]

const partnerPlans = [
  {
    id: 'partner',
    name: 'Business + Deals',
    price: 29.99,
    icon: Crown,
    features: ['Create deals', 'Premium placement', 'Business page', 'AI marketing content', 'Analytics', 'Customer inbox'],
    restrictions: []
  }
]

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const currentTier = user?.tier || 'explorer'

  const handleUpgrade = (planId: string) => {
    console.log('Upgrading to:', planId)
    // TODO: Implement payment integration
    onClose()
  }

  if (!isOpen) return null

  const renderPlanSection = (title: string, plans: any[], color: string) => (
    <div className="mb-8">
      <h3 className={`text-xl font-bold text-center mb-6 ${color}`}>{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isCurrentPlan = currentTier === plan.id
          
          return (
            <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="primary">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  <Icon className={`w-6 h-6 ${plan.id === 'explorer' ? 'text-gray-500' : 'text-blue-500'}`} />
                </div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="text-2xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-600">/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {plan.features.slice(0, 3).map((feature: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-3">
                  {isCurrentPlan ? (
                    <Badge variant="outline" className="w-full justify-center py-2 text-xs">
                      Current Plan
                    </Badge>
                  ) : (
                    <Button 
                      size="sm"
                      className="w-full text-xs" 
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      Upgrade
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-6">
          {renderPlanSection('🧳 For Travelers', travelerPlans, 'text-blue-600')}
          {renderPlanSection('🧭 For Travel Agents & Transport', businessPlans, 'text-orange-600')}
          {renderPlanSection('🍽️ For Partner Businesses', partnerPlans, 'text-green-600')}
          
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Need help choosing? <a href="/contact" className="text-blue-600 hover:underline">Contact our team</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}