'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import CurrencySelector from '@/components/CurrencySelector';
import NetWorthChart from '@/components/NetWorthChart';
import PortfolioBreakdown from '@/components/PortfolioBreakdown';
import { Asset, Snapshot } from '@/lib/db';
import { PriceResult } from '@/lib/prices';
import { SupportedCurrency, formatCurrency } from '@/lib/currency';

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

      // Fetch prices for tradeable assets
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

  // Calculate total net worth
  const calculateNetWorth = () => {
    let totalInUsd = 0;

    for (const asset of assets) {
      let value = 0;
      let currency = asset.currency;

      if (asset.manual_price !== null) {
        value = asset.manual_price * asset.quantity;
      } else if (asset.symbol) {
        const priceKey = asset.symbol.toLowerCase();
        const priceData = prices[priceKey] || prices[asset.symbol.toUpperCase()];
        if (priceData && priceData.price > 0) {
          value = priceData.price * asset.quantity;
          currency = priceData.currency;
        }
      }

      // Convert to USD
      if (currency !== 'USD' && exchangeRates[currency]) {
        value = value / exchangeRates[currency];
      }

      totalInUsd += value;
    }

    // Convert to display currency
    if (displayCurrency !== 'USD' && exchangeRates[displayCurrency]) {
      return totalInUsd * exchangeRates[displayCurrency];
    }

    return totalInUsd;
  };

  const netWorth = calculateNetWorth();

  // Record daily snapshot
  useEffect(() => {
    if (!loading && assets.length > 0) {
      const recordSnapshot = async () => {
        try {
          await fetch('/api/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              total_value: netWorth,
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Fortuna</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/assets"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Manage Assets
            </Link>
            <CurrencySelector value={displayCurrency} onChange={handleCurrencyChange} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Net Worth Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8">
          <p className="text-blue-100 text-sm font-medium mb-1">Total Net Worth</p>
          <p className="text-4xl font-bold text-white">
            {formatCurrency(netWorth, displayCurrency)}
          </p>
          <p className="text-blue-100 text-sm mt-2">
            {assets.length} asset{assets.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Net Worth Over Time</h2>
            <NetWorthChart
              snapshots={snapshots}
              displayCurrency={displayCurrency}
              exchangeRates={exchangeRates}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Portfolio Breakdown</h2>
            <PortfolioBreakdown
              assets={assets}
              prices={prices}
              exchangeRates={exchangeRates}
              displayCurrency={displayCurrency}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Link
            href="/assets"
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl p-4 text-center transition-colors"
          >
            <p className="font-medium">View All Assets</p>
            <p className="text-sm text-gray-400 mt-1">Manage your portfolio</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
