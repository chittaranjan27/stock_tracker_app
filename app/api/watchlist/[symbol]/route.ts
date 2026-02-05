import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/better-auth/auth';
import { removeWatchlistItem } from '@/lib/actions/watchlist.actions';

async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { symbol } = await context.params;
  const normalized = String(symbol || '').trim().toUpperCase();
  if (!normalized) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const ok = await removeWatchlistItem(userId, normalized);
  return NextResponse.json({ success: ok });
}
