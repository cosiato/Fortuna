import { NextRequest, NextResponse } from 'next/server';
import { getAllAccounts, createAccount, prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityIdParam = searchParams.get('entityId');

    if (entityIdParam !== null) {
      const entityId = parseInt(entityIdParam, 10);
      if (isNaN(entityId)) {
        return NextResponse.json(
          { error: 'Invalid entityId parameter' },
          { status: 400 }
        );
      }
      const accounts = await prisma.account.findMany({
        where: { entityId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(accounts);
    }

    const accounts = await getAllAccounts();
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, balance, currency, countryCode, entityId } = body;

    if (!name || !countryCode) {
      return NextResponse.json(
        { error: 'Name and countryCode are required' },
        { status: 400 }
      );
    }

    if (typeof countryCode !== 'string' || countryCode.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid country code. Must be ISO 3166-1 alpha-2 (2 letters)' },
        { status: 400 }
      );
    }

    const account = await createAccount({
      name,
      balance: balance ?? 0,
      currency: currency || 'USD',
      countryCode: countryCode.toUpperCase(),
      entityId: entityId ?? 0,
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create account', details: message },
      { status: 500 }
    );
  }
}
