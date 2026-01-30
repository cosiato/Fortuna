'use client';

import { useState, useEffect } from 'react';
import { Account, AccountType } from '@/lib/db';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_CURRENCIES, CURRENCY_INFO, SupportedCurrency } from '@/lib/currency';
import CountrySelector from '@/components/CountrySelector';

interface AccountFormProps {
  account?: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Account>) => void;
  defaultType: AccountType;
}

export default function AccountForm({
  account,
  open,
  onOpenChange,
  onSubmit,
  defaultType,
}: AccountFormProps) {
  const [name, setName] = useState(account?.name ?? '');
  const [balance, setBalance] = useState(account?.balance?.toString() ?? '');
  const [currency, setCurrency] = useState(account?.currency ?? 'USD');
  const [countryCode, setCountryCode] = useState(account?.countryCode ?? '');

  useEffect(() => {
    if (account) {
      setName(account.name ?? '');
      setBalance(account.balance?.toString() ?? '');
      setCurrency(account.currency ?? 'USD');
      setCountryCode(account.countryCode ?? '');
    } else {
      setName('');
      setBalance('');
      setCurrency('USD');
      setCountryCode('');
    }
  }, [account, open]);

  const isEditing = !!account;
  const typeLabel = defaultType === 'personal' ? 'Vault' : 'Factory';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      accountType: defaultType,
      balance: parseFloat(balance) || 0,
      currency,
      countryCode,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${typeLabel}` : `Add New ${typeLabel}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g., ${defaultType === 'personal' ? 'Main Savings, Emergency Fund' : 'Company Treasury, Revenue Account'}`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Cash Value</Label>
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
            <Label htmlFor="currency">Currency</Label>
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
                {SUPPORTED_CURRENCIES.filter((c) => c !== 'BTC').map((c) => (
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

          <div className="space-y-2">
            <Label htmlFor="country">Location</Label>
            <CountrySelector value={countryCode} onChange={setCountryCode} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!countryCode}>
              {isEditing ? 'Update' : `Add ${typeLabel}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
