'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import CurrencySelector from '@/components/CurrencySelector';
import NetWorthChart from '@/components/NetWorthChart';
import PortfolioBreakdown from '@/components/PortfolioBreakdown';
import { Asset, Snapshot } from '@/lib/db';
import { PriceResult } from '@/lib/prices';
import { SupportedCurrency, formatCurrency } from '@/lib/currency';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [prices, setPrices] = useState<{ [symbol: string]: PriceResult }>({});
  const [exchangeRates, setExchangeRates] = useState<{ [currency: string]: number }>({
    USD: 1,
    EUR: 0.92,
    BTC: 0.000024,
  });
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>('USD');
  const [loading, setLoading] = useState(true);

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
      const [assetsRes, snapshotsRes, ratesRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/snapshots'),
        fetch('/api/exchange-rates'),
      ]);

      const assetsData = await assetsRes.json();
      const snapshotsData = await snapshotsRes.json();
      const ratesData = await ratesRes.json();

      setAssets(assetsData);
      setSnapshots(snapshotsData);
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

  const calculateNetWorth = () => {
    let totalInUsd = 0;

    for (const asset of assets) {
      let value = 0;
      let currency = asset.currency;

      if (asset.manualPrice !== null) {
        value = asset.manualPrice * asset.quantity;
      } else if (asset.symbol) {
        const priceKey = asset.symbol.toLowerCase();
        const priceData = prices[priceKey] || prices[asset.symbol.toUpperCase()];
        if (priceData && priceData.price > 0) {
          value = priceData.price * asset.quantity;
          currency = priceData.currency;
        }
      }

      if (currency !== 'USD' && exchangeRates[currency]) {
        value = value / exchangeRates[currency];
      }

      totalInUsd += value;
    }

    if (displayCurrency !== 'USD' && exchangeRates[displayCurrency]) {
      return totalInUsd * exchangeRates[displayCurrency];
    }

    return totalInUsd;
  };

  const netWorth = calculateNetWorth();

  useEffect(() => {
    if (!loading && assets.length > 0) {
      const recordSnapshot = async () => {
        try {
          await fetch('/api/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              totalValue: netWorth,
              currency: 'USD',
            }),
          });
        } catch (error) {
          console.error('Error recording snapshot:', error);
        }
      };
      recordSnapshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, assets.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-vignette pointer-events-none" />
      <header className="border-b border-border px-6 py-4 relative">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-accent">Fortuna</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/assets"
              className="text-muted-foreground hover:text-accent transition-colors"
            >
              Manage Assets
            </Link>
            <CurrencySelector value={displayCurrency} onChange={handleCurrencyChange} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 relative">
        <Card className="gradient-border bg-primary mb-8 hover:shadow-glow-gold/30">
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm font-medium mb-1">Power Level</p>
            <p className="text-4xl font-bold text-accent font-serif animate-pulse-slow">
              {formatCurrency(netWorth, displayCurrency)}
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              {assets.length} asset{assets.length !== 1 ? 's' : ''} in inventory
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground">Net Worth Over Time</h2>
            <NetWorthChart
              snapshots={snapshots}
              displayCurrency={displayCurrency}
              exchangeRates={exchangeRates}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground">Portfolio Breakdown</h2>
            <PortfolioBreakdown
              assets={assets}
              prices={prices}
              exchangeRates={exchangeRates}
              displayCurrency={displayCurrency}
            />
          </div>
        </div>

        <Button asChild variant="secondary" className="w-full hover:border-accent">
          <Link href="/assets">
            <div className="text-center py-2">
              <p className="font-medium">View Inventory</p>
              <p className="text-sm text-muted-foreground mt-1">Manage your assets</p>
            </div>
          </Link>
        </Button>
      </main>
    </div>
  );
}
