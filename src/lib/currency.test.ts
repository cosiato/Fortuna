import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetch } from '@tauri-apps/plugin-http';

const mockFetch = vi.mocked(fetch);

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

  describe('SUPPORTED_CURRENCIES', () => {
    it('should include all expected currencies', async () => {
      const { SUPPORTED_CURRENCIES } = await import('./currency');
      expect(SUPPORTED_CURRENCIES).toContain('USD');
      expect(SUPPORTED_CURRENCIES).toContain('EUR');
      expect(SUPPORTED_CURRENCIES).toContain('GBP');
      expect(SUPPORTED_CURRENCIES).toContain('JPY');
      expect(SUPPORTED_CURRENCIES).toContain('CHF');
      expect(SUPPORTED_CURRENCIES).toContain('HKD');
      expect(SUPPORTED_CURRENCIES).toContain('SGD');
      expect(SUPPORTED_CURRENCIES).toContain('AED');
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
});
