import React from 'react'
import { Info, MapPin, DollarSign, MessageCircle, Utensils } from 'lucide-react'
import { Card, CardContent } from './Card'
import { localCulture } from '../data/sriLankanDestinations'

export const CulturalInsights: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Info className="w-4 h-4" />
            Cultural Guide
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Know Before You Go
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Essential cultural insights to make your Sri Lankan adventure authentic and respectful
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Language */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Languages</h3>
              <p className="text-sm text-gray-600 mb-2">{localCulture.language.primary}</p>
              <p className="text-sm text-gray-600 mb-2">{localCulture.language.secondary}</p>
              <p className="text-xs text-green-600 font-medium">{localCulture.language.common}</p>
            </CardContent>
          </Card>

          {/* Currency */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Currency</h3>
              <p className="text-sm text-gray-600 mb-2">{localCulture.currency.name}</p>
              <p className="text-sm font-medium text-gray-900 mb-2">{localCulture.currency.rate}</p>
              <p className="text-xs text-blue-600">{localCulture.currency.tips}</p>
            </CardContent>
          </Card>

          {/* Food */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Must-Try Foods</h3>
              <div className="space-y-1">
                {localCulture.food.slice(0, 3).map((food, index) => (
                  <p key={index} className="text-sm text-gray-600">{food}</p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customs */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cultural Tips</h3>
              <div className="space-y-1">
                {localCulture.customs.slice(0, 2).map((custom, index) => (
                  <p key={index} className="text-xs text-gray-600">{custom}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tips */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Cultural Etiquette Guide
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Do's
              </h4>
              <ul className="space-y-2">
                {localCulture.customs.map((custom, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {custom}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                Local Specialties
              </h4>
              <ul className="space-y-2">
                {localCulture.food.map((food, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-orange-500 mr-2">🍽️</span>
                    {food}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
