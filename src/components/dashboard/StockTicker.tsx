import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StockData {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

const TRENDING_STOCKS = ["SPY", "QQQ", "DIA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "BABA", "TSM"];

export const StockTicker = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);

  const fetchStockData = async () => {
    try {
      const promises = TRENDING_STOCKS.map(symbol =>
        supabase.functions.invoke("fetch-stock-data", {
          body: { symbol }
        })
      );

      const results = await Promise.all(promises);
      const stockData = results
        .filter(result => result.data)
        .map(result => result.data as StockData);

      setStocks(stockData);
    } catch (error) {
      console.error("Error fetching ticker data:", error);
    }
  };

  useEffect(() => {
    fetchStockData();
    const interval = setInterval(fetchStockData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (stocks.length === 0) return null;

  // Duplicate stocks for seamless loop
  const duplicatedStocks = [...stocks, ...stocks];

  return (
    <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden relative">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {duplicatedStocks.map((stock, index) => (
            <div
              key={`${stock.symbol}-${index}`}
              className="ticker-item inline-flex items-center gap-2 px-4 py-2 hover:bg-accent/20 transition-colors cursor-pointer group"
            >
              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {stock.symbol}
              </span>
              <span className="font-medium text-foreground">
                ${stock.price}
              </span>
              <div className={`flex items-center gap-1 text-sm ${
                stock.isPositive ? "text-success" : "text-destructive"
              }`}>
                {stock.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{stock.changePercent}%</span>
              </div>
              <div className="h-4 w-px bg-border/50 ml-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
