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

export interface StockHistoricalData {
  symbol: string;
  name: string;
  prices: Array<{
    date: string;
    price: number;
    volume?: number;
  }>;
}

export interface StockPrediction {
  symbol: string;
  name: string;
  prices: Array<{
    date: string;
    price: number;
    confidence?: number;
  }>;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Fetch historical stock data from Finnhub
 */
export async function fetchStockHistoricalData(
  stockName: string,
  timeRange: '1D' | '1W' | '1M' | '3M' | '1Y' = '1M'
): Promise<StockHistoricalData | null> {
  if (!FINNHUB_API_KEY) {
    console.warn('Finnhub API key not configured');
    return null;
  }

  const symbol = getSymbolFromName(stockName);
  if (!symbol) {
    console.warn(`No symbol mapping found for: ${stockName}`);
    return null;
  }

  try {
    // Calculate time range
    const now = Math.floor(Date.now() / 1000);
    const ranges = {
      '1D': 1 * 24 * 60 * 60,
      '1W': 7 * 24 * 60 * 60,
      '1M': 30 * 24 * 60 * 60,
      '3M': 90 * 24 * 60 * 60,
      '1Y': 365 * 24 * 60 * 60,
    };
    const from = now - ranges[timeRange];

    // Determine resolution (1 = 1min, 5 = 5min, 15 = 15min, 30 = 30min, 60 = 1hour, D = day, W = week, M = month)
    const resolutions: { [key: string]: string } = {
      '1D': '5',
      '1W': '30',
      '1M': 'D',
      '3M': 'D',
      '1Y': 'W',
    };
    const resolution = resolutions[timeRange];

    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}&token=${FINNHUB_API_KEY}`
    );

    if (response.data && response.data.c && response.data.t) {
      const prices = response.data.c.map((price: number, index: number) => ({
        date: new Date(response.data.t[index] * 1000).toISOString(),
        price: price,
        volume: response.data.v?.[index] || 0,
      }));

      return {
        symbol,
        name: stockName,
        prices,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch historical data from Alpha Vantage as fallback
 */
export async function fetchStockHistoricalDataAlphaVantage(
  stockName: string,
  timeRange: '1D' | '1W' | '1M' | '3M' | '1Y' = '1M'
): Promise<StockHistoricalData | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn('Alpha Vantage API key not configured');
    return null;
  }

  const symbol = getSymbolFromName(stockName);
  if (!symbol) {
    console.warn(`No symbol mapping found for: ${stockName}`);
    return null;
  }

  try {
    // Alpha Vantage function based on time range
    const functions: { [key: string]: string } = {
      '1D': 'TIME_SERIES_INTRADAY',
      '1W': 'TIME_SERIES_DAILY',
      '1M': 'TIME_SERIES_DAILY',
      '3M': 'TIME_SERIES_DAILY',
      '1Y': 'TIME_SERIES_WEEKLY',
    };
    const func = functions[timeRange];
    
    let url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    if (func === 'TIME_SERIES_INTRADAY') {
      url += '&interval=5min';
    }

    const response = await axios.get(url);

    if (response.data) {
      let timeSeries: any = null;
      
      // Find the time series data in the response
      const keys = Object.keys(response.data);
      for (const key of keys) {
        if (key.includes('Time Series')) {
          timeSeries = response.data[key];
          break;
        }
      }

      if (timeSeries) {
        const prices = Object.entries(timeSeries).map(([date, data]: [string, any]) => ({
          date: new Date(date).toISOString(),
          price: parseFloat(data['4. close']),
          volume: parseInt(data['5. volume'] || '0'),
        })).reverse(); // Alpha Vantage returns newest first, we want oldest first

        return {
          symbol,
          name: stockName,
          prices,
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching historical data from Alpha Vantage for ${symbol}:`, error);
    return null;
  }
}

/**
 * Generate a simple price prediction based on historical data
 * This is a basic linear regression prediction for demonstration
 * In production, you'd want to use a more sophisticated ML model or prediction API
 */
export async function fetchStockPrediction(
  stockName: string,
  daysAhead: number = 7
): Promise<StockPrediction | null> {
  // First get historical data
  const historical = await fetchStockHistoricalData(stockName, '1M');
  
  if (!historical || historical.prices.length < 7) {
    console.warn('Insufficient historical data for prediction');
    return null;
  }

  try {
    // Simple linear regression for prediction
    const recentPrices = historical.prices.slice(-14); // Use last 14 data points
    const n = recentPrices.length;
    
    // Calculate trend
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    recentPrices.forEach((point, i) => {
      sumX += i;
      sumY += point.price;
      sumXY += i * point.price;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions
    const lastDate = new Date(recentPrices[recentPrices.length - 1].date);
    const predictions = [];
    
    for (let i = 1; i <= daysAhead; i++) {
      const predictedPrice = slope * (n + i) + intercept;
      const futureDate = new Date(lastDate);
      futureDate.setDate(lastDate.getDate() + i);
      
      // Add some randomness to make it more realistic (±2% variation)
      const variance = predictedPrice * 0.02 * (Math.random() - 0.5);
      const finalPrice = Math.max(0, predictedPrice + variance);
      
      predictions.push({
        date: futureDate.toISOString(),
        price: parseFloat(finalPrice.toFixed(2)),
        confidence: Math.max(0.5, 1 - (i / daysAhead) * 0.4) // Confidence decreases over time
      });
    }

    // Determine trend
    const firstPrice = recentPrices[0].price;
    const lastPrice = recentPrices[recentPrices.length - 1].price;
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (change > 2) trend = 'up';
    else if (change < -2) trend = 'down';

    return {
      symbol: historical.symbol,
      name: stockName,
      prices: predictions,
      trend
    };
  } catch (error) {
    console.error('Error generating prediction:', error);
    return null;
  }
}

/**
 * Fetch top gainers and losers (popular stocks)
 */
export async function fetchTopMovers(): Promise<{
  gainers: StockQuote[];
  losers: StockQuote[];
} | null> {
  if (!FINNHUB_API_KEY) {
    console.warn('Finnhub API key not configured');
    return null;
  }

  try {
    // Fetch market movers from Finnhub
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NFLX', 'NVDA', 'V', 'JPM'];
    const quotes: StockQuote[] = [];

    for (const symbol of symbols) {
      const response = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );

      if (response.data && response.data.c) {
        quotes.push({
          symbol,
          name: symbol,
          price: response.data.c,
          change: response.data.d || 0,
          changePercent: response.data.dp || 0,
          timestamp: Date.now()
        });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Sort and return top 5 gainers and losers
    const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
    
    return {
      gainers: sorted.slice(0, 5),
      losers: sorted.slice(-5).reverse()
    };
  } catch (error) {
    console.error('Error fetching top movers:', error);
    return null;
  }
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
  fetchStockHistoricalData,
  fetchStockHistoricalDataAlphaVantage,
  fetchStockPrediction,
  fetchTopMovers,
  isLiveDataAvailable,
  getApiStatus,
  getSymbolFromName,
};

