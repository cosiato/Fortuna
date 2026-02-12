import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetch } from '@tauri-apps/plugin-http';

const mockFetch = vi.mocked(fetch);
const RATES_STORAGE_KEY = 'fortuna_exchange_rates';

const createMockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
}) as unknown as Response;

describe('currency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getExchangeRates', () => {
    it('should fetch exchange rates from API', async () => {
      const exchangeRateData = {
        rates: {
          EUR: 0.92,
          GBP: 0.79,
          JPY: 149.50,
          CHF: 0.88,
          HKD: 7.82,
          SGD: 1.34,
          AED: 3.67,
          CAD: 1.36,
          BRL: 4.97,
          AUD: 1.53,
          ZAR: 18.60,
          INR: 83.10,
        },
      };

      const btcData = {
        bitcoin: { usd: 42000 },
      };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(exchangeRateData))
        .mockResolvedValueOnce(createMockResponse(btcData));

      const { getExchangeRates } = await import('./currency');
      const rates = await getExchangeRates();

      expect(mockFetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/USD');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      expect(rates.base).toBe('USD');
      expect(rates.rates.EUR).toBe(0.92);
      expect(rates.rates.GBP).toBe(0.79);
      expect(rates.rates.BTC).toBeCloseTo(1 / 42000, 10);
    });

    it('should return cached rates within TTL', async () => {
      const exchangeRateData = { rates: { EUR: 0.92 } };
      const btcData = { bitcoin: { usd: 42000 } };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(exchangeRateData))
        .mockResolvedValueOnce(createMockResponse(btcData));

      const { getExchangeRates } = await import('./currency');

      const firstCall = await getExchangeRates();
      const secondCall = await getExchangeRates();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(firstCall).toEqual(secondCall);
    });

    it('should return fallback rates on API error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { getExchangeRates } = await import('./currency');
      const rates = await getExchangeRates();

      expect(rates.base).toBe('USD');
      expect(rates.rates.USD).toBe(1);
      expect(rates.rates.EUR).toBe(0.92);
      expect(rates.rates.BTC).toBe(0.000024);
    });

    it('should return fallback rates on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, false, 500));

      const { getExchangeRates } = await import('./currency');
      const rates = await getExchangeRates();

      expect(rates.base).toBe('USD');
      expect(rates.rates.USD).toBe(1);
    });

    it('should persist rates to localStorage', async () => {
      const exchangeRateData = { rates: { EUR: 0.92 } };
      const btcData = { bitcoin: { usd: 42000 } };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(exchangeRateData))
        .mockResolvedValueOnce(createMockResponse(btcData));

      const { getExchangeRates } = await import('./currency');
      await getExchangeRates();

      expect(localStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(
        (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1]
      );
      expect(savedData.base).toBe('USD');
    });

    it('should use fallback values for currencies missing from API response', async () => {
      // API returns only EUR, all other fiat should get fallback values
      const exchangeRateData = { rates: { EUR: 0.95 } };
      const btcData = { bitcoin: { usd: 42000 } };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(exchangeRateData))
        .mockResolvedValueOnce(createMockResponse(btcData));

      const { getExchangeRates, FALLBACK_RATES } = await import('./currency');
      const rates = await getExchangeRates();

      expect(rates.rates.EUR).toBe(0.95); // From API
      expect(rates.rates.CAD).toBe(FALLBACK_RATES.CAD); // Fallback
      expect(rates.rates.BRL).toBe(FALLBACK_RATES.BRL); // Fallback
    });
  });

  describe('convertCurrency', () => {
    beforeEach(() => {
      const exchangeRateData = {
        rates: {
          EUR: 0.92,
          GBP: 0.79,
          JPY: 149.50,
        },
      };
      const btcData = { bitcoin: { usd: 50000 } };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(exchangeRateData))
        .mockResolvedValueOnce(createMockResponse(btcData));
    });

    it('should return same amount when currencies match', async () => {
      const { convertCurrency } = await import('./currency');
      const result = await convertCurrency(100, 'USD', 'USD');
      expect(result).toBe(100);
    });

    it('should convert from USD to EUR', async () => {
      const { convertCurrency } = await import('./currency');
      const result = await convertCurrency(100, 'USD', 'EUR');
      expect(result).toBeCloseTo(92, 0);
    });

    it('should convert from EUR to USD', async () => {
      const { convertCurrency } = await import('./currency');
      const result = await convertCurrency(92, 'EUR', 'USD');
      expect(result).toBeCloseTo(100, 0);
    });

    it('should convert between non-USD currencies via USD', async () => {
      const { convertCurrency } = await import('./currency');
      const result = await convertCurrency(100, 'EUR', 'GBP');
      const expectedUsd = 100 / 0.92;
      const expectedGbp = expectedUsd * 0.79;
      expect(result).toBeCloseTo(expectedGbp, 1);
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', async () => {
      const { formatCurrency } = await import('./currency');
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toBe('$1,234.56');
    });

    it('should format EUR correctly', async () => {
      const { formatCurrency } = await import('./currency');
      const result = formatCurrency(1234.56, 'EUR');
      expect(result).toContain('1,234.56');
    });

    it('should format BTC with 8 decimal places', async () => {
      const { formatCurrency } = await import('./currency');
      const result = formatCurrency(0.12345678, 'BTC');
      expect(result).toBe('\u20bf0.12345678');
    });

    it('should format JPY without decimal places', async () => {
      const { formatCurrency } = await import('./currency');
      const result = formatCurrency(1234, 'JPY');
      expect(result).toContain('1,234');
    });
  });

  describe('forceRefreshExchangeRates', () => {
    it('should fetch rates and call API endpoints', async () => {
      const exchangeRateData = { rates: { EUR: 0.92 } };
      const btcData = { bitcoin: { usd: 42000 } };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(exchangeRateData))
        .mockResolvedValueOnce(createMockResponse(btcData));

      const { forceRefreshExchangeRates } = await import('./currency');

      const rates = await forceRefreshExchangeRates();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/USD');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      expect(rates.base).toBe('USD');
      expect(rates.rates.USD).toBe(1);
    });

    it('should invalidate in-memory cache', async () => {
      const exchangeRateData = { rates: { EUR: 0.92 } };
      const btcData = { bitcoin: { usd: 42000 } };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(exchangeRateData))
        .mockResolvedValueOnce(createMockResponse(btcData))
        .mockResolvedValueOnce(createMockResponse(exchangeRateData))
        .mockResolvedValueOnce(createMockResponse(btcData));

      const { getExchangeRates, forceRefreshExchangeRates } = await import('./currency');

      await getExchangeRates();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      await getExchangeRates();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      await forceRefreshExchangeRates();
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('convertCurrency edge cases', () => {
    it('should return USD amount when target currency rate is missing', async () => {
      const exchangeRateData = {
        rates: {
          EUR: 0.92,
        },
      };
      const btcData = { bitcoin: { usd: 50000 } };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(exchangeRateData))
        .mockResolvedValueOnce(createMockResponse(btcData));

      const { convertCurrency } = await import('./currency');
      // XYZ is not in the rates, so toRate will be undefined
      const result = await convertCurrency(100, 'USD', 'XYZ');
      expect(result).toBe(100);
    });
  });

  describe('loadRatesFromStorage', () => {
    it('should load valid cached rates from localStorage on init', async () => {
      const storedRates = {
        base: 'USD',
        rates: { USD: 1, EUR: 0.90, GBP: 0.78 },
        timestamp: Date.now(),
      };
      localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(storedRates));

      const { getExchangeRates } = await import('./currency');
      const rates = await getExchangeRates();

      // Should use the cached rates without calling fetch
      expect(mockFetch).not.toHaveBeenCalled();
      expect(rates.rates.EUR).toBe(0.90);
    });

    it('should ignore expired cached rates from localStorage', async () => {
      const storedRates = {
        base: 'USD',
        rates: { USD: 1, EUR: 0.90 },
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago (expired)
      };
      localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(storedRates));

      const exchangeRateData = { rates: { EUR: 0.92 } };
      const btcData = { bitcoin: { usd: 42000 } };
      mockFetch
        .mockResolvedValueOnce(createMockResponse(exchangeRateData))
        .mockResolvedValueOnce(createMockResponse(btcData));

      const { getExchangeRates } = await import('./currency');
      const rates = await getExchangeRates();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(rates.rates.EUR).toBe(0.92);
    });

    it('should handle corrupted localStorage data', async () => {
      localStorage.setItem(RATES_STORAGE_KEY, 'not valid json');

      const exchangeRateData = { rates: { EUR: 0.92 } };
      const btcData = { bitcoin: { usd: 42000 } };
      mockFetch
        .mockResolvedValueOnce(createMockResponse(exchangeRateData))
        .mockResolvedValueOnce(createMockResponse(btcData));

      const { getExchangeRates } = await import('./currency');
      const rates = await getExchangeRates();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(rates.base).toBe('USD');
    });
  });

  describe('SUPPORTED_CURRENCIES', () => {
    it('should contain exactly 50 currencies', async () => {
      const { SUPPORTED_CURRENCIES } = await import('./currency');
      expect(SUPPORTED_CURRENCIES).toHaveLength(50);
    });

    it('should include key currencies from each continent', async () => {
      const { SUPPORTED_CURRENCIES } = await import('./currency');
      // North America
      expect(SUPPORTED_CURRENCIES).toContain('USD');
      expect(SUPPORTED_CURRENCIES).toContain('CAD');
      expect(SUPPORTED_CURRENCIES).toContain('MXN');
      // South America
      expect(SUPPORTED_CURRENCIES).toContain('BRL');
      expect(SUPPORTED_CURRENCIES).toContain('ARS');
      // Europe
      expect(SUPPORTED_CURRENCIES).toContain('EUR');
      expect(SUPPORTED_CURRENCIES).toContain('GBP');
      expect(SUPPORTED_CURRENCIES).toContain('CHF');
      expect(SUPPORTED_CURRENCIES).toContain('SEK');
      // Asia
      expect(SUPPORTED_CURRENCIES).toContain('JPY');
      expect(SUPPORTED_CURRENCIES).toContain('CNY');
      expect(SUPPORTED_CURRENCIES).toContain('KRW');
      expect(SUPPORTED_CURRENCIES).toContain('INR');
      expect(SUPPORTED_CURRENCIES).toContain('AED');
      // Africa
      expect(SUPPORTED_CURRENCIES).toContain('ZAR');
      expect(SUPPORTED_CURRENCIES).toContain('NGN');
      // Oceania
      expect(SUPPORTED_CURRENCIES).toContain('AUD');
      expect(SUPPORTED_CURRENCIES).toContain('NZD');
      // Digital
      expect(SUPPORTED_CURRENCIES).toContain('BTC');
    });
  });

  describe('CURRENCY_INFO', () => {
    it('should have info for all supported currencies', async () => {
      const { CURRENCY_INFO, SUPPORTED_CURRENCIES } = await import('./currency');
      for (const currency of SUPPORTED_CURRENCIES) {
        expect(CURRENCY_INFO[currency]).toBeDefined();
        expect(CURRENCY_INFO[currency].name).toBeDefined();
        expect(CURRENCY_INFO[currency].flag).toBeDefined();
      }
    });
  });

  describe('CURRENCY_GROUPS', () => {
    it('should contain all 7 continents', async () => {
      const { CURRENCY_GROUPS } = await import('./currency');
      const continents = CURRENCY_GROUPS.map((g) => g.continent);
      expect(continents).toEqual([
        'North America',
        'South America',
        'Europe',
        'Asia',
        'Africa',
        'Oceania',
        'Digital',
      ]);
    });

    it('should place every supported currency in exactly one group', async () => {
      const { CURRENCY_GROUPS, SUPPORTED_CURRENCIES } = await import('./currency');

      const allGrouped = CURRENCY_GROUPS.flatMap((g) => [...g.currencies]);
      expect(allGrouped).toHaveLength(SUPPORTED_CURRENCIES.length);

      // Every supported currency appears exactly once
      for (const currency of SUPPORTED_CURRENCIES) {
        const count = allGrouped.filter((c) => c === currency).length;
        expect(count).toBe(1);
      }
    });

    it('should only contain valid supported currencies', async () => {
      const { CURRENCY_GROUPS, SUPPORTED_CURRENCIES } = await import('./currency');
      const allGrouped = CURRENCY_GROUPS.flatMap((g) => [...g.currencies]);
      for (const code of allGrouped) {
        expect(SUPPORTED_CURRENCIES).toContain(code);
      }
    });
  });

  describe('FALLBACK_RATES', () => {
    it('should have a rate for every supported currency', async () => {
      const { FALLBACK_RATES, SUPPORTED_CURRENCIES } = await import('./currency');
      for (const currency of SUPPORTED_CURRENCIES) {
        expect(FALLBACK_RATES[currency]).toBeDefined();
        expect(FALLBACK_RATES[currency]).toBeGreaterThan(0);
      }
    });

    it('should have USD rate equal to 1', async () => {
      const { FALLBACK_RATES } = await import('./currency');
      expect(FALLBACK_RATES.USD).toBe(1);
    });
  });
});
