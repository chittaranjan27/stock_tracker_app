'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Portfolio } from '@/database/models/portfolio.model';
import { fetchJSON } from '@/lib/actions/finnhub.actions';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const getFinnhubToken = () => process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

export async function getPortfolioByUserId(userId: string): Promise<PortfolioHoldingWithQuote[]> {
  if (!userId) return [];

  try {
    await connectToDatabase();
    const holdings = await Portfolio.find({ userId }).sort({ addedAt: -1 }).lean();
    if (!holdings.length) return [];

    const token = getFinnhubToken();
    const symbols = Array.from(new Set(holdings.map((h) => String(h.symbol).toUpperCase())));
    const quotes = new Map<string, QuoteData>();

    if (token) {
      await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
            const quote = await fetchJSON<QuoteData>(url, 15);
            quotes.set(symbol, quote);
          } catch (err) {
            console.error('getPortfolioByUserId quote error:', symbol, err);
          }
        })
      );
    }

    return holdings.map((holding) => {
      const symbol = String(holding.symbol).toUpperCase();
      const quote = quotes.get(symbol);
      return {
        _id: holding._id?.toString?.() || String(holding._id),
        userId,
        symbol,
        buyPrice: holding.buyPrice,
        quantity: holding.quantity,
        addedAt: holding.addedAt,
        currentPrice: quote?.c,
        changePercent: quote?.dp,
      } as PortfolioHoldingWithQuote;
    });
  } catch (err) {
    console.error('getPortfolioByUserId error:', err);
    return [];
  }
}

export async function addPortfolioHolding({
  userId,
  symbol,
  buyPrice,
  quantity,
}: {
  userId: string;
  symbol: string;
  buyPrice: number;
  quantity: number;
}): Promise<PortfolioHoldingWithQuote | null> {
  if (!userId || !symbol) return null;
  if (!Number.isFinite(buyPrice) || !Number.isFinite(quantity)) return null;

  try {
    await connectToDatabase();
    const normalizedSymbol = symbol.trim().toUpperCase();

    const created = await Portfolio.create({
      userId,
      symbol: normalizedSymbol,
      buyPrice,
      quantity,
      addedAt: new Date(),
    });

    return {
      _id: created._id.toString(),
      userId,
      symbol: normalizedSymbol,
      buyPrice,
      quantity,
      addedAt: created.addedAt,
    } as PortfolioHoldingWithQuote;
  } catch (err) {
    console.error('addPortfolioHolding error:', err);
    return null;
  }
}

export async function updatePortfolioHolding({
  userId,
  id,
  buyPrice,
  quantity,
}: {
  userId: string;
  id: string;
  buyPrice?: number;
  quantity?: number;
}): Promise<boolean> {
  if (!userId || !id) return false;

  try {
    await connectToDatabase();
    const update: { buyPrice?: number; quantity?: number } = {};
    if (Number.isFinite(buyPrice)) update.buyPrice = buyPrice;
    if (Number.isFinite(quantity)) update.quantity = quantity;

    if (!Object.keys(update).length) return false;

    await Portfolio.updateOne({ _id: id, userId }, { $set: update });
    return true;
  } catch (err) {
    console.error('updatePortfolioHolding error:', err);
    return false;
  }
}

export async function removePortfolioHolding(userId: string, id: string): Promise<boolean> {
  if (!userId || !id) return false;

  try {
    await connectToDatabase();
    await Portfolio.deleteOne({ _id: id, userId });
    return true;
  } catch (err) {
    console.error('removePortfolioHolding error:', err);
    return false;
  }
}
