import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  const { toast } = useToast();
  const { role, hasAccess } = useUserRole();

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
          <h1 className="text-3xl font-bold mb-2">Stock Browser</h1>
          <p className="text-muted-foreground">Search and trade worldwide stocks</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex gap-2">
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
        </Card>

        {stocks.length > 0 && (
          <div className="grid gap-4">
            {stocks.map((stock) => (
              <Card key={stock.symbol} className="p-4 hover:border-primary transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{stock.symbol}</h3>
                      <span className="text-sm text-muted-foreground">{stock.name}</span>
                      {stock.exchange && (
                        <Badge variant="secondary" className="text-xs">
                          {stock.exchange}
                        </Badge>
                      )}
                    </div>
                    {stock.country && (
                      <p className="text-xs text-muted-foreground">{stock.country}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold">${stock.price}</div>
                      <div className={`flex items-center gap-1 text-sm ${stock.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {stock.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>{stock.change} ({stock.changePercent}%)</span>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => setSelectedStock(stock)}
                          disabled={!canTrade}
                        >
                          {canTrade ? "Trade" : <><Lock className="h-4 w-4 mr-2" /> Premium</>}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Trade {selectedStock?.symbol}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Current Price</Label>
                            <p className="text-2xl font-bold">${selectedStock?.price}</p>
                          </div>
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
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && stocks.length === 0 && searchQuery && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No stocks found. Try a different search term.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
