import React, { useState } from 'react';
import { ExchangeRates } from '../types';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseCurrency: string;
  exchangeRates: ExchangeRates | null;
}

export const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({
  isOpen,
  onClose,
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
        </div>
      </div>
    </div>
  );
};