import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { TripPlanSuggestion, DailyTripPlan, ActivityDetail } from '../types.ts';
import { Colors } from '../constants.ts';
import { useToast } from '../contexts/ToastContext.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import LockIcon from './LockIcon.tsx';

interface TripPlannerModalProps {
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

export const TripPlannerModal: React.FC<TripPlannerModalProps> = ({
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
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
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

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseWithAnimation();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, handleCloseWithAnimation]);

  const handleSavePlan = () => {
    if (tripPlan && onSaveTripPlan) {
      onSaveTripPlan(tripPlan);
      setIsPlanSavedInThisSession(true);
    }
  };

  const handleSharePlanToCommunity = () => {
    if (tripPlan && onShareToCommunity) {
      onShareToCommunity(tripPlan);
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
    shareText += "Shared from Travel Buddy!";

    navigator.clipboard.writeText(shareText).then(() => {
        addToast({ message: t('tripPlannerModal.shareToWhatsAppToast'), type: 'success' });
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        addToast({ message: "Failed to copy plan.", type: 'error' });
    });
  };
  
  const handleToggleActivityCompletion = (dayIndex: number, activityIndex: number) => {
    const key = `${dayIndex}-${activityIndex}`;
    setCompletedActivities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenInMaps = (location: string | undefined) => {
    if (location) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else {
      addToast({ message: t('tripPlannerModal.noLocationProvided'), type: 'warning' });
    }
  };
  
  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      addToast({ message: 'Text-to-speech is not supported by your browser.', type: 'warning' });
      return;
    }

    if (isReading) {
      speechSynthesis.cancel();
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
    textToRead += tripPlan.conclusion;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => {
        addToast({ message: 'Speech synthesis failed.', type: 'error' });
        setIsReading(false);
    };
    utteranceRef.current = utterance;
    
    speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const handleExportToPDF = () => {
    const printableElement = document.getElementById('trip-planner-printable');
    if (printableElement) {
        document.body.classList.add('printing-active');
        printableElement.classList.add('printable-area');

        window.print();
        
        // Use a timeout to ensure the print dialog has time to process
        setTimeout(() => {
            printableElement.classList.remove('printable-area');
            document.body.classList.remove('printing-active');
        }, 500);
    } else {
        addToast({ message: 'Could not find content to print.', type: 'error' });
    }
  };

  const getEffortPillStyle = (effortLevel?: string): React.CSSProperties => {
    let bgColor = `${Colors.accentInfo}20`;
    let textColor = Colors.accentInfo;
    switch (effortLevel?.toLowerCase()) {
      case 'moderate':
        bgColor = `${Colors.accentWarning}20`;
        textColor = Colors.accentWarning;
        break;
      case 'tough':
        bgColor = `${Colors.accentError}20`;
        textColor = Colors.accentError;
        break;
    }
    return { backgroundColor: bgColor, color: textColor };
  };

  const renderSection = (titleKey: string, items: React.ReactNode, icon: React.ReactNode) => {
    if (!items) return null;
    return (
      <div className="mt-4 pt-3 border-t" style={{borderColor: `var(--color-glass-border)`}}>
        <h4 className="text-md font-semibold mb-2 flex items-center" style={{color: 'var(--color-primary)'}}>
          <span className="mr-2">{icon}</span>
          {t(titleKey)}
        </h4>
        {items}
      </div>
    );
  };
  
  const commonButtonStyles = "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-70 flex items-center justify-center gap-2";

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-40 transition-opacity duration-300 ease-out
                  ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}                  
      onClick={handleCloseWithAnimation}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-planner-modal-title"
    >
      <div
        id="trip-planner-printable"
        className={`card-base w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col relative
                    transform transition-all duration-300 ease-out
                    ${isVisible && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="flex justify-between items-center p-4 border-b no-print" style={{borderColor: `var(--color-glass-border)`}}>
          <h2 id="trip-planner-modal-title" className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {isLoading ? "Crafting Your Trip Plan..." : tripPlan?.tripTitle || `Your Trip to ${destination}`}
          </h2>
          <button
            onClick={handleCloseWithAnimation}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Close trip planner modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 mb-3" style={{ borderColor: 'var(--color-primary-dark)', borderTopColor: 'var(--color-primary)' }}></div>
              <p className="text-md" style={{ color: 'var(--color-text-secondary)' }}>AI is planning your adventure to {destination} ({duration})...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-3 my-1.5 rounded-lg text-sm text-center" style={{ backgroundColor: `var(--color-accent-danger)1A`, border: `1px solid var(--color-accent-danger)50`, color: 'var(--color-accent-danger)' }} role="alert">
              <p className="font-semibold text-md mb-1">Trip Planning Failed</p>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && tripPlan && (
            <div className="prose prose-sm max-w-none" style={{color: 'var(--color-text-secondary)'}}>
              {tripPlan.introduction && <p className="lead text-sm mb-6" style={{color: 'var(--color-text-primary)', lineHeight: 1.6}}>{tripPlan.introduction}</p>}
              
              <div className="space-y-6">
                {tripPlan.dailyPlans?.map((day, dayIndex) => {
                    const totalActivities = day.activities.length;
                    const completedCount = day.activities.filter((_, actIndex) => completedActivities[`${dayIndex}-${actIndex}`]).length;
                    const progress = totalActivities > 0 ? (completedCount / totalActivities) * 100 : 0;

                    return (
                        <div key={day.day} className="card-base p-4 overflow-hidden">
                            {day.photoUrl && (
                                <div className="h-40 -m-4 mb-4 rounded-t-xl overflow-hidden relative">
                                    <img src={day.photoUrl} alt={`View of ${day.title}`} className="w-full h-full object-cover"/>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                </div>
                            )}
                            <h4 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Day {day.day}: {day.title}</h4>
                            {day.theme && <p className="italic text-xs mb-3 font-medium" style={{color: 'var(--color-primary)'}}>{day.theme}</p>}
                            
                            {totalActivities > 0 && (
                                <div className="my-3 no-print">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-semibold" style={{color: 'var(--color-text-secondary)'}}>{t('tripPlannerModal.dailyProgress')}</label>
                                        <span className="text-xs font-bold" style={{color: 'var(--color-primary)'}}>{completedCount} / {totalActivities}</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full" style={{backgroundColor: 'var(--color-input-bg)'}}>
                                        <div className="h-2 rounded-full transition-all duration-300" style={{width: `${progress}%`, backgroundImage: 'var(--gradient-accent)'}}></div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 mt-4">
                            {day.activities.map((activity, actIndex) => {
                                const isCompleted = !!completedActivities[`${dayIndex}-${actIndex}`];
                                return (
                                 <div key={actIndex} className={`p-3 rounded-lg transition-opacity duration-300 ${isCompleted ? 'opacity-60' : 'opacity-100'}`} style={{backgroundColor: 'var(--color-input-bg)'}}>
                                    <div className="flex items-start gap-3">
                                        <input type="checkbox" checked={isCompleted} onChange={() => handleToggleActivityCompletion(dayIndex, actIndex)} className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 no-print" style={{accentColor: 'var(--color-primary)'}} aria-label={t(isCompleted ? 'tripPlannerModal.markAsNotDone' : 'tripPlannerModal.markAsDone')} />
                                        <div className="flex-1">
                                            <h5 className={`font-semibold text-sm mb-0.5 ${isCompleted ? 'line-through' : ''}`} style={{ color: 'var(--color-text-primary)' }}>
                                                <span className="mr-2">{activity.icon || '📍'}</span>
                                                {activity.activityTitle}
                                            </h5>
                                            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs mb-1" style={{color: 'var(--color-text-secondary)'}}>
                                                <span>🕒 {activity.timeOfDay} {activity.estimatedDuration && `(${activity.estimatedDuration})`}</span>
                                                {activity.effortLevel && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={getEffortPillStyle(activity.effortLevel)}>{activity.effortLevel}</span>}
                                            </div>
                                            <p className={`text-xs ${isCompleted ? 'line-through' : ''}`} style={{lineHeight: 1.5}}>{activity.description}</p>
                                            
                                            <div className="flex gap-2 mt-2 no-print">
                                                {activity.location && <button onClick={() => handleOpenInMaps(activity.location)} className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1" style={{backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-glass-border)'}}>{t('tripPlannerModal.openInMaps')} 🗺️</button>}
                                                {activity.bookingLink && <a href={activity.bookingLink} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1" style={{backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-glass-border)'}}>Booking Info 🔗</a>}
                                            </div>
                                        </div>
                                    </div>
                                 </div>
                            )})}
                            </div>
                        </div>
                    )
                })}
              </div>
              
              {renderSection('tripPlannerModal.usefulPhrases', tripPlan.usefulPhrases && (
                <ul className="list-none space-y-2">
                  {tripPlan.usefulPhrases.map((phrase, idx) => (
                    <li key={idx} className="text-xs p-2 rounded-md" style={{backgroundColor: 'var(--color-input-bg)'}}>
                      <p className="font-semibold" style={{color: 'var(--color-text-primary)'}}>{phrase.phrase}</p>
                      <p style={{color: 'var(--color-text-secondary)'}}>{phrase.translation}</p>
                    </li>
                  ))}
                </ul>
              ), '🗣️')}
              {renderSection('tripPlannerModal.culturalEtiquette', tripPlan.culturalEtiquette && <ul className="list-none space-y-1.5 pl-4">{tripPlan.culturalEtiquette.map((item, idx) => <li key={idx} className="text-xs flex items-start"><span className="mr-2 mt-1" style={{color: 'var(--color-primary)'}}>✓</span><span style={{ opacity: 0.9 }}>{item}</span></li>)}</ul>, '🤝')}
              {renderSection('tripPlannerModal.sustainabilityTips', tripPlan.sustainabilityTips && <ul className="list-none space-y-1.5 pl-4">{tripPlan.sustainabilityTips.map((item, idx) => <li key={idx} className="text-xs flex items-start"><span className="mr-2 mt-1" style={{color: 'var(--color-primary)'}}>✓</span><span style={{ opacity: 0.9 }}>{item}</span></li>)}</ul>, '🌱')}
             
              {tripPlan.conclusion && <p className="mt-4 pt-3 border-t text-sm" style={{borderColor: `var(--color-glass-border)`, color: 'var(--color-text-primary)'}}>{tripPlan.conclusion}</p>}
            </div>
          )}
           {!isLoading && !error && !tripPlan && (
             <div className="text-center py-8">
                <p className="text-md" style={{color: 'var(--color-text-secondary)'}}>Please fill in the destination and duration to generate your AI trip plan.</p>
             </div>
           )}
        </div>

        <div className="p-3 border-t flex flex-col sm:flex-row justify-end gap-2.5 items-center no-print" style={{ backgroundColor: `var(--color-input-bg)80`, borderColor: `var(--color-glass-border)` }}>
          {tripPlan && (
            <>
              <button onClick={handleReadAloud} className={`${commonButtonStyles} w-full sm:w-auto`} style={{backgroundImage: `linear-gradient(135deg, ${Colors.accentInfo}, ${Colors.primary})`, color: 'white'}}>
                 {isReading ? t('tripPlannerModal.stopReading') : t('tripPlannerModal.readAloud')}
              </button>
               <button onClick={handleExportToPDF} className={`${commonButtonStyles} w-full sm:w-auto`} style={{backgroundImage: `linear-gradient(135deg, ${Colors.accentSuccess}, ${Colors.secondary})`, color: 'white'}}>
                 {t('tripPlannerModal.exportToPDF')}
              </button>
              <button onClick={handleShareViaWhatsApp} className={`${commonButtonStyles} w-full sm:w-auto`} style={{backgroundImage: `linear-gradient(135deg, #25D366, #128C7E)`, color: 'white'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.267.651 4.383 1.803 6.182l-.341 1.236 1.241-.328z"/></svg>
                {t('tripPlannerModal.shareViaWhatsApp')}
              </button>
              {onShareToCommunity && (
                  <button onClick={handleSharePlanToCommunity} className={`${commonButtonStyles} w-full sm:w-auto`} style={{backgroundImage: `linear-gradient(135deg, ${Colors.accentInfo}, ${Colors.primary})`, color: 'white'}}>
                    {t('communityTab.shareTripPlanButton')}
                  </button>
              )}
              {onSaveTripPlan && (
                 <button onClick={handleSavePlan} disabled={isPlanSavedInThisSession || !isPlanSavable} className={`${commonButtonStyles} w-full sm:w-auto disabled:opacity-70`} style={{backgroundImage: `linear-gradient(135deg, ${Colors.accentSuccess}, ${Colors.secondary})`, color: 'white'}}>
                   {!isPlanSavable && <LockIcon className="w-4 h-4" color="white" />}
                   {isPlanSavedInThisSession ? "Plan Saved ✔" : "Save Trip Plan"}
                 </button>
              )}
            </>
          )}
          <button onClick={handleCloseWithAnimation} className={`${commonButtonStyles} w-full sm:w-auto`} style={{backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: `1px solid var(--color-glass-border)`}}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};