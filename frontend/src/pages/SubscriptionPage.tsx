import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Check, Crown, Zap, Star } from 'lucide-react'

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

export const SubscriptionPage: React.FC = () => {
  const { user } = useAuth()
  const currentTier = user?.tier || 'explorer'

  const handleUpgrade = (planId: string) => {
    console.log('Upgrading to:', planId)
  }

  const renderPlanSection = (title: string, plans: any[], color: string) => (
    <div className="mb-16">
      <h2 className={`text-2xl font-bold text-center mb-8 ${color}`}>{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <Icon className={`w-8 h-8 ${plan.id === 'explorer' ? 'text-gray-500' : 'text-blue-500'}`} />
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
                
                {plan.restrictions.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Restrictions:</p>
                    {plan.restrictions.map((restriction: string, index: number) => (
                      <p key={index} className="text-xs text-gray-400">• {restriction}</p>
                    ))}
                  </div>
                )}
                
                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Badge variant="outline" className="w-full justify-center py-2">
                      Current Plan
                    </Badge>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      Upgrade to {plan.name}
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Three categories designed for different user types</p>
        </div>

        {renderPlanSection('🧳 For Travelers', travelerPlans, 'text-blue-600')}
        {renderPlanSection('🧭 For Travel Agents & Transport', businessPlans, 'text-orange-600')}
        {renderPlanSection('🍽️ For Partner Businesses', partnerPlans, 'text-green-600')}
        
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Need help choosing? <a href="/contact" className="text-blue-600 hover:underline">Contact our team</a>
          </p>
        </div>
      </div>
    </div>
  )
}