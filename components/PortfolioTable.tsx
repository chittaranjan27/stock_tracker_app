"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, formatChangePercent } from "@/lib/utils";
import { usePriceStream } from "@/hooks/usePriceStream";
import Link from "next/link";

type PortfolioTableProps = {
  initialHoldings: PortfolioHoldingWithQuote[];
};

const PortfolioTable = ({ initialHoldings }: PortfolioTableProps) => {
  const [holdings, setHoldings] = useState<PortfolioHoldingWithQuote[]>(initialHoldings || []);
  const [form, setForm] = useState({ symbol: "", buyPrice: "", quantity: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ buyPrice: "", quantity: "" });

  const streamSymbols = useMemo(
    () =>
      holdings.map((holding) => ({
        symbol: holding.symbol,
        currentPrice: holding.currentPrice,
        changePercent: holding.changePercent,
      })),
    [holdings]
  );

  const { prices } = usePriceStream(streamSymbols);

  const totals = useMemo(() => {
    let totalInvested = 0;
    let totalValue = 0;
    let dailyGain = 0;

    holdings.forEach((holding) => {
      const live = prices[holding.symbol];
      const priceValue = live?.price ?? holding.currentPrice;
      const changeValue = live?.changePercent ?? holding.changePercent;
      const investedValue = holding.buyPrice * holding.quantity;
      totalInvested += investedValue;

      if (typeof priceValue === "number") {
        totalValue += priceValue * holding.quantity;
        if (typeof changeValue === "number") {
          const prevClose = priceValue / (1 + changeValue / 100);
          const dailyPerShare = priceValue - prevClose;
          dailyGain += dailyPerShare * holding.quantity;
        }
      }
    });

    return {
      totalInvested,
      totalValue,
      totalProfit: totalValue - totalInvested,
      dailyGain,
    };
  }, [holdings, prices]);

  const handleAdd = async () => {
    const symbol = form.symbol.trim().toUpperCase();
    const buyPrice = Number(form.buyPrice);
    const quantity = Number(form.quantity);

    if (!symbol || !Number.isFinite(buyPrice) || !Number.isFinite(quantity)) {
      toast.error("Please enter valid symbol, buy price, and quantity.");
      return;
    }

    setSaving(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: PortfolioHoldingWithQuote = {
      _id: tempId,
      userId: "local",
      symbol,
      buyPrice,
      quantity,
      addedAt: new Date(),
    };

    setHoldings((prev) => [optimistic, ...prev]);
    setForm({ symbol: "", buyPrice: "", quantity: "" });

    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, buyPrice, quantity }),
      });

      if (!res.ok) {
        throw new Error("Failed to add holding");
      }

      const data = await res.json();
      if (data?.item) {
        setHoldings((prev) => prev.map((h) => (h._id === tempId ? data.item : h)));
      }
    } catch (err) {
      console.error("add holding error:", err);
      setHoldings((prev) => prev.filter((h) => h._id !== tempId));
      toast.error("Failed to add holding. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    const prev = holdings;
    setHoldings((list) => list.filter((item) => item._id !== id));

    try {
      const res = await fetch(`/api/portfolio/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
    } catch (err) {
      console.error("remove holding error:", err);
      setHoldings(prev);
      toast.error("Failed to remove holding.");
    }
  };

  const startEdit = (holding: PortfolioHoldingWithQuote) => {
    setEditingId(holding._id);
    setEditValues({
      buyPrice: holding.buyPrice.toString(),
      quantity: holding.quantity.toString(),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ buyPrice: "", quantity: "" });
  };

  const saveEdit = async (id: string) => {
    const buyPrice = Number(editValues.buyPrice);
    const quantity = Number(editValues.quantity);
    if (!Number.isFinite(buyPrice) || !Number.isFinite(quantity)) {
      toast.error("Enter valid buy price and quantity.");
      return;
    }

    const prev = holdings;
    setHoldings((list) =>
      list.map((item) => (item._id === id ? { ...item, buyPrice, quantity } : item))
    );
    setEditingId(null);

    try {
      const res = await fetch(`/api/portfolio/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyPrice, quantity }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }
    } catch (err) {
      console.error("update holding error:", err);
      setHoldings(prev);
      toast.error("Failed to update holding.");
    }
  };

  if (holdings.length === 0) {
    return (
      <div className="watchlist-empty">
        <p className="empty-title">Your portfolio is empty</p>
        <p className="empty-description">Add your first holding to track performance.</p>
        <div className="flex gap-3 mt-4">
          <Input
            value={form.symbol}
            onChange={(e) => setForm((prev) => ({ ...prev, symbol: e.target.value }))}
            placeholder="Symbol (AAPL)"
            className="h-10 w-40"
          />
          <Input
            value={form.buyPrice}
            onChange={(e) => setForm((prev) => ({ ...prev, buyPrice: e.target.value }))}
            placeholder="Buy price"
            className="h-10 w-32"
          />
          <Input
            value={form.quantity}
            onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
            placeholder="Qty"
            className="h-10 w-24"
          />
          <Button onClick={handleAdd} disabled={saving} className="search-btn">
            Add Holding
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
          <div className="text-sm text-gray-500">Total Value</div>
          <div className="text-xl font-semibold text-gray-100">{formatPrice(totals.totalValue)}</div>
        </div>
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
          <div className="text-sm text-gray-500">Total Invested</div>
          <div className="text-xl font-semibold text-gray-100">{formatPrice(totals.totalInvested)}</div>
        </div>
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
          <div className="text-sm text-gray-500">Total P/L</div>
          <div className={`text-xl font-semibold ${totals.totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatPrice(totals.totalProfit)}
          </div>
        </div>
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
          <div className="text-sm text-gray-500">Daily Gain/Loss</div>
          <div className={`text-xl font-semibold ${totals.dailyGain >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatPrice(totals.dailyGain)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={form.symbol}
          onChange={(e) => setForm((prev) => ({ ...prev, symbol: e.target.value }))}
          placeholder="Symbol (AAPL)"
          className="h-10 w-40"
        />
        <Input
          value={form.buyPrice}
          onChange={(e) => setForm((prev) => ({ ...prev, buyPrice: e.target.value }))}
          placeholder="Buy price"
          className="h-10 w-32"
        />
        <Input
          value={form.quantity}
          onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
          placeholder="Qty"
          className="h-10 w-24"
        />
        <Button onClick={handleAdd} disabled={saving} className="search-btn">
          Add Holding
        </Button>
      </div>

      <div className="watchlist-table">
        <div className="grid grid-cols-12 px-4 py-3 text-sm text-gray-400 border-b border-gray-600">
          <div className="col-span-3">Symbol</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Buy Price</div>
          <div className="col-span-2 text-right">Current</div>
          <div className="col-span-2 text-right">P/L</div>
          <div className="col-span-1 text-right">Action</div>
        </div>
        <div className="divide-y divide-gray-600">
          {holdings.map((holding) => {
            const live = prices[holding.symbol];
            const priceValue = live?.price ?? holding.currentPrice;
            const changeValue = live?.changePercent ?? holding.changePercent;
            const currentValue = typeof priceValue === "number" ? priceValue * holding.quantity : undefined;
            const investedValue = holding.buyPrice * holding.quantity;
            const profitLoss =
              typeof currentValue === "number" ? currentValue - investedValue : undefined;
            const changeFormatted =
              typeof changeValue === "number" ? formatChangePercent(changeValue) : "—";

            return (
              <div
                key={holding._id}
                className="grid grid-cols-12 px-4 py-3 items-center text-gray-100 hover:bg-gray-700/50 transition-colors"
              >
                <div className="col-span-3 font-medium">
                  <Link href={`/stocks/${holding.symbol}`} className="hover:text-yellow-500">
                    {holding.symbol}
                  </Link>
                  <div className="text-xs text-gray-500">{changeFormatted}</div>
                </div>
                <div className="col-span-2 text-right text-sm">
                  {editingId === holding._id ? (
                    <Input
                      value={editValues.quantity}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, quantity: e.target.value }))}
                      className="h-8 text-right"
                    />
                  ) : (
                    holding.quantity
                  )}
                </div>
                <div className="col-span-2 text-right text-sm">
                  {editingId === holding._id ? (
                    <Input
                      value={editValues.buyPrice}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, buyPrice: e.target.value }))}
                      className="h-8 text-right"
                    />
                  ) : (
                    formatPrice(holding.buyPrice)
                  )}
                </div>
                <div className="col-span-2 text-right text-sm">
                  {typeof priceValue === "number" ? formatPrice(priceValue) : "N/A"}
                </div>
                <div className="col-span-2 text-right text-sm">
                  <span className={profitLoss !== undefined && profitLoss < 0 ? "text-red-500" : "text-green-500"}>
                    {typeof profitLoss === "number" ? formatPrice(profitLoss) : "N/A"}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-end gap-2">
                  {editingId === holding._id ? (
                    <>
                      <button onClick={() => saveEdit(holding._id)} className="text-green-500">
                        <Save className="h-4 w-4" />
                      </button>
                      <button onClick={cancelEdit} className="text-gray-400">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(holding)} className="text-yellow-500">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleRemove(holding._id)} className="trash-icon">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PortfolioTable;
