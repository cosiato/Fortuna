'use client';

import { Asset } from '@/lib/db';
import { PriceResult } from '@/lib/prices';
import { SupportedCurrency, formatCurrency } from '@/lib/currency';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AssetListProps {
  assets: Asset[];
  prices: { [symbol: string]: PriceResult };
  exchangeRates: { [currency: string]: number };
  displayCurrency: SupportedCurrency;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

function getAssetValue(
  asset: Asset,
  prices: { [symbol: string]: PriceResult }
): { value: number; currency: string } {
  if (asset.manualPrice !== null) {
    return { value: asset.manualPrice * asset.quantity, currency: asset.currency };
  }

  const priceKey = asset.symbol?.toLowerCase() || '';
  const priceData = prices[priceKey] || prices[asset.symbol?.toUpperCase() || ''];

  if (priceData && priceData.price > 0) {
    return { value: priceData.price * asset.quantity, currency: priceData.currency };
  }

  return { value: 0, currency: asset.currency };
}

function convertValue(
  value: number,
  fromCurrency: string,
  toCurrency: string,
  rates: { [currency: string]: number }
): number {
  if (fromCurrency === toCurrency) return value;

  let valueInUsd = value;
  if (fromCurrency !== 'USD') {
    const fromRate = rates[fromCurrency];
    if (fromRate && fromRate > 0) {
      valueInUsd = value / fromRate;
    }
  }

  const toRate = rates[toCurrency];
  if (toRate && toRate > 0) {
    return valueInUsd * toRate;
  }

  return valueInUsd;
}

const TYPE_LABELS: { [key: string]: string } = {
  stock: 'Stock',
  crypto: 'Crypto',
  real_estate: 'Real Estate',
  cash: 'Cash',
  other: 'Other',
};

const TYPE_COLORS: { [key: string]: string } = {
  stock: 'bg-blue-500 hover:bg-blue-500',
  crypto: 'bg-orange-500 hover:bg-orange-500',
  real_estate: 'bg-green-500 hover:bg-green-500',
  cash: 'bg-yellow-500 hover:bg-yellow-500',
  other: 'bg-gray-500 hover:bg-gray-500',
};

export default function AssetList({
  assets,
  prices,
  exchangeRates,
  displayCurrency,
  onEdit,
  onDelete,
}: AssetListProps) {
  if (assets.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No assets yet. Add your first asset to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => {
            const { value, currency } = getAssetValue(asset, prices);
            const displayValue = convertValue(value, currency, displayCurrency, exchangeRates);
            const priceKey = asset.symbol?.toLowerCase() || asset.symbol?.toUpperCase() || '';
            const priceData = prices[priceKey] || prices[asset.symbol?.toUpperCase() || ''];
            const unitPrice = asset.manualPrice || priceData?.price || 0;

            return (
              <TableRow key={asset.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    {asset.symbol && (
                      <p className="text-sm text-muted-foreground">{asset.symbol.toUpperCase()}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${TYPE_COLORS[asset.type]} text-white border-0`}>
                    {TYPE_LABELS[asset.type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {asset.quantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {unitPrice > 0 ? formatCurrency(unitPrice, 'USD') : '-'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {displayValue > 0 ? formatCurrency(displayValue, displayCurrency) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(asset)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(asset.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
