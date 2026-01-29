'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import CurrencySelector from '@/components/CurrencySelector';
import AssetList from '@/components/AssetList';
import AssetForm from '@/components/AssetForm';
import { Asset } from '@/lib/db';
import { PriceResult } from '@/lib/prices';
import { SupportedCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [prices, setPrices] = useState<{ [symbol: string]: PriceResult }>({});
  const [exchangeRates, setExchangeRates] = useState<{ [currency: string]: number }>({
    USD: 1,
    EUR: 0.92,
    BTC: 0.000024,
  });
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>('USD');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('displayCurrency');
    if (saved && ['USD', 'EUR', 'BTC'].includes(saved)) {
      setDisplayCurrency(saved as SupportedCurrency);
    }
  }, []);

  const handleCurrencyChange = (currency: SupportedCurrency) => {
    setDisplayCurrency(currency);
    localStorage.setItem('displayCurrency', currency);
  };

  const fetchData = useCallback(async () => {
    try {
      const [assetsRes, ratesRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/exchange-rates'),
      ]);

      const assetsData = await assetsRes.json();
      const ratesData = await ratesRes.json();

      setAssets(assetsData);
      setExchangeRates(ratesData.rates || { USD: 1, EUR: 0.92, BTC: 0.000024 });

      const tradeableAssets = assetsData.filter(
        (a: Asset) => (a.type === 'stock' || a.type === 'crypto') && a.symbol
      );

      if (tradeableAssets.length > 0) {
        const stockSymbols = tradeableAssets
          .filter((a: Asset) => a.type === 'stock')
          .map((a: Asset) => a.symbol);
        const cryptoSymbols = tradeableAssets
          .filter((a: Asset) => a.type === 'crypto')
          .map((a: Asset) => a.symbol);

        const pricePromises: Promise<Response>[] = [];

        if (stockSymbols.length > 0) {
          pricePromises.push(
            fetch(`/api/prices?symbols=${stockSymbols.join(',')}&type=stock`)
          );
        }
        if (cryptoSymbols.length > 0) {
          pricePromises.push(
            fetch(`/api/prices?symbols=${cryptoSymbols.join(',')}&type=crypto`)
          );
        }

        const priceResponses = await Promise.all(pricePromises);
        const pricesMap: { [symbol: string]: PriceResult } = {};

        for (const res of priceResponses) {
          const data = await res.json();
          if (data.prices) {
            for (const p of data.prices) {
              pricesMap[p.symbol.toLowerCase()] = p;
              pricesMap[p.symbol.toUpperCase()] = p;
            }
          }
        }

        setPrices(pricesMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddAsset = async (data: Partial<Asset>) => {
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowForm(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  };

  const handleEditAsset = async (data: Partial<Asset>) => {
    if (!editingAsset) return;

    try {
      const res = await fetch(`/api/assets/${editingAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setEditingAsset(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating asset:', error);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Back
            </Link>
            <h1 className="text-2xl font-bold">Assets</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowForm(true)}>
              Add Asset
            </Button>
            <CurrencySelector value={displayCurrency} onChange={handleCurrencyChange} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AssetList
          assets={assets}
          prices={prices}
          exchangeRates={exchangeRates}
          displayCurrency={displayCurrency}
          onEdit={setEditingAsset}
          onDelete={handleDeleteAsset}
        />
      </main>

      <AssetForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleAddAsset}
      />

      <AssetForm
        asset={editingAsset}
        open={!!editingAsset}
        onOpenChange={(open) => !open && setEditingAsset(null)}
        onSubmit={handleEditAsset}
      />
    </div>
  );
}
