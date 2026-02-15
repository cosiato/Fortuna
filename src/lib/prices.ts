import { getCryptoBySymbol } from "@/lib/cryptocurrencies"
import { fetch } from "@tauri-apps/plugin-http"

interface PriceCacheEntry {
  price: number
  currency: string
  timestamp: number
}

interface PriceCache {
  [symbol: string]: PriceCacheEntry
}

const STORAGE_KEY = "fortuna_price_cache"
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function loadCacheFromStorage(): PriceCache {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as PriceCache
    }
  } catch {
    // Ignore parse errors, return empty cache
  }
  return {}
}

function saveCacheToStorage(cacheData: PriceCache): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData))
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

const cache: PriceCache = loadCacheFromStorage()

export interface PriceResult {
  symbol: string
  price: number
  currency: string
  error?: string
}

interface StockInfo {
  symbol: string
  name: string
  price: number
  currency: string
  error?: string
}

interface YahooChartMeta {
  shortName?: string
  longName?: string
  regularMarketPrice?: number
  currency?: string
}

interface StockInfoCacheEntry {
  name: string
  price: number
  currency: string
  timestamp: number
}

interface StockInfoCache {
  [symbol: string]: StockInfoCacheEntry
}

const stockInfoCache: StockInfoCache = {}

async function fetchYahooChartData(
  symbol: string,
): Promise<{ meta: YahooChartMeta | null; error?: string }> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      return { meta: null, error: `Yahoo Finance API error: ${response.status}` }
    }

    const data = await response.json()
    const meta = data?.chart?.result?.[0]?.meta

    if (!meta) {
      return { meta: null, error: "Quote not found" }
    }

    return { meta }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch data"
    return { meta: null, error: message }
  }
}

export async function getStockInfo(symbol: string): Promise<StockInfo> {
  const trimmedSymbol = symbol.trim().toUpperCase()

  if (!trimmedSymbol || trimmedSymbol.length > 12) {
    return { symbol, name: "", price: 0, currency: "USD", error: "Invalid symbol" }
  }

  const cacheKey = `stockinfo:${trimmedSymbol}`
  const cached = stockInfoCache[cacheKey]

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      symbol,
      name: cached.name,
      price: cached.price,
      currency: cached.currency,
    }
  }

  const { meta, error } = await fetchYahooChartData(trimmedSymbol)

  if (error || !meta) {
    return { symbol, name: "", price: 0, currency: "USD", error: error || "Quote not found" }
  }

  const result: StockInfo = {
    symbol,
    name: meta.shortName || meta.longName || symbol,
    price: meta.regularMarketPrice ?? 0,
    currency: meta.currency || "USD",
  }

  stockInfoCache[cacheKey] = {
    name: result.name,
    price: result.price,
    currency: result.currency,
    timestamp: Date.now(),
  }

  return result
}

export async function getStockPrice(symbol: string): Promise<PriceResult> {
  const cacheKey = `stock:${symbol.toUpperCase()}`
  const cached = cache[cacheKey]

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      symbol,
      price: cached.price,
      currency: cached.currency,
    }
  }

  const { meta, error } = await fetchYahooChartData(symbol)

  if (error || !meta || meta.regularMarketPrice === undefined) {
    return { symbol, price: 0, currency: "USD", error: error || "Quote not found" }
  }

  const result = {
    symbol,
    price: meta.regularMarketPrice,
    currency: meta.currency || "USD",
  }

  cache[cacheKey] = {
    price: result.price,
    currency: result.currency,
    timestamp: Date.now(),
  }
  saveCacheToStorage(cache)

  return result
}

export async function getCryptoPrice(symbol: string): Promise<PriceResult> {
  const crypto = getCryptoBySymbol(symbol)
  const coinId = crypto?.id || symbol.toLowerCase()

  const cacheKey = `crypto:${symbol.toUpperCase()}`
  const cached = cache[cacheKey]

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      symbol,
      price: cached.price,
      currency: cached.currency,
    }
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    const price = data[coinId]?.usd ?? data[coinId.toLowerCase()]?.usd

    if (price === undefined) {
      return { symbol, price: 0, currency: "USD", error: "Coin not found" }
    }

    const result = {
      symbol,
      price,
      currency: "USD",
    }

    cache[cacheKey] = {
      price: result.price,
      currency: result.currency,
      timestamp: Date.now(),
    }
    saveCacheToStorage(cache)

    return result
  } catch {
    return { symbol, price: 0, currency: "USD", error: "Failed to fetch price" }
  }
}

async function getBatchCryptoPrices(symbols: string[]): Promise<PriceResult[]> {
  if (symbols.length === 0) return []

  const now = Date.now()
  const uncachedSymbols: string[] = []
  const cachedResults: PriceResult[] = []

  for (const symbol of symbols) {
    const cacheKey = `crypto:${symbol.toUpperCase()}`
    const cached = cache[cacheKey]
    if (cached && now - cached.timestamp < CACHE_TTL) {
      cachedResults.push({
        symbol,
        price: cached.price,
        currency: cached.currency,
      })
    } else {
      uncachedSymbols.push(symbol)
    }
  }

  if (uncachedSymbols.length === 0) {
    return cachedResults
  }

  const coinIds = uncachedSymbols.map((symbol) => {
    const crypto = getCryptoBySymbol(symbol)
    return { symbol, coinId: crypto?.id || symbol.toLowerCase() }
  })

  try {
    const idsParam = coinIds.map((c) => c.coinId).join(",")
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()

    const results: PriceResult[] = [...cachedResults]

    for (const { symbol, coinId } of coinIds) {
      const price = data[coinId]?.usd ?? data[coinId.toLowerCase()]?.usd
      const result: PriceResult = {
        symbol,
        price: price ?? 0,
        currency: "USD",
        error: price === undefined ? "Coin not found" : undefined,
      }
      results.push(result)

      if (price !== undefined) {
        cache[`crypto:${symbol.toUpperCase()}`] = {
          price,
          currency: "USD",
          timestamp: now,
        }
      }
    }

    saveCacheToStorage(cache)
    return results
  } catch {
    const individualResults = await Promise.all(
      uncachedSymbols.map((symbol) => getCryptoPrice(symbol)),
    )
    return [...cachedResults, ...individualResults]
  }
}

export async function getMultiplePrices(
  symbols: { symbol: string; type: "stock" | "crypto" }[],
): Promise<PriceResult[]> {
  const stockSymbols = symbols.filter((s) => s.type === "stock").map((s) => s.symbol)
  const cryptoSymbols = symbols.filter((s) => s.type === "crypto").map((s) => s.symbol)

  const [stockResults, cryptoResults] = await Promise.all([
    Promise.all(stockSymbols.map(getStockPrice)),
    getBatchCryptoPrices(cryptoSymbols),
  ])

  return [...stockResults, ...cryptoResults]
}

function invalidateCacheForSymbols(symbols: { symbol: string; type: "stock" | "crypto" }[]): void {
  for (const { symbol, type } of symbols) {
    const prefix = type === "stock" ? "stock" : "crypto"
    const cacheKey = `${prefix}:${symbol.toUpperCase()}`
    delete cache[cacheKey]
  }
  saveCacheToStorage(cache)
}

export async function forceRefreshPrices(
  symbols: { symbol: string; type: "stock" | "crypto" }[],
): Promise<PriceResult[]> {
  invalidateCacheForSymbols(symbols)
  return getMultiplePrices(symbols)
}

export async function fetchSinglePrice(
  symbol: string,
  type: "stock" | "crypto",
): Promise<PriceResult> {
  if (type === "stock") {
    return getStockPrice(symbol)
  }
  return getCryptoPrice(symbol)
}
