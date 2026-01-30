'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_CURRENCIES, CURRENCY_INFO, SupportedCurrency } from '@/lib/currency';

interface CurrencySelectorProps {
  value: SupportedCurrency;
  onChange: (currency: SupportedCurrency) => void;
}

export default function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  return (
    <Select value={value} onValueChange={(val) => onChange(val as SupportedCurrency)}>
      <SelectTrigger className="w-28">
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <span>{CURRENCY_INFO[value].flag}</span>
            <span>{value}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((currency) => (
          <SelectItem key={currency} value={currency}>
            <span className="flex items-center gap-2">
              <span>{CURRENCY_INFO[currency].flag}</span>
              <span>{currency}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
