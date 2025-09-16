import React, { useState, useEffect } from 'react';
import { TripPlanSuggestion, DailyTripPlan, Activity } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { Cloud, Sun, CloudRain, Shuffle, DollarSign, Clock, MapPin, Grip } from './Icons.tsx';

interface SmartTripPlannerViewProps {
  generatedTripPlan: TripPlanSuggestion;
  onUpdatePlan: (updatedPlan: TripPlanSuggestion) => void;
  userLocation?: { latitude: number; longitude: number };
  weather?: string;
  budget?: number;
}

interface AlternativeActivity {
  id: string;
  activityTitle: string;
  description: string;
  timeOfDay: string;
  estimatedDuration: string;
  weatherSuitable: 'indoor' | 'outdoor' | 'both';
  budgetImpact: number;
  icon: string;
}

const SmartTripPlannerView: React.FC<SmartTripPlannerViewProps> = ({
  generatedTripPlan,
  onUpdatePlan,
  userLocation,
  weather = 'sunny',
  budget = 1000
}) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [draggedActivity, setDraggedActivity] = useState<{ dayIndex: number; activityIndex: number } | null>(null);
  const [showAlternatives, setShowAlternatives] = useState<{ dayIndex: number; activityIndex: number } | null>(null);
  const [currentBudget, setCurrentBudget] = useState(budget);
  const [weatherAlerts, setWeatherAlerts] = useState<string[]>([]);

  // Weather-based suggestions
  useEffect(() => {
    if (weather.includes('rain') || weather.includes('storm')) {
      const alerts = generatedTripPlan.dailyPlans.flatMap((day, dayIndex) =>
        day.activities
          .filter(activity => activity.description.toLowerCase().includes('outdoor'))
          .map(() => `Day ${day.day}: Consider indoor alternatives due to ${weather}`)
      );
      setWeatherAlerts(alerts);
    }
  }, [weather, generatedTripPlan]);

  // Generate alternative activities
  const generateAlternatives = (originalActivity: Activity): AlternativeActivity[] => {
    const alternatives: AlternativeActivity[] = [
      {
        id: 'alt1',
        activityTitle: 'Local Museum Visit',
        description: 'Explore cultural heritage indoors',
        timeOfDay: originalActivity.timeOfDay,
        estimatedDuration: originalActivity.estimatedDuration || '2 hours',
        weatherSuitable: 'indoor',
        budgetImpact: -20,
        icon: '🏛️'
      },
      {
        id: 'alt2', 
        activityTitle: 'Food Market Tour',
        description: 'Taste local cuisine and specialties',
        timeOfDay: originalActivity.timeOfDay,
        estimatedDuration: originalActivity.estimatedDuration || '1.5 hours',
        weatherSuitable: 'both',
        budgetImpact: 15,
        icon: '🍜'
      },
      {
        id: 'alt3',
        activityTitle: 'Shopping District',
        description: 'Browse local shops and souvenirs',
        timeOfDay: originalActivity.timeOfDay,
        estimatedDuration: originalActivity.estimatedDuration || '2 hours',
        weatherSuitable: 'indoor',
        budgetImpact: 30,
        icon: '🛍️'
      }
    ];
    return alternatives;
  };

  const handleDragStart = (dayIndex: number, activityIndex: number) => {
    setDraggedActivity({ dayIndex, activityIndex });
  };

  const handleDrop = (targetDayIndex: number, targetActivityIndex: number) => {
    if (!draggedActivity) return;

    const updatedPlan = { ...generatedTripPlan };
    const sourceDay = updatedPlan.dailyPlans[draggedActivity.dayIndex];
    const targetDay = updatedPlan.dailyPlans[targetDayIndex];
    
    const [movedActivity] = sourceDay.activities.splice(draggedActivity.activityIndex, 1);
    targetDay.activities.splice(targetActivityIndex, 0, movedActivity);

    onUpdatePlan(updatedPlan);
    setDraggedActivity(null);
    addToast({ message: 'Activity moved successfully!', type: 'success' });
  };

  const replaceActivity = (dayIndex: number, activityIndex: number, newActivity: AlternativeActivity) => {
    const updatedPlan = { ...generatedTripPlan };
    updatedPlan.dailyPlans[dayIndex].activities[activityIndex] = {
      ...updatedPlan.dailyPlans[dayIndex].activities[activityIndex],
      activityTitle: newActivity.activityTitle,
      description: newActivity.description,
      icon: newActivity.icon
    };

    setCurrentBudget(prev => prev + newActivity.budgetImpact);
    onUpdatePlan(updatedPlan);
    setShowAlternatives(null);
    addToast({ message: 'Activity updated!', type: 'success' });
  };

  const getWeatherIcon = () => {
    if (weather.includes('rain')) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if (weather.includes('cloud')) return <Cloud className="w-5 h-5 text-gray-500" />;
    return <Sun className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Smart Context Header */}
      <div className="card-base p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Smart Trip Planner
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              {getWeatherIcon()}
              <span style={{ color: 'var(--color-text-secondary)' }}>{weather}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span style={{ color: 'var(--color-text-primary)' }}>${currentBudget}</span>
            </div>
          </div>
        </div>

        {/* Weather Alerts */}
        {weatherAlerts.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">🌧️ Weather Advisory</h4>
            {weatherAlerts.map((alert, index) => (
              <p key={index} className="text-sm text-blue-700">{alert}</p>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Timeline */}
      <div className="space-y-4">
        {generatedTripPlan.dailyPlans.map((day, dayIndex) => (
          <div key={day.day} className="card-base p-4">
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Day {day.day}: {day.title}
            </h3>
            
            <div className="space-y-3">
              {day.activities.map((activity, activityIndex) => (
                <div
                  key={activityIndex}
                  className="group relative p-3 rounded-lg border-2 border-dashed border-transparent hover:border-blue-300 transition-all"
                  style={{ backgroundColor: 'var(--color-input-bg)' }}
                  draggable
                  onDragStart={() => handleDragStart(dayIndex, activityIndex)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(dayIndex, activityIndex)}
                >
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                      <Grip className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{activity.icon || '📍'}</span>
                        <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {activity.activityTitle}
                        </h4>
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <Clock className="w-3 h-3" />
                          {activity.timeOfDay}
                        </div>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {activity.description}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={() => setShowAlternatives({ dayIndex, activityIndex })}
                        className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Show alternatives"
                      >
                        <Shuffle className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-green-100 transition-colors"
                        title="Get directions"
                      >
                        <MapPin className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  </div>

                  {/* Alternative Options Modal */}
                  {showAlternatives?.dayIndex === dayIndex && showAlternatives?.activityIndex === activityIndex && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg shadow-lg border z-10">
                      <h5 className="font-semibold mb-3">Alternative Options:</h5>
                      <div className="space-y-2">
                        {generateAlternatives(activity).map((alt) => (
                          <button
                            key={alt.id}
                            onClick={() => replaceActivity(dayIndex, activityIndex, alt)}
                            className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span>{alt.icon}</span>
                              <span className="font-medium">{alt.activityTitle}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                alt.budgetImpact > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {alt.budgetImpact > 0 ? '+' : ''}${alt.budgetImpact}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{alt.description}</p>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowAlternatives(null)}
                        className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Smart Suggestions */}
      <div className="card-base p-4">
        <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          💡 Smart Suggestions
        </h3>
        <div className="space-y-2 text-sm">
          <p style={{ color: 'var(--color-text-secondary)' }}>
            • Visit museums during midday to avoid crowds
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            • Book restaurants in advance for dinner slots
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            • Start early for outdoor activities to beat the heat
          </p>
        </div>
      </div>
    </div>
  );
};

export default SmartTripPlannerView;