"use client";

import { useMemo } from "react";
import { formatChangePercent, formatPrice, getChangeColorClass } from "@/lib/utils";
import { usePriceStream } from "@/hooks/usePriceStream";

type StockPriceTickerProps = {
  symbol: string;
  currentPrice?: number;
  changePercent?: number;
};

const StockPriceTicker = ({ symbol, currentPrice, changePercent }: StockPriceTickerProps) => {
  const symbols = useMemo(
    () => [{ symbol, currentPrice, changePercent }],
    [symbol, currentPrice, changePercent]
  );
  const { prices } = usePriceStream(symbols);
  const live = prices[symbol.toUpperCase()];

  const priceValue = live?.price ?? currentPrice;
  const changeValue = live?.changePercent ?? changePercent;

  const priceFormatted = typeof priceValue === "number" ? formatPrice(priceValue) : "—";
  const changeFormatted =
    typeof changeValue === "number" ? formatChangePercent(changeValue) : "—";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-500">Live Price</span>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-gray-100">{priceFormatted}</span>
        <span className={`text-sm font-medium ${getChangeColorClass(changeValue)}`}>
          {changeFormatted}
        </span>
      </div>
    </div>
  );
};

export default StockPriceTicker;
