import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/better-auth/auth';
import { removePortfolioHolding, updatePortfolioHolding } from '@/lib/actions/portfolio.actions';

async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const buyPrice = body?.buyPrice !== undefined ? Number(body.buyPrice) : undefined;
    const quantity = body?.quantity !== undefined ? Number(body.quantity) : undefined;

    const ok = await updatePortfolioHolding({ userId, id, buyPrice, quantity });
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('PATCH /api/portfolio/:id error:', err);
    return NextResponse.json({ error: 'Failed to update holding' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const ok = await removePortfolioHolding(userId, id);
  return NextResponse.json({ success: ok });
}
