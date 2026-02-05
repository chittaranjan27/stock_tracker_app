"use client";

import { useContext, useEffect, useMemo } from "react";
import { PriceStreamContext } from "@/components/PriceStreamProvider";

type StreamSymbol = {
  symbol: string;
  currentPrice?: number;
  changePercent?: number;
};

export const usePriceStream = (symbols: StreamSymbol[]) => {
  const context = useContext(PriceStreamContext);

  if (!context) {
    throw new Error("usePriceStream must be used within PriceStreamProvider");
  }

  const symbolKey = useMemo(() => symbols.map((s) => s.symbol.toUpperCase()).join("|"), [symbols]);

  const normalized = useMemo(() => {
    return symbols
      .map((s) => ({
        symbol: s.symbol.trim().toUpperCase(),
        currentPrice: s.currentPrice,
        changePercent: s.changePercent,
      }))
      .filter((s) => s.symbol.length > 0);
  }, [symbolKey, symbols]);

  const symbolList = useMemo(() => normalized.map((s) => s.symbol), [normalized]);

  useEffect(() => {
    if (symbolList.length === 0) return;
    context.addSymbols(symbolList);
    return () => context.removeSymbols(symbolList);
  }, [context, symbolList]);

  useEffect(() => {
    normalized.forEach((item) => {
      context.setBaseline(item.symbol, item.currentPrice, item.changePercent);
    });
  }, [context, normalized]);

  return {
    prices: context.prices,
  };
};
