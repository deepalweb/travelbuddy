import React from 'react';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { PlannerView, TripPlanSuggestion } from '../types.ts';

interface PlannerHomeViewProps {
  setPlannerView: (view: PlannerView) => void;
  savedTripPlans: TripPlanSuggestion[];
  onViewSavedTripPlan: (plan: TripPlanSuggestion) => void;
  onEditTripPlan: (plan: TripPlanSuggestion) => void;
  onDeleteSavedTripPlan: (planId: string) => void;
}

const PlannerHomeView: React.FC<PlannerHomeViewProps> = ({ 
  setPlannerView, 
  savedTripPlans, 
  onViewSavedTripPlan, 
  onEditTripPlan, 
  onDeleteSavedTripPlan 
}) => {
  const { t } = useLanguage();

  const planningOptions = [
    {
      view: 'oneDay' as PlannerView,
      titleKey: 'Quick Day Planner',
      descKey: 'Perfect single-day itinerary with selected places. Fast and simple.',
      buttonKey: 'Plan My Day',
      icon: '🗺️',
    },
    {
      view: 'smart' as PlannerView,
      titleKey: 'Smart Trip Planner',
      descKey: 'Multi-day AI planner with drag & drop, weather alerts, budget tracking, and local insights',
      buttonKey: 'Create Smart Trip',
      icon: '🧠',
    },
  ];

  return (
    <div className="animate-fadeInUp max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-2 gradient-text">{t('plannerHubView.title')}</h1>
        <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          {t('plannerHubView.subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-10">
        {planningOptions.map((option) => (
          <div
            key={option.view}
            className="card-base p-6 flex flex-col text-center"
          >
            <div className="text-5xl mb-4">{option.icon}</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {t(option.titleKey)}
            </h3>
            <p className="text-sm mb-6 flex-grow" style={{ color: 'var(--color-text-secondary)' }}>
              {t(option.descKey)}
            </p>
            <button
              onClick={() => setPlannerView(option.view)}
              className="btn btn-primary w-full mt-auto"
            >
              {t(option.buttonKey)}
            </button>
          </div>
        ))}
      </div>

      {/* My Saved Trip Plans */}
      {savedTripPlans.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>My Saved Trip Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedTripPlans.map(plan => (
              <div key={plan.id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">{plan.tripTitle}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>📍 {plan.destination}</span>
                      <span>📅 {plan.duration}</span>
                      <span>🎯 {plan.dailyPlans.length} days</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{plan.introduction}</p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => onViewSavedTripPlan(plan)}
                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    👁️ View
                  </button>
                  <button 
                    onClick={() => onEditTripPlan(plan)}
                    className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => onDeleteSavedTripPlan(plan.id)}
                    className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerHomeView;
