import { NextRequest, NextResponse } from 'next/server';
import { getAllAccounts, createAccount, AccountType } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as AccountType | null;

    const validTypes: AccountType[] = ['personal', 'business'];
    const accountType = type && validTypes.includes(type) ? type : undefined;

    const accounts = await getAllAccounts(accountType);
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

    const { name, accountType, balance, currency, countryCode } = body;

    if (!name || !accountType || !countryCode) {
      return NextResponse.json(
        { error: 'Name, accountType, and countryCode are required' },
        { status: 400 }
      );
    }

    const validTypes: AccountType[] = ['personal', 'business'];
    if (!validTypes.includes(accountType)) {
      return NextResponse.json(
        { error: 'Invalid account type. Must be "personal" or "business"' },
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
      accountType,
      balance: balance ?? 0,
      currency: currency || 'USD',
      countryCode: countryCode.toUpperCase(),
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
