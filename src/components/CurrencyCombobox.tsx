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
import { CURRENCY_GROUPS, CURRENCY_INFO, type SupportedCurrency } from "@/lib/currency"
import CountryFlag from "@/components/CountryFlag"

const CONTINENT_KEY_MAP: Record<string, string> = {
  "North America": "continent.northAmerica",
  "South America": "continent.southAmerica",
  Europe: "continent.europe",
  Asia: "continent.asia",
  Africa: "continent.africa",
  Oceania: "continent.oceania",
  Digital: "continent.digital",
}

interface CurrencyComboboxProps {
  value: string
  onChange: (currency: string) => void
  exclude?: readonly string[]
}

export default function CurrencyCombobox({ value, onChange, exclude = [] }: CurrencyComboboxProps) {
  const { t } = useTranslation("common")
  const [open, setOpen] = useState(false)

  const info = CURRENCY_INFO[value as SupportedCurrency]

  const filteredGroups = CURRENCY_GROUPS.map((group) => ({
    ...group,
    currencies: group.currencies.filter((code) => !exclude.includes(code)),
  })).filter((group) => group.currencies.length > 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {info ? (
            <span className="flex items-center gap-2">
              <CountryFlag code={info.flagCode} />
              <span className="mt-px">
                {value} - {info.name}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{t("selectCurrency")}</span>
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
          <CommandInput placeholder={t("searchByCodeOrName")} />
          <CommandList>
            <CommandEmpty>{t("noCurrenciesMatch")}</CommandEmpty>
            {filteredGroups.map((group) => (
              <CommandGroup
                key={group.continent}
                heading={t(CONTINENT_KEY_MAP[group.continent] as any)}
              >
                {group.currencies.map((code) => {
                  const currencyInfo = CURRENCY_INFO[code]
                  return (
                    <CommandItem
                      key={code}
                      value={`${code} ${currencyInfo.name}`}
                      onSelect={() => {
                        onChange(code)
                        setOpen(false)
                      }}
                    >
                      <Icon
                        icon="solar:check-circle-linear"
                        width={16}
                        height={16}
                        className={cn("mr-2 h-4 w-4", value === code ? "opacity-100" : "opacity-0")}
                      />
                      <span className="flex items-center gap-2">
                        <CountryFlag code={currencyInfo.flagCode} />
                        <span className="mt-0.5">
                          {code} - {currencyInfo.name}
                        </span>
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
