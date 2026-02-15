import { fetch } from "@tauri-apps/plugin-http";

interface ExchangeRates {
  base: string;
  rates: { [currency: string]: number };
  timestamp: number;
}

const RATES_STORAGE_KEY = "fortuna_exchange_rates";
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
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

type CurrencyContinent =
  | "North America"
  | "South America"
  | "Europe"
  | "Asia"
  | "Africa"
  | "Oceania"
  | "Digital";

interface CurrencyGroup {
  continent: CurrencyContinent;
  currencies: readonly SupportedCurrency[];
}

export const CURRENCY_GROUPS: readonly CurrencyGroup[] = [
  { continent: "North America", currencies: ["USD", "CAD", "MXN"] },
  {
    continent: "South America",
    currencies: ["BRL", "ARS", "CLP", "COP", "PEN"],
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
] as const;

export const CURRENCY_INFO: Record<
  SupportedCurrency,
  { flag: string; name: string }
> = {
  // North America
  USD: { flag: "\u{1F1FA}\u{1F1F8}", name: "US Dollar" },
  CAD: { flag: "\u{1F1E8}\u{1F1E6}", name: "Canadian Dollar" },
  MXN: { flag: "\u{1F1F2}\u{1F1FD}", name: "Mexican Peso" },
  // South America
  BRL: { flag: "\u{1F1E7}\u{1F1F7}", name: "Brazilian Real" },
  ARS: { flag: "\u{1F1E6}\u{1F1F7}", name: "Argentine Peso" },
  CLP: { flag: "\u{1F1E8}\u{1F1F1}", name: "Chilean Peso" },
  COP: { flag: "\u{1F1E8}\u{1F1F4}", name: "Colombian Peso" },
  PEN: { flag: "\u{1F1F5}\u{1F1EA}", name: "Peruvian Sol" },
  // Europe
  EUR: { flag: "\u{1F1EA}\u{1F1FA}", name: "Euro" },
  GBP: { flag: "\u{1F1EC}\u{1F1E7}", name: "British Pound" },
  CHF: { flag: "\u{1F1E8}\u{1F1ED}", name: "Swiss Franc" },
  SEK: { flag: "\u{1F1F8}\u{1F1EA}", name: "Swedish Krona" },
  NOK: { flag: "\u{1F1F3}\u{1F1F4}", name: "Norwegian Krone" },
  DKK: { flag: "\u{1F1E9}\u{1F1F0}", name: "Danish Krone" },
  PLN: { flag: "\u{1F1F5}\u{1F1F1}", name: "Polish Zloty" },
  CZK: { flag: "\u{1F1E8}\u{1F1FF}", name: "Czech Koruna" },
  HUF: { flag: "\u{1F1ED}\u{1F1FA}", name: "Hungarian Forint" },
  RON: { flag: "\u{1F1F7}\u{1F1F4}", name: "Romanian Leu" },
  RUB: { flag: "\u{1F1F7}\u{1F1FA}", name: "Russian Ruble" },
  ISK: { flag: "\u{1F1EE}\u{1F1F8}", name: "Icelandic Krona" },
  // Asia
  JPY: { flag: "\u{1F1EF}\u{1F1F5}", name: "Japanese Yen" },
  CNY: { flag: "\u{1F1E8}\u{1F1F3}", name: "Chinese Yuan" },
  HKD: { flag: "\u{1F1ED}\u{1F1F0}", name: "Hong Kong Dollar" },
  SGD: { flag: "\u{1F1F8}\u{1F1EC}", name: "Singapore Dollar" },
  KRW: { flag: "\u{1F1F0}\u{1F1F7}", name: "South Korean Won" },
  INR: { flag: "\u{1F1EE}\u{1F1F3}", name: "Indian Rupee" },
  IDR: { flag: "\u{1F1EE}\u{1F1E9}", name: "Indonesian Rupiah" },
  MYR: { flag: "\u{1F1F2}\u{1F1FE}", name: "Malaysian Ringgit" },
  THB: { flag: "\u{1F1F9}\u{1F1ED}", name: "Thai Baht" },
  PHP: { flag: "\u{1F1F5}\u{1F1ED}", name: "Philippine Peso" },
  VND: { flag: "\u{1F1FB}\u{1F1F3}", name: "Vietnamese Dong" },
  TWD: { flag: "\u{1F1F9}\u{1F1FC}", name: "Taiwan Dollar" },
  TRY: { flag: "\u{1F1F9}\u{1F1F7}", name: "Turkish Lira" },
  AED: { flag: "\u{1F1E6}\u{1F1EA}", name: "UAE Dirham" },
  SAR: { flag: "\u{1F1F8}\u{1F1E6}", name: "Saudi Riyal" },
  QAR: { flag: "\u{1F1F6}\u{1F1E6}", name: "Qatari Riyal" },
  KWD: { flag: "\u{1F1F0}\u{1F1FC}", name: "Kuwaiti Dinar" },
  ILS: { flag: "\u{1F1EE}\u{1F1F1}", name: "Israeli Shekel" },
  PKR: { flag: "\u{1F1F5}\u{1F1F0}", name: "Pakistani Rupee" },
  // Africa
  ZAR: { flag: "\u{1F1FF}\u{1F1E6}", name: "South African Rand" },
  NGN: { flag: "\u{1F1F3}\u{1F1EC}", name: "Nigerian Naira" },
  EGP: { flag: "\u{1F1EA}\u{1F1EC}", name: "Egyptian Pound" },
  KES: { flag: "\u{1F1F0}\u{1F1EA}", name: "Kenyan Shilling" },
  MAD: { flag: "\u{1F1F2}\u{1F1E6}", name: "Moroccan Dirham" },
  GHS: { flag: "\u{1F1EC}\u{1F1ED}", name: "Ghanaian Cedi" },
  TZS: { flag: "\u{1F1F9}\u{1F1FF}", name: "Tanzanian Shilling" },
  // Oceania
  AUD: { flag: "\u{1F1E6}\u{1F1FA}", name: "Australian Dollar" },
  NZD: { flag: "\u{1F1F3}\u{1F1FF}", name: "New Zealand Dollar" },
  FJD: { flag: "\u{1F1EB}\u{1F1EF}", name: "Fijian Dollar" },
  // Digital
  BTC: { flag: "\u20BF", name: "Bitcoin" },
};

export const FALLBACK_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  CAD: 1.36,
  MXN: 17.15,
  BRL: 4.97,
  ARS: 350,
  CLP: 900,
  COP: 3950,
  PEN: 3.72,
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
};

/** Fiat currency codes (all supported except BTC) */
const FIAT_CURRENCIES = SUPPORTED_CURRENCIES.filter(
  (c): c is Exclude<SupportedCurrency, "BTC"> => c !== "BTC",
);

export async function getExchangeRates(): Promise<ExchangeRates> {
  if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_TTL) {
    return cachedRates;
  }

  try {
    // Fetch USD-based rates from exchangerate-api (free tier)
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();

    // Get BTC price to add BTC as a currency option
    const btcResponse = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    );

    let btcRate = 0;
    if (btcResponse.ok) {
      const btcData = await btcResponse.json();
      const btcPriceInUsd = btcData.bitcoin?.usd || 0;
      if (btcPriceInUsd > 0) {
        btcRate = 1 / btcPriceInUsd; // How many BTC per 1 USD
      }
    }

    // Build rates dynamically from all fiat currencies
    const rates: Record<string, number> = { USD: 1 };
    for (const code of FIAT_CURRENCIES) {
      rates[code] = data.rates[code] ?? FALLBACK_RATES[code] ?? 1;
    }
    rates.BTC = btcRate;

    cachedRates = {
      base: "USD",
      rates,
      timestamp: Date.now(),
    };
    saveRatesToStorage(cachedRates);

    return cachedRates;
  } catch {
    // Return fallback rates
    return {
      base: "USD",
      rates: { ...FALLBACK_RATES },
      timestamp: Date.now(),
    };
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  const rates = await getExchangeRates();

  // Convert to USD first, then to target currency
  let amountInUsd = amount;
  if (fromCurrency !== "USD") {
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

import i18n from "@/lib/i18n";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-BR",
};

export function getIntlLocale(): string {
  return LOCALE_MAP[i18n.language] ?? "en-US";
}

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
): string {
  if (currency === "BTC") {
    return `\u20BF${amount.toFixed(8)}`;
  }

  return new Intl.NumberFormat(getIntlLocale(), {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export async function forceRefreshExchangeRates(): Promise<ExchangeRates> {
  cachedRates = null;
  return getExchangeRates();
}
