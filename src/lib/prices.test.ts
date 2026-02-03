import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetch } from '@tauri-apps/plugin-http';

const mockFetch = vi.mocked(fetch);

const createMockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
}) as unknown as Response;

vi.mock('@/lib/cryptocurrencies', () => ({
  getCryptoBySymbol: vi.fn((symbol: string) => {
    const cryptoMap: Record<string, { id: string; symbol: string; name: string }> = {
      BTC: { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ETH: { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
      SOL: { id: 'solana', symbol: 'SOL', name: 'Solana' },
    };
    return cryptoMap[symbol.toUpperCase()] || null;
  }),
}));

describe('prices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStockPrice', () => {
    it('should fetch stock price from Yahoo Finance', async () => {
      const yahooResponse = {
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 175.50,
                currency: 'USD',
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(yahooResponse));

      const { getStockPrice } = await import('./prices');
      const result = await getStockPrice('AAPL');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://query1.finance.yahoo.com/v8/finance/chart/AAPL'),
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
      expect(result.symbol).toBe('AAPL');
      expect(result.price).toBe(175.50);
      expect(result.currency).toBe('USD');
      expect(result.error).toBeUndefined();
    });

    it('should return cached price within TTL', async () => {
      const yahooResponse = {
        chart: {
          result: [{ meta: { regularMarketPrice: 175.50, currency: 'USD' } }],
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(yahooResponse));

      const { getStockPrice } = await import('./prices');

      const firstCall = await getStockPrice('AAPL');
      const secondCall = await getStockPrice('AAPL');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(firstCall).toEqual(secondCall);
    });

    it('should return error when quote not found', async () => {
      const yahooResponse = {
        chart: {
          result: [{ meta: {} }],
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(yahooResponse));

      const { getStockPrice } = await import('./prices');
      const result = await getStockPrice('INVALID');

      expect(result.price).toBe(0);
      expect(result.error).toBe('Quote not found');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, false, 404));

      const { getStockPrice } = await import('./prices');
      const result = await getStockPrice('AAPL');

      expect(result.price).toBe(0);
      expect(result.error).toContain('Yahoo Finance API error');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { getStockPrice } = await import('./prices');
      const result = await getStockPrice('AAPL');

      expect(result.price).toBe(0);
      expect(result.error).toBe('Network error');
    });

    it('should persist price to localStorage', async () => {
      const yahooResponse = {
        chart: {
          result: [{ meta: { regularMarketPrice: 175.50, currency: 'USD' } }],
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(yahooResponse));

      const { getStockPrice } = await import('./prices');
      await getStockPrice('AAPL');

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getCryptoPrice', () => {
    it('should fetch crypto price from CoinGecko', async () => {
      const coinGeckoResponse = {
        bitcoin: { usd: 42000 },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(coinGeckoResponse));

      const { getCryptoPrice } = await import('./prices');
      const result = await getCryptoPrice('BTC');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      expect(result.symbol).toBe('BTC');
      expect(result.price).toBe(42000);
      expect(result.currency).toBe('USD');
      expect(result.error).toBeUndefined();
    });

    it('should return cached crypto price within TTL', async () => {
      const coinGeckoResponse = { bitcoin: { usd: 42000 } };
      mockFetch.mockResolvedValueOnce(createMockResponse(coinGeckoResponse));

      const { getCryptoPrice } = await import('./prices');

      const firstCall = await getCryptoPrice('BTC');
      const secondCall = await getCryptoPrice('BTC');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(firstCall).toEqual(secondCall);
    });

    it('should return error when coin not found', async () => {
      const coinGeckoResponse = {};
      mockFetch.mockResolvedValueOnce(createMockResponse(coinGeckoResponse));

      const { getCryptoPrice } = await import('./prices');
      const result = await getCryptoPrice('INVALID');

      expect(result.price).toBe(0);
      expect(result.error).toBe('Coin not found');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, false, 429));

      const { getCryptoPrice } = await import('./prices');
      const result = await getCryptoPrice('BTC');

      expect(result.price).toBe(0);
      expect(result.error).toBe('Failed to fetch price');
    });
  });

  describe('getMultiplePrices', () => {
    it('should fetch both stock and crypto prices', async () => {
      const yahooResponse = {
        chart: {
          result: [{ meta: { regularMarketPrice: 175.50, currency: 'USD' } }],
        },
      };
      const coinGeckoResponse = {
        bitcoin: { usd: 42000 },
        ethereum: { usd: 2500 },
      };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(yahooResponse))
        .mockResolvedValueOnce(createMockResponse(coinGeckoResponse));

      const { getMultiplePrices } = await import('./prices');
      const results = await getMultiplePrices([
        { symbol: 'AAPL', type: 'stock' },
        { symbol: 'BTC', type: 'crypto' },
        { symbol: 'ETH', type: 'crypto' },
      ]);

      expect(results).toHaveLength(3);
      expect(results.find((r) => r.symbol === 'AAPL')?.price).toBe(175.50);
      expect(results.find((r) => r.symbol === 'BTC')?.price).toBe(42000);
      expect(results.find((r) => r.symbol === 'ETH')?.price).toBe(2500);
    });

    it('should handle empty array', async () => {
      const { getMultiplePrices } = await import('./prices');
      const results = await getMultiplePrices([]);

      expect(results).toEqual([]);
    });

    it('should handle only stocks', async () => {
      const yahooResponse1 = {
        chart: { result: [{ meta: { regularMarketPrice: 175.50, currency: 'USD' } }] },
      };
      const yahooResponse2 = {
        chart: { result: [{ meta: { regularMarketPrice: 380.00, currency: 'USD' } }] },
      };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(yahooResponse1))
        .mockResolvedValueOnce(createMockResponse(yahooResponse2));

      const { getMultiplePrices } = await import('./prices');
      const results = await getMultiplePrices([
        { symbol: 'AAPL', type: 'stock' },
        { symbol: 'MSFT', type: 'stock' },
      ]);

      expect(results).toHaveLength(2);
    });

    it('should handle only crypto', async () => {
      const coinGeckoResponse = {
        bitcoin: { usd: 42000 },
        ethereum: { usd: 2500 },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(coinGeckoResponse));

      const { getMultiplePrices } = await import('./prices');
      const results = await getMultiplePrices([
        { symbol: 'BTC', type: 'crypto' },
        { symbol: 'ETH', type: 'crypto' },
      ]);

      expect(results).toHaveLength(2);
    });
  });

  describe('forceRefreshPrices', () => {
    it('should invalidate cache and fetch new prices', async () => {
      const firstResponse = {
        chart: { result: [{ meta: { regularMarketPrice: 175.50, currency: 'USD' } }] },
      };
      const secondResponse = {
        chart: { result: [{ meta: { regularMarketPrice: 180.00, currency: 'USD' } }] },
      };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(firstResponse))
        .mockResolvedValueOnce(createMockResponse(secondResponse));

      const { getStockPrice, forceRefreshPrices } = await import('./prices');

      const firstCall = await getStockPrice('AAPL');
      expect(firstCall.price).toBe(175.50);

      const refreshed = await forceRefreshPrices([{ symbol: 'AAPL', type: 'stock' }]);
      expect(refreshed[0].price).toBe(180.00);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchSinglePrice', () => {
    it('should fetch stock price when type is stock', async () => {
      const yahooResponse = {
        chart: { result: [{ meta: { regularMarketPrice: 175.50, currency: 'USD' } }] },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(yahooResponse));

      const { fetchSinglePrice } = await import('./prices');
      const result = await fetchSinglePrice('AAPL', 'stock');

      expect(result.symbol).toBe('AAPL');
      expect(result.price).toBe(175.50);
    });

    it('should fetch crypto price when type is crypto', async () => {
      const coinGeckoResponse = { bitcoin: { usd: 42000 } };
      mockFetch.mockResolvedValueOnce(createMockResponse(coinGeckoResponse));

      const { fetchSinglePrice } = await import('./prices');
      const result = await fetchSinglePrice('BTC', 'crypto');

      expect(result.symbol).toBe('BTC');
      expect(result.price).toBe(42000);
    });
  });

  describe('getStockInfo', () => {
    it('should fetch stock info from Yahoo Finance', async () => {
      const yahooResponse = {
        chart: {
          result: [
            {
              meta: {
                shortName: 'Apple Inc.',
                longName: 'Apple Inc.',
                regularMarketPrice: 175.50,
                currency: 'USD',
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(yahooResponse));

      const { getStockInfo } = await import('./prices');
      const result = await getStockInfo('AAPL');

      expect(result.symbol).toBe('AAPL');
      expect(result.name).toBe('Apple Inc.');
      expect(result.price).toBe(175.50);
      expect(result.currency).toBe('USD');
      expect(result.error).toBeUndefined();
    });

    it('should return cached stock info within TTL', async () => {
      const yahooResponse = {
        chart: {
          result: [
            {
              meta: {
                shortName: 'Apple Inc.',
                regularMarketPrice: 175.50,
                currency: 'USD',
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(yahooResponse));

      const { getStockInfo } = await import('./prices');

      const first = await getStockInfo('AAPL');
      const second = await getStockInfo('AAPL');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(first.name).toEqual(second.name);
    });

    it('should return error for invalid symbol', async () => {
      const { getStockInfo } = await import('./prices');
      const result = await getStockInfo('');

      expect(result.error).toBe('Invalid symbol');
      expect(result.price).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return error for too-long symbol', async () => {
      const { getStockInfo } = await import('./prices');
      const result = await getStockInfo('TOOLONGSYMBOL1');

      expect(result.error).toBe('Invalid symbol');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return error when API fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, false, 404));

      const { getStockInfo } = await import('./prices');
      const result = await getStockInfo('INVALID');

      expect(result.error).toContain('Yahoo Finance API error');
      expect(result.price).toBe(0);
    });

    it('should use longName when shortName is missing', async () => {
      const yahooResponse = {
        chart: {
          result: [
            {
              meta: {
                longName: 'Tesla Inc.',
                regularMarketPrice: 250.00,
                currency: 'USD',
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(yahooResponse));

      const { getStockInfo } = await import('./prices');
      const result = await getStockInfo('TSLA');

      expect(result.name).toBe('Tesla Inc.');
    });

    it('should fallback to symbol when no name is available', async () => {
      const yahooResponse = {
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 100.00,
                currency: 'USD',
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(yahooResponse));

      const { getStockInfo } = await import('./prices');
      const result = await getStockInfo('XYZ');

      expect(result.name).toBe('XYZ');
    });

    it('should default currency to USD when not provided', async () => {
      const yahooResponse = {
        chart: {
          result: [
            {
              meta: {
                shortName: 'Test Corp',
                regularMarketPrice: 50.00,
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(yahooResponse));

      const { getStockInfo } = await import('./prices');
      const result = await getStockInfo('TEST');

      expect(result.currency).toBe('USD');
    });
  });

  describe('getBatchCryptoPrices (via getMultiplePrices)', () => {
    it('should fall back to individual fetches when batch API fails', async () => {
      // Batch request fails
      mockFetch.mockRejectedValueOnce(new Error('API rate limit'));
      // Individual fallback requests
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ bitcoin: { usd: 42000 } }))
        .mockResolvedValueOnce(createMockResponse({ ethereum: { usd: 2500 } }));

      const { getMultiplePrices } = await import('./prices');
      const results = await getMultiplePrices([
        { symbol: 'BTC', type: 'crypto' },
        { symbol: 'ETH', type: 'crypto' },
      ]);

      expect(results).toHaveLength(2);
      expect(results.find((r) => r.symbol === 'BTC')?.price).toBe(42000);
      expect(results.find((r) => r.symbol === 'ETH')?.price).toBe(2500);
    });

    it('should mark coins as not found in batch response', async () => {
      const coinGeckoResponse = {
        bitcoin: { usd: 42000 },
        // 'solana' intentionally missing from response
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(coinGeckoResponse));

      const { getMultiplePrices } = await import('./prices');
      const results = await getMultiplePrices([
        { symbol: 'BTC', type: 'crypto' },
        { symbol: 'SOL', type: 'crypto' },
      ]);

      expect(results.find((r) => r.symbol === 'BTC')?.price).toBe(42000);
      expect(results.find((r) => r.symbol === 'SOL')?.price).toBe(0);
      expect(results.find((r) => r.symbol === 'SOL')?.error).toBe('Coin not found');
    });
  });

  describe('cache behavior', () => {
    it('should use case-insensitive cache keys', async () => {
      const yahooResponse = {
        chart: { result: [{ meta: { regularMarketPrice: 175.50, currency: 'USD' } }] },
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(yahooResponse));

      const { getStockPrice } = await import('./prices');

      await getStockPrice('aapl');
      await getStockPrice('AAPL');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should separate stock and crypto cache keys', async () => {
      const yahooResponse = {
        chart: { result: [{ meta: { regularMarketPrice: 175.50, currency: 'USD' } }] },
      };
      const coinGeckoResponse = { bitcoin: { usd: 42000 } };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(yahooResponse))
        .mockResolvedValueOnce(createMockResponse(coinGeckoResponse));

      const { getStockPrice, getCryptoPrice } = await import('./prices');

      await getStockPrice('BTC');
      await getCryptoPrice('BTC');

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
