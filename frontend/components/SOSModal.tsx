
import React, { useEffect, useCallback, useState } from 'react';
import { EmergencyContact, HospitalInfo, SuggestedEmergencyNumbers, EmbassyInfo } from '../types.ts';
import { Colors } from '../constants.ts';
import { useToast } from '../contexts/ToastContext.tsx';
import { suggestLocalEmergencyNumbers, fetchNearbyEmbassies } from '../services/geminiService.ts'; 
import { useLanguage } from '../contexts/LanguageContext.tsx';


interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { latitude: number; longitude: number } | null;
  isFetchingUserLocation: boolean;
  userLocationError: string | null;
  emergencyContacts: EmergencyContact[];
  onFetchNearbyHospitals: () => Promise<void>;
  nearbyHospitals: HospitalInfo[];
  isLoadingHospitals: boolean;
  hospitalsError: string | null;
  onCheckInSafe: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  isFetchingUserLocation,
  userLocationError,
  emergencyContacts,
  onFetchNearbyHospitals,
  nearbyHospitals,
  isLoadingHospitals,
  hospitalsError,
  onCheckInSafe,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const { addToast } = useToast();
  const { t } = useLanguage();

  const [suggestedNumbers, setSuggestedNumbers] = useState<SuggestedEmergencyNumbers | null>(null);
  const [isLoadingSuggestedNumbers, setIsLoadingSuggestedNumbers] = useState<boolean>(false);
  const [suggestedNumbersError, setSuggestedNumbersError] = useState<string | null>(null);

  const [userNationality, setUserNationality] = useState<string>('');
  const [nearbyEmbassies, setNearbyEmbassies] = useState<EmbassyInfo[]>([]);
  const [isLoadingEmbassies, setIsLoadingEmbassies] = useState<boolean>(false);
  const [embassiesError, setEmbassiesError] = useState<string | null>(null);


  useEffect(() => {
    if (isOpen) {
        setIsVisible(true);
        // Reset state when modal opens
        setSuggestedNumbers(null);
        setSuggestedNumbersError(null);
        setNearbyEmbassies([]);
        setEmbassiesError(null);
        // setUserNationality(''); // Optionally reset nationality input
    }
  }, [isOpen]);

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCloseWithAnimation();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleCloseWithAnimation]);

  const handleCopyLocation = async () => {
    if (userLocation) {
      const locationLink = `https://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}`;
      try {
        await navigator.clipboard.writeText(locationLink);
        addToast({ message: t('sosModal.locationCopied'), type: 'success' });
      } catch (err) {
        addToast({ message: t('sosModal.failedToCopyLocation'), type: 'error' });
        console.error('Failed to copy location: ', err);
      }
    } else {
      addToast({ message: t('sosModal.locationNotAvailable'), type: 'warning' });
    }
  };
  
  const handleGetHospitalDirections = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    addToast({message: t('sosModal.openingHospitalDirections'), type: "info"});
  };

  const handleSuggestEmergencyNumbers = async () => {
    if (!userLocation) {
      addToast({ message: t('sosModal.locationNotAvailable'), type: 'warning' });
      return;
    }
    setIsLoadingSuggestedNumbers(true);
    setSuggestedNumbersError(null);
    setSuggestedNumbers(null);
    addToast({ message: t('sosModal.fetchingEmergencyNumbers'), type: 'info'});
    try {
      const numbers = await suggestLocalEmergencyNumbers(userLocation.latitude, userLocation.longitude);
      setSuggestedNumbers(numbers);
      addToast({ message: t('sosModal.emergencyNumbersFetched'), type: 'success'});
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('sosModal.emergencyNumbersErrorUnknown');
      setSuggestedNumbersError(msg);
      addToast({ message: t('sosModal.emergencyNumbersError', {error: msg}), type: 'error'});
    } finally {
      setIsLoadingSuggestedNumbers(false);
    }
  };

  const handleFetchNearbyEmbassies = async () => {
    if (!userLocation) {
      addToast({ message: t('sosModal.locationNotAvailable'), type: 'warning' });
      return;
    }
    if (!userNationality.trim()) {
      addToast({ message: t('sosModal.nationalityRequired'), type: 'warning' });
      return;
    }
    setIsLoadingEmbassies(true);
    setEmbassiesError(null);
    setNearbyEmbassies([]);
    addToast({ message: t('sosModal.fetchingEmbassies'), type: 'info'});
    try {
      const embassies = await fetchNearbyEmbassies(userLocation.latitude, userLocation.longitude, userNationality);
      setNearbyEmbassies(embassies);
       if (embassies.length === 0) {
        addToast({ message: t('sosModal.noEmbassiesFound'), type: 'info'});
      } else {
        addToast({ message: t('sosModal.embassiesFound', {count: embassies.length.toString()}), type: 'success'});
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('sosModal.embassiesErrorUnknown');
      setEmbassiesError(msg);
      addToast({ message: t('sosModal.embassiesError', {error: msg}), type: 'error'});
    } finally {
      setIsLoadingEmbassies(false);
    }
  };

  const commonButtonStyles: React.CSSProperties = {
    padding: '0.625rem 1rem', 
    borderRadius: '0.5rem', 
    fontWeight: '600',
    transition: 'all 0.2s ease-in-out',
    boxShadow: Colors.boxShadowSoft,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  };
  
  const sosActionButtonStyle: React.CSSProperties = {
    ...commonButtonStyles,
    backgroundColor: Colors.accentError, 
    color: 'white',
    fontSize: '0.875rem', 
  };
  
  const infoSectionStyle: React.CSSProperties = {
    backgroundColor: Colors.inputBackground,
    borderRadius: '0.75rem', 
    padding: '1rem', 
    boxShadow: Colors.boxShadowSoft,
    marginBottom: '1rem', 
    border: `1px solid ${Colors.cardBorder}`
  };
  
  const inputStyle: React.CSSProperties = {
    color: Colors.text,
    backgroundColor: Colors.cardBackground,
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '0.5rem', 
    padding: '0.5rem 0.75rem', 
    width: '100%',
    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    fontSize: '0.875rem', 
  };


  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out
                  ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}                  
      onClick={handleCloseWithAnimation}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-modal-title"
    >
      <div
        className={`rounded-xl shadow-xl overflow-hidden w-full sm:max-w-lg max-h-[90vh] flex flex-col relative
                    transform transition-all duration-300 ease-out
                    ${isVisible && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{
          backgroundColor: Colors.cardBackground,
          boxShadow: Colors.boxShadow,
          border: `2px solid ${Colors.accentError}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b" style={{borderColor: `${Colors.accentError}50`, backgroundColor: `${Colors.accentError}1A`}}>
          <h2 id="sos-modal-title" className="text-lg sm:text-xl font-bold flex items-center" style={{ color: Colors.accentError }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {t('sosModal.title')}
          </h2>
          <button
            onClick={handleCloseWithAnimation}
            className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 ring-gray-400"
            aria-label="Close SOS modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto text-sm space-y-4">
          <div style={infoSectionStyle}>
              <h3 className="font-semibold mb-1.5" style={{color: Colors.text}}>{t('sosModal.emergencyCallInfo')}</h3>
              <p style={{color: Colors.text_secondary}}>{t('sosModal.dialLocalEmergency')}</p>
          </div>

          <div style={{...infoSectionStyle, backgroundColor: `${Colors.accentSuccess}1A`, borderColor: `${Colors.accentSuccess}50` }}>
            <h3 className="font-semibold mb-1.5" style={{color: Colors.accentSuccess}}>{t('userProfile.statusActive')} Check-In</h3>
            <p style={{color: Colors.text_secondary}} className="mb-2">Not in an emergency? Let your contacts know you're okay.</p>
            <button
                onClick={onCheckInSafe}
                disabled={emergencyContacts.length === 0}
                style={{
                    ...commonButtonStyles,
                    backgroundColor: Colors.accentSuccess,
                    color: 'white',
                }}
                className="disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t('sosModal.imSafeButton')}
            </button>
            {emergencyContacts.length === 0 && (
                <p className="text-xs mt-1" style={{color: Colors.text_secondary}}>Add emergency contacts in Account Settings to use this feature.</p>
            )}
          </div>

          <div style={infoSectionStyle}>
            <h3 className="font-semibold mb-1.5" style={{color: Colors.text}}>{t('sosModal.shareYourLocation')}</h3>
            {isFetchingUserLocation && <p style={{color: Colors.text_secondary}}>{t('sosModal.gettingLocation')}</p>}
            {userLocationError && <p style={{color: Colors.accentError}}>{userLocationError}</p>}
            {userLocation && !userLocationError && (
              <p style={{color: Colors.text_secondary}}>Lat: {userLocation.latitude.toFixed(5)}, Lon: {userLocation.longitude.toFixed(5)}</p>
            )}
            <button onClick={handleCopyLocation} disabled={!userLocation || isFetchingUserLocation} style={{...sosActionButtonStyle, backgroundColor: Colors.secondary, marginTop: '0.5rem'}} className="disabled:opacity-60">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                {t('sosModal.copyLocationLink')}
            </button>
          </div>
          
          <div style={infoSectionStyle}>
            <h3 className="font-semibold mb-1.5" style={{color: Colors.text}}>{t('sosModal.suggestedLocalEmergencyNumbers')}</h3>
            <button onClick={handleSuggestEmergencyNumbers} disabled={isLoadingSuggestedNumbers || !userLocation} style={{...sosActionButtonStyle, backgroundColor: Colors.highlight}} className="disabled:opacity-60 mb-2">
              {isLoadingSuggestedNumbers ? t('sosModal.fetchingButton') : t('sosModal.fetchNumbersButton')}
            </button>
            {suggestedNumbersError && <p style={{color: Colors.accentError}}>{suggestedNumbersError}</p>}
            {suggestedNumbers && (
              <div className="space-y-1 text-xs" style={{color: Colors.text_secondary}}>
                {suggestedNumbers.general && <p><strong>{t('sosModal.generalNumberLabel')}:</strong> {suggestedNumbers.general}</p>}
                {suggestedNumbers.police && <p><strong>{t('sosModal.policeNumberLabel')}:</strong> {suggestedNumbers.police}</p>}
                {suggestedNumbers.ambulance && <p><strong>{t('sosModal.ambulanceNumberLabel')}:</strong> {suggestedNumbers.ambulance}</p>}
                {suggestedNumbers.fire && <p><strong>{t('sosModal.fireNumberLabel')}:</strong> {suggestedNumbers.fire}</p>}
                {suggestedNumbers.notes && <p className="italic mt-1">{suggestedNumbers.notes}</p>}
                <p className="font-bold mt-1.5 text-red-600">{suggestedNumbers.disclaimer}</p>
              </div>
            )}
          </div>


          <div style={infoSectionStyle}>
            <h3 className="font-semibold mb-1.5" style={{color: Colors.text}}>{t('sosModal.findNearbyHospitals')}</h3>
            <button onClick={onFetchNearbyHospitals} disabled={isLoadingHospitals || !userLocation} style={{...sosActionButtonStyle, backgroundColor: Colors.primary}} className="disabled:opacity-60">
                {isLoadingHospitals ? t('sosModal.searchingForHospitals') : t('sosModal.searchForHospitals')}
            </button>
            {hospitalsError && <p className="mt-1.5" style={{color: Colors.accentError}}>{hospitalsError}</p>}
            {!isLoadingHospitals && !hospitalsError && nearbyHospitals.length === 0 && (
                <p className="text-xs mt-1.5" style={{color: Colors.text_secondary}}>{t('sosModal.clickSearchForHospitals')}</p>
            )}
            {nearbyHospitals.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {nearbyHospitals.map((hospital, index) => (
                  <li key={index} className="p-2 rounded-md" style={{backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}`}}>
                    <p className="font-semibold text-xs" style={{color: Colors.text}}>{hospital.name}</p>
                    <p className="text-xs" style={{color: Colors.text_secondary}}>{hospital.address}</p>
                    <button 
                      onClick={() => handleGetHospitalDirections(hospital.address)} 
                      className="text-xs mt-1 font-semibold hover:underline"
                      style={{color: Colors.secondary}}
                    >
                      Get Directions
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div style={infoSectionStyle}>
            <h3 className="font-semibold mb-1.5" style={{color: Colors.text}}>{t('sosModal.findNearbyEmbassies')}</h3>
            <div className="mb-2">
                <label htmlFor="nationality" className="block text-xs font-medium mb-0.5" style={{color: Colors.text_secondary}}>{t('sosModal.nationalityInputLabel')}</label>
                <input
                    type="text"
                    id="nationality"
                    value={userNationality}
                    onChange={(e) => setUserNationality(e.target.value)}
                    placeholder={t('sosModal.nationalityInputPlaceholder')}
                    style={inputStyle}
                    className={`focus:ring-1 focus:ring-[${Colors.primary}]`}
                />
            </div>
            <button onClick={handleFetchNearbyEmbassies} disabled={isLoadingEmbassies || !userLocation || !userNationality.trim()} style={{...sosActionButtonStyle, backgroundColor: Colors.accentInfo}} className="disabled:opacity-60">
              {isLoadingEmbassies ? t('sosModal.fetchingButton') : t('sosModal.findEmbassiesButton')}
            </button>
            {embassiesError && <p className="mt-1.5" style={{color: Colors.accentError}}>{embassiesError}</p>}
            {!isLoadingEmbassies && !embassiesError && nearbyHospitals.length === 0 && userNationality.trim() && (
                <p className="text-xs mt-1.5" style={{color: Colors.text_secondary}}>{t('sosModal.noEmbassiesFound')}</p>
            )}
            {!isLoadingEmbassies && !embassiesError && nearbyHospitals.length === 0 && !userNationality.trim() && (
                <p className="text-xs mt-1.5" style={{color: Colors.text_secondary}}>{t('sosModal.enterNationalityPrompt')}</p>
            )}
            {nearbyEmbassies.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {nearbyEmbassies.map((embassy) => (
                  <li key={embassy.id} className="p-2 rounded-md" style={{backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}`}}>
                    <p className="font-semibold text-xs" style={{color: Colors.text}}>{embassy.name}</p>
                    <p className="text-xs" style={{color: Colors.text_secondary}}><strong>{t('sosModal.embassyAddressLabel')}:</strong> {embassy.address}</p>
                    {embassy.phone && <p className="text-xs" style={{color: Colors.text_secondary}}><strong>{t('sosModal.embassyPhoneLabel')}:</strong> {embassy.phone}</p>}
                    {embassy.website && <p className="text-xs" style={{color: Colors.text_secondary}}><strong>{t('sosModal.embassyWebsiteLabel')}:</strong> <a href={embassy.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{color:Colors.accentInfo}}>{embassy.website}</a></p>}
                    {embassy.notes && <p className="text-xs italic mt-1" style={{color: Colors.text_secondary}}>{embassy.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>


          {emergencyContacts.length > 0 && (
            <div style={infoSectionStyle}>
              <h3 className="font-semibold mb-1.5" style={{color: Colors.text}}>{t('sosModal.myEmergencyContacts')}</h3>
              <ul className="space-y-1">
                {emergencyContacts.map(contact => (
                  <li key={contact.id} className="flex justify-between items-center p-1.5 rounded-md" style={{backgroundColor: Colors.inputBackground}}>
                    <span style={{color: Colors.text_secondary}}>{contact.name}: {contact.phone}</span>
                    <a href={`tel:${contact.phone}`} style={{...commonButtonStyles, width: 'auto', backgroundColor: Colors.accentError, color: 'white', padding: '0.375rem 0.75rem', fontSize: '0.8125rem'}} className="ml-2">Call</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {emergencyContacts.length === 0 && (
             <p className="text-xs text-center" style={{color: Colors.text_secondary}}>{t('sosModal.noEmergencyContacts')}</p>
          )}
        </div>

        <div className="p-3 border-t flex justify-end" style={{ backgroundColor: Colors.inputBackground, borderColor: `${Colors.accentError}50` }}>
          <button
            onClick={handleCloseWithAnimation}
            style={{...commonButtonStyles, width: 'auto', backgroundColor: Colors.cardBackground, color: Colors.text_secondary, border: `1px solid ${Colors.cardBorder}`}}
            aria-label="Close SOS modal"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Removed: export default SOSModal; // Ensuring named export
