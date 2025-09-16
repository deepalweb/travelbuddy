<<<<<<< HEAD
import React, { useState } from 'react';
import { ExchangeRates } from '../types';
=======

import React, { useState, useEffect, useCallback } from 'react';
import { ExchangeRates } from '../types.ts';
import { Colors, COMMON_CURRENCIES } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
>>>>>>> 25dfd0e7057dc9918b9fb42f119370715379fda2

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
<<<<<<< HEAD
  baseCurrency: string;
=======
  baseCurrency?: string;
>>>>>>> 25dfd0e7057dc9918b9fb42f119370715379fda2
  exchangeRates: ExchangeRates | null;
}

export const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({
  isOpen,
  onClose,
<<<<<<< HEAD
  baseCurrency,
  exchangeRates
}) => {
  const [amount, setAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<string>(baseCurrency);
  const [toCurrency, setToCurrency] = useState<string>('USD');

  if (!isOpen) return null;

  const convertCurrency = (amount: number, from: string, to: string): number => {
    if (!exchangeRates || from === to) return amount;
    
    // Convert to USD first if needed, then to target currency
    const usdAmount = from === 'USD' ? amount : amount / (exchangeRates[from] || 1);
    return to === 'USD' ? usdAmount : usdAmount * (exchangeRates[to] || 1);
  };

  const currencies = exchangeRates ? ['USD', ...Object.keys(exchangeRates)] : ['USD'];
  const numAmount = parseFloat(amount) || 0;
  const convertedAmount = convertCurrency(numAmount, fromCurrency, toCurrency);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Currency Converter</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter amount"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <div className="text-center">
              <div className="text-lg font-semibold">
                {numAmount.toFixed(2)} {fromCurrency} =
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {convertedAmount.toFixed(2)} {toCurrency}
              </div>
            </div>
          </div>

          {!exchangeRates && (
            <div className="text-sm text-gray-500 text-center">
              Exchange rates not available
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
=======
  baseCurrency = 'USD',
  exchangeRates,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [amount1, setAmount1] = useState<string>('1');
  const [amount2, setAmount2] = useState<string>('');
  const [currency1, setCurrency1] = useState(baseCurrency);
  const [currency2, setCurrency2] = useState('EUR');
  const { t } = useLanguage();

  const calculateConversion = useCallback((amountStr: string, fromRate: number, toRate: number) => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || fromRate === 0) return '';
    const result = (amount / fromRate) * toRate;
    // Format to a reasonable number of decimal places
    return result.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, []);

  useEffect(() => {
    if (isOpen) {
        setCurrency1(baseCurrency);
        if (exchangeRates) {
            const rate1 = exchangeRates[baseCurrency] || 1;
            const rate2 = exchangeRates[currency2] || 1;
            setAmount2(calculateConversion(amount1, rate1, rate2));
        }
    }
  }, [isOpen, baseCurrency, exchangeRates, currency2, amount1, calculateConversion]);

  
  const handleAmount1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount1(value);
    if (exchangeRates) {
      const rate1 = exchangeRates[currency1] || 1;
      const rate2 = exchangeRates[currency2] || 1;
      setAmount2(calculateConversion(value, rate1, rate2));
    }
  };

  const handleAmount2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount2(value);
    if (exchangeRates) {
        const rate1 = exchangeRates[currency1] || 1;
        const rate2 = exchangeRates[currency2] || 1;
        setAmount1(calculateConversion(value, rate2, rate1));
    }
  };

  const handleCurrency1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    setCurrency1(newCurrency);
    if (exchangeRates) {
        const rate1 = exchangeRates[newCurrency] || 1;
        const rate2 = exchangeRates[currency2] || 1;
        setAmount2(calculateConversion(amount1, rate1, rate2));
    }
  };
  
  const handleCurrency2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    setCurrency2(newCurrency);
    if (exchangeRates) {
        const rate1 = exchangeRates[currency1] || 1;
        const rate2 = exchangeRates[newCurrency] || 1;
        setAmount2(calculateConversion(amount1, rate1, rate2));
    }
  };

  useEffect(() => {
    if (isOpen) setIsVisible(true);
  }, [isOpen]);

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCloseWithAnimation();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleCloseWithAnimation]);

  if (!isOpen && !isVisible) return null;
  
  const modalStyle = { backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow, border: `1px solid ${Colors.cardBorder}` };
  const inputStyle = { color: Colors.text, backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}`, borderRadius: '0.625rem', padding: '0.75rem 1rem', width: '100%', fontSize: '1rem', };
  const selectStyle = { ...inputStyle, appearance: 'none' as 'none', paddingRight: '2.5rem', backgroundPosition: 'right 0.75rem center', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23333333' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`};

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(30, 41, 58, 0.4)', backdropFilter: 'blur(5px)' }}
      onClick={handleCloseWithAnimation} role="dialog" aria-modal="true" aria-labelledby="currency-converter-title">
      <div className={`rounded-xl shadow-xl overflow-hidden w-full sm:max-w-md flex flex-col relative transform transition-all duration-300 ease-out ${isVisible && isOpen ? 'scale-100' : 'scale-95'}`}
        style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b" style={{borderColor: Colors.cardBorder}}>
          <h2 id="currency-converter-title" className="text-lg font-semibold" style={{color: Colors.text}}>
            {t('homeView.currencyConverter')}
          </h2>
          <button onClick={handleCloseWithAnimation} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2" aria-label={t('close')}>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {!exchangeRates && <p className="text-center" style={{color: Colors.accentError}}>Exchange rates not available. Please try again later.</p>}
          <div className="flex items-end gap-3">
            <div className="flex-grow">
              <label htmlFor="amount1" className="text-xs font-medium" style={{color: Colors.text_secondary}}>From</label>
              <input id="amount1" type="number" value={amount1} onChange={handleAmount1Change} style={inputStyle} disabled={!exchangeRates} />
            </div>
            <select value={currency1} onChange={handleCurrency1Change} style={selectStyle} className="max-w-[100px]" disabled={!exchangeRates}>
              {COMMON_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <div className="flex justify-center my-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: Colors.text_secondary}}><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-grow">
              <label htmlFor="amount2" className="text-xs font-medium" style={{color: Colors.text_secondary}}>To</label>
              <input id="amount2" type="number" value={amount2} onChange={handleAmount2Change} style={inputStyle} disabled={!exchangeRates} />
            </div>
            <select value={currency2} onChange={handleCurrency2Change} style={selectStyle} className="max-w-[100px]" disabled={!exchangeRates}>
              {COMMON_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          {exchangeRates && <p className="text-center text-xs pt-2" style={{color: Colors.text_secondary}}>Based on USD exchange rates. Conversions are approximate.</p>}
>>>>>>> 25dfd0e7057dc9918b9fb42f119370715379fda2
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
};
=======
};
>>>>>>> 25dfd0e7057dc9918b9fb42f119370715379fda2
