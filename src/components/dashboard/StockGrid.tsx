import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, Plus, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Stock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  data: Array<{ time: string; value: number }>;
}

interface StockGridProps {
  selectedStock: string;
  onSelectStock: (symbol: string) => void;
}

export const StockGrid = ({ selectedStock, onSelectStock }: StockGridProps) => {
  const [newSymbol, setNewSymbol] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [watchlist, setWatchlist] = useState<Stock[]>([
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      price: "$0.00",
      change: "+0.00",
      changePercent: "+0.00%",
      isPositive: true,
      data: [
        { time: "9:30", value: 0 },
        { time: "10:00", value: 0 },
        { time: "10:30", value: 0 },
        { time: "11:00", value: 0 },
      ],
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      price: "$0.00",
      change: "+0.00",
      changePercent: "+0.00%",
      isPositive: true,
      data: [
        { time: "9:30", value: 0 },
        { time: "10:00", value: 0 },
        { time: "10:30", value: 0 },
        { time: "11:00", value: 0 },
      ],
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corp.",
      price: "$0.00",
      change: "+0.00",
      changePercent: "+0.00%",
      isPositive: true,
      data: [
        { time: "9:30", value: 0 },
        { time: "10:00", value: 0 },
        { time: "10:30", value: 0 },
        { time: "11:00", value: 0 },
      ],
    },
  ]);

  const fetchStockData = async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
        body: { symbol }
      });

      if (error) throw error;

      if (data.error) {
        console.error('Stock API error:', data.error);
        return null;
      }

      // Show demo data notice if API limit reached
      if (data.isDemo && !toast) {
        setTimeout(() => {
          toast({
            title: "Using Demo Data",
            description: "Alpha Vantage API limit reached. Showing simulated data. Upgrade your API key for real-time data.",
            variant: "default",
          });
        }, 1000);
      }

      return {
        symbol: data.symbol,
        name: `${data.symbol} Corporation`,
        price: `$${data.price}`,
        change: data.isPositive ? `+${data.change}` : data.change,
        changePercent: data.isPositive ? `+${data.changePercent}%` : `${data.changePercent}%`,
        isPositive: data.isPositive,
        data: data.chartData
      };
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return null;
    }
  };

  const refreshAllStocks = async () => {
    setLoading(true);
    const updatedWatchlist = [];
    
    for (const stock of watchlist) {
      const freshData = await fetchStockData(stock.symbol);
      updatedWatchlist.push(freshData || stock);
    }
    
    setWatchlist(updatedWatchlist);
    setLoading(false);
    
    toast({
      title: "Refreshed",
      description: "Stock data updated successfully",
    });
  };

  useEffect(() => {
    refreshAllStocks();
  }, []);

  const handleAddStock = async () => {
    if (!newSymbol.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a stock symbol",
      });
      return;
    }

    const symbol = newSymbol.toUpperCase().trim();
    
    if (watchlist.some(stock => stock.symbol === symbol)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "This stock is already in your watchlist",
      });
      return;
    }

    setLoading(true);
    const stockData = await fetchStockData(symbol);
    setLoading(false);

    if (!stockData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch data for this symbol. Please check the symbol and try again.",
      });
      return;
    }

    setWatchlist([...watchlist, stockData]);
    setNewSymbol("");
    setDialogOpen(false);
    
    toast({
      title: "Success",
      description: `Added ${symbol} to your watchlist`,
    });
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Watchlist</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshAllStocks}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Stock
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stock to Watchlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="stock-symbol" className="text-sm font-medium">
                  Stock Symbol
                </label>
                <Input
                  id="stock-symbol"
                  placeholder="e.g., TSLA, AMZN, NVDA"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddStock()}
                />
              </div>
              <Button onClick={handleAddStock} disabled={loading} className="w-full">
                {loading ? "Fetching..." : "Add to Watchlist"}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        {watchlist.map((stock) => (
          <div
            key={stock.symbol}
            onClick={() => onSelectStock(stock.symbol)}
            className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer hover:border-primary ${
              selectedStock === stock.symbol ? "border-primary bg-primary/5" : "border-border bg-secondary/30"
            }`}
          >
            <div className="grid grid-cols-[1fr,auto,120px] gap-4 items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{stock.symbol}</span>
                  {stock.isPositive ? (
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-danger" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{stock.name}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-xl font-bold">{stock.price}</span>
                  <span className={`text-sm font-semibold ${stock.isPositive ? "text-success" : "text-danger"}`}>
                    {stock.change} ({stock.changePercent})
                  </span>
                </div>
              </div>

              <div className="h-16 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stock.data}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={stock.isPositive ? "hsl(var(--success))" : "hsl(var(--danger))"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
