import { fetch } from '@tauri-apps/plugin-http';

interface ExchangeRates {
  base: string;
  rates: { [currency: string]: number };
  timestamp: number;
}

const RATES_STORAGE_KEY = 'fortuna_exchange_rates';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function loadRatesFromStorage(): ExchangeRates | null {
  try {
    const stored = localStorage.getItem(RATES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ExchangeRates;
      if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveRatesToStorage(rates: ExchangeRates): void {
  try {
    localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(rates));
  } catch {
    // Ignore storage errors
  }
}

let cachedRates: ExchangeRates | null = loadRatesFromStorage();

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'HKD', 'SGD', 'AED', 'BTC'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_INFO: Record<SupportedCurrency, { flag: string; name: string }> = {
  USD: { flag: '🇺🇸', name: 'US Dollar' },
  EUR: { flag: '🇪🇺', name: 'Euro' },
  GBP: { flag: '🇬🇧', name: 'British Pound' },
  JPY: { flag: '🇯🇵', name: 'Japanese Yen' },
  CHF: { flag: '🇨🇭', name: 'Swiss Franc' },
  HKD: { flag: '🇭🇰', name: 'Hong Kong Dollar' },
  SGD: { flag: '🇸🇬', name: 'Singapore Dollar' },
  AED: { flag: '🇦🇪', name: 'UAE Dirham' },
  BTC: { flag: '₿', name: 'Bitcoin' },
};

export async function getExchangeRates(): Promise<ExchangeRates> {
  if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_TTL) {
    return cachedRates;
  }

  try {
    // Fetch USD-based rates from exchangerate-api (free tier)
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD'
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();

    // Get BTC price to add BTC as a currency option
    const btcResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    );

    let btcRate = 0;
    if (btcResponse.ok) {
      const btcData = await btcResponse.json();
      const btcPriceInUsd = btcData.bitcoin?.usd || 0;
      if (btcPriceInUsd > 0) {
        btcRate = 1 / btcPriceInUsd; // How many BTC per 1 USD
      }
    }

    cachedRates = {
      base: 'USD',
      rates: {
        USD: 1,
        EUR: data.rates.EUR || 0.92,
        GBP: data.rates.GBP || 0.79,
        JPY: data.rates.JPY || 149.50,
        CHF: data.rates.CHF || 0.88,
        HKD: data.rates.HKD || 7.82,
        SGD: data.rates.SGD || 1.34,
        AED: data.rates.AED || 3.67,
        BTC: btcRate,
      },
      timestamp: Date.now(),
    };
    saveRatesToStorage(cachedRates);

    return cachedRates;
  } catch {
    // Return fallback rates
    return {
      base: 'USD',
      rates: {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        CHF: 0.88,
        HKD: 7.82,
        SGD: 1.34,
        AED: 3.67,
        BTC: 0.000024,
      },
      timestamp: Date.now(),
    };
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  const rates = await getExchangeRates();

  // Convert to USD first, then to target currency
  let amountInUsd = amount;
  if (fromCurrency !== 'USD') {
    const fromRate = rates.rates[fromCurrency];
    if (fromRate && fromRate > 0) {
      amountInUsd = amount / fromRate;
    }
  }

  const toRate = rates.rates[toCurrency];
  if (toRate && toRate > 0) {
    return amountInUsd * toRate;
  }

  return amountInUsd;
}

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency
): string {
  if (currency === 'BTC') {
    return `₿${amount.toFixed(8)}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export async function forceRefreshExchangeRates(): Promise<ExchangeRates> {
  cachedRates = null;
  return getExchangeRates();
}
