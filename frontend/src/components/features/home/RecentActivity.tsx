import React from 'react';
import { motion } from 'framer-motion';
import { Map, Heart, ArrowRight } from 'lucide-react';

const RecentActivity: React.FC = () => {
  const activities = [
    {
      id: 'trips',
      icon: Map,
      title: 'Recent Trips',
      count: 3,
      subtitle: 'View your travel plans',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      action: () => console.log('Navigate to trips')
    },
    {
      id: 'favorites',
      icon: Heart,
      title: 'Favorite Places',
      count: 12,
      subtitle: 'Your saved locations',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      action: () => console.log('Navigate to favorites')
    }
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
      
      <div className="space-y-3">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <motion.button
              key={activity.id}
              onClick={activity.action}
              className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4"
              whileHover={{ scale: 1.01, x: 4 }}
              whileTap={{ scale: 0.99 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`p-3 ${activity.bgColor} rounded-xl`}>
                <Icon className={`w-6 h-6 ${activity.color}`} />
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {activity.count}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">{activity.subtitle}</p>
              </div>
              
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;