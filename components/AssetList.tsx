'use client';

import { Asset } from '@/lib/db';
import { PriceResult } from '@/lib/prices';
import { SupportedCurrency, formatCurrency } from '@/lib/currency';

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
  if (asset.manual_price !== null) {
    return { value: asset.manual_price * asset.quantity, currency: asset.currency };
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
  stock: 'bg-blue-500',
  crypto: 'bg-orange-500',
  real_estate: 'bg-green-500',
  cash: 'bg-yellow-500',
  other: 'bg-gray-500',
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
      <div className="bg-gray-900 rounded-xl p-8 text-center">
        <p className="text-gray-400">No assets yet. Add your first asset to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Asset</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Type</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Quantity</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Price</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Value</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const { value, currency } = getAssetValue(asset, prices);
            const displayValue = convertValue(value, currency, displayCurrency, exchangeRates);
            const priceKey = asset.symbol?.toLowerCase() || asset.symbol?.toUpperCase() || '';
            const priceData = prices[priceKey] || prices[asset.symbol?.toUpperCase() || ''];
            const unitPrice = asset.manual_price || priceData?.price || 0;

            return (
              <tr key={asset.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{asset.name}</p>
                    {asset.symbol && (
                      <p className="text-sm text-gray-400">{asset.symbol.toUpperCase()}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${TYPE_COLORS[asset.type]}`}
                  >
                    {TYPE_LABELS[asset.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-white">
                  {asset.quantity.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-white">
                  {unitPrice > 0 ? formatCurrency(unitPrice, 'USD') : '-'}
                </td>
                <td className="px-4 py-3 text-right font-medium text-white">
                  {displayValue > 0 ? formatCurrency(displayValue, displayCurrency) : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onEdit(asset)}
                    className="text-blue-400 hover:text-blue-300 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(asset.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
