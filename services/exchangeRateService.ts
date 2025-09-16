
import { ExchangeRatesResponse } from '../types.ts';

const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/'; // Base URL, will append base currency

export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<ExchangeRatesResponse> => {
  try {
    const response = await fetch(`${EXCHANGE_RATE_API_URL}${baseCurrency}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("ExchangeRate API error response:", errorData);
      throw new Error(`Failed to fetch exchange rates: ${response.status} ${response.statusText}. ${errorData?.['error-type'] || ''}`);
    }
    const data: ExchangeRatesResponse = await response.json();
    if (data.result !== 'success') {
      console.error("ExchangeRate API non-success result:", data);
      throw new Error(`ExchangeRate API returned non-success result: ${data.result}`);
    }
    return data;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    if (error instanceof Error) {
      throw new Error(`Network or parsing error fetching exchange rates: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching exchange rates.");
  }
};
