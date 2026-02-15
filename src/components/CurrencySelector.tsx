import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import CurrencyPickerOverlay from "@/components/CurrencyPickerOverlay"
import { CURRENCY_INFO, type SupportedCurrency } from "@/lib/currency"

interface CurrencySelectorProps {
  value: SupportedCurrency
  onChange: (currency: SupportedCurrency) => void
}

export default function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto px-2 py-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-1.5">
          <span>{CURRENCY_INFO[value].flag}</span>
          <span className="text-sm font-medium">{value}</span>
        </span>
      </Button>
      <CurrencyPickerOverlay open={open} value={value} onSelect={onChange} onClose={handleClose} />
    </>
  )
}
