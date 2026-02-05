'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { fetchJSON } from '@/lib/actions/finnhub.actions';
import { formatChangePercent, formatMarketCapValue, formatPrice } from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const getFinnhubToken = () => process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function getWatchlistByUserId(userId: string): Promise<StockWithData[]> {
  if (!userId) return [];

  try {
    await connectToDatabase();

    const items = await Watchlist.find({ userId })
      .sort({ order: 1, addedAt: 1 })
      .lean();

    if (!items.length) return [];

    const token = getFinnhubToken();

    const enriched = await Promise.all(
      items.map(async (item) => {
        const symbol = String(item.symbol).toUpperCase();
        let quote: QuoteData | null = null;
        let profile: ProfileData | null = null;

        if (token) {
          try {
            const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
            quote = await fetchJSON<QuoteData>(quoteUrl, 30);
          } catch (err) {
            console.error('getWatchlistByUserId quote error:', symbol, err);
          }

          try {
            const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`;
            profile = await fetchJSON<ProfileData>(profileUrl, 3600);
          } catch (err) {
            console.error('getWatchlistByUserId profile error:', symbol, err);
          }
        }

        const currentPrice = quote?.c;
        const changePercent = quote?.dp;
        const marketCap = profile?.marketCapitalization;

        const changeFormatted =
          typeof changePercent === 'number' ? formatChangePercent(changePercent) : 'N/A';
        const priceFormatted = typeof currentPrice === 'number' ? formatPrice(currentPrice) : 'N/A';

        return {
          userId,
          symbol,
          company: item.company,
          addedAt: item.addedAt,
          order: item.order ?? 0,
          currentPrice,
          changePercent,
          priceFormatted,
          changeFormatted,
          marketCap: marketCap ? formatMarketCapValue(marketCap * 1_000_000) : 'N/A',
          peRatio: 'N/A',
        } as StockWithData;
      })
    );

    return enriched;
  } catch (err) {
    console.error('getWatchlistByUserId error:', err);
    return [];
  }
}

export async function getNextWatchlistOrder(userId: string): Promise<number> {
  if (!userId) return 0;
  await connectToDatabase();
  const last = await Watchlist.findOne({ userId }).sort({ order: -1 }).select({ order: 1 }).lean();
  return (last?.order ?? 0) + 1;
}

export async function addWatchlistItem({
  userId,
  symbol,
  company,
}: {
  userId: string;
  symbol: string;
  company: string;
}): Promise<StockWithData | null> {
  if (!userId || !symbol) return null;

  try {
    await connectToDatabase();
    const normalizedSymbol = symbol.trim().toUpperCase();
    const normalizedCompany = company?.trim() || normalizedSymbol;

    const order = await getNextWatchlistOrder(userId);

    const created = await Watchlist.findOneAndUpdate(
      { userId, symbol: normalizedSymbol },
      {
        $setOnInsert: {
          userId,
          symbol: normalizedSymbol,
          company: normalizedCompany,
          addedAt: new Date(),
          order,
        },
      },
      { new: true, upsert: true }
    ).lean();

    if (!created) return null;

    return {
      userId,
      symbol: created.symbol,
      company: created.company,
      addedAt: created.addedAt,
      order: created.order ?? order,
    } as StockWithData;
  } catch (err) {
    console.error('addWatchlistItem error:', err);
    return null;
  }
}

export async function removeWatchlistItem(userId: string, symbol: string): Promise<boolean> {
  if (!userId || !symbol) return false;

  try {
    await connectToDatabase();
    const normalizedSymbol = symbol.trim().toUpperCase();
    await Watchlist.deleteOne({ userId, symbol: normalizedSymbol });
    return true;
  } catch (err) {
    console.error('removeWatchlistItem error:', err);
    return false;
  }
}

export async function reorderWatchlist(userId: string, orderedSymbols: string[]): Promise<boolean> {
  if (!userId || !orderedSymbols?.length) return false;

  try {
    await connectToDatabase();

    const ops = orderedSymbols.map((symbol, idx) => ({
      updateOne: {
        filter: { userId, symbol: symbol.trim().toUpperCase() },
        update: { $set: { order: idx + 1 } },
      },
    }));

    if (ops.length) {
      await Watchlist.bulkWrite(ops);
    }
    return true;
  } catch (err) {
    console.error('reorderWatchlist error:', err);
    return false;
  }
}
