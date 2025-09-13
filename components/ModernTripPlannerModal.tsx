import React, { useEffect, useCallback, useState, useRef } from 'react';
import { TripPlanSuggestion } from '../types.ts';
import { useToast } from '../contexts/ToastContext.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import LockIcon from './LockIcon.tsx';

interface ModernTripPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripPlan: TripPlanSuggestion | null;
  isLoading: boolean;
  error: string | null;
  destination: string;
  duration: string;
  onSaveTripPlan?: (plan: TripPlanSuggestion) => void;
  isPlanSavable?: boolean;
  onShareToCommunity?: (plan: TripPlanSuggestion) => void;
}

export const ModernTripPlannerModal: React.FC<ModernTripPlannerModalProps> = ({
  isOpen,
  onClose,
  tripPlan,
  isLoading,
  error,
  destination,
  duration,
  onSaveTripPlan,
  isPlanSavable,
  onShareToCommunity,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isPlanSavedInThisSession, setIsPlanSavedInThisSession] = useState<boolean>(false);
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({});
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [isReading, setIsReading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsPlanSavedInThisSession(false);
      setCompletedActivities({});
    }
    // Stop speech synthesis when modal closes or trip plan changes
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsReading(false);
      }
    };
  }, [isOpen, tripPlan]);

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const handleToggleActivityCompletion = (dayIndex: number, activityIndex: number) => {
    const key = `${dayIndex}-${activityIndex}`;
    setCompletedActivities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenInMaps = (location: string | undefined) => {
    if (location) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else {
      addToast({ message: 'No location provided', type: 'warning' });
    }
  };

  const handleSavePlan = () => {
    if (tripPlan && onSaveTripPlan) {
      onSaveTripPlan(tripPlan);
      setIsPlanSavedInThisSession(true);
    }
  };

  const handleShareViaWhatsApp = () => {
    if (!tripPlan) return;

    let shareText = `*${tripPlan.tripTitle}*\n\n`;
    shareText += `${tripPlan.introduction}\n\n`;

    tripPlan.dailyPlans.forEach(day => {
      shareText += `*Day ${day.day}: ${day.title}*\n`;
      day.activities.forEach(activity => {
        shareText += ` - ${activity.activityTitle} (${activity.timeOfDay})\n`;
      });
      shareText += '\n';
    });

    if (tripPlan.conclusion) {
      shareText += `${tripPlan.conclusion}\n\n`;
    }
    shareText += 'Shared from Travel Buddy!';

    navigator.clipboard.writeText(shareText).then(() => {
      addToast({ message: t('tripPlannerModal.shareToWhatsAppToast'), type: 'success' });
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      addToast({ message: 'Failed to copy plan.', type: 'error' });
    });
  };

  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      addToast({ message: 'Text-to-speech is not supported by your browser.', type: 'warning' });
      return;
    }

    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    if (!tripPlan) return;

    let textToRead = `${tripPlan.tripTitle}. ${tripPlan.introduction}. `;
    tripPlan.dailyPlans.forEach(day => {
      textToRead += ` Day ${day.day}: ${day.title}. `;
      day.activities.forEach(activity => {
        textToRead += ` ${activity.timeOfDay}: ${activity.activityTitle}. ${activity.description}. `;
      });
    });
    if (tripPlan.conclusion) textToRead += tripPlan.conclusion;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => {
      addToast({ message: 'Speech synthesis failed.', type: 'error' });
      setIsReading(false);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const handleExportToPDF = () => {
    const printableElement = document.getElementById('trip-planner-printable');
    if (printableElement) {
      document.body.classList.add('printing-active');
      printableElement.classList.add('printable-area');
      window.print();
      setTimeout(() => {
        printableElement.classList.remove('printable-area');
        document.body.classList.remove('printing-active');
      }, 500);
    } else {
      addToast({ message: 'Could not find content to print.', type: 'error' });
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-40 transition-opacity duration-300 ease-out
                  ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}
      onClick={handleCloseWithAnimation}
    >
      <div
        id="trip-planner-printable"
        className={`bg-white rounded-2xl shadow-2xl w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col relative
                    transform transition-all duration-300 ease-out
                    ${isVisible && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLoading ? "Crafting Your Trip Plan..." : tripPlan?.tripTitle || `Your Trip to ${destination}`}
          </h2>
          <button
            onClick={handleCloseWithAnimation}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600">AI is planning your adventure to {destination} ({duration})...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="font-semibold text-red-800 mb-2">Trip Planning Failed</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {!isLoading && !error && tripPlan && (
            <div>
              {tripPlan.introduction && (
                <p className="text-gray-700 text-lg leading-relaxed mb-8">{tripPlan.introduction}</p>
              )}

              {/* Modern Timeline */}
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-blue-200 to-transparent hidden md:block"></div>

                <div className="space-y-8">
                  {tripPlan.dailyPlans?.map((day, dayIndex) => {
                    const totalActivities = day.activities.length;
                    const completedCount = day.activities.filter((_, actIndex) => completedActivities[`${dayIndex}-${actIndex}`]).length;
                    const progress = totalActivities > 0 ? (completedCount / totalActivities) * 100 : 0;
                    const isLastDay = dayIndex === tripPlan.dailyPlans.length - 1;

                    return (
                      <div key={day.day} className="relative">
                        {/* Timeline Node */}
                        <div className="absolute left-6 top-6 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-4 border-white shadow-lg z-10 hidden md:block"></div>

                        {/* Day Card */}
                        <div className="md:ml-16 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300">
                          {/* Hero Section */}
                          <div className="relative h-48 overflow-hidden">
                            {day.photoUrl ? (
                              <img src={day.photoUrl} alt={`Day ${day.day}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500"></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                            {/* Day Header */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                                  Day {day.day}
                                </div>
                                {day.theme && (
                                  <div className="bg-blue-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
                                    {day.theme}
                                  </div>
                                )}
                              </div>
                              <h3 className="text-2xl font-bold mb-1">{day.title}</h3>
                              <div className="flex items-center gap-4 text-sm opacity-90">
                                <span>🎯 {totalActivities} activities</span>
                                <span>✅ {completedCount} completed</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="px-6 py-3 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-600">Progress</span>
                              <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Activities Timeline */}
                          <div className="p-6">
                            <div className="space-y-4">
                              {day.activities.map((activity, actIndex) => {
                                const isCompleted = !!completedActivities[`${dayIndex}-${actIndex}`];
                                return (
                                  <div key={actIndex} className={`group relative transition-all duration-300 ${isCompleted ? 'opacity-60' : 'opacity-100'}`}>
                                    {/* Activity Card */}
                                    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                                      <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <div className="flex-shrink-0 mt-1">
                                          <input
                                            type="checkbox"
                                            checked={isCompleted}
                                            onChange={() => handleToggleActivityCompletion(dayIndex, actIndex)}
                                            className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
                                          />
                                        </div>

                                        {/* Activity Content */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-3 mb-2">
                                            <h4 className={`font-semibold text-gray-900 ${isCompleted ? 'line-through' : ''}`}>
                                              <span className="text-xl mr-2">{activity.icon || '📍'}</span>
                                              {activity.activityTitle}
                                            </h4>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                                {activity.timeOfDay}
                                              </span>
                                              {activity.effortLevel && (
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${activity.effortLevel === 'Easy' ? 'bg-green-100 text-green-800' :
                                                  activity.effortLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                  }`}>
                                                  {activity.effortLevel}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <p className={`text-gray-600 text-sm mb-3 leading-relaxed ${isCompleted ? 'line-through' : ''}`}>
                                            {activity.description}
                                          </p>

                                          {activity.estimatedDuration && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                              <span>⏱️</span>
                                              <span>{activity.estimatedDuration}</span>
                                            </div>
                                          )}

                                          {/* Action Buttons */}
                                          <div className="flex gap-2">
                                            {activity.location && (
                                              <button
                                                onClick={() => handleOpenInMaps(activity.location)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                                              >
                                                🗺️ Maps
                                              </button>
                                            )}
                                            {activity.bookingLink && (
                                              <a
                                                href={activity.bookingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-lg transition-colors"
                                              >
                                                🔗 Book
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Connector to next day */}
                        {!isLastDay && (
                          <div className="hidden md:flex items-center justify-center mt-6 mb-2">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                              ✈️ Next Day
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {tripPlan.conclusion && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                  <p className="text-gray-700 leading-relaxed">{tripPlan.conclusion}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex flex-wrap gap-3 justify-end">
          {tripPlan && (
            <>
              <button
                onClick={handleReadAloud}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                {isReading ? t('tripPlannerModal.stopReading') : t('tripPlannerModal.readAloud')}
              </button>
              <button
                onClick={handleExportToPDF}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('tripPlannerModal.exportToPDF')}
              </button>
              <button
                onClick={handleShareViaWhatsApp}
                className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f7a6f] text-white rounded-lg font-medium transition-colors"
              >
                {t('tripPlannerModal.shareViaWhatsApp')}
              </button>
              {onSaveTripPlan && (
                <button
                  onClick={handleSavePlan}
                  disabled={isPlanSavedInThisSession || !isPlanSavable}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {!isPlanSavable && <LockIcon className="w-4 h-4" color="white" />}
                  {isPlanSavedInThisSession ? "Plan Saved ✔" : "Save Trip Plan"}
                </button>
              )}
              {onShareToCommunity && (
                <button
                  onClick={() => onShareToCommunity(tripPlan)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Share to Community
                </button>
              )}
            </>
          )}
          <button
            onClick={handleCloseWithAnimation}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};