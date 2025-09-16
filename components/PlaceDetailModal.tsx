import React, { useState, useEffect, useCallback } from 'react';
import { Place, ExchangeRates, UserReview, CurrentUser } from '../types.ts'; 
import { Colors } from '../constants.ts';
import { askQuestionAboutPlace } from '../services/geminiService.ts'; 
import { useToast } from '../contexts/ToastContext.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx'; 
import LockIcon from './LockIcon.tsx';

interface PlaceDetailModalProps {
  place: Place;
  onClose: () => void;
  homeCurrency?: string;
  exchangeRates?: ExchangeRates | null;
  userReviews?: UserReview[]; 
  onAddUserReview: (placeId: string, rating: number, text: string) => void;
  currentUser: CurrentUser | null;
  hasAccessToBasic: boolean;
  hasAccessToPremium: boolean;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ place, onClose, homeCurrency, exchangeRates, userReviews, onAddUserReview, currentUser, hasAccessToBasic, hasAccessToPremium }) => {
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const { addToast } = useToast();
  const { t } = useLanguage(); 

  // Recommendations temporarily disabled

  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [newReviewRating, setNewReviewRating] = useState<number>(0);
  const [newReviewText, setNewReviewText] = useState<string>('');
  const [reviewFormError, setReviewFormError] = useState<string | null>(null);

  // Details and gallery state
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [photoAttributions, setPhotoAttributions] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);


  useEffect(() => {
    setIsVisible(true);
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCloseWithAnimation();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []); 

  useEffect(() => {
    // Load extra details and photos when modal opens
    let abort = new AbortController();
    const run = async () => {
      if (!place.place_id) return;
      setDetailsLoading(true); setDetailsError(null);
      try {
        const url = new URL('/api/places/details', window.location.origin);
        url.searchParams.set('place_id', place.place_id);
        url.searchParams.set('lang', 'en');
        const resp = await fetch(url.toString(), { signal: abort.signal });
        if (!resp.ok) throw new Error(await resp.text());
        const json = await resp.json();
        const refs: string[] = (json.photos || []).map((p: any) => p.photo_reference).filter(Boolean);
        const atts: string[] = (json.photos || []).flatMap((p: any) => Array.isArray(p.html_attributions) ? p.html_attributions : []).filter(Boolean);
        const urls = refs.map(ref => `/api/places/photo?ref=${encodeURIComponent(ref)}&w=800`);
        if (urls.length > 0) {
          setGallery(urls);
          setPhotoAttributions(Array.from(new Set(atts)));
        } else if (place.photoUrl) {
          setGallery([place.photoUrl]);
          setPhotoAttributions([]);
        } else {
          setGallery([]);
          setPhotoAttributions([]);
        }
      } catch (e: any) {
        setDetailsError(e?.message || 'Failed to load details');
        setGallery(place.photoUrl ? [place.photoUrl] : []);
        setPhotoAttributions([]);
      } finally {
        setDetailsLoading(false);
      }
    };
    run();
    return () => abort.abort();
  }, [place.place_id]);

  // Recommendations fetching removed for now

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); 
  }, [onClose]);

  const handleAskQuestion = async () => {
    if (!hasAccessToPremium) {
        addToast({ message: t('subscriptionOverlay.pleaseSubscribeToast', {featureName: t('features.aiPlaceHelpers')}), type: 'warning' });
        return;
    }
    if (!userQuestion.trim()) {
        addToast({message: t('modals.typeYourQuestion'), type: "warning"}); return;
    }
    setIsAsking(true); setAiAnswer(null); setAskError(null);
    addToast({message: t('modals.askingButton'), type: "info", duration: 1500});
    try {
      const answer = await askQuestionAboutPlace(place, userQuestion);
      setAiAnswer(answer);
      addToast({message: t('modals.geminiAnswered'), type: "success"});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('modals.geminiError');
      setAskError(errorMessage);
      addToast({message: `${t('modals.errorPrefix')} ${errorMessage}`, type: "error"});
    } finally {
      setIsAsking(false);
    }
  };

  const handleGetDirections = () => {
    const addressToUse = place.formatted_address || place.address;
    const encodedAddress = encodeURIComponent(addressToUse);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    addToast({message: t('modals.openingGoogleMaps'), type: "info"});
  };
  
  const commonButtonStyles = "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-98 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm";

  const handleSubmitReview = () => {
    setReviewFormError(null);
    if (newReviewRating === 0) {
      setReviewFormError(t('placeDetailModal.ratingRequiredError'));
      addToast({ message: t('placeDetailModal.ratingRequiredError'), type: 'warning' });
      return;
    }
    if (!newReviewText.trim()) {
      setReviewFormError(t('placeDetailModal.reviewTextRequiredError'));
       addToast({ message: t('placeDetailModal.reviewTextRequiredError'), type: 'warning' });
      return;
    }
    onAddUserReview(place.id, newReviewRating, newReviewText);
    setShowReviewForm(false);
    setNewReviewRating(0);
    setNewReviewText('');
  };

  const LockedSection: React.FC<{ tier: 'basic' | 'premium', featureName: string }> = ({ tier, featureName }) => (
    <div className="text-center p-3 my-2 rounded-lg" style={{backgroundColor: `${Colors.primary}1A`, border: `1px dashed ${Colors.primary}50`}}>
        <LockIcon className="w-5 h-5 mx-auto mb-1.5" color={Colors.primary} />
        <p className="text-xs" style={{color: Colors.text_secondary}}>
            {t('subscriptionOverlay.upgradeMessage', { 
                featureName: featureName,
                requiredTierName: t(`subscriptionTiers.${tier}.name`) 
            })}
        </p>
    </div>
  );

  const renderSection = (titleKey: string, content?: React.ReactNode, icon?: React.ReactNode) => {
    if (!content) return null;
    return (
        <div className="mb-4"> 
            <h4 className="text-base font-semibold mb-1.5 flex items-center" style={{color: Colors.primary}}> 
                {icon && <span className="mr-2 h-4 w-4">{icon}</span>} 
                {t(titleKey)}
            </h4>
            {content}
        </div>
    );
  };
  
  const priceLevelToDollars = (level?: number) => {
    if (level === undefined || level < 0 || level > 4) return 'N/A';
    if (level === 0) return 'Free';
    return '$'.repeat(level);
  };

  const formatPrice = (amount: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(amount);
    } catch (e) { return `${amount.toFixed(2)} ${currencyCode}`; }
  };

  const convertPrice = (amount: number, fromCurrency: string, toCurrency: string | undefined): string | null => {
    if (!exchangeRates || !toCurrency || fromCurrency === toCurrency) return null;
    if (fromCurrency === 'USD' && exchangeRates[toCurrency]) {
      const rate = exchangeRates[toCurrency];
      return formatPrice(amount * rate, toCurrency);
    }
    return null; 
  };
  
  const renderPriceDisplay = (
    priceInfo: { amount: number; currencyCode: string; description?: string } | undefined,
    labelKey: string
  ) => {
    if (!priceInfo) return null;
    const originalPriceFormatted = formatPrice(priceInfo.amount, priceInfo.currencyCode);
    let convertedPriceFormatted: string | null = null;
    if (priceInfo.currencyCode === 'USD' && homeCurrency && homeCurrency !== 'USD' && exchangeRates) {
      convertedPriceFormatted = convertPrice(priceInfo.amount, 'USD', homeCurrency);
    }
    const priceDescription = priceInfo.description ? `${priceInfo.description}: ` : '';
    return (
      <p className="text-sm mb-1" style={{ color: Colors.text }}> 
        <strong style={{color:Colors.text}}>{t(labelKey)}:</strong> {priceDescription}{originalPriceFormatted}
        {convertedPriceFormatted && homeCurrency && (
          <span style={{color: Colors.text_secondary}} className="text-xs"> (approx. {convertedPriceFormatted})</span>
        )}
      </p>
    );
  };

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out
                  ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(24,24,27,0.85)' }}      
      onClick={handleCloseWithAnimation}
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
    >
      <div 
        className={`bg-zinc-800 rounded-md overflow-hidden w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col relative
                    transform transition-all duration-300 ease-out
                    ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{ 
          border: '1px solid #27272a',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
            <img src={(gallery[activeIdx] || place.photoUrl || 'https://picsum.photos/600/400?blur=2')} alt={place.name} loading="lazy"
                className="w-full h-48 sm:h-56 object-cover" 
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="absolute bottom-2 left-2 right-2 flex gap-2 overflow-x-auto p-1 bg-black/30 rounded-md">
                {gallery.slice(0,6).map((url, idx) => (
                  <button key={idx} onClick={() => setActiveIdx(idx)} className={`border rounded-sm ${idx===activeIdx?'border-white':'border-transparent'}`} aria-label={`Photo ${idx+1}`}>
                    <img src={url} alt={`Photo ${idx+1}`} className="w-12 h-12 object-cover rounded-sm" />
                  </button>
                ))}
              </div>
            )}
            <button
                onClick={handleCloseWithAnimation}
                className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-100 hover:bg-neutral-500 p-2 rounded-md transition-colors z-10 focus:outline-none focus:ring-2 ring-white bg-zinc-800"
                aria-label={t('close')}
                >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="absolute bottom-0 left-0 p-4 sm:p-5 text-white w-full">
                <h2 id="modal-title" className="text-xl sm:text-2xl font-bold leading-tight" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>{place.name}</h2>
                <p className="text-sm sm:text-base font-medium" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>{place.formatted_address || place.address}</p>
                <div className="flex items-center mt-2 text-sm">
                    <span style={{color: Colors.gold}}>{'★'.repeat(Math.round(place.rating))}</span>
                    <span style={{color: '#E0E0E0'}}>{'★'.repeat(5 - Math.round(place.rating))}</span>
                    <span className="ml-2 font-semibold">({place.rating.toFixed(1)})</span>
                    <span className="ml-1 opacity-90">({t('placeDetailModal.ratingsSuffix', {count: place.user_ratings_total?.toString() || '0'})})</span>
                </div>
                {detailsLoading && <p className="text-xs mt-1 opacity-80">Loading details…</p>}
                {detailsError && <p className="text-xs mt-1 text-red-400">{detailsError}</p>}
            </div>
        </div>

        <div className="overflow-y-auto flex-grow p-4 sm:p-5">
            {photoAttributions.length > 0 && (
              <div className="mb-3 text-[10px] opacity-80" style={{color: Colors.text_secondary}}>
                <span>Photo credits: </span>
                {photoAttributions.map((html, i) => (
                  <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-4">
                {renderSection('placeDetailModal.about', <p className="text-sm" style={{color: Colors.text_secondary, lineHeight: 1.6}}>{place.description}</p>, <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>)}
                
                {hasAccessToBasic ? (
                    <>
                        {renderSection('placeDetailModal.localTip', <p className="text-sm" style={{color: Colors.text_secondary, lineHeight: 1.6}}>{place.localTip}</p>, <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>)}
                        {renderSection('placeDetailModal.handyPhrase', <p className="text-sm" style={{color: Colors.text_secondary, lineHeight: 1.6}}>{`"${place.handyPhrase}"`}</p>, <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z" /></svg>)}
                    </>
                ) : (
                    <LockedSection tier="basic" featureName="insider tips and details" />
                )}

                {hasAccessToBasic && place.opening_hours && renderSection('placeDetailModal.details',
                  <ul className="text-sm list-none space-y-1">
                    <li className="flex items-center"><strong className="w-20 font-semibold">{t('placeDetailModal.status')}:</strong> {place.business_status || t('placeDetailModal.notAvailable')}</li>
                    <li className="flex items-center"><strong className="w-20 font-semibold">{t('placeDetailModal.priceLevel')}:</strong> {priceLevelToDollars(place.price_level)}</li>
                    <li className="flex items-center"><strong className="w-20 font-semibold">{t('placeDetailModal.currently')}:</strong> <span style={{color: place.opening_hours.open_now ? Colors.accentSuccess : Colors.accentError}}>{place.opening_hours.open_now ? t('placeDetailModal.open') : t('placeDetailModal.closed')}</span></li>
                    {place.opening_hours.weekday_text?.map((day, index) => <li key={index} className="flex items-center"><span className="text-xs">{day}</span></li>)}
                  </ul>,
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                )}
                 {hasAccessToBasic && (place.examplePrice || place.deal?.price) && renderSection('placeDetailModal.priceLevel', 
                    <>
                        {renderPriceDisplay(place.examplePrice, 'placeDetailModal.examplePrice')}
                        {renderPriceDisplay(place.deal?.price, 'placeDetailModal.dealPrice')}
                    </>, 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.158-.103.346-.195.574-.277a6.967 6.967 0 011.012-.103c.359.01.72.059 1.076.142.389.09.754.24 1.077.458.322.217.575.49.757.822.182.333.272.711.272 1.121 0 .445-.099.833-.297 1.17a2.15 2.15 0 01-.841.88c-.346.223-.74.39-1.18.494a6.963 6.963 0 01-1.012.103c-.359-.01-.72-.059-1.076-.142a4.474 4.474 0 01-1.077-.458 2.15 2.15 0 01-.757-.822.927.927 0 01-.272-1.121c0-.445.099-.833.297-1.17.22-.387.52-.707.884-.965a4.473 4.473 0 011.18-.494z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0 2a10 10 0 100-20 10 10 0 000 20z" clipRule="evenodd" /></svg>
                )}

                 {renderSection('placeDetailModal.userReviewsTitle', 
                    <div className="space-y-3">
                        {userReviews && userReviews.length > 0 ? userReviews.slice(0, 3).map(review => (
                            <div key={review.id} className="text-xs p-2 rounded-md" style={{backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}`}}>
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold" style={{color:Colors.text}}>{review.username}</p>
                                    <div>
                                        <span style={{color: Colors.accentWarning}}>{'★'.repeat(review.rating)}</span>
                                        <span style={{color: '#E0E0E0'}}>{'★'.repeat(5 - review.rating)}</span>
                                    </div>
                                </div>
                                <p className="mt-1" style={{color: Colors.text_secondary}}>{review.text}</p>
                            </div>
                        )) : (
                            <p className="text-xs italic" style={{color:Colors.text_secondary}}>{t('placeDetailModal.noReviewsYet')}</p>
                        )}

                        {!currentUser ? (
                             <p className="text-xs text-center p-2 rounded-md mt-2" style={{backgroundColor: `${Colors.primary}20`}}>{t('placeDetailModal.loginToReview')}</p>
                        ) : !hasAccessToPremium ? (
                             <p className="text-xs text-center p-2 rounded-md mt-2" style={{backgroundColor: `${Colors.primary}20`}}>{t('placeDetailModal.upgradeToReview')}</p>
                        ) : !showReviewForm ? (
                             <button onClick={() => setShowReviewForm(true)} className={`${commonButtonStyles} w-full mt-2`} style={{backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`, color: 'white'}}>{t('placeDetailModal.writeReviewButton')}</button>
                        ) : (
                            <div className="p-3 mt-2 rounded-lg" style={{backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}`}}>
                                <h5 className="font-semibold text-sm mb-1" style={{color: Colors.text}}>{t('placeDetailModal.yourReviewTitle')}</h5>
                                <div className="mb-2">
                                    <label className="text-xs font-medium" style={{color: Colors.text_secondary}}>{t('placeDetailModal.yourRatingLabel')}</label>
                                    <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} onClick={() => setNewReviewRating(star)} className="text-2xl" style={{color: star <= newReviewRating ? Colors.accentWarning : '#E0E0E0', transition: 'color 0.2s'}}>★</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <label htmlFor="reviewText" className="text-xs font-medium" style={{color: Colors.text_secondary}}>{t('placeDetailModal.yourReviewLabel')}</label>
                                    <textarea id="reviewText" value={newReviewText} onChange={e => setNewReviewText(e.target.value)} rows={3} placeholder={t('placeDetailModal.reviewPlaceholder')} className="w-full text-xs p-2 rounded-md" style={{backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}`}} />
                                </div>
                                {reviewFormError && <p className="text-xs mb-2" style={{color: Colors.accentError}}>{reviewFormError}</p>}
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowReviewForm(false)} className={`${commonButtonStyles} text-xs py-1.5 px-3`} style={{backgroundColor: Colors.inputBackground, color: Colors.text_secondary, border: `1px solid ${Colors.cardBorder}`}}>{t('placeDetailModal.cancelButton')}</button>
                                    <button onClick={handleSubmitReview} className={`${commonButtonStyles} text-xs py-1.5 px-3`} style={{backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`, color: 'white'}}>{t('placeDetailModal.submitReviewButton')}</button>
                                </div>
                            </div>
                        )}

                    </div>,
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                 )}
              </div>
              <div className="space-y-4">
                 {/* AI Question Section */}
                <div className="p-3 rounded-lg" style={{backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}`}}>
                    <h4 className="font-semibold text-sm mb-1" style={{color: Colors.text}}>Ask Gemini about this place!</h4>
                    <textarea 
                        value={userQuestion}
                        onChange={e => setUserQuestion(e.target.value)}
                        placeholder={hasAccessToPremium ? t('placeDetailModal.askGeminiPlaceholder') : t('placeDetailModal.askGeminiPlaceholderLocked')}
                        rows={3}
                        className="w-full text-xs p-2 rounded-md"
                        style={{backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}`}}
                        disabled={!hasAccessToPremium}
                    />
                    <button onClick={handleAskQuestion} disabled={isAsking || !hasAccessToPremium} className={`${commonButtonStyles} w-full mt-1.5 text-xs py-1.5 px-3 disabled:opacity-60 flex items-center justify-center`} style={{backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`, color: 'white'}}>
                        {!hasAccessToPremium && <LockIcon className="w-3.5 h-3.5 mr-1.5" color="white"/>}
                        {isAsking ? t('modals.gettingAnswer') : 'Ask Gemini'}
                    </button>
                    {askError && <p className="text-xs mt-1.5 text-red-500">{askError}</p>}
                    {aiAnswer && (
                        <div className="mt-2 text-xs p-2 rounded-md" style={{backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}`}}>
                            <p className="font-semibold" style={{color: Colors.text}}>{t('modals.geminiSays')}</p>
                            <p style={{color: Colors.text_secondary}}>{aiAnswer}</p>
                        </div>
                    )}
                </div>

                {/* Recommendations removed for now */}
              </div>
            </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t flex justify-end items-center" style={{ backgroundColor: `${Colors.inputBackground}80`, borderColor: Colors.cardBorder}}>
            <button 
                onClick={handleGetDirections}
                className={`${commonButtonStyles} mr-2`}
                style={{backgroundImage: `linear-gradient(135deg, ${Colors.accentSuccess}, ${Colors.secondary})`, color: 'white'}}
            >
                {t('modals.getDirections')}
            </button>
            <button 
                onClick={handleCloseWithAnimation} 
                className={`${commonButtonStyles}`}
                style={{backgroundColor: Colors.cardBackground, color: Colors.text_secondary, border: `1px solid ${Colors.cardBorder}`}}
            >
                {t('close')}
            </button>
        </div>
      </div>
    </div>
  );
};