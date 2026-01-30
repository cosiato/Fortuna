'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/lib/db';
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

interface AssetFormProps {
  asset?: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Asset>) => void;
}

const ASSET_TYPES = [
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'stock', label: 'Stock' },
  { value: 'real_estate', label: 'House / Real Estate' },
  { value: 'other', label: 'Other' },
];

export default function AssetForm({ asset, open, onOpenChange, onSubmit }: AssetFormProps) {
  const [name, setName] = useState(asset?.name || '');
  const [type, setType] = useState<Asset['type']>(asset?.type || 'stock');
  const [symbol, setSymbol] = useState(asset?.symbol || '');
  const [quantity, setQuantity] = useState(asset?.quantity?.toString() || '1');
  const [manualPrice, setManualPrice] = useState(asset?.manualPrice?.toString() || '');
  const [currency, setCurrency] = useState(asset?.currency || 'USD');

  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setType(asset.type || 'stock');
      setSymbol(asset.symbol || '');
      setQuantity(asset.quantity?.toString() || '1');
      setManualPrice(asset.manualPrice?.toString() || '');
      setCurrency(asset.currency || 'USD');
    } else {
      setName('');
      setType('stock');
      setSymbol('');
      setQuantity('1');
      setManualPrice('');
      setCurrency('USD');
    }
  }, [asset, open]);

  const isEditing = !!asset;
  const requiresSymbol = type === 'stock' || type === 'crypto';
  const requiresManualPrice = type === 'real_estate' || type === 'other';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      symbol: requiresSymbol ? symbol : null,
      quantity: parseFloat(quantity) || 0,
      manualPrice: requiresManualPrice ? parseFloat(manualPrice) || null : null,
      currency,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Asset' : 'Add New Asset'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Apple Stock, Bitcoin, House"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(val) => setType(val as Asset['type'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresSymbol && (
            <div className="space-y-2">
              <Label htmlFor="symbol">
                {type === 'stock' ? 'Ticker Symbol' : 'Coin ID'}
              </Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder={type === 'stock' ? 'e.g., AAPL, GOOGL' : 'e.g., bitcoin, ethereum'}
                required
              />
              {type === 'crypto' && (
                <p className="text-xs text-muted-foreground">
                  Use CoinGecko coin IDs (lowercase)
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
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
              <Label htmlFor="manualPrice">Value (in {currency})</Label>
              <Input
                id="manualPrice"
                type="number"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                step="any"
                min="0"
                placeholder="Enter current value"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
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
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {isEditing ? 'Update' : 'Add Asset'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
