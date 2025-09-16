import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext.tsx';
import { Bell, X, Check, CheckCheck } from './Icons.tsx';
import { pushNotificationService } from '../services/pushNotificationService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    setPushEnabled(pushNotificationService.isPermissionGranted());
  }, []);

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deal': return '💰';
      case 'weather': return '🌤️';
      case 'safety': return '🚨';
      case 'social': return '👥';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20';
      case 'medium': return 'border-l-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20';
      case 'low': return 'border-l-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20';
      default: return 'border-l-gray-400 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Mobile backdrop */}
      <div className="lg:hidden fixed inset-0 bg-black/50" onClick={onClose}></div>
      
      {/* Notification panel */}
      <div className="fixed top-0 right-0 h-full w-full bg-white dark:bg-gray-900 shadow-xl lg:absolute lg:top-full lg:right-0 lg:h-auto lg:max-h-[400px] lg:w-96 lg:rounded-lg lg:border border-blue-200 dark:border-blue-800">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-blue-100 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-sm text-blue-900 dark:text-blue-100">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[16px] text-center shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded text-blue-600 dark:text-blue-400">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-2.5 border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.read ? 'ring-1 ring-blue-200 dark:ring-blue-700' : ''
                  } hover:shadow-sm hover:scale-[1.01] transition-all duration-200 cursor-pointer`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-100">{notification.title}</h4>
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                            {new Date(notification.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded ml-2 flex-shrink-0 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-blue-100 dark:border-blue-800 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${pushEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Push: {pushEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {!pushEnabled && (
              <button
                onClick={async () => {
                  const enabled = await pushNotificationService.initialize();
                  setPushEnabled(enabled);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50"
              >
                Enable
              </button>
            )}
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="w-full text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 py-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;