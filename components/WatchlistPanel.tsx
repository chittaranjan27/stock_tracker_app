"use client";

import { useMemo, useState, type DragEvent } from "react";
import Link from "next/link";
import { GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChangeColorClass } from "@/lib/utils";

type WatchlistPanelProps = {
  initialWatchlist: StockWithData[];
};

const arrayMove = <T,>(list: T[], from: number, to: number) => {
  const copy = list.slice();
  const [removed] = copy.splice(from, 1);
  copy.splice(to, 0, removed);
  return copy;
};

const WatchlistPanel = ({ initialWatchlist }: WatchlistPanelProps) => {
  const [items, setItems] = useState<StockWithData[]>(initialWatchlist || []);
  const [newSymbol, setNewSymbol] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [items]);

  const refreshWatchlist = async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("refreshWatchlist error:", err);
    }
  };

  const handleAdd = async () => {
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) return;
    if (sortedItems.some((item) => item.symbol === symbol)) {
      toast.error(`${symbol} is already in your watchlist.`);
      return;
    }

    const optimistic: StockWithData = {
      userId: "local",
      symbol,
      company: symbol,
      addedAt: new Date(),
      order: sortedItems.length + 1,
      priceFormatted: "—",
      changeFormatted: "—",
      marketCap: "N/A",
      peRatio: "N/A",
    };

    setItems((prev) => [...prev, optimistic]);
    setNewSymbol("");
    setIsSaving(true);

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });

      if (!res.ok) {
        throw new Error("Failed to add");
      }

      await refreshWatchlist();
    } catch (err) {
      console.error("add watchlist error:", err);
      setItems((prev) => prev.filter((item) => item.symbol !== symbol));
      toast.error("Failed to add stock. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (symbol: string) => {
    const prev = items;
    setItems((list) => list.filter((item) => item.symbol !== symbol));

    try {
      const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, {
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

  const persistOrder = async (list: StockWithData[]) => {
    const orderedSymbols = list.map((item) => item.symbol);
    try {
      await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedSymbols }),
      });
    } catch (err) {
      console.error("persist order error:", err);
    }
  };

  const handleDragStart = (event: DragEvent, index: number) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    setDraggedIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = arrayMove(sortedItems, draggedIndex, index).map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    setItems(reordered);
    setDraggedIndex(null);
    persistOrder(reordered);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  return (
    <section className="watchlist">
      <div className="flex flex-col gap-4 rounded-lg border border-gray-600 bg-gray-800 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="watchlist-title">Your Watchlist</h2>
            <p className="text-sm text-gray-500">Add stocks, reorder, and open details.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Input
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="Add by symbol (AAPL)"
              className="h-10 w-full sm:w-52"
              disabled={isSaving}
            />
            <Button onClick={handleAdd} disabled={isSaving} className="search-btn">
              Add
            </Button>
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <div className="watchlist-empty">
            <p className="empty-title">Your watchlist is empty</p>
            <p className="empty-description">Add a stock symbol to start tracking it.</p>
          </div>
        ) : (
          <div className="watchlist-table">
            <div className="grid grid-cols-12 px-4 py-3 text-sm text-gray-400 border-b border-gray-600">
              <div className="col-span-4">Company</div>
              <div className="col-span-2">Symbol</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Change</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-gray-600">
              {sortedItems.map((item, index) => (
                <div
                  key={item.symbol}
                  className="grid grid-cols-12 px-4 py-3 items-center text-gray-100 hover:bg-gray-700/50 transition-colors"
                  draggable
                  onDragStart={(event) => handleDragStart(event, index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                >
                  <div className="col-span-4 flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-500 cursor-grab" />
                    <Link href={`/stocks/${item.symbol}`} className="font-medium hover:text-yellow-500">
                      {item.company || item.symbol}
                    </Link>
                  </div>
                  <div className="col-span-2 text-sm text-gray-400">{item.symbol}</div>
                  <div className="col-span-2 text-right text-sm">{item.priceFormatted || "N/A"}</div>
                  <div className="col-span-2 text-right text-sm">
                    <span className={getChangeColorClass(item.changePercent)}>
                      {item.changeFormatted || "N/A"}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-3">
                    <Link href={`/stocks/${item.symbol}`} className="text-sm text-yellow-500 hover:text-yellow-400">
                      Open
                    </Link>
                    <button
                      className="trash-icon"
                      onClick={() => handleRemove(item.symbol)}
                      aria-label={`Remove ${item.symbol}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default WatchlistPanel;
