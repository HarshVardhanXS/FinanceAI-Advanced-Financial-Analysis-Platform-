import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, Plus, RefreshCw, X, TrendingUp } from "lucide-react";
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
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

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
        name: data.name || `${data.symbol} Corporation`,
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

  const loadWatchlist = async () => {
    if (!userId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error loading watchlist:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load watchlist",
      });
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const updatedWatchlist = [];
      for (const item of data) {
        const freshData = await fetchStockData(item.symbol);
        if (freshData) {
          updatedWatchlist.push(freshData);
        }
      }
      setWatchlist(updatedWatchlist);
    }
    setLoading(false);
  };

  const refreshAllStocks = async () => {
    if (!userId) return;
    
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
    if (userId) {
      loadWatchlist();
    }
  }, [userId]);

  const handleAddStock = async () => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please sign in to add stocks",
      });
      return;
    }

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

    if (!stockData) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch data for this symbol. Please check the symbol and try again.",
      });
      return;
    }

    // Save to database
    const { error } = await supabase
      .from('watchlists')
      .insert({
        user_id: userId,
        symbol: stockData.symbol,
        name: stockData.name
      });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add stock to watchlist",
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

  const handleRemoveStock = async (symbol: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('user_id', userId)
      .eq('symbol', symbol);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove stock from watchlist",
      });
      return;
    }

    setWatchlist(watchlist.filter(stock => stock.symbol !== symbol));
    toast({
      title: "Removed",
      description: `Removed ${symbol} from your watchlist`,
    });
  };

  return (
    <Card className="glass-card p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-bold gradient-text">Watchlist</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshAllStocks}
            disabled={loading}
            className="gap-2 hover-glow"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 hover-glow">
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
        {watchlist.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-heading font-semibold mb-2">Your watchlist is empty</p>
            <p className="text-sm">Click "Add Stock" to start tracking stocks</p>
          </div>
        ) : (
          watchlist.map((stock) => (
            <div
              key={stock.symbol}
              className={`p-4 rounded-lg border transition-all duration-300 hover-lift cursor-pointer ${
                selectedStock === stock.symbol 
                  ? "border-primary bg-gradient-primary shadow-glow-primary" 
                  : "border-border bg-secondary/30 hover:border-primary/50"
              }`}
            >
              <div className="grid grid-cols-[1fr,auto,120px] gap-4 items-center">
                <div 
                  onClick={() => onSelectStock(stock.symbol)}
                  className="cursor-pointer"
                >
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

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveStock(stock.symbol);
                  }}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
