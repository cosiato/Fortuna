"use client"

import { Account } from "@/lib/db"
import { getCountryFlag, getCountryName } from "@/lib/countries"
import { formatCurrency, SupportedCurrency } from "@/lib/currency"
import { Card, CardContent } from "@/components/ui/card"

interface AccountCardProps {
  account: Account
  displayCurrency: SupportedCurrency
  exchangeRates: { [currency: string]: number }
}

export default function AccountCard({ account, displayCurrency, exchangeRates }: AccountCardProps) {
  const isVault = account.accountType === "personal"

  const getDisplayValue = (): number => {
    let valueInUsd = account.balance

    if (account.currency !== "USD" && exchangeRates[account.currency]) {
      valueInUsd = account.balance / exchangeRates[account.currency]
    }

    if (displayCurrency !== "USD" && exchangeRates[displayCurrency]) {
      return valueInUsd * exchangeRates[displayCurrency]
    }

    return valueInUsd
  }

  const flag = getCountryFlag(account.countryCode)
  const countryName = getCountryName(account.countryCode)
  const displayValue = getDisplayValue()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{flag}</span>
            <div>
              <p className="font-medium text-foreground">{account.name}</p>
              <p className="text-xs text-muted-foreground">{countryName}</p>
            </div>
          </div>
          <p className={`text-sm font-semibold ${isVault ? "text-accent" : "text-purple-400"}`}>
            {formatCurrency(displayValue, displayCurrency)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
