import { NextRequest, NextResponse } from 'next/server';
import { getAllSnapshots, createSnapshot, getTodaySnapshot } from '@/lib/db';

export async function GET() {
  try {
    const snapshots = await getAllSnapshots();
    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { totalValue, currency } = body;

    if (totalValue === undefined || totalValue === null) {
      return NextResponse.json(
        { error: 'totalValue is required' },
        { status: 400 }
      );
    }

    const todaySnapshot = await getTodaySnapshot();
    if (todaySnapshot) {
      return NextResponse.json(
        { message: 'Snapshot already exists for today', snapshot: todaySnapshot },
        { status: 200 }
      );
    }

    const snapshot = await createSnapshot({
      totalValue,
      currency: currency || 'USD',
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}
