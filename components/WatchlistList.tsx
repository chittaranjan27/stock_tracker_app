"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { formatChangePercent, formatPrice, getChangeColorClass } from "@/lib/utils";
import { usePriceStream } from "@/hooks/usePriceStream";

type WatchlistListProps = {
  initialWatchlist: StockWithData[];
};

const WatchlistList = ({ initialWatchlist }: WatchlistListProps) => {
  const [items, setItems] = useState<StockWithData[]>(initialWatchlist || []);

  const ordered = useMemo(() => {
    return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [items]);

  const streamSymbols = useMemo(
    () =>
      ordered.map((item) => ({
        symbol: item.symbol,
        currentPrice: item.currentPrice,
        changePercent: item.changePercent,
      })),
    [ordered]
  );

  const { prices } = usePriceStream(streamSymbols);

  const handleRemove = async (symbol: string) => {
    const prev = items;
    setItems((list) => list.filter((item) => item.symbol !== symbol));

    try {
      const res = await fetch(`/api/watchlist/${encodeURIComponent(symbol)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to remove");
      }
    } catch (err) {
      console.error("remove watchlist error:", err);
      setItems(prev);
      toast.error("Failed to remove stock. Please try again.");
    }
  };

  if (ordered.length === 0) {
    return (
      <div className="watchlist-empty">
        <p className="empty-title">Your watchlist is empty</p>
        <p className="empty-description">Add stocks from any detail page.</p>
      </div>
    );
  }

  return (
    <div className="watchlist-table">
      <div className="grid grid-cols-12 px-4 py-3 text-sm text-gray-400 border-b border-gray-600">
        <div className="col-span-4">Company</div>
        <div className="col-span-2">Symbol</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-2 text-right">Change</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>
      <div className="divide-y divide-gray-600">
        {ordered.map((item) => (
          <div
            key={item.symbol}
            className="grid grid-cols-12 px-4 py-3 items-center text-gray-100 hover:bg-gray-700/50 transition-colors"
          >
            {(() => {
              const live = prices[item.symbol];
              const priceValue = live?.price ?? item.currentPrice;
              const changeValue = live?.changePercent ?? item.changePercent;
              const priceFormatted =
                typeof priceValue === "number" ? formatPrice(priceValue) : item.priceFormatted || "N/A";
              const changeFormatted =
                typeof changeValue === "number" ? formatChangePercent(changeValue) : item.changeFormatted || "N/A";

              return (
                <>
            <div className="col-span-4">
              <Link href={`/stocks/${item.symbol}`} className="font-medium hover:text-yellow-500">
                {item.company || item.symbol}
              </Link>
            </div>
            <div className="col-span-2 text-sm text-gray-400">{item.symbol}</div>
            <div className="col-span-2 text-right text-sm">{priceFormatted}</div>
            <div className="col-span-2 text-right text-sm">
              <span className={getChangeColorClass(changeValue)}>
                {changeFormatted}
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-end">
              <button
                className="trash-icon"
                onClick={() => handleRemove(item.symbol)}
                aria-label={`Remove ${item.symbol}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
                </>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchlistList;
