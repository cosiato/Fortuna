import type { PriceResult } from "./prices"

interface AssetLike {
  symbol: string | null
  quantity: number
  manualPrice: number | null
  currency: string
}

/**
 * Convert an amount from a given currency to USD.
 * Returns the amount unchanged when the currency is USD or unknown.
 */
export function toUsd(
  amount: number,
  currency: string,
  exchangeRates: Record<string, number>,
): number {
  if (currency === "USD") return amount
  const rate = exchangeRates[currency]
  return rate ? amount / rate : amount
}

/**
 * Convert a USD amount to a target display currency.
 * Returns the amount unchanged when the currency is USD or unknown.
 */
export function fromUsd(
  amountInUsd: number,
  displayCurrency: string,
  exchangeRates: Record<string, number>,
): number {
  if (displayCurrency === "USD") return amountInUsd
  const rate = exchangeRates[displayCurrency]
  return rate ? amountInUsd * rate : amountInUsd
}

/**
 * Convert an amount from one currency to another via USD.
 */
export function toDisplayCurrency(
  amount: number,
  sourceCurrency: string,
  displayCurrency: string,
  exchangeRates: Record<string, number>,
): number {
  if (sourceCurrency === displayCurrency) return amount
  const usd = toUsd(amount, sourceCurrency, exchangeRates)
  return fromUsd(usd, displayCurrency, exchangeRates)
}

/**
 * Resolve an asset's total value in USD using market prices or manual price.
 */
export function getAssetValueInUsd(
  asset: AssetLike,
  prices: Record<string, PriceResult>,
  exchangeRates: Record<string, number>,
): number {
  let value = 0
  let currency = asset.currency

  if (asset.manualPrice !== null) {
    value = asset.manualPrice * asset.quantity
  } else if (asset.symbol) {
    const priceData = prices[asset.symbol.toLowerCase()] || prices[asset.symbol.toUpperCase()]
    if (priceData && priceData.price > 0) {
      value = priceData.price * asset.quantity
      currency = priceData.currency
    }
  }

  return toUsd(value, currency, exchangeRates)
}
