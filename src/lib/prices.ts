import YahooFinance from 'yahoo-finance2';
import { getCryptoBySymbol } from '@/lib/cryptocurrencies';

interface PriceCache {
  [symbol: string]: {
    price: number;
    currency: string;
    timestamp: number;
  };
}

const cache: PriceCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Create a single instance to reuse
const yahooFinance = new YahooFinance();

export interface PriceResult {
  symbol: string;
  price: number;
  currency: string;
  error?: string;
}

export async function getStockPrice(symbol: string): Promise<PriceResult> {
  const cacheKey = `stock:${symbol.toUpperCase()}`;
  const cached = cache[cacheKey];

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      symbol,
      price: cached.price,
      currency: cached.currency,
    };
  }

  try {
    const quote = await yahooFinance.quote(symbol);
    if (!quote || !quote.regularMarketPrice) {
      return { symbol, price: 0, currency: 'USD', error: 'Quote not found' };
    }

    const result = {
      symbol,
      price: quote.regularMarketPrice,
      currency: quote.currency || 'USD',
    };

    cache[cacheKey] = {
      price: result.price,
      currency: result.currency,
      timestamp: Date.now(),
    };

    return result;
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    return { symbol, price: 0, currency: 'USD', error: 'Failed to fetch price' };
  }
}

export async function getCryptoPrice(symbol: string): Promise<PriceResult> {
  const crypto = getCryptoBySymbol(symbol);
  const coinId = crypto?.id || symbol.toLowerCase();

  const cacheKey = `crypto:${symbol.toUpperCase()}`;
  const cached = cache[cacheKey];

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      symbol,
      price: cached.price,
      currency: cached.currency,
    };
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data[coinId.toLowerCase()]?.usd;

    if (price === undefined) {
      return { symbol, price: 0, currency: 'USD', error: 'Coin not found' };
    }

    const result = {
      symbol,
      price,
      currency: 'USD',
    };

    cache[cacheKey] = {
      price: result.price,
      currency: result.currency,
      timestamp: Date.now(),
    };

    return result;
  } catch (error) {
    console.error(`Error fetching crypto price for ${symbol}:`, error);
    return { symbol, price: 0, currency: 'USD', error: 'Failed to fetch price' };
  }
}

export async function getMultiplePrices(
  symbols: { symbol: string; type: 'stock' | 'crypto' }[]
): Promise<PriceResult[]> {
  const promises = symbols.map(({ symbol, type }) =>
    type === 'stock' ? getStockPrice(symbol) : getCryptoPrice(symbol)
  );
  return Promise.all(promises);
}
