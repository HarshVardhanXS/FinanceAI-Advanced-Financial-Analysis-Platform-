import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface StockMarker {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  coordinates: [number, number];
  country: string;
}

// Major stock exchanges worldwide with their locations
const worldwideStocks: StockMarker[] = [
  { symbol: "AAPL", name: "Apple Inc.", coordinates: [-122.03, 37.33], country: "USA", price: "", change: "", changePercent: "", isPositive: true },
  { symbol: "MSFT", name: "Microsoft Corporation", coordinates: [-122.12, 47.67], country: "USA", price: "", change: "", changePercent: "", isPositive: true },
  { symbol: "GOOGL", name: "Alphabet Inc.", coordinates: [-122.08, 37.42], country: "USA", price: "", change: "", changePercent: "", isPositive: true },
  { symbol: "AMZN", name: "Amazon.com Inc.", coordinates: [-122.34, 47.62], country: "USA", price: "", change: "", changePercent: "", isPositive: true },
  { symbol: "TSLA", name: "Tesla Inc.", coordinates: [-97.74, 30.27], country: "USA", price: "", change: "", changePercent: "", isPositive: true },
  { symbol: "NVDA", name: "NVIDIA Corporation", coordinates: [-121.96, 37.37], country: "USA", price: "", change: "", changePercent: "", isPositive: true },
  { symbol: "TSM", name: "Taiwan Semiconductor", coordinates: [121.02, 24.79], country: "Taiwan", price: "", change: "", changePercent: "", isPositive: true },
  { symbol: "BABA", name: "Alibaba Group", coordinates: [120.15, 30.27], country: "China", price: "", change: "", changePercent: "", isPositive: true },
  { symbol: "SAP", name: "SAP SE", coordinates: [8.68, 49.41], country: "Germany", price: "", change: "", changePercent: "", isPositive: true },
  { symbol: "TM", name: "Toyota Motor Corp", coordinates: [137.15, 35.08], country: "Japan", price: "", change: "", changePercent: "", isPositive: true },
  { symbol: "NVO", name: "Novo Nordisk", coordinates: [12.56, 55.67], country: "Denmark", price: "", change: "", changePercent: "", isPositive: true },
  { symbol: "ASML", name: "ASML Holding", coordinates: [5.44, 51.44], country: "Netherlands", price: "", change: "", changePercent: "", isPositive: true },
];

export const StockWorldMap = () => {
  const [stocks, setStocks] = useState<StockMarker[]>(worldwideStocks);
  const [selectedStock, setSelectedStock] = useState<StockMarker | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStockData = async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbol }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return null;
    }
  };

  const loadAllStocks = async () => {
    setLoading(true);
    const updatedStocks = await Promise.all(
      worldwideStocks.map(async (stock) => {
        const data = await fetchStockData(stock.symbol);
        if (data) {
          return {
            ...stock,
            price: `$${data.price}`,
            change: data.change,
            changePercent: data.changePercent,
            isPositive: data.isPositive,
            name: data.name || stock.name,
          };
        }
        return stock;
      })
    );
    setStocks(updatedStocks);
    setLoading(false);
  };

  useEffect(() => {
    loadAllStocks();
  }, []);

  return (
    <Card className="glass-card p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-bold gradient-text">Global Stock Market</h2>
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${stocks.length} stocks tracked worldwide`}
        </div>
      </div>

      <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden bg-secondary/30 border border-border/50">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 147,
          }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="hsl(var(--secondary))"
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none", transition: "none" },
                    hover: { outline: "none", transition: "none" },
                    pressed: { outline: "none", transition: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {stocks.map((stock) => (
            <Marker
              key={stock.symbol}
              coordinates={stock.coordinates}
              onMouseEnter={() => setSelectedStock(stock)}
              onMouseLeave={() => setSelectedStock(null)}
            >
              <circle
                r={3}
                fill={stock.isPositive ? "hsl(var(--success))" : "hsl(var(--danger))"}
                stroke="hsl(var(--background))"
                strokeWidth={1}
                className="cursor-pointer"
                style={{ transition: "none" }}
              />
            </Marker>
          ))}
        </ComposableMap>

        <AnimatePresence>
          {selectedStock && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute top-4 right-4 glass-card p-4 shadow-glow-primary min-w-[280px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">{selectedStock.symbol}</span>
                    {selectedStock.isPositive ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-danger" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{selectedStock.name}</p>
                  <p className="text-xs text-muted-foreground mb-3">{selectedStock.country}</p>
                  
                  {selectedStock.price && (
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">{selectedStock.price}</div>
                      <div className={`text-sm font-semibold ${selectedStock.isPositive ? "text-success" : "text-danger"}`}>
                        {selectedStock.isPositive ? "+" : ""}{selectedStock.change} ({selectedStock.changePercent}%)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className="p-2 rounded-lg border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-all hover:border-primary/50"
            onMouseEnter={() => setSelectedStock(stock)}
            onMouseLeave={() => setSelectedStock(null)}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="font-semibold text-xs">{stock.symbol}</span>
              {stock.isPositive ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-danger" />
              )}
            </div>
            {stock.price && (
              <>
                <div className="text-[10px] font-bold truncate">{stock.price}</div>
                <div className={`text-[10px] ${stock.isPositive ? "text-success" : "text-danger"}`}>
                  {stock.isPositive ? "+" : ""}{stock.changePercent}%
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
