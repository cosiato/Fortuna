import { NextRequest, NextResponse } from 'next/server';
import { getAllAssets, createAsset, AssetType } from '@/lib/db';

export async function GET() {
  try {
    const assets = await getAllAssets();
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, type, symbol, quantity, manualPrice, currency } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const validTypes: AssetType[] = ['stock', 'crypto', 'real_estate', 'cash', 'other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid asset type' },
        { status: 400 }
      );
    }

    const asset = await createAsset({
      name,
      type,
      symbol: symbol || null,
      quantity: quantity || 0,
      manualPrice: manualPrice ?? null,
      currency: currency || 'USD',
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}
