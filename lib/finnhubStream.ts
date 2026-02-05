import 'server-only';
import { EventEmitter } from 'events';
import WebSocket from 'ws';

type TradeEvent = {
  symbol: string;
  price: number;
  timestamp: number;
  volume?: number;
};

type FinnhubTradeMessage = {
  type: string;
  data?: Array<{ s: string; p: number; t: number; v?: number }>;
};

class FinnhubStream extends EventEmitter {
  private ws: WebSocket | null = null;
  private pendingSymbols = new Set<string>();
  private refCounts = new Map<string, number>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;

  private getToken() {
    return process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';
  }

  private connect() {
    if (this.ws || this.isConnecting) return;

    const token = this.getToken();
    if (!token) {
      console.error('Finnhub token missing. Live streaming disabled.');
      return;
    }

    this.isConnecting = true;
    this.ws = new WebSocket(`wss://ws.finnhub.io?token=${token}`);

    this.ws.on('open', () => {
      this.isConnecting = false;
      this.pendingSymbols.forEach((symbol) => this.sendSubscribe(symbol));
      this.pendingSymbols.clear();
    });

    this.ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString()) as FinnhubTradeMessage;
        if (parsed.type !== 'trade' || !parsed.data?.length) return;

        parsed.data.forEach((trade) => {
          const event: TradeEvent = {
            symbol: trade.s,
            price: trade.p,
            timestamp: trade.t,
            volume: trade.v,
          };
          this.emit('trade', event);
        });
      } catch (err) {
        console.error('Finnhub WS parse error:', err);
      }
    });

    this.ws.on('close', () => {
      this.ws = null;
      this.scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      console.error('Finnhub WS error:', err);
      this.ws?.close();
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
      this.refCounts.forEach((_count, symbol) => {
        this.pendingSymbols.add(symbol);
      });
    }, 2000);
  }

  private sendSubscribe(symbol: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pendingSymbols.add(symbol);
      this.connect();
      return;
    }
    this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
  }

  private sendUnsubscribe(symbol: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pendingSymbols.delete(symbol);
      return;
    }
    this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
  }

  subscribe(symbol: string) {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) return;

    const count = this.refCounts.get(normalized) ?? 0;
    this.refCounts.set(normalized, count + 1);
    if (count === 0) {
      this.sendSubscribe(normalized);
    }
  }

  unsubscribe(symbol: string) {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) return;

    const count = this.refCounts.get(normalized) ?? 0;
    if (count <= 1) {
      this.refCounts.delete(normalized);
      this.sendUnsubscribe(normalized);
      return;
    }
    this.refCounts.set(normalized, count - 1);
  }
}

declare global {
  var finnhubStream: FinnhubStream | undefined;
}

export const getFinnhubStream = () => {
  if (!global.finnhubStream) {
    global.finnhubStream = new FinnhubStream();
  }
  return global.finnhubStream;
};
