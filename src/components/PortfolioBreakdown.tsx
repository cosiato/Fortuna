'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Asset } from '@/lib/db';
import { PriceResult } from '@/lib/prices';
import { SupportedCurrency, formatCurrency } from '@/lib/currency';
import { Card, CardContent } from '@/components/ui/card';

interface PortfolioBreakdownProps {
  assets: Asset[];
  prices: { [symbol: string]: PriceResult };
  exchangeRates: { [currency: string]: number };
  displayCurrency: SupportedCurrency;
}

const COLORS = ['#1A1F3D', '#C9A227', '#2D6A4F', '#8B2635', '#6B7280'];
const TYPE_LABELS: { [key: string]: string } = {
  stock: 'Stocks',
  crypto: 'Crypto',
  real_estate: 'Real Estate',
  cash: 'Cash',
  other: 'Other',
};

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

export default function PortfolioBreakdown({
  assets,
  prices,
  exchangeRates,
  displayCurrency,
}: PortfolioBreakdownProps) {
  const typeValues: { [key: string]: number } = {
    stock: 0,
    crypto: 0,
    real_estate: 0,
    cash: 0,
    other: 0,
  };

  assets.forEach((asset) => {
    const { value, currency } = getAssetValue(asset, prices);
    const convertedValue = convertValue(value, currency, displayCurrency, exchangeRates);
    typeValues[asset.type] += convertedValue;
  });

  const data = Object.entries(typeValues)
    .filter(([, value]) => value > 0)
    .map(([type, value]) => ({
      name: TYPE_LABELS[type],
      value,
    }));

  if (data.length === 0) {
    return (
      <Card className="h-64">
        <CardContent className="h-full flex items-center justify-center p-8">
          <p className="text-muted-foreground">Add assets to see your portfolio breakdown.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-64">
      <CardContent className="h-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(26, 31, 61, 0.06)',
              }}
              formatter={(value) => formatCurrency(value as number, displayCurrency)}
            />
            <Legend
              formatter={(value) => <span className="text-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
