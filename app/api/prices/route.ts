import { NextRequest, NextResponse } from 'next/server';
import { getMultiplePrices } from '@/lib/prices';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbols = searchParams.get('symbols');
  const type = searchParams.get('type') as 'stock' | 'crypto' | null;

  if (!symbols) {
    return NextResponse.json(
      { error: 'symbols parameter is required' },
      { status: 400 }
    );
  }

  const symbolList = symbols.split(',').map((s) => s.trim()).filter(Boolean);

  if (symbolList.length === 0) {
    return NextResponse.json(
      { error: 'At least one symbol is required' },
      { status: 400 }
    );
  }

  try {
    if (type) {
      const prices = await getMultiplePrices(
        symbolList.map((symbol) => ({ symbol, type }))
      );
      return NextResponse.json({ prices });
    }

    // If no type specified, try to determine from symbol format
    // Crypto IDs are lowercase words (bitcoin, ethereum)
    // Stock symbols are uppercase (AAPL, GOOGL)
    const prices = await getMultiplePrices(
      symbolList.map((symbol) => ({
        symbol,
        type: symbol === symbol.toUpperCase() ? 'stock' : 'crypto',
      }))
    );

    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
