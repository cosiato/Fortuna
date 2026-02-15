import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { Asset } from "@/types/database"
import { api } from "@/lib/api"
import { PriceResult, fetchSinglePrice } from "@/lib/prices"
import { showErrorToast } from "@/lib/errorHandling"

interface UseAssetCrudOptions {
  selectedEntityId: number
  fetchDataOnly: () => Promise<{ assetsData: Asset[]; accountsData: unknown[] }>
  requestSnapshot: () => void
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>
  setPrices: React.Dispatch<React.SetStateAction<Record<string, PriceResult>>>
}

export function useAssetCrud({
  selectedEntityId,
  fetchDataOnly,
  requestSnapshot,
  setAssets,
  setPrices,
}: UseAssetCrudOptions) {
  const [assetFormOpen, setAssetFormOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  const { t } = useTranslation(["errors"])

  const fetchPriceAndSyncCurrency = useCallback(
    async (assetId: string, symbol: string, type: "stock" | "crypto", storedCurrency?: string) => {
      try {
        const priceResult = await fetchSinglePrice(symbol, type)
        if (priceResult.price > 0) {
          setPrices((prev) => ({
            ...prev,
            [priceResult.symbol.toLowerCase()]: priceResult,
            [priceResult.symbol.toUpperCase()]: priceResult,
          }))
          if (priceResult.currency !== storedCurrency) {
            await api.assets.update(assetId, { currency: priceResult.currency })
            await fetchDataOnly()
          }
        }
      } catch {
        // Price fetch is best-effort; the asset was already saved
      }
    },
    [setPrices, fetchDataOnly],
  )

  const handleAddAsset = async (data: Partial<Asset>) => {
    try {
      const created = await api.assets.create({
        name: data.name!,
        type: data.type as Asset["type"],
        symbol: data.symbol,
        quantity: data.quantity,
        manualPrice: data.manualPrice,
        currency: data.currency,
        entityId: selectedEntityId,
      })
      setAssetFormOpen(false)
      await fetchDataOnly()
      requestSnapshot()

      if (data.symbol && (data.type === "stock" || data.type === "crypto")) {
        await fetchPriceAndSyncCurrency(
          created.id,
          data.symbol,
          data.type,
          data.currency,
        )
      }
    } catch (error) {
      showErrorToast(error, t("errors:failedToCreateAsset"))
    }
  }

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset)
    setAssetFormOpen(true)
  }

  const handleUpdateAsset = async (data: Partial<Asset>) => {
    if (!editingAsset) return
    try {
      await api.assets.update(editingAsset.id, {
        name: data.name,
        type: data.type as Asset["type"],
        symbol: data.symbol,
        quantity: data.quantity,
        manualPrice: data.manualPrice,
        currency: data.currency,
      })
      setAssetFormOpen(false)
      setEditingAsset(null)
      await fetchDataOnly()
      requestSnapshot()

      if (data.symbol && (data.type === "stock" || data.type === "crypto")) {
        await fetchPriceAndSyncCurrency(
          editingAsset.id,
          data.symbol,
          data.type,
          data.currency,
        )
      }
    } catch (error) {
      showErrorToast(error, t("errors:failedToUpdateAsset"))
    }
  }

  const handleDeleteAsset = async (id: string) => {
    try {
      await api.assets.delete(id)
      await fetchDataOnly()
      requestSnapshot()
    } catch (error) {
      showErrorToast(error, t("errors:failedToDeleteAsset"))
    }
  }

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    try {
      await api.assets.update(id, { quantity: newQuantity })
      setAssets((prev) =>
        prev.map((asset) => (asset.id === id ? { ...asset, quantity: newQuantity } : asset)),
      )
      requestSnapshot()
    } catch (error) {
      showErrorToast(error, t("errors:failedToUpdateQuantity"))
    }
  }

  const handleAssetFormClose = (open: boolean) => {
    setAssetFormOpen(open)
    if (!open) {
      setEditingAsset(null)
    }
  }

  return {
    assetFormOpen,
    editingAsset,
    setAssetFormOpen,
    handleAddAsset,
    handleEditAsset,
    handleUpdateAsset,
    handleDeleteAsset,
    handleQuantityChange,
    handleAssetFormClose,
  }
}
