import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/better-auth/auth';
import {
  addWatchlistItem,
  getWatchlistByUserId,
} from '@/lib/actions/watchlist.actions';
import { fetchJSON } from '@/lib/actions/finnhub.actions';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const getFinnhubToken = () => process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

async function resolveCompanyName(symbol: string): Promise<string> {
  const token = getFinnhubToken();
  if (!token) return symbol;

  try {
    const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`;
    const profile = await fetchJSON<ProfileData>(profileUrl, 3600);
    return profile?.name?.trim() || symbol;
  } catch (err) {
    console.error('resolveCompanyName error:', err);
    return symbol;
  }
}

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await getWatchlistByUserId(userId);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const symbol = String(body?.symbol || '').trim().toUpperCase();
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const company = body?.company ? String(body.company) : await resolveCompanyName(symbol);
    const item = await addWatchlistItem({ userId, symbol, company });

    if (!item) {
      return NextResponse.json({ error: 'Failed to add watchlist item' }, { status: 500 });
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error('POST /api/watchlist error:', err);
    return NextResponse.json({ error: 'Failed to add watchlist item' }, { status: 500 });
  }
}
