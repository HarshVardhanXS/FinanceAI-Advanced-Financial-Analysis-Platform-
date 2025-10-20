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
    <Card className="p-6 bg-gradient-to-br from-card to-card/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Global Stock Market</h2>
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${stocks.length} stocks tracked worldwide`}
        </div>
      </div>

      <div className="relative h-[500px] rounded-lg overflow-hidden bg-secondary/30">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 150,
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
                    default: { outline: "none" },
                    hover: { fill: "hsl(var(--accent))", outline: "none" },
                    pressed: { outline: "none" },
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
              <motion.circle
                r={6}
                fill={stock.isPositive ? "hsl(var(--success))" : "hsl(var(--danger))"}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                className="cursor-pointer"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.5 }}
                transition={{ duration: 0.3 }}
              />
              <motion.circle
                r={8}
                fill={stock.isPositive ? "hsl(var(--success) / 0.3)" : "hsl(var(--danger) / 0.3)"}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </Marker>
          ))}
        </ComposableMap>

        <AnimatePresence>
          {selectedStock && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm border rounded-lg p-4 shadow-xl min-w-[280px]"
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

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {stocks.map((stock) => (
          <motion.div
            key={stock.symbol}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="p-3 rounded-lg border bg-secondary/30 cursor-pointer"
            onMouseEnter={() => setSelectedStock(stock)}
            onMouseLeave={() => setSelectedStock(null)}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="font-semibold text-sm">{stock.symbol}</span>
              {stock.isPositive ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-danger" />
              )}
            </div>
            {stock.price && (
              <>
                <div className="text-xs font-bold">{stock.price}</div>
                <div className={`text-xs ${stock.isPositive ? "text-success" : "text-danger"}`}>
                  {stock.isPositive ? "+" : ""}{stock.changePercent}%
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
