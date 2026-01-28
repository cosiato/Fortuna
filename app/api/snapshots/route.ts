import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAllSnapshots, createSnapshot, getTodaySnapshot } from '@/lib/db';

export async function GET() {
  try {
    const snapshots = getAllSnapshots();
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
    const { total_value, currency } = body;

    if (total_value === undefined || total_value === null) {
      return NextResponse.json(
        { error: 'total_value is required' },
        { status: 400 }
      );
    }

    // Check if we already have a snapshot for today
    const todaySnapshot = getTodaySnapshot();
    if (todaySnapshot) {
      return NextResponse.json(
        { message: 'Snapshot already exists for today', snapshot: todaySnapshot },
        { status: 200 }
      );
    }

    const snapshot = createSnapshot({
      id: uuidv4(),
      total_value,
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
