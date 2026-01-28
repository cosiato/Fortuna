'use client';

import { useState } from 'react';
import { Asset } from '@/lib/db';

interface AssetFormProps {
  asset?: Asset | null;
  onSubmit: (data: Partial<Asset>) => void;
  onClose: () => void;
}

const ASSET_TYPES = [
  { value: 'stock', label: 'Stock' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

export default function AssetForm({ asset, onSubmit, onClose }: AssetFormProps) {
  const [name, setName] = useState(asset?.name || '');
  const [type, setType] = useState<Asset['type']>(asset?.type || 'stock');
  const [symbol, setSymbol] = useState(asset?.symbol || '');
  const [quantity, setQuantity] = useState(asset?.quantity?.toString() || '1');
  const [manualPrice, setManualPrice] = useState(asset?.manual_price?.toString() || '');
  const [currency, setCurrency] = useState(asset?.currency || 'USD');

  const isEditing = !!asset;
  const requiresSymbol = type === 'stock' || type === 'crypto';
  const requiresManualPrice = type === 'real_estate' || type === 'cash' || type === 'other';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      symbol: requiresSymbol ? symbol : null,
      quantity: parseFloat(quantity) || 0,
      manual_price: requiresManualPrice ? parseFloat(manualPrice) || null : null,
      currency,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-white mb-6">
          {isEditing ? 'Edit Asset' : 'Add New Asset'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Apple Stock, Bitcoin, House"
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Asset['type'])}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {requiresSymbol && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {type === 'stock' ? 'Ticker Symbol' : 'Coin ID'}
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder={type === 'stock' ? 'e.g., AAPL, GOOGL' : 'e.g., bitcoin, ethereum'}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {type === 'crypto' && (
                <p className="text-xs text-gray-500 mt-1">
                  Use CoinGecko coin IDs (lowercase)
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="any"
              min="0"
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {requiresManualPrice && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Value (in {currency})
              </label>
              <input
                type="number"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                step="any"
                min="0"
                placeholder="Enter current value"
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              {isEditing ? 'Update' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
