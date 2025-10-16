
import React, { useState } from 'react';
import { CurrentUser, UserInterest } from '../types.ts';
import { Colors, COMMON_CURRENCIES, SUPPORTED_LANGUAGES, AVAILABLE_USER_INTERESTS, DEFAULT_LANGUAGE } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface WelcomeWizardModalProps {
  user: CurrentUser;
  onComplete: (preferences: { language: string; homeCurrency: string; selectedInterests: UserInterest[] }) => void;
  onClose: () => void;
}

const WelcomeWizardModal: React.FC<WelcomeWizardModalProps> = ({ user, onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState(user.language || DEFAULT_LANGUAGE);
  const [homeCurrency, setHomeCurrency] = useState(user.homeCurrency || 'USD');
  const [selectedInterests, setSelectedInterests] = useState<UserInterest[]>(user.selectedInterests || []);
  const { t, setLanguage: setAppLanguage } = useLanguage();

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    setAppLanguage(langCode); // Update context immediately for live preview
  };

  const handleInterestToggle = (interest: UserInterest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);
  const handleFinish = () => {
    onComplete({ language, homeCurrency, selectedInterests });
  };

  const titles = [
    t('welcomeWizard.step1Title'),
    t('welcomeWizard.step2Title'),
    t('welcomeWizard.step3Title'),
    t('welcomeWizard.step4Title'),
  ];
  
  const bodies = [
    t('welcomeWizard.step1Body'),
    t('welcomeWizard.step2Body'),
    t('welcomeWizard.step3Body'),
    t('welcomeWizard.step4Body'),
  ];

  const inputStyle: React.CSSProperties = {
    color: Colors.text, backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '0.625rem', padding: '0.75rem 1rem', width: '100%', transition: 'all 0.2s', fontSize: '0.875rem',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, appearance: 'none', paddingRight: '2.5rem', backgroundPosition: `right 0.75rem center`,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23${Colors.text.substring(1)}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', color: Colors.text_secondary, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500'
  };

  const primaryButtonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem', borderRadius: '0.625rem', fontWeight: '600', border: 'none', cursor: 'pointer',
    transition: 'all 0.2s ease-in-out', boxShadow: Colors.boxShadowButton, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`, color: 'white',
  };
  
  const secondaryButtonStyle: React.CSSProperties = { ...primaryButtonStyle, backgroundImage: 'none', backgroundColor: 'transparent', color: Colors.primary, border: `1px solid ${Colors.primary}`, boxShadow: 'none' };

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out bg-black/50 backdrop-blur-sm`}
      onClick={onClose}
    >
      <div className={`rounded-xl shadow-2xl overflow-hidden w-full sm:max-w-lg md:max-w-xl flex flex-col relative transform transition-all duration-300 ease-out animate-fadeInUp`}
        style={{ backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.accentInfo})`}}>
                <span className="text-4xl">👋</span>
            </div>
            <h2 id="wizard-title" className="text-2xl font-bold mb-2" style={{color: Colors.text}}>{t('welcomeWizard.title')}</h2>
        </div>
        
        <div className="px-6 py-4 overflow-y-auto min-h-[300px]">
          <h3 className="text-lg font-semibold text-center mb-2" style={{color: Colors.text}}>{titles[step - 1]}</h3>
          <p className="text-sm text-center mb-6" style={{color: Colors.text_secondary}}>{bodies[step - 1]}</p>

          {step === 2 && (
            <div className="space-y-4 animate-fadeInUp">
              <div>
                <label htmlFor="languageSelect" style={labelStyle}>{t('accountSettings.languageLabel')}</label>
                <select id="languageSelect" value={language} onChange={e => handleLanguageChange(e.target.value)} style={selectStyle}>
                  {SUPPORTED_LANGUAGES.map(lang => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="homeCurrencySelect" style={labelStyle}>{t('accountSettings.homeCurrencyLabel')}</label>
                <select id="homeCurrencySelect" value={homeCurrency} onChange={e => setHomeCurrency(e.target.value)} style={selectStyle}>
                  {COMMON_CURRENCIES.map(currency => (<option key={currency.code} value={currency.code}>{currency.name} ({currency.code})</option>))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fadeInUp">
              {AVAILABLE_USER_INTERESTS.map(interest => (
                <button type="button" key={interest} onClick={() => handleInterestToggle(interest)}
                  className="p-3 rounded-lg text-sm font-medium text-center transition-all duration-200"
                  style={{
                    backgroundColor: selectedInterests.includes(interest) ? `${Colors.primary}2A` : Colors.inputBackground,
                    border: `1px solid ${selectedInterests.includes(interest) ? Colors.primary : Colors.cardBorder}`,
                    color: selectedInterests.includes(interest) ? Colors.primaryDark : Colors.text,
                  }}
                >
                  {t(`userInterests.${interest.toLowerCase().replace(/\s&/g, '')}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-5 border-t" style={{borderColor: Colors.cardBorder}}>
            <button onClick={handleBack} style={secondaryButtonStyle} className={`${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}>
                {t('welcomeWizard.backButton')}
            </button>
            <div className="flex items-center gap-2">
                {[1,2,3,4].map(s => <div key={s} className={`w-2 h-2 rounded-full transition-colors ${step >= s ? 'bg-blue-500' : 'bg-gray-300'}`} style={{backgroundColor: step >=s ? Colors.primary : Colors.cardBorder}}></div>)}
            </div>
            {step < 4 ? (
                <button onClick={handleNext} style={primaryButtonStyle}>
                    {t('welcomeWizard.nextButton')}
                </button>
            ) : (
                <button onClick={handleFinish} style={primaryButtonStyle}>
                    {t('welcomeWizard.finishButton')}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeWizardModal;
