import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/better-auth/auth';
import { addPortfolioHolding, getPortfolioByUserId } from '@/lib/actions/portfolio.actions';

async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await getPortfolioByUserId(userId);
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
    const buyPrice = Number(body?.buyPrice);
    const quantity = Number(body?.quantity);

    if (!symbol || !Number.isFinite(buyPrice) || !Number.isFinite(quantity)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const item = await addPortfolioHolding({ userId, symbol, buyPrice, quantity });
    if (!item) {
      return NextResponse.json({ error: 'Failed to add holding' }, { status: 500 });
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error('POST /api/portfolio error:', err);
    return NextResponse.json({ error: 'Failed to add holding' }, { status: 500 });
  }
}
