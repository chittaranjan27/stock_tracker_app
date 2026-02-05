"use client";

import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";

type LivePrice = {
  price: number;
  changePercent?: number;
  timestamp?: number;
};

type Baseline = {
  prevClose?: number;
};

type PriceStreamContextValue = {
  prices: Record<string, LivePrice>;
  addSymbols: (symbols: string[]) => void;
  removeSymbols: (symbols: string[]) => void;
  setBaseline: (symbol: string, currentPrice?: number, changePercent?: number) => void;
};

const PriceStreamContext = createContext<PriceStreamContextValue | null>(null);

const PriceStreamProvider = ({ children }: { children: React.ReactNode }) => {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [activeSymbols, setActiveSymbols] = useState<string[]>([]);
  const refCounts = useRef(new Map<string, number>());
  const baselines = useRef(new Map<string, Baseline>());

  const updateActiveSymbols = useCallback(() => {
    setActiveSymbols(Array.from(refCounts.current.keys()));
  }, []);

  const addSymbols = useCallback(
    (symbols: string[]) => {
      let changed = false;
      symbols.forEach((raw) => {
        const symbol = raw.trim().toUpperCase();
        if (!symbol) return;
        const count = refCounts.current.get(symbol) ?? 0;
        refCounts.current.set(symbol, count + 1);
        if (count === 0) changed = true;
      });
      if (changed) updateActiveSymbols();
    },
    [updateActiveSymbols]
  );

  const removeSymbols = useCallback(
    (symbols: string[]) => {
      let changed = false;
      symbols.forEach((raw) => {
        const symbol = raw.trim().toUpperCase();
        if (!symbol) return;
        const count = refCounts.current.get(symbol) ?? 0;
        if (count <= 1) {
          refCounts.current.delete(symbol);
          changed = true;
        } else {
          refCounts.current.set(symbol, count - 1);
        }
      });
      if (changed) updateActiveSymbols();
    },
    [updateActiveSymbols]
  );

  const setBaseline = useCallback((rawSymbol: string, currentPrice?: number, changePercent?: number) => {
    const symbol = rawSymbol.trim().toUpperCase();
    if (!symbol || typeof currentPrice !== "number") return;

    if (typeof changePercent === "number" && currentPrice > 0) {
      const prevClose = currentPrice / (1 + changePercent / 100);
      baselines.current.set(symbol, { prevClose });
    } else {
      baselines.current.set(symbol, { prevClose: currentPrice });
    }
  }, []);

  const applyTrade = useCallback((symbol: string, price: number, timestamp?: number) => {
    const base = baselines.current.get(symbol);
    const prevClose = base?.prevClose;
    const changePercent =
      typeof prevClose === "number" && prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : undefined;

    setPrices((prev) => ({
      ...prev,
      [symbol]: {
        price,
        changePercent,
        timestamp,
      },
    }));
  }, []);

  useEffect(() => {
    if (activeSymbols.length === 0) return;

    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    const symbolsParam = activeSymbols.join(",");

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`/api/prices?symbols=${encodeURIComponent(symbolsParam)}`);
          if (!res.ok) return;
          const data = await res.json();
          if (!Array.isArray(data?.items)) return;
          data.items.forEach((item: { symbol: string; price?: number; changePercent?: number; timestamp?: number }) => {
            if (typeof item.price !== "number") return;
            const changePercent =
              typeof item.changePercent === "number" ? item.changePercent : undefined;
            setPrices((prev) => ({
              ...prev,
              [item.symbol]: {
                price: item.price as number,
                changePercent,
                timestamp: item.timestamp,
              },
            }));
          });
        } catch (err) {
          console.error("Polling fallback error:", err);
        }
      }, 12000);
    };

    const startStream = () => {
      eventSource = new EventSource(`/api/prices/stream?symbols=${encodeURIComponent(symbolsParam)}`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const symbol = data.symbol as string;
          const price = data.price as number;
          const timestamp = data.timestamp as number;
          if (symbol && typeof price === "number") {
            applyTrade(symbol, price, timestamp);
          }
        } catch (err) {
          console.error("Stream parse error:", err);
        }
      };
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        startPolling();
      };
    };

    startStream();

    return () => {
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [activeSymbols, applyTrade]);

  const value = useMemo<PriceStreamContextValue>(
    () => ({
      prices,
      addSymbols,
      removeSymbols,
      setBaseline,
    }),
    [prices, addSymbols, removeSymbols, setBaseline]
  );

  return <PriceStreamContext.Provider value={value}>{children}</PriceStreamContext.Provider>;
};

export { PriceStreamContext, PriceStreamProvider };

export default PriceStreamProvider;
