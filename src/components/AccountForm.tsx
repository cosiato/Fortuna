import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { Account } from "@/types/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import CurrencyCombobox from "@/components/CurrencyCombobox"
import CountrySelector from "@/components/CountrySelector"
import { createAccountSchema, validateSchema } from "@/lib/validation"
import { toast } from "sonner"

interface AccountFormProps {
  account?: Account | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<Account>) => void
}

export default function AccountForm({ account, open, onOpenChange, onSubmit }: AccountFormProps) {
  const { t } = useTranslation("vaults")
  const [name, setName] = useState(account?.name ?? "")
  const [balance, setBalance] = useState(account?.balance?.toString() ?? "")
  const [currency, setCurrency] = useState(account?.currency ?? "USD")
  const [countryCode, setCountryCode] = useState(account?.countryCode ?? "")

  useEffect(() => {
    if (account) {
      setName(account.name ?? "")
      setBalance(account.balance?.toString() ?? "")
      setCurrency(account.currency ?? "USD")
      setCountryCode(account.countryCode ?? "")
    } else {
      setName("")
      setBalance("")
      setCurrency("USD")
      setCountryCode("")
    }
  }, [account, open])

  const isEditing = !!account

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name,
      balance: parseFloat(balance) || 0,
      currency,
      countryCode,
    }
    const result = validateSchema(createAccountSchema(), data)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("editVault") : t("addVault")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">{t("cashValue")}</Label>
            <Input
              id="balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              step="any"
              min="0"
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t("currency")}</Label>
            <CurrencyCombobox value={currency} onChange={setCurrency} exclude={["BTC"]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">{t("location")}</Label>
            <CountrySelector value={countryCode} onChange={setCountryCode} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button type="submit" variant="default" className="flex-1" disabled={!countryCode}>
              {isEditing ? t("update", { ns: "common" }) : t("addBtn")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
