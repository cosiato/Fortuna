import { fetch } from "@tauri-apps/plugin-http"

interface ExchangeRates {
  base: string
  rates: { [currency: string]: number }
  timestamp: number
}

const RATES_STORAGE_KEY = "fortuna_exchange_rates"
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

class RatesCacheManager {
  private cached: ExchangeRates | null

  constructor() {
    this.cached = RatesCacheManager.loadFromStorage()
  }

  private static loadFromStorage(): ExchangeRates | null {
    try {
      const stored = localStorage.getItem(RATES_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ExchangeRates
        if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL) {
          return parsed
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null
  }

  private persist(rates: ExchangeRates): void {
    try {
      localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(rates))
    } catch {
      // Ignore storage errors
    }
  }

  get(): ExchangeRates | null {
    return this.cached
  }

  set(rates: ExchangeRates): void {
    this.cached = rates
    this.persist(rates)
  }

  invalidate(): void {
    this.cached = null
  }
}

const ratesCache = new RatesCacheManager()

export const SUPPORTED_CURRENCIES = [
  // North America
  "USD",
  "CAD",
  "MXN",
  // South America
  "BRL",
  "ARS",
  "CLP",
  "COP",
  "PEN",
  "PYG",
  // Europe
  "EUR",
  "GBP",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "RUB",
  "ISK",
  // Asia
  "JPY",
  "CNY",
  "HKD",
  "SGD",
  "KRW",
  "INR",
  "IDR",
  "MYR",
  "THB",
  "PHP",
  "VND",
  "TWD",
  "TRY",
  "AED",
  "SAR",
  "QAR",
  "KWD",
  "ILS",
  "PKR",
  // Africa
  "ZAR",
  "NGN",
  "EGP",
  "KES",
  "MAD",
  "GHS",
  "TZS",
  // Oceania
  "AUD",
  "NZD",
  "FJD",
  // Digital
  "BTC",
] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

type CurrencyContinent =
  | "North America"
  | "South America"
  | "Europe"
  | "Asia"
  | "Africa"
  | "Oceania"
  | "Digital"

interface CurrencyGroup {
  continent: CurrencyContinent
  currencies: readonly SupportedCurrency[]
}

export const CURRENCY_GROUPS: readonly CurrencyGroup[] = [
  { continent: "North America", currencies: ["USD", "CAD", "MXN"] },
  {
    continent: "South America",
    currencies: ["BRL", "ARS", "CLP", "COP", "PEN", "PYG"],
  },
  {
    continent: "Europe",
    currencies: [
      "EUR",
      "GBP",
      "CHF",
      "SEK",
      "NOK",
      "DKK",
      "PLN",
      "CZK",
      "HUF",
      "RON",
      "RUB",
      "ISK",
    ],
  },
  {
    continent: "Asia",
    currencies: [
      "JPY",
      "CNY",
      "HKD",
      "SGD",
      "KRW",
      "INR",
      "IDR",
      "MYR",
      "THB",
      "PHP",
      "VND",
      "TWD",
      "TRY",
      "AED",
      "SAR",
      "QAR",
      "KWD",
      "ILS",
      "PKR",
    ],
  },
  {
    continent: "Africa",
    currencies: ["ZAR", "NGN", "EGP", "KES", "MAD", "GHS", "TZS"],
  },
  { continent: "Oceania", currencies: ["AUD", "NZD", "FJD"] },
  { continent: "Digital", currencies: ["BTC"] },
] as const

export const CURRENCY_INFO: Record<SupportedCurrency, { flagCode: string; name: string }> = {
  // North America
  USD: { flagCode: "us", name: "US Dollar" },
  CAD: { flagCode: "ca", name: "Canadian Dollar" },
  MXN: { flagCode: "mx", name: "Mexican Peso" },
  // South America
  BRL: { flagCode: "br", name: "Brazilian Real" },
  ARS: { flagCode: "ar", name: "Argentine Peso" },
  CLP: { flagCode: "cl", name: "Chilean Peso" },
  COP: { flagCode: "co", name: "Colombian Peso" },
  PEN: { flagCode: "pe", name: "Peruvian Sol" },
  PYG: { flagCode: "py", name: "Paraguayan Guarani" },
  // Europe
  EUR: { flagCode: "eu", name: "Euro" },
  GBP: { flagCode: "gb", name: "British Pound" },
  CHF: { flagCode: "ch", name: "Swiss Franc" },
  SEK: { flagCode: "se", name: "Swedish Krona" },
  NOK: { flagCode: "no", name: "Norwegian Krone" },
  DKK: { flagCode: "dk", name: "Danish Krone" },
  PLN: { flagCode: "pl", name: "Polish Zloty" },
  CZK: { flagCode: "cz", name: "Czech Koruna" },
  HUF: { flagCode: "hu", name: "Hungarian Forint" },
  RON: { flagCode: "ro", name: "Romanian Leu" },
  RUB: { flagCode: "ru", name: "Russian Ruble" },
  ISK: { flagCode: "is", name: "Icelandic Krona" },
  // Asia
  JPY: { flagCode: "jp", name: "Japanese Yen" },
  CNY: { flagCode: "cn", name: "Chinese Yuan" },
  HKD: { flagCode: "hk", name: "Hong Kong Dollar" },
  SGD: { flagCode: "sg", name: "Singapore Dollar" },
  KRW: { flagCode: "kr", name: "South Korean Won" },
  INR: { flagCode: "in", name: "Indian Rupee" },
  IDR: { flagCode: "id", name: "Indonesian Rupiah" },
  MYR: { flagCode: "my", name: "Malaysian Ringgit" },
  THB: { flagCode: "th", name: "Thai Baht" },
  PHP: { flagCode: "ph", name: "Philippine Peso" },
  VND: { flagCode: "vn", name: "Vietnamese Dong" },
  TWD: { flagCode: "tw", name: "Taiwan Dollar" },
  TRY: { flagCode: "tr", name: "Turkish Lira" },
  AED: { flagCode: "ae", name: "UAE Dirham" },
  SAR: { flagCode: "sa", name: "Saudi Riyal" },
  QAR: { flagCode: "qa", name: "Qatari Riyal" },
  KWD: { flagCode: "kw", name: "Kuwaiti Dinar" },
  ILS: { flagCode: "il", name: "Israeli Shekel" },
  PKR: { flagCode: "pk", name: "Pakistani Rupee" },
  // Africa
  ZAR: { flagCode: "za", name: "South African Rand" },
  NGN: { flagCode: "ng", name: "Nigerian Naira" },
  EGP: { flagCode: "eg", name: "Egyptian Pound" },
  KES: { flagCode: "ke", name: "Kenyan Shilling" },
  MAD: { flagCode: "ma", name: "Moroccan Dirham" },
  GHS: { flagCode: "gh", name: "Ghanaian Cedi" },
  TZS: { flagCode: "tz", name: "Tanzanian Shilling" },
  // Oceania
  AUD: { flagCode: "au", name: "Australian Dollar" },
  NZD: { flagCode: "nz", name: "New Zealand Dollar" },
  FJD: { flagCode: "fj", name: "Fijian Dollar" },
  // Digital
  BTC: { flagCode: "btc", name: "Bitcoin" },
}

export const FALLBACK_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  CAD: 1.36,
  MXN: 17.15,
  BRL: 4.97,
  ARS: 350,
  CLP: 900,
  COP: 3950,
  PEN: 3.72,
  PYG: 7300,
  EUR: 0.92,
  GBP: 0.79,
  CHF: 0.88,
  SEK: 10.45,
  NOK: 10.55,
  DKK: 6.88,
  PLN: 4.02,
  CZK: 22.7,
  HUF: 355,
  RON: 4.57,
  RUB: 90,
  ISK: 137,
  JPY: 149.5,
  CNY: 7.24,
  HKD: 7.82,
  SGD: 1.34,
  KRW: 1320,
  INR: 83.1,
  IDR: 15600,
  MYR: 4.65,
  THB: 35.5,
  PHP: 55.8,
  VND: 24500,
  TWD: 31.5,
  TRY: 27.5,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  ILS: 3.65,
  PKR: 280,
  ZAR: 18.6,
  NGN: 800,
  EGP: 30.9,
  KES: 153,
  MAD: 10.05,
  GHS: 12.3,
  TZS: 2510,
  AUD: 1.53,
  NZD: 1.63,
  FJD: 2.24,
  BTC: 0.000024,
}

/** Fiat currency codes (all supported except BTC) */
const FIAT_CURRENCIES = SUPPORTED_CURRENCIES.filter(
  (c): c is Exclude<SupportedCurrency, "BTC"> => c !== "BTC",
)

export async function getExchangeRates(): Promise<ExchangeRates> {
  const cached = ratesCache.get()
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached
  }

  try {
    // Fetch USD-based rates from exchangerate-api (free tier)
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD")

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`)
    }

    const data = await response.json()

    // Get BTC price to add BTC as a currency option
    const btcResponse = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    )

    let btcRate = 0
    if (btcResponse.ok) {
      const btcData = await btcResponse.json()
      const btcPriceInUsd = btcData.bitcoin?.usd || 0
      if (btcPriceInUsd > 0) {
        btcRate = 1 / btcPriceInUsd // How many BTC per 1 USD
      }
    }

    // Build rates dynamically from all fiat currencies
    const rates: Record<string, number> = { USD: 1 }
    for (const code of FIAT_CURRENCIES) {
      rates[code] = data.rates[code] ?? FALLBACK_RATES[code] ?? 1
    }
    rates.BTC = btcRate

    const result: ExchangeRates = {
      base: "USD",
      rates,
      timestamp: Date.now(),
    }
    ratesCache.set(result)

    return result
  } catch {
    // Return fallback rates
    return {
      base: "USD",
      rates: { ...FALLBACK_RATES },
      timestamp: Date.now(),
    }
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<number> {
  if (fromCurrency === toCurrency) return amount

  const rates = await getExchangeRates()

  // Convert to USD first, then to target currency
  let amountInUsd = amount
  if (fromCurrency !== "USD") {
    const fromRate = rates.rates[fromCurrency]
    if (fromRate && fromRate > 0) {
      amountInUsd = amount / fromRate
    }
  }

  const toRate = rates.rates[toCurrency]
  if (toRate && toRate > 0) {
    return amountInUsd * toRate
  }

  return amountInUsd
}

import i18n from "@/lib/i18n"

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-BR",
}

export function getIntlLocale(): string {
  return LOCALE_MAP[i18n.language] ?? "en-US"
}

export function formatCurrency(amount: number, currency: SupportedCurrency): string {
  if (currency === "BTC") {
    return `\u20BF${amount.toFixed(8)}`
  }

  return new Intl.NumberFormat(getIntlLocale(), {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export async function forceRefreshExchangeRates(): Promise<ExchangeRates> {
  ratesCache.invalidate()
  return getExchangeRates()
}
