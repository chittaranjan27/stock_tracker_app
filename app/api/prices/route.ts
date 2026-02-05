import { NextRequest, NextResponse } from 'next/server';
import { fetchJSON } from '@/lib/actions/finnhub.actions';

export const runtime = 'nodejs';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const getToken = () => process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('symbols') || '';
  const symbols = raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (!symbols.length) {
    return NextResponse.json({ error: 'symbols required' }, { status: 400 });
  }

  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: 'Finnhub API key missing' }, { status: 500 });
  }

  const items = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
        const quote = await fetchJSON<QuoteData>(url, 10);
        return {
          symbol,
          price: quote?.c,
          changePercent: quote?.dp,
          timestamp: quote?.t,
        };
      } catch (err) {
        console.error('Polling quote error:', symbol, err);
        return { symbol, price: undefined, changePercent: undefined, timestamp: undefined };
      }
    })
  );

  return NextResponse.json({ items });
}
