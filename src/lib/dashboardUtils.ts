import { SupportedCurrency, getIntlLocale } from "@/lib/currency"

export const CATEGORY_BADGE_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; icon: string }
> = {
  stock: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/25",
    icon: "solar:chart-linear",
  },
  crypto: {
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/25",
    icon: "solar:money-bag-linear",
  },
  real_estate: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
    icon: "solar:home-linear",
  },
  other: {
    bg: "bg-slate-400/15",
    text: "text-slate-400",
    border: "border-slate-400/25",
    icon: "solar:box-linear",
  },
}

export interface CategoryBadge {
  key: string
  label: string
  count: number
  total: number
}

export function formatCompactValue(value: number, currency: SupportedCurrency): string {
  if (currency === "BTC") {
    return value >= 1 ? `${value.toFixed(2)} BTC` : `${value.toFixed(4)} BTC`
  }
  return new Intl.NumberFormat(getIntlLocale(), {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}
