import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CRYPTOCURRENCIES, getCryptoBySymbol } from '@/lib/cryptocurrencies';

interface CryptoSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
}

export default function CryptoSelector({ value, onChange }: CryptoSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedCrypto = getCryptoBySymbol(value);

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
            <span className="text-muted-foreground">Select cryptocurrency</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search cryptocurrency..." />
          <CommandList>
            <CommandEmpty>No cryptocurrency found.</CommandEmpty>
            <CommandGroup>
              {CRYPTOCURRENCIES.map((crypto) => (
                <CommandItem
                  key={crypto.id}
                  value={`${crypto.name} ${crypto.symbol} ${crypto.id}`}
                  onSelect={() => {
                    onChange(crypto.symbol);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value.toUpperCase() === crypto.symbol.toUpperCase() ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex items-center gap-2">
                    <img
                      src={crypto.logo}
                      alt={crypto.name}
                      className="w-5 h-5 rounded-full"
                    />
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
  );
}
