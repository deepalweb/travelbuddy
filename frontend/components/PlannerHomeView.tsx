import React from 'react';
import { TripPlanSuggestion } from '../types.ts';

interface PlannerHomeViewProps {
  setPlannerView: (view: string) => void;
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
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Trip Planner</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => setPlannerView('oneDay')}
          className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <div className="text-3xl mb-3">📅</div>
          <h3 className="text-lg font-bold mb-2">Day Planner</h3>
          <p className="text-sm text-gray-600">Plan a perfect single day</p>
        </button>
        
        <button
          onClick={() => setPlannerView('multiDay')}
          className="p-6 bg-purple-50 border-2 border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
        >
          <div className="text-3xl mb-3">🗺️</div>
          <h3 className="text-lg font-bold mb-2">Multi-Day Trip</h3>
          <p className="text-sm text-gray-600">Plan comprehensive trips</p>
        </button>
        
        <button
          onClick={() => setPlannerView('enhanced')}
          className="p-6 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 transition-colors"
        >
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-lg font-bold mb-2">Enhanced Planner</h3>
          <p className="text-sm text-gray-600">Interactive drag-and-drop planning</p>
        </button>
      </div>
      
      {savedTripPlans.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Plans</h2>
          <div className="space-y-3">
            {savedTripPlans.slice(0, 3).map((plan) => (
              <div key={plan.id} className="p-4 bg-white border rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{plan.tripTitle}</h3>
                    <p className="text-sm text-gray-600">{plan.destination} • {plan.duration}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewSavedTripPlan(plan)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEditTripPlan(plan)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Edit
                    </button>
                  </div>
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