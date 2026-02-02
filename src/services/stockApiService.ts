/**
 * Stock API Service
 * Integrates with real-time stock market data APIs
 * 
 * Supported APIs:
 * - Finnhub (Primary) - https://finnhub.io/
 * - Alpha Vantage (Alternative) - https://www.alphavantage.co/
 */

import axios from 'axios';

// API Configuration
const FINNHUB_API_KEY = process.env.REACT_APP_FINNHUB_API_KEY || '';
const ALPHA_VANTAGE_API_KEY = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY || '';
const USE_LIVE_DATA = process.env.REACT_APP_USE_LIVE_DATA === 'true';

// Stock symbol mapping (local names to real symbols)
const SYMBOL_MAP: { [key: string]: string } = {
  'Swiss Life AG': 'SLHN.SW',
  'Spotify': 'SPOT',
  'SolarCity': 'TSLA', // SolarCity was acquired by Tesla
  'UBS AG': 'UBS',
  'SHELL': 'SHEL',
  'Card Services AG': 'V', // Visa as alternative
  'Apple': 'AAPL',
  'Samsung': '005930.KS',
  'Nestlé': 'NESN.SW',
  'Microsoft': 'MSFT',
  'Amazon': 'AMZN',
  'Google': 'GOOGL',
  'Facebook': 'META',
  'Tesla': 'TSLA',
  'Netflix': 'NFLX',
};

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

/**
 * Fetch real-time stock quote from Finnhub
 */
export async function fetchStockQuoteFinnhub(symbol: string): Promise<number | null> {
  if (!FINNHUB_API_KEY) {
    console.warn('Finnhub API key not configured');
    return null;
  }

  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (response.data && response.data.c) {
      return response.data.c; // Current price
    }
    return null;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch real-time stock quote from Alpha Vantage
 */
export async function fetchStockQuoteAlphaVantage(symbol: string): Promise<number | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn('Alpha Vantage API key not configured');
    return null;
  }

  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (response.data && response.data['Global Quote']) {
      const price = parseFloat(response.data['Global Quote']['05. price']);
      return isNaN(price) ? null : price;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get real stock symbol from local name
 */
export function getSymbolFromName(name: string): string | null {
  return SYMBOL_MAP[name] || null;
}

/**
 * Fetch live price for a stock by name
 */
export async function fetchLiveStockPrice(stockName: string): Promise<number | null> {
  if (!USE_LIVE_DATA) {
    return null; // Use simulated data
  }

  const symbol = getSymbolFromName(stockName);
  if (!symbol) {
    console.warn(`No symbol mapping found for: ${stockName}`);
    return null;
  }

  // Try Finnhub first, fallback to Alpha Vantage
  let price = await fetchStockQuoteFinnhub(symbol);
  
  if (price === null && ALPHA_VANTAGE_API_KEY) {
    price = await fetchStockQuoteAlphaVantage(symbol);
  }

  return price;
}

/**
 * Fetch multiple stock prices in batch
 * Note: Rate limiting applies - use carefully
 */
export async function fetchMultipleStockPrices(
  stockNames: string[]
): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();
  
  if (!USE_LIVE_DATA) {
    return priceMap;
  }

  // Batch fetch with delay to respect rate limits
  for (const name of stockNames) {
    const price = await fetchLiveStockPrice(name);
    if (price !== null) {
      priceMap.set(name, price);
    }
    
    // Small delay to respect rate limits (60 requests/min for Finnhub)
    await new Promise(resolve => setTimeout(resolve, 1100));
  }

  return priceMap;
}

/**
 * Check if live data is enabled and API keys are configured
 */
export function isLiveDataAvailable(): boolean {
  return USE_LIVE_DATA && (!!FINNHUB_API_KEY || !!ALPHA_VANTAGE_API_KEY);
}

/**
 * Get API status information
 */
export function getApiStatus() {
  return {
    liveDataEnabled: USE_LIVE_DATA,
    finnhubConfigured: !!FINNHUB_API_KEY,
    alphaVantageConfigured: !!ALPHA_VANTAGE_API_KEY,
    ready: isLiveDataAvailable(),
  };
}

export default {
  fetchLiveStockPrice,
  fetchMultipleStockPrices,
  isLiveDataAvailable,
  getApiStatus,
  getSymbolFromName,
};
