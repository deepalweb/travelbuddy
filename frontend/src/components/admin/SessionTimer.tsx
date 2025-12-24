import React from 'react';

interface SessionTimerProps {
  timeRemaining: number;
  showWarning: boolean;
  formatTime: (ms: number) => string;
  onExtend: () => void;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
  timeRemaining,
  showWarning,
  formatTime,
  onExtend
}) => {
  if (!showWarning) {
    return (
      <div className="text-xs text-gray-500">
        Session: {formatTime(timeRemaining)}
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-800 mb-1">Session Expiring Soon</h3>
          <p className="text-sm text-yellow-700 mb-3">
            Your session will expire in {formatTime(timeRemaining)}
          </p>
          <button
            onClick={onExtend}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium w-full"
          >
            Extend Session
          </button>
        </div>
      </div>
    </div>
  );
};
