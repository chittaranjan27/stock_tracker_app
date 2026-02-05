import { NextRequest, NextResponse } from 'next/server';
import { getFinnhubStream } from '@/lib/finnhubStream';

export const runtime = 'nodejs';

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

  const stream = getFinnhubStream();
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    start(controller) {
      const symbolSet = new Set(symbols);

      const onTrade = (event: { symbol: string; price: number; timestamp: number }) => {
        if (!symbolSet.has(event.symbol)) return;
        const payload = JSON.stringify(event);
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      symbols.forEach((symbol) => stream.subscribe(symbol));
      stream.on('trade', onTrade);

      const ping = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
      }, 25000);

      const cleanup = () => {
        clearInterval(ping);
        stream.off('trade', onTrade);
        symbols.forEach((symbol) => stream.unsubscribe(symbol));
        controller.close();
      };

      request.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
