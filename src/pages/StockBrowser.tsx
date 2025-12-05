import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Lock, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Stock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  exchange?: string;
  currency?: string;
  country?: string;
}

export default function StockBrowser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState("US");
  const { toast } = useToast();
  const { role, hasAccess } = useUserRole();

  const exchanges = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "NS", name: "India (NSE)", flag: "🇮🇳" },
    { code: "BO", name: "India (BSE)", flag: "🇮🇳" },
    { code: "TO", name: "Toronto", flag: "🇨🇦" },
    { code: "L", name: "London", flag: "🇬🇧" },
    { code: "F", name: "Frankfurt", flag: "🇩🇪" },
    { code: "PA", name: "Paris", flag: "🇫🇷" },
    { code: "T", name: "Tokyo", flag: "🇯🇵" },
    { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
    { code: "SS", name: "Shanghai", flag: "🇨🇳" },
    { code: "SW", name: "Switzerland", flag: "🇨🇭" },
    { code: "AS", name: "Amsterdam", flag: "🇳🇱" },
  ];

  useEffect(() => {
    loadStocksByExchange(selectedExchange);
  }, [selectedExchange]);

  const loadStocksByExchange = async (exchange: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-symbols', {
        body: { exchange }
      });

      if (error) throw error;
      setStocks(data.stocks || []);
    } catch (error: any) {
      toast({
        title: "Failed to load stocks",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-stocks', {
        body: { query: searchQuery }
      });

      if (error) throw error;
      setStocks(data.stocks || []);
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!selectedStock || !hasAccess('premium')) {
      toast({
        title: "Upgrade Required",
        description: "Premium membership required for trading",
        variant: "destructive"
      });
      return;
    }

    setTradeLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const qty = parseFloat(quantity);
      const price = parseFloat(selectedStock.price);
      const totalAmount = qty * price;

      const { error } = await supabase.from('paper_trades').insert({
        user_id: user.id,
        symbol: selectedStock.symbol,
        trade_type: type,
        quantity: qty,
        price: price,
        total_amount: totalAmount
      });

      if (error) throw error;

      toast({
        title: "Trade Executed",
        description: `${type === 'buy' ? 'Bought' : 'Sold'} ${qty} shares of ${selectedStock.symbol}`
      });
      
      setSelectedStock(null);
      setQuantity("1");
    } catch (error: any) {
      toast({
        title: "Trade failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTradeLoading(false);
    }
  };

  const canTrade = hasAccess('premium');

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Global Stock Browser</h1>
          </div>
          <p className="text-muted-foreground">Browse and trade stocks from major exchanges worldwide with real-time data</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search stocks by symbol or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          <Tabs value={selectedExchange} onValueChange={setSelectedExchange} className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1">
              {exchanges.map((exchange) => (
                <TabsTrigger key={exchange.code} value={exchange.code} className="text-xs px-3 py-2">
                  <span className="mr-1">{exchange.flag}</span>
                  {exchange.code}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </Card>

        {loading && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              <p className="text-muted-foreground">Loading stocks from {exchanges.find(e => e.code === selectedExchange)?.name}...</p>
            </div>
          </Card>
        )}

        {!loading && stocks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {searchQuery ? `Search Results (${stocks.length})` : `${exchanges.find(e => e.code === selectedExchange)?.name} Stocks (${stocks.length})`}
              </h2>
              <p className="text-sm text-muted-foreground">Click on any stock to trade</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {stocks.map((stock) => (
              <Dialog key={stock.symbol}>
                <DialogTrigger asChild>
                  <Card 
                    className="p-4 hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => setSelectedStock(stock)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold truncate group-hover:text-primary transition-colors">{stock.symbol}</h3>
                        <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                      </div>
                      {stock.exchange && (
                        <Badge variant="secondary" className="text-[10px] ml-2 shrink-0">
                          {stock.exchange}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-xl font-bold">${stock.price}</div>
                      <div className={`flex items-center gap-1 text-xs ${stock.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {stock.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span>{stock.changePercent}%</span>
                      </div>
                    </div>
                    {!canTrade && (
                      <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>Premium to trade</span>
                      </div>
                    )}
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Trade {selectedStock?.symbol}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{selectedStock?.name}</p>
                        <p className="text-2xl font-bold">${selectedStock?.price}</p>
                      </div>
                      <div className={`text-right ${selectedStock?.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        <p className="text-sm">{selectedStock?.change}</p>
                        <p className="text-lg font-semibold">{selectedStock?.changePercent}%</p>
                      </div>
                    </div>
                    {canTrade ? (
                      <>
                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Total Amount</Label>
                          <p className="text-xl font-semibold">
                            ${(parseFloat(quantity) * parseFloat(selectedStock?.price || "0")).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleTrade('buy')} 
                            disabled={tradeLoading}
                            className="flex-1"
                          >
                            Buy
                          </Button>
                          <Button 
                            onClick={() => handleTrade('sell')} 
                            disabled={tradeLoading}
                            variant="secondary"
                            className="flex-1"
                          >
                            Sell
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Upgrade to Premium to trade this stock</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            ))}
            </div>
          </div>
        )}

        {!loading && stocks.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery ? "No stocks found. Try a different search term." : "No stocks available for this exchange."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
