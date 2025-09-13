import React, { useState } from 'react';
import { LocalAgencyPlan } from '../types.ts';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';

interface LocalAgencyPlannerViewProps {
  onGeneratePlan: (location: string, planType: string, interests: string) => void;
  isGenerating: boolean;
  generatedPlan: LocalAgencyPlan | null;
  error: string | null;
  onBack: () => void;
  onReset: () => void;
  userCity: string | null;
}

const LocalAgencyPlannerView: React.FC<LocalAgencyPlannerViewProps> = ({
  onGeneratePlan,
  isGenerating,
  generatedPlan,
  error,
  onBack,
  onReset,
  userCity,
}) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [location, setLocation] = useState(userCity || '');
  const [planType, setPlanType] = useState('Half-Day Discovery Tour');
  const [interests, setInterests] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      addToast({ message: 'Please enter a destination.', type: 'warning' });
      return;
    }
    onGeneratePlan(location, planType, interests);
  };

  const handleViewRouteOnMap = () => {
    if (!generatedPlan || generatedPlan.schedule.length < 2) {
      addToast({ message: t('localAgencyPlanner.noRouteInfo'), type: 'info' });
      return;
    }
    const waypoints = generatedPlan.schedule.map(stop => encodeURIComponent(stop.placeNameForMap || stop.address)).join('/');
    const mapsUrl = `https://www.google.com/maps/dir/${waypoints}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    addToast({ message: t('localAgencyPlanner.openingMapRoute'), type: 'info' });
  };
  
  const planTypeOptions = [
    { value: 'Half-Day Discovery Tour', labelKey: 'localAgencyPlanner.planTypeHalfDay' },
    { value: 'Full-Day Culinary Experience', labelKey: 'localAgencyPlanner.planTypeFullDayCulinary' },
    { value: 'Hidden Gems Walking Tour', labelKey: 'localAgencyPlanner.planTypeHiddenGems' },
    { value: 'Art & Culture Trail', labelKey: 'localAgencyPlanner.planTypeArtAndCulture' },
  ];

  const renderSection = (titleKey: string, content: React.ReactNode, icon: React.ReactNode) => (
    <div className="card-base p-5">
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
        {icon}
        {t(titleKey)}
      </h3>
      <div className="text-sm space-y-3" style={{ color: 'var(--color-text-secondary)' }}>
        {content}
      </div>
    </div>
  );

  return (
    <div className="animate-fadeInUp max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold mb-4 btn btn-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        {t('localAgencyPlanner.backToPlanner')}
      </button>

      {!generatedPlan && !isGenerating && !error && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-2 gradient-text">{t('localAgencyPlanner.mainTitle')}</h1>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>{t('localAgencyPlanner.mainSubtitle')}</p>
          </div>
          <form onSubmit={handleSubmit} className="card-base p-6 space-y-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('localAgencyPlanner.locationLabel')}</label>
              <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder={t('localAgencyPlanner.locationPlaceholder')} className="input-base" required />
            </div>
            <div>
              <label htmlFor="planType" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('localAgencyPlanner.planTypeLabel')}</label>
              <select id="planType" value={planType} onChange={e => setPlanType(e.target.value)} className="input-base">
                {planTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="interests" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('localAgencyPlanner.interestsLabel')}</label>
              <textarea id="interests" value={interests} onChange={e => setInterests(e.target.value)} placeholder={t('localAgencyPlanner.interestsPlaceholder')} className="input-base" rows={3}></textarea>
            </div>
            <button type="submit" className="btn btn-primary w-full py-3" disabled={isGenerating}>
              {t('localAgencyPlanner.generateButton')}
            </button>
          </form>
        </>
      )}

      {isGenerating && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 mx-auto" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'var(--color-primary-dark)' }}></div>
          <p className="mt-4 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{t('localAgencyPlanner.generatingButton')}</p>
        </div>
      )}

      {error && !isGenerating && (
        <div className="text-center py-20 card-base">
            <p className="text-xl font-semibold mb-2" style={{color: 'var(--color-accent-danger)'}}>{t('error')}</p>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('localAgencyPlanner.error')}</p>
            <button onClick={onReset} className="btn btn-primary mt-4">{t('localAgencyPlanner.startOver')}</button>
        </div>
      )}

      {generatedPlan && !isGenerating && !error && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold gradient-text">{generatedPlan.planTitle}</h2>
          </div>
          
          {renderSection('localAgencyPlanner.introduction', <p className="whitespace-pre-wrap">{generatedPlan.introduction}</p>, '🤵')}
          
          {renderSection('localAgencyPlanner.schedule', (
            <div className="space-y-4">
              {generatedPlan.schedule.map((activity, index) => (
                <div key={index} className="p-4 rounded-lg" style={{backgroundColor: 'var(--color-input-bg)'}}>
                  <p className="font-bold text-md" style={{color: 'var(--color-text-primary)'}}>{activity.time} - {activity.title}</p>
                  <p className="mt-1 text-sm">{activity.description}</p>
                  <p className="mt-2 text-xs p-2 rounded" style={{backgroundColor: 'var(--color-glass-bg)', borderLeft: `3px solid var(--color-accent-info)`}}>
                    <strong>Insider Tip:</strong> {activity.insiderTip}
                  </p>
                  <p className="mt-2 text-xs"><strong>Address:</strong> {activity.address}</p>
                </div>
              ))}
            </div>
          ), '🗓️')}
          
          {renderSection('localAgencyPlanner.localEtiquette', <p className="whitespace-pre-wrap">{generatedPlan.localEtiquette}</p>, '🤝')}
          {renderSection('localAgencyPlanner.transportation', <p className="whitespace-pre-wrap">{generatedPlan.transportationAdvice}</p>, '🚌')}
          {renderSection('localAgencyPlanner.conclusion', <p className="whitespace-pre-wrap">{generatedPlan.conclusion}</p>, '🎉')}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleViewRouteOnMap} className="btn btn-primary">
              {t('localAgencyPlanner.viewRouteOnMap')}
            </button>
            <button onClick={onReset} className="btn btn-secondary">
              {t('localAgencyPlanner.startOver')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalAgencyPlannerView;
