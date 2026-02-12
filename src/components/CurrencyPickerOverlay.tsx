import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "@iconify/react"
import {
  CURRENCY_GROUPS,
  CURRENCY_INFO,
  type SupportedCurrency,
} from "@/lib/currency"

interface CurrencyPickerOverlayProps {
  open: boolean
  value: SupportedCurrency
  onSelect: (currency: SupportedCurrency) => void
  onClose: () => void
}

export default function CurrencyPickerOverlay({
  open,
  value,
  onSelect,
  onClose,
}: CurrencyPickerOverlayProps) {
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSearch("")
      // Small delay to ensure the overlay is mounted before focusing
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  const query = search.trim().toLowerCase()

  const filteredGroups = useMemo(() => {
    if (!query) return CURRENCY_GROUPS

    return CURRENCY_GROUPS
      .map((group) => ({
        ...group,
        currencies: group.currencies.filter((code) => {
          const info = CURRENCY_INFO[code]
          return (
            code.toLowerCase().includes(query) ||
            info.name.toLowerCase().includes(query)
          )
        }),
      }))
      .filter((group) => group.currencies.length > 0)
  }, [query])

  const handleSelect = (currency: SupportedCurrency) => {
    onSelect(currency)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex flex-col bg-background"
          role="dialog"
          aria-label="Select currency"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Select Currency
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-800/50 transition-colors"
              aria-label="Close"
            >
              <Icon icon="solar:close-circle-linear" width={20} height={20} />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-border/50">
            <div className="relative">
              <Icon
                icon="solar:magnifer-linear"
                width={16}
                height={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code or name..."
                className="w-full pl-9 pr-4 py-2 rounded-md bg-slate-800/50 border border-slate-700/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50"
              />
            </div>
          </div>

          {/* Currency grid */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No currencies match your search.
              </div>
            ) : (
              <div className="space-y-6">
                {filteredGroups.map((group) => (
                  <section key={group.continent}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {group.continent}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {group.currencies.map((code) => {
                        const info = CURRENCY_INFO[code]
                        const isSelected = code === value

                        return (
                          <button
                            key={code}
                            onClick={() => handleSelect(code)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                              isSelected
                                ? "border-accent/60 bg-accent/10 ring-1 ring-accent/30"
                                : "border-slate-800/50 bg-slate-900/20 hover:bg-slate-800/40 hover:border-slate-700/50"
                            }`}
                          >
                            <span className="text-lg leading-none shrink-0">
                              {info.flag}
                            </span>
                            <div className="min-w-0">
                              <span
                                className={`text-sm font-semibold block ${
                                  isSelected
                                    ? "text-accent"
                                    : "text-foreground"
                                }`}
                              >
                                {code}
                              </span>
                              <span className="text-xs text-muted-foreground truncate block">
                                {info.name}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
