import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CRYPTOCURRENCIES, getCryptoBySymbol } from "@/lib/cryptocurrencies"

interface CryptoSelectorProps {
  value: string
  onChange: (symbol: string) => void
}

export default function CryptoSelector({ value, onChange }: CryptoSelectorProps) {
  const { t } = useTranslation("common")
  const [open, setOpen] = useState(false)
  const selectedCrypto = getCryptoBySymbol(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedCrypto ? (
            <span className="flex items-center gap-2">
              <img
                src={selectedCrypto.logo}
                alt={selectedCrypto.name}
                className="w-5 h-5 rounded-full"
              />
              <span>{selectedCrypto.name}</span>
              <span className="text-muted-foreground">({selectedCrypto.symbol})</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{t("selectCryptocurrency")}</span>
          )}
          <Icon
            icon="solar:sort-vertical-linear"
            width={16}
            height={16}
            className="ml-2 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={t("searchCryptocurrency")} />
          <CommandList>
            <CommandEmpty>{t("noCryptocurrencyFound")}</CommandEmpty>
            <CommandGroup>
              {CRYPTOCURRENCIES.map((crypto) => (
                <CommandItem
                  key={crypto.id}
                  value={`${crypto.name} ${crypto.symbol} ${crypto.id}`}
                  onSelect={() => {
                    onChange(crypto.symbol)
                    setOpen(false)
                  }}
                >
                  <Icon
                    icon="solar:check-circle-linear"
                    width={16}
                    height={16}
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toUpperCase() === crypto.symbol.toUpperCase()
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <span className="flex items-center gap-2">
                    <img src={crypto.logo} alt={crypto.name} className="w-5 h-5 rounded-full" />
                    <span>{crypto.name}</span>
                    <span className="text-muted-foreground">({crypto.symbol})</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
