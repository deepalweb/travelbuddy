import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Shield, Globe } from 'lucide-react';

interface QuickActionsProps {
  weather: any;
}

const QuickActions: React.FC<QuickActionsProps> = ({ weather }) => {
  const actions = [
    {
      id: 'weather',
      label: 'Weather',
      icon: Cloud,
      gradient: 'from-blue-500 to-blue-600',
      subtitle: weather ? `${Math.round(weather.temperature)}°` : '28°',
      action: () => console.log('Weather clicked')
    },
    {
      id: 'safety',
      label: 'Safety Hub',
      icon: Shield,
      gradient: 'from-red-500 to-red-600',
      action: () => console.log('Safety clicked')
    },
    {
      id: 'translator',
      label: 'Translator',
      icon: Globe,
      gradient: 'from-green-500 to-green-600',
      action: () => console.log('Translator clicked')
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-blue-100 rounded-lg">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            ⚡
          </motion.div>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              onClick={action.action}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="space-y-3">
                <div className={`w-12 h-12 bg-gradient-to-r ${action.gradient} rounded-xl flex items-center justify-center mx-auto`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
                  {action.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{action.subtitle}</p>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;