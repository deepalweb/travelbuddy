import React, { useState } from 'react';
import { EnhancedActivity } from '../enhancedTypes';

interface SimpleTripPlannerViewProps {
  activities: EnhancedActivity[];
  onActivitiesChange: (activities: EnhancedActivity[]) => void;
  destination: string;
  budget: number;
}

const SimpleTripPlannerView: React.FC<SimpleTripPlannerViewProps> = ({
  activities,
  onActivitiesChange,
  destination,
  budget
}) => {
  const [totalCost, setTotalCost] = useState(0);

  React.useEffect(() => {
    const cost = activities.reduce((sum, activity) => 
      sum + activity.costInfo.entryFee + activity.costInfo.transportCost, 0);
    setTotalCost(cost);
  }, [activities]);

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
        <h2 className="text-2xl font-bold mb-4">Trip Planner - {destination}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">${totalCost}</div>
            <div className="text-sm opacity-80">Total Cost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{activities.length}</div>
            <div className="text-sm opacity-80">Activities</div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="bg-white rounded-xl shadow-lg border p-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl">{getActivityIcon(activity.type)}</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{activity.title}</h3>
                <p className="text-gray-600 mb-2">{activity.timeSlot}</p>
                <p className="text-sm text-gray-700">{activity.description}</p>
                
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-green-600 font-medium">
                    ${activity.costInfo.entryFee}
                  </span>
                  <span className="text-blue-600">
                    {activity.estimatedDuration}
                  </span>
                  <span className="text-orange-600">
                    {activity.contextInfo.crowdLevel} crowd
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No activities planned yet. Start by selecting places from the explorer.</p>
        </div>
      )}
    </div>
  );
};

export default SimpleTripPlannerView;