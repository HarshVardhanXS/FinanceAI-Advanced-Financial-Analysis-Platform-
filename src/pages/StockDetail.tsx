import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, TrendingUp, TrendingDown, Building2, DollarSign, 
  BarChart3, Users, Globe, Calendar, Lock, Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StockDetails {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  dividend?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
  avgVolume?: number;
  industry?: string;
  sector?: string;
  description?: string;
  website?: string;
  employees?: number;
  country?: string;
  exchange?: string;
  ipo?: string;
  chartData?: { time: string; value: number }[];
}

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasAccess } = useUserRole();
  
  const [stock, setStock] = useState<StockDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"1D" | "1W" | "1M" | "3M" | "1Y">("1D");
  const [quantity, setQuantity] = useState("1");
  const [tradeLoading, setTradeLoading] = useState(false);

  const canTrade = hasAccess('premium');

  useEffect(() => {
    if (symbol) {
      fetchStockDetails(symbol);
    }
  }, [symbol]);

  const fetchStockDetails = async (sym: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-details', {
        body: { symbol: sym }
      });

      if (error) throw error;
      setStock(data);
    } catch (error: any) {
      toast({
        title: "Failed to load stock details",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!stock || !hasAccess('premium')) {
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
      const totalAmount = qty * stock.price;

      const { error } = await supabase.from('paper_trades').insert({
        user_id: user.id,
        symbol: stock.symbol,
        trade_type: type,
        quantity: qty,
        price: stock.price,
        total_amount: totalAmount
      });

      if (error) throw error;

      toast({
        title: "Trade Executed",
        description: `${type === 'buy' ? 'Bought' : 'Sold'} ${qty} shares of ${stock.symbol}`
      });
      
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

  const addToWatchlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Login Required",
          description: "Please login to add stocks to your watchlist",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.from('watchlists').insert({
        user_id: user.id,
        symbol: stock?.symbol || '',
        name: stock?.name || ''
      });

      if (error) throw error;

      toast({
        title: "Added to Watchlist",
        description: `${stock?.symbol} has been added to your watchlist`
      });
    } catch (error: any) {
      toast({
        title: "Failed to add",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "N/A";
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const formatVolume = (num: number | undefined) => {
    if (num === undefined) return "N/A";
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              <p className="text-muted-foreground">Loading stock details...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Stock not found</p>
            <Button onClick={() => navigate('/stocks')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browser
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/stocks')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Stock Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{stock.symbol}</h1>
              {stock.exchange && (
                <Badge variant="secondary">{stock.exchange}</Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground mb-4">{stock.name}</p>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold">${stock.price.toFixed(2)}</span>
              <div className={`flex items-center gap-1 text-lg ${stock.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {stock.isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={addToWatchlist}>
              <Star className="h-4 w-4 mr-2" />
              Add to Watchlist
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={!canTrade}>
                  {canTrade ? (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Trade
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Premium
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Trade {stock.symbol}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                      <p className="text-2xl font-bold">${stock.price.toFixed(2)}</p>
                    </div>
                    <div className={`text-right ${stock.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      <p className="text-lg font-semibold">{stock.changePercent.toFixed(2)}%</p>
                    </div>
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
                      ${(parseFloat(quantity) * stock.price).toFixed(2)}
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

        {/* Chart */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Price Chart</CardTitle>
            <div className="flex gap-1">
              {(["1D", "1W", "1M", "3M", "1Y"] as const).map((period) => (
                <Button
                  key={period}
                  variant={chartPeriod === period ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartPeriod(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stock.chartData || []}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={stock.isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={stock.isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis domain={['auto', 'auto']} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={stock.isPositive ? "#22c55e" : "#ef4444"}
                    fill="url(#colorValue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="company">Company Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-xl font-bold">${stock.open?.toFixed(2) || 'N/A'}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Previous Close</p>
                <p className="text-xl font-bold">${stock.previousClose?.toFixed(2) || 'N/A'}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Day High</p>
                <p className="text-xl font-bold">${stock.high?.toFixed(2) || 'N/A'}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Day Low</p>
                <p className="text-xl font-bold">${stock.low?.toFixed(2) || 'N/A'}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">52 Week High</p>
                <p className="text-xl font-bold">${stock.week52High?.toFixed(2) || 'N/A'}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">52 Week Low</p>
                <p className="text-xl font-bold">${stock.week52Low?.toFixed(2) || 'N/A'}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Volume</p>
                <p className="text-xl font-bold">{formatVolume(stock.volume)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Avg Volume</p>
                <p className="text-xl font-bold">{formatVolume(stock.avgVolume)}</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financials" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Market Cap</p>
                </div>
                <p className="text-xl font-bold">{formatNumber(stock.marketCap)}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">P/E Ratio</p>
                </div>
                <p className={`text-xl font-bold ${stock.peRatio && stock.peRatio < 15 ? 'text-green-500' : stock.peRatio && stock.peRatio > 30 ? 'text-red-500' : ''}`}>
                  {stock.peRatio?.toFixed(2) || 'N/A'}
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">EPS</p>
                </div>
                <p className={`text-xl font-bold ${stock.eps && stock.eps > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${stock.eps?.toFixed(2) || 'N/A'}
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Dividend Yield</p>
                </div>
                <p className={`text-xl font-bold ${stock.dividend && stock.dividend >= 3 ? 'text-green-500' : ''}`}>
                  {stock.dividend ? `${stock.dividend.toFixed(2)}%` : 'N/A'}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Beta</p>
                <p className="text-xl font-bold">{stock.beta?.toFixed(2) || 'N/A'}</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Profile
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry</span>
                    <span className="font-medium">{stock.industry || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sector</span>
                    <span className="font-medium">{stock.sector || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-medium">{stock.country || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employees</span>
                    <span className="font-medium">{stock.employees?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IPO Date</span>
                    <span className="font-medium">{stock.ipo || 'N/A'}</span>
                  </div>
                  {stock.website && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Website</span>
                      <a href={stock.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Visit
                      </a>
                    </div>
                  )}
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {stock.description || 'No company description available.'}
                </p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}