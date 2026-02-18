import { useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Icon } from "@iconify/react"
import type { Asset } from "@/types/database"
import { SupportedCurrency, formatCurrency } from "@/lib/currency"
import SlotMachineNumber from "@/components/SlotMachineNumber"
import { getCryptoBySymbol } from "@/lib/cryptocurrencies"
import { Button } from "@/components/ui/button"

interface CategoryStyle {
  gradient: string
  glowColor: string
}

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  stock: {
    gradient: "from-amber-500/30 to-amber-900/10",
    glowColor: "hover:shadow-amber-500/20",
  },
  crypto: {
    gradient: "from-purple-500/30 to-purple-900/10",
    glowColor: "hover:shadow-purple-500/20",
  },
  real_estate: {
    gradient: "from-emerald-500/30 to-emerald-900/10",
    glowColor: "hover:shadow-emerald-500/20",
  },
  other: {
    gradient: "from-slate-500/30 to-slate-900/10",
    glowColor: "hover:shadow-slate-500/20",
  },
}

interface AssetTileProps {
  asset: Asset
  displayValue: number
  displayCurrency: SupportedCurrency
  categoryStyle?: CategoryStyle
  onEdit?: (asset: Asset) => void
  onDelete?: (id: string) => void
  onQuantityChange?: (id: string, newQuantity: number) => void
}

function CryptoAvatar({ symbol }: { symbol: string }) {
  const crypto = getCryptoBySymbol(symbol)

  if (crypto?.logo) {
    return (
      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-slate-800">
        <img
          src={crypto.logo}
          alt={crypto.name}
          width={24}
          height={24}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center shrink-0">
      <span className="text-accent font-bold text-[10px]">{symbol.slice(0, 2).toUpperCase()}</span>
    </div>
  )
}

export default function AssetTile({
  asset,
  displayValue,
  displayCurrency,
  categoryStyle,
  onEdit,
  onDelete,
  onQuantityChange,
}: AssetTileProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const { t } = useTranslation(["assets", "common"])
  const style = categoryStyle || CATEGORY_STYLES[asset.type] || CATEGORY_STYLES.other
  const showActions = onEdit || onDelete

  const canDecrement = asset.quantity > 1

  const handleIncrement = () => {
    onQuantityChange?.(asset.id, asset.quantity + 1)
  }

  const handleDecrement = () => {
    if (canDecrement) {
      onQuantityChange?.(asset.id, asset.quantity - 1)
    }
  }

  const handleDeleteClick = () => {
    setIsFlipped(true)
  }

  const handleConfirmDelete = () => {
    onDelete?.(asset.id)
    setIsFlipped(false)
  }

  const handleCancelDelete = () => {
    setIsFlipped(false)
  }

  return (
    <div className="relative h-[104px]" style={{ perspective: "1000px" }}>
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className={`absolute inset-0 group p-2.5 rounded-lg bg-gradient-to-br ${style.gradient} border border-border/40`}
          style={{
            backfaceVisibility: "hidden",
            pointerEvents: isFlipped ? "none" : "auto",
          }}
        >
          {showActions && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(asset)}
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-accent hover:bg-accent/10"
                >
                  <Icon icon="solar:pen-linear" width={10} height={10} />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Icon icon="solar:trash-bin-trash-linear" width={10} height={10} />
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              {asset.type === "crypto" && asset.symbol && <CryptoAvatar symbol={asset.symbol} />}
              <div className="min-w-0 flex-1">
                {asset.type === "stock" && asset.symbol ? (
                  <>
                    <h3
                      className={`font-semibold text-sm text-foreground truncate ${showActions ? "pr-8" : ""}`}
                    >
                      {asset.symbol.toUpperCase()}
                    </h3>
                    <p className="text-[10px] text-muted-foreground truncate">{asset.name}</p>
                  </>
                ) : (
                  <>
                    <h3
                      className={`font-semibold text-sm text-foreground truncate ${showActions ? "pr-8" : ""}`}
                    >
                      {asset.type === "crypto" && asset.symbol
                        ? getCryptoBySymbol(asset.symbol)?.name || asset.name
                        : asset.name}
                    </h3>
                    {asset.symbol && (
                      <p className="text-[10px] text-muted-foreground uppercase">{asset.symbol}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                  {t("assets:qty")}
                </span>
                <div className="flex items-center">
                  {onQuantityChange && asset.type !== "crypto" && (
                    <div className="w-0 group-hover:w-5 overflow-hidden transition-all duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDecrement}
                        disabled={!canDecrement}
                        className="h-5 w-5 p-0 mt-0.5 text-muted-foreground hover:text-accent hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                      >
                        <Icon icon="solar:minus-circle-linear" width={12} height={12} />
                      </Button>
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {asset.quantity.toLocaleString(undefined, {
                      maximumFractionDigits: asset.type === "crypto" ? 4 : 2,
                    })}
                  </span>
                  {onQuantityChange && asset.type !== "crypto" && (
                    <div className="w-0 group-hover:w-5 overflow-hidden transition-all duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleIncrement}
                        className="h-5 w-5 p-0 mt-0.5 text-muted-foreground hover:text-accent hover:bg-accent/10"
                      >
                        <Icon icon="solar:add-circle-linear" width={12} height={12} />
                      </Button>
                    </div>
                  )}
                </div>
                {asset.type === "crypto" &&
                  asset.stakedQuantity != null &&
                  asset.stakedQuantity > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Icon
                        icon="solar:lock-linear"
                        width={10}
                        height={10}
                        className="text-muted-foreground"
                      />
                      <span className="text-[9px] text-muted-foreground">
                        {t("assets:stakedOf", {
                          staked: asset.stakedQuantity.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          }),
                        })}
                      </span>
                    </div>
                  )}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                  {t("assets:value")}
                </span>
                <span className="text-sm font-bold text-accent">
                  {displayValue > 0 ? (
                    <SlotMachineNumber
                      value={formatCurrency(displayValue, displayCurrency)}
                      duration={500}
                      staggerMs={20}
                    />
                  ) : (
                    "-"
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 p-2.5 rounded-lg bg-gradient-to-br from-red-950 to-red-900 border border-red-800/60 flex flex-col items-center justify-center gap-3"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-red-200 text-xs font-medium text-center px-2 truncate max-w-full">
            {t("assets:deleteConfirm", { name: asset.name })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelDelete}
              className="h-7 px-3 text-xs text-red-200 hover:text-white hover:bg-red-800/50"
            >
              {t("common:cancel")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConfirmDelete}
              className="h-7 px-3 text-xs bg-red-700 text-white hover:bg-red-600 hover:text-white"
            >
              {t("common:confirm")}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
