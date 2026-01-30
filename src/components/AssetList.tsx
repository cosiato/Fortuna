'use client';

import { Asset } from '@/lib/db';
import { PriceResult } from '@/lib/prices';
import { SupportedCurrency, formatCurrency } from '@/lib/currency';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface AssetListProps {
  assets: Asset[];
  prices: { [symbol: string]: PriceResult };
  exchangeRates: { [currency: string]: number };
  displayCurrency: SupportedCurrency;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

interface CategoryConfig {
  key: string;
  label: string;
  icon: string;
  gradient: string;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'crypto', label: 'Crypto', icon: 'C', gradient: 'from-purple-500/20 to-purple-900/20' },
  { key: 'stock', label: 'Stocks', icon: 'S', gradient: 'from-amber-500/20 to-amber-900/20' },
  { key: 'real_estate', label: 'Real Estate', icon: 'H', gradient: 'from-emerald-500/20 to-emerald-900/20' },
  { key: 'other', label: 'Other', icon: 'O', gradient: 'from-slate-500/20 to-slate-900/20' },
];

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

function getCategoryTotal(
  assets: Asset[],
  prices: { [symbol: string]: PriceResult },
  exchangeRates: { [currency: string]: number },
  displayCurrency: SupportedCurrency
): number {
  return assets.reduce((total, asset) => {
    const { value, currency } = getAssetValue(asset, prices);
    const convertedValue = convertValue(value, currency, displayCurrency, exchangeRates);
    return total + convertedValue;
  }, 0);
}

interface AssetCardProps {
  asset: Asset;
  prices: { [symbol: string]: PriceResult };
  exchangeRates: { [currency: string]: number };
  displayCurrency: SupportedCurrency;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

function AssetCard({
  asset,
  prices,
  exchangeRates,
  displayCurrency,
  onEdit,
  onDelete,
}: AssetCardProps) {
  const { value, currency } = getAssetValue(asset, prices);
  const displayValue = convertValue(value, currency, displayCurrency, exchangeRates);
  const priceKey = asset.symbol?.toLowerCase() || asset.symbol?.toUpperCase() || '';
  const priceData = prices[priceKey] || prices[asset.symbol?.toUpperCase() || ''];
  const unitPrice = asset.manualPrice || priceData?.price || 0;

  return (
    <div className="group flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50 hover:border-accent/30 hover:bg-card/80 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
          <span className="text-accent font-bold text-sm">
            {asset.symbol?.slice(0, 2).toUpperCase() || asset.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium text-foreground">{asset.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {asset.symbol && (
              <span className="uppercase">{asset.symbol}</span>
            )}
            <span>x{asset.quantity.toLocaleString()}</span>
            {unitPrice > 0 && (
              <span>@ {formatCurrency(unitPrice, 'USD')}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold text-accent">
            {displayValue > 0 ? formatCurrency(displayValue, displayCurrency) : '-'}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(asset)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(asset.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}

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
      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No assets yet. Add your first asset to get started!</p>
        </CardContent>
      </Card>
    );
  }

  const assetsByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category.key] = assets.filter((asset) => asset.type === category.key);
    return acc;
  }, {} as { [key: string]: Asset[] });

  const nonEmptyCategories = CATEGORIES.filter(
    (category) => assetsByCategory[category.key].length > 0
  );

  return (
    <Accordion
      type="multiple"
      defaultValue={nonEmptyCategories.map((c) => c.key)}
      className="space-y-3"
    >
      {nonEmptyCategories.map((category) => {
        const categoryAssets = assetsByCategory[category.key];
        const categoryTotal = getCategoryTotal(
          categoryAssets,
          prices,
          exchangeRates,
          displayCurrency
        );

        return (
          <AccordionItem
            key={category.key}
            value={category.key}
            className={`border border-border/50 rounded-xl overflow-hidden bg-gradient-to-r ${category.gradient}`}
          >
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-white/5">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-bold text-xs">{category.icon}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{category.label}</span>
                    <span className="text-sm text-muted-foreground">
                      ({categoryAssets.length} {categoryAssets.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                </div>
                <span className="font-bold text-accent">
                  {formatCurrency(categoryTotal, displayCurrency)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="space-y-2">
                {categoryAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    prices={prices}
                    exchangeRates={exchangeRates}
                    displayCurrency={displayCurrency}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
