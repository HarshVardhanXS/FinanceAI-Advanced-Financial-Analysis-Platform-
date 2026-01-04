import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Globe, Flame, ArrowUpCircle, ArrowDownCircle, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  volume?: number;
}

type CategoryFilter = "all" | "gainers" | "losers" | "active";

export default function StockBrowser() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState("US");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const { toast } = useToast();

  const filteredStocks = useMemo(() => {
    if (categoryFilter === "all") return stocks;
    
    const sortedStocks = [...stocks];
    
    switch (categoryFilter) {
      case "gainers":
        return sortedStocks
          .filter(s => s.isPositive)
          .sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent));
      case "losers":
        return sortedStocks
          .filter(s => !s.isPositive)
          .sort((a, b) => parseFloat(a.changePercent) - parseFloat(b.changePercent));
      case "active":
        return sortedStocks
          .sort((a, b) => (b.volume || 0) - (a.volume || 0));
      default:
        return stocks;
    }
  }, [stocks, categoryFilter]);

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
      
      if (data.rateLimited) {
        toast({
          title: "API Rate Limit",
          description: "Finnhub API limit reached. Please wait a moment and try again.",
          variant: "destructive"
        });
      }
      
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

        {/* Category Filters */}
        <div className="mb-6">
          <ToggleGroup 
            type="single" 
            value={categoryFilter} 
            onValueChange={(value) => value && setCategoryFilter(value as CategoryFilter)}
            className="justify-start flex-wrap"
          >
            <ToggleGroupItem value="all" aria-label="All stocks" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              All Stocks
            </ToggleGroupItem>
            <ToggleGroupItem value="gainers" aria-label="Top gainers" className="gap-2 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-500">
              <ArrowUpCircle className="h-4 w-4" />
              Top Gainers
            </ToggleGroupItem>
            <ToggleGroupItem value="losers" aria-label="Top losers" className="gap-2 data-[state=on]:bg-red-500/20 data-[state=on]:text-red-500">
              <ArrowDownCircle className="h-4 w-4" />
              Top Losers
            </ToggleGroupItem>
            <ToggleGroupItem value="active" aria-label="Most active" className="gap-2 data-[state=on]:bg-orange-500/20 data-[state=on]:text-orange-500">
              <Flame className="h-4 w-4" />
              Most Active
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {loading && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              <p className="text-muted-foreground">Loading stocks from {exchanges.find(e => e.code === selectedExchange)?.name}...</p>
            </div>
          </Card>
        )}

        {!loading && filteredStocks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {searchQuery 
                  ? `Search Results (${filteredStocks.length})` 
                  : `${exchanges.find(e => e.code === selectedExchange)?.name} ${
                      categoryFilter === "gainers" ? "Top Gainers" :
                      categoryFilter === "losers" ? "Top Losers" :
                      categoryFilter === "active" ? "Most Active" : "Stocks"
                    } (${filteredStocks.length})`
                }
              </h2>
              <p className="text-sm text-muted-foreground">Click on any stock for details</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredStocks.map((stock) => (
                <Card 
                  key={stock.symbol}
                  className="p-4 hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/stocks/${stock.symbol}`)}
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
                </Card>
              ))}
            </div>
          </div>
        )}

        {!loading && stocks.length > 0 && filteredStocks.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No {categoryFilter === "gainers" ? "gaining" : categoryFilter === "losers" ? "losing" : ""} stocks found for this filter.
            </p>
          </Card>
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
