

import React from 'react';
import { Deal, ExchangeRates } from '../types.ts';
import { Colors } from '../constants.ts';
import LockIcon from './LockIcon.tsx'; 
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface DealCardProps {
  deal: Deal;
  onSelectPlace: (placeName: string) => void;
  isTripDeal?: boolean;
  homeCurrency?: string;
  exchangeRates?: ExchangeRates | null;
  placePhotoUrl?: string; 
  hasAccessToPremiumDeals: boolean; 
}

const DealCard: React.FC<DealCardProps> = ({ 
  deal, 
  onSelectPlace, 
  isTripDeal, 
  homeCurrency, 
  exchangeRates,
  placePhotoUrl,
  hasAccessToPremiumDeals
}) => {
  const { t } = useLanguage();
  const isPremiumDeal = deal.isPremium;

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

  const originalPriceFormatted = deal.price ? formatPrice(deal.price.amount, deal.price.currencyCode) : null;
  let convertedPriceFormatted: string | null = null;
  if (deal.price && deal.price.currencyCode === 'USD' && homeCurrency && homeCurrency !== 'USD' && exchangeRates) {
      convertedPriceFormatted = convertPrice(deal.price.amount, 'USD', homeCurrency);
  }

  const canViewDealDetails = !isPremiumDeal || (isPremiumDeal && hasAccessToPremiumDeals);

  const cardStyle: React.CSSProperties = {
    backgroundColor: Colors.cardBackground, 
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '0.75rem', 
    boxShadow: Colors.boxShadow,
  };

  return (
    <button
      onClick={() => canViewDealDetails ? onSelectPlace(deal.placeName) : undefined}
      className={`rounded-xl overflow-hidden flex flex-col transition-all duration-200 group animate-fadeInUp w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 relative ${!canViewDealDetails ? 'opacity-70 cursor-default' : 'hover:shadow-lg hover:-translate-y-1'}`} // Ring color changed
      style={cardStyle}
      aria-label={canViewDealDetails ? t('dealsTab.viewDealLabel', {title: deal.title, placeName: deal.placeName}) : t('dealsTab.premiumDealLabel', {title: deal.title})}
      disabled={!canViewDealDetails && isPremiumDeal}
    >
  {isPremiumDeal && (
         <div 
          className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 text-xs font-bold text-white rounded-md shadow-md flex items-center" // Changed premium badge text to white for better contrast with gold/yellow
          style={{ backgroundColor: Colors.gold, boxShadow: `1px 1px 3px rgba(0,0,0,0.2)` }}
        >
          {!hasAccessToPremiumDeals && <LockIcon className="w-3 h-3 mr-1" color="white" />} {/* Lock icon color to white */}
          {t('dealsTab.premiumBadge')}
        </div>
      )}
      {!canViewDealDetails && isPremiumDeal && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl p-4 text-center"> 
            <div>
                <LockIcon className="w-10 h-10 text-white mx-auto mb-2" color="white"/> 
                <p className="text-sm font-semibold text-white">{t('dealsTab.upgradeToViewPremium')}</p> 
            </div>
        </div>
      )}
  {placePhotoUrl && (
        <div className="relative w-full h-32 sm:h-36 overflow-hidden"> 
          <img 
            src={placePhotoUrl} alt={t('dealsTab.dealImageAlt', {placeName: deal.placeName})}
            loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
          />
        </div>
      )}
      {isTripDeal && (
        <div
          className="absolute top-2.5 right-2.5 text-xs font-semibold px-2 py-1 rounded-md text-white z-10" 
          style={{
            backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`, 
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}
        >
          {t('dealsTab.yourTripDealBadge')}
        </div>
      )}
      <div className="p-4 flex flex-col flex-grow">  
        <h3 className="text-lg font-bold mb-1" style={{ color: Colors.primaryGradientEnd }}>{deal.discount}</h3> 
        <h4 className="text-base font-semibold mb-1.5" style={{ color: Colors.text }}>{deal.title}</h4> 
        
        {originalPriceFormatted && (
          <p className="text-sm font-medium mb-1" style={{ color: Colors.text }}> 
            {t('dealsTab.priceLabel')}: {originalPriceFormatted}
            {convertedPriceFormatted && homeCurrency && (
              <span className="text-xs ml-1.5 opacity-80" style={{ color: Colors.text_secondary }}>({t('dealsTab.approxPriceLabel')} {convertedPriceFormatted})</span>
            )}
          </p>
        )}

        <p className="text-sm mb-1" style={{ color: Colors.text_secondary }}> 
          {t('dealsTab.atLabel')}: <span className="font-medium" style={{color: Colors.text}}>{deal.placeName}</span>
        </p>
        <p className="text-xs mb-3 flex-grow" style={{ color: Colors.text_secondary, lineHeight: 1.5 }}> 
          {deal.description}
        </p>
        <div className="mt-auto pt-2.5 border-t flex justify-end" style={{borderColor: Colors.cardBorder}}> 
          <span
            className="text-sm font-medium py-1.5 px-3 rounded-md" 
            style={{
              color: canViewDealDetails ? Colors.text : Colors.text_secondary,
              backgroundColor: canViewDealDetails ? Colors.inputBackground : `${Colors.inputBackground}80`, 
              border: `1px solid ${canViewDealDetails ? Colors.cardBorder : 'transparent'}`
            }}
          >
            {canViewDealDetails ? t('dealsTab.viewDetailsButton') : t('dealsTab.upgradeToViewButton')}
          </span>
        </div>
      </div>
    </button>
  );
};

export default React.memo(DealCard);
