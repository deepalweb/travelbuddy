import React, { useState, useEffect } from 'react';

interface EnhancedActivity {
  id: string;
  title: string;
  timeSlot: string;
  estimatedDuration: string;
  type: 'landmark' | 'restaurant' | 'museum' | 'nature' | 'shopping';
  costInfo: {
    entryFee: number;
    currency: string;
    transportCost: number;
  };
  contextInfo: {
    crowdLevel: string;
    bestTimeToVisit: string;
    localTips: string[];
  };
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

interface EnhancedTripPlannerViewProps {
  activities: EnhancedActivity[];
  onActivitiesChange: (activities: EnhancedActivity[]) => void;
  destination: string;
  budget: number;
}

const EnhancedTripPlannerView: React.FC<EnhancedTripPlannerViewProps> = ({
  activities,
  onActivitiesChange,
  destination,
  budget
}) => {
  const [totalCost, setTotalCost] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [showAlternatives, setShowAlternatives] = useState<string | null>(null);

  useEffect(() => {
    const cost = activities.reduce((sum, activity) => 
      sum + activity.costInfo.entryFee + activity.costInfo.transportCost, 0);
    const time = activities.reduce((sum, activity) => 
      sum + parseInt(activity.estimatedDuration), 0);
    
    setTotalCost(cost);
    setTotalTime(time);
  }, [activities]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const items = [...activities];
    [items[index], items[index - 1]] = [items[index - 1], items[index]];
    onActivitiesChange(items);
  };

  const handleMoveDown = (index: number) => {
    if (index === activities.length - 1) return;
    const items = [...activities];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    onActivitiesChange(items);
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      landmark: '🏛️',
      restaurant: '🍽️',
      museum: '🎨',
      nature: '🌳',
      shopping: '🛍️'
    };
    return icons[type as keyof typeof icons] || '📍';
  };

  const getCrowdColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'high': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const generateAlternatives = (activity: EnhancedActivity) => {
    // Mock alternatives based on activity type
    const alternatives = {
      landmark: [
        { name: 'Historic Cathedral', cost: 12, time: '2h' },
        { name: 'City Observatory', cost: 8, time: '1.5h' },
        { name: 'Art District Walk', cost: 0, time: '2h' }
      ],
      restaurant: [
        { name: 'Local Bistro', cost: 25, time: '1.5h' },
        { name: 'Street Food Market', cost: 15, time: '1h' },
        { name: 'Rooftop Restaurant', cost: 45, time: '2h' }
      ]
    };
    
    return alternatives[activity.type as keyof typeof alternatives] || [];
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
        <h2 className="text-2xl font-bold mb-4">Enhanced Trip Planner - {destination}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">${totalCost}</div>
            <div className="text-sm opacity-80">Total Cost</div>
            <div className={`text-xs ${totalCost > budget ? 'text-red-200' : 'text-green-200'}`}>
              {totalCost > budget ? 'Over Budget' : 'Within Budget'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalTime}h</div>
            <div className="text-sm opacity-80">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{activities.length}</div>
            <div className="text-sm opacity-80">Activities</div>
          </div>
        </div>
      </div>

      {/* Interactive Timeline */}
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="bg-white rounded-xl shadow-lg border-2 border-gray-200 transition-all duration-200 hover:shadow-xl"
          >
                      {/* Activity Card */}
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Move Controls */}
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="w-8 h-6 bg-gray-100 rounded flex items-center justify-center disabled:opacity-50 hover:bg-gray-200"
                            >
                              <span className="text-gray-600 text-xs">↑</span>
                            </button>
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={index === activities.length - 1}
                              className="w-8 h-6 bg-gray-100 rounded flex items-center justify-center disabled:opacity-50 hover:bg-gray-200"
                            >
                              <span className="text-gray-600 text-xs">↓</span>
                            </button>
                          </div>

                          {/* Activity Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{activity.title}</h3>
                                <p className="text-sm text-gray-600">{activity.timeSlot}</p>
                              </div>
                            </div>

                            {/* Cost and Time Info */}
                            <div className="flex items-center gap-6 mb-3">
                              <div className="flex items-center gap-1">
                                <span className="text-green-600">💰</span>
                                <span className="text-sm font-medium">
                                  {activity.costInfo.currency}{activity.costInfo.entryFee}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-blue-600">⏱️</span>
                                <span className="text-sm">{activity.estimatedDuration}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-orange-600">👥</span>
                                <span className={`text-sm font-medium ${getCrowdColor(activity.contextInfo.crowdLevel)}`}>
                                  {activity.contextInfo.crowdLevel} crowd
                                </span>
                              </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1 mb-3">
                              <span className="text-red-500">📍</span>
                              <span className="text-sm text-gray-600">{activity.location.address}</span>
                            </div>

                            {/* Local Tips */}
                            {activity.contextInfo.localTips.length > 0 && (
                              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-blue-600">💡</span>
                                  <span className="text-sm font-medium text-blue-800">Local Tips</span>
                                </div>
                                <ul className="text-sm text-blue-700 space-y-1">
                                  {activity.contextInfo.localTips.map((tip, tipIndex) => (
                                    <li key={tipIndex}>• {tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setShowAlternatives(
                                showAlternatives === activity.id ? null : activity.id
                              )}
                              className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                            >
                              Alternatives
                            </button>
                            <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                              Directions
                            </button>
                            <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
                              Book
                            </button>
                          </div>
                        </div>

                        {/* Alternatives Panel */}
                        {showAlternatives === activity.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-3">Alternative Options:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {generateAlternatives(activity).map((alt, altIndex) => (
                                <div key={altIndex} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                  <div className="font-medium text-sm">{alt.name}</div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    ${alt.cost} • {alt.time}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
          </div>
        ))}
      </div>

      {/* Route Optimization */}
      <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Route Optimization</h3>
            <p className="text-sm text-gray-600">AI can optimize your route to save time and money</p>
          </div>
          <button className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all">
            Optimize Route
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTripPlannerView;