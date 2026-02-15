import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import type { Asset } from "@/types/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SUPPORTED_CURRENCIES, CURRENCY_INFO, SupportedCurrency } from "@/lib/currency"
import CryptoSelector from "@/components/CryptoSelector"
import { getCryptoBySymbol } from "@/lib/cryptocurrencies"
import { getStockInfo } from "@/lib/prices"
import { createAssetSchema, validateSchema } from "@/lib/validation"
import { toast } from "sonner"

interface AssetFormProps {
  asset?: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<Asset>) => void
}

export default function AssetForm({ asset, open, onOpenChange, onSubmit }: AssetFormProps) {
  const { t } = useTranslation("assets")
  const [name, setName] = useState(asset?.name || "")
  const [type, setType] = useState<Asset["type"]>(asset?.type || "stock")
  const [symbol, setSymbol] = useState(asset?.symbol || "")
  const [quantity, setQuantity] = useState(asset?.quantity?.toString() || "1")
  const [manualPrice, setManualPrice] = useState(asset?.manualPrice?.toString() || "")
  const [currency, setCurrency] = useState(asset?.currency || "USD")
  const [resolvedName, setResolvedName] = useState("")
  const [isLoadingName, setIsLoadingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  const ASSET_TYPES = [
    { value: "crypto", label: t("assetType.crypto") },
    { value: "stock", label: t("assetType.stock") },
    { value: "real_estate", label: t("assetType.real_estate") },
    { value: "other", label: t("assetType.other") },
  ]

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    requestIdRef.current++

    if (asset) {
      setName(asset.name || "")
      setType(asset.type || "stock")
      setSymbol(asset.symbol || "")
      setQuantity(asset.quantity?.toString() || "1")
      setManualPrice(asset.manualPrice?.toString() || "")
      setCurrency(asset.currency || "USD")
      setResolvedName(asset.name || "")
      setNameError(null)
      setIsLoadingName(false)
    } else {
      setName("")
      setType("stock")
      setSymbol("")
      setQuantity("1")
      setManualPrice("")
      setCurrency("USD")
      setResolvedName("")
      setNameError(null)
      setIsLoadingName(false)
    }
  }, [asset, open])

  const fetchStockName = useCallback(async (tickerSymbol: string) => {
    if (!tickerSymbol.trim()) {
      setResolvedName("")
      setNameError(null)
      return
    }

    const currentRequestId = ++requestIdRef.current
    setIsLoadingName(true)
    setNameError(null)

    const info = await getStockInfo(tickerSymbol.trim().toUpperCase())

    if (currentRequestId !== requestIdRef.current) {
      return
    }

    setIsLoadingName(false)

    if (info.error) {
      setNameError(info.error)
      setResolvedName("")
    } else {
      setResolvedName(info.name)
      setNameError(null)
    }
  }, [])

  const handleStockSymbolChange = useCallback(
    (value: string) => {
      setSymbol(value)
      setResolvedName("")
      setNameError(null)

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchStockName(value)
      }, 500)
    },
    [fetchStockName],
  )

  const handleCryptoChange = useCallback((cryptoSymbol: string) => {
    setSymbol(cryptoSymbol)
    const crypto = getCryptoBySymbol(cryptoSymbol)
    if (crypto) {
      setResolvedName(crypto.name)
      setNameError(null)
    } else {
      setResolvedName("")
      setNameError(t("cryptoNotFound"))
    }
  }, [t])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const isEditing = !!asset
  const requiresSymbol = type === "stock" || type === "crypto"
  const requiresManualPrice = type === "real_estate" || type === "other"
  const usesApiName = type === "stock" || type === "crypto"

  const getEffectiveName = () => {
    if (usesApiName) {
      return resolvedName
    }
    return name
  }

  const isSubmitDisabled = usesApiName && (!resolvedName.trim() || isLoadingName)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name: getEffectiveName(),
      type,
      symbol: requiresSymbol ? symbol : null,
      quantity: parseFloat(quantity) || 0,
      manualPrice: requiresManualPrice ? parseFloat(manualPrice) || null : null,
      currency,
    }
    const result = validateSchema(createAssetSchema(), data)
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
          <DialogTitle>{isEditing ? t("editAsset") : t("addAsset")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("type", { ns: "common" })}</Label>
            <Select
              value={type}
              onValueChange={(val) => {
                setType(val as Asset["type"])
                setResolvedName("")
                setNameError(null)
                if (val !== "stock" && val !== "crypto") {
                  setSymbol("")
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectType")} />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((assetType) => (
                  <SelectItem key={assetType.value} value={assetType.value}>
                    {assetType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "crypto" && (
            <div className="space-y-2">
              <Label>{t("cryptocurrency")}</Label>
              <CryptoSelector value={symbol} onChange={handleCryptoChange} />
              {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            </div>
          )}

          {type === "stock" && (
            <div className="space-y-2">
              <Label htmlFor="symbol">{t("tickerSymbol")}</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => handleStockSymbolChange(e.target.value)}
                placeholder={t("tickerPlaceholder")}
                required
              />
              {isLoadingName && (
                <p className="text-sm text-muted-foreground">{t("lookingUpStock")}</p>
              )}
              {resolvedName && !isLoadingName && (
                <p className="text-sm text-muted-foreground">{resolvedName}</p>
              )}
              {nameError && !isLoadingName && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>
          )}

          {!usesApiName && (
            <div className="space-y-2">
              <Label htmlFor="name">{t("name", { ns: "common" })}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">{t("quantity")}</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="any"
              min="0"
              required
            />
          </div>

          {requiresManualPrice && (
            <div className="space-y-2">
              <Label htmlFor="manualPrice">{t("valueIn", { currency })}</Label>
              <Input
                id="manualPrice"
                type="number"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                step="any"
                min="0"
                placeholder={t("enterCurrentValue")}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currency">{t("currency")}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span>{CURRENCY_INFO[currency as SupportedCurrency]?.flag}</span>
                    <span>{currency}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.filter((c) => c !== "BTC").map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-2">
                      <span>{CURRENCY_INFO[c].flag}</span>
                      <span>{c}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" variant="default" className="flex-1" disabled={isSubmitDisabled}>
              {isLoadingName ? t("loadingBtn") : isEditing ? t("update", { ns: "common" }) : t("addBtn")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
