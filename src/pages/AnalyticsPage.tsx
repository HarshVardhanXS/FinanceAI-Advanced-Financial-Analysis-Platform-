import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, Activity, PieChart, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, PieChart as RePieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PortfolioItem {
  symbol: string;
  quantity: number;
  average_price: number;
  current_price?: number;
  current_value?: number;
  total_return?: number;
  return_percentage?: number;
}

interface Transaction {
  id: string;
  symbol: string;
  transaction_type: string;
  quantity: number;
  price: number;
  total_amount: number;
  transaction_date: string;
}

const AnalyticsPage = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch portfolio
      const { data: portfolioData, error: portfolioError } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", user.id);

      if (portfolioError) throw portfolioError;

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch watchlist count
      const { count, error: watchlistError } = await supabase
        .from("watchlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (watchlistError) throw watchlistError;

      setTransactions(transactionsData || []);
      setWatchlistCount(count || 0);

      // Fetch current prices for portfolio items
      if (portfolioData && portfolioData.length > 0) {
        const portfolioWithPrices = await Promise.all(
          portfolioData.map(async (item) => {
            try {
              const { data: stockData } = await supabase.functions.invoke("fetch-stock-data", {
                body: { symbol: item.symbol },
              });

              const currentPrice = stockData?.current || item.average_price;
              const currentValue = currentPrice * item.quantity;
              const investedValue = item.average_price * item.quantity;
              const totalReturn = currentValue - investedValue;
              const returnPercentage = (totalReturn / investedValue) * 100;

              return {
                ...item,
                current_price: currentPrice,
                current_value: currentValue,
                total_return: totalReturn,
                return_percentage: returnPercentage,
              };
            } catch (error) {
              return {
                ...item,
                current_price: item.average_price,
                current_value: item.average_price * item.quantity,
                total_return: 0,
                return_percentage: 0,
              };
            }
          })
        );

        setPortfolio(portfolioWithPrices);

        // Calculate totals
        const total = portfolioWithPrices.reduce((sum, item) => sum + (item.current_value || 0), 0);
        const invested = portfolioWithPrices.reduce((sum, item) => sum + (item.average_price * item.quantity), 0);
        
        setTotalValue(total);
        setTotalInvested(invested);
      } else {
        setPortfolio([]);
        setTotalValue(0);
        setTotalInvested(0);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const totalReturn = totalValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Prepare chart data
  const allocationData = portfolio.map(item => ({
    name: item.symbol,
    value: item.current_value || 0,
  }));

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Performance over time (last 30 days based on transactions)
  const performanceData = transactions
    .slice(0, 30)
    .reverse()
    .map((txn, index) => ({
      date: new Date(txn.transaction_date).toLocaleDateString(),
      value: txn.transaction_type === 'buy' ? txn.total_amount : -txn.total_amount,
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div>
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-96 mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-[500px]" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-2">Track your performance and insights</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Portfolio value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Return</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalReturn >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  ${Math.abs(totalReturn).toFixed(2)} {totalReturn >= 0 ? 'gain' : 'loss'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolio.length}</div>
                <p className="text-xs text-muted-foreground">Holdings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Watchlist</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{watchlistCount}</div>
                <p className="text-xs text-muted-foreground">Stocks tracked</p>
              </CardContent>
            </Card>
          </div>

          {portfolio.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Add positions to see detailed analytics</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="allocation" className="space-y-4">
              <TabsList>
                <TabsTrigger value="allocation">
                  <PieChart className="h-4 w-4 mr-2" />
                  Asset Allocation
                </TabsTrigger>
                <TabsTrigger value="performance">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="transactions">
                  <Calendar className="h-4 w-4 mr-2" />
                  Transactions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="allocation" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Portfolio Allocation</CardTitle>
                      <CardDescription>Distribution by stock</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Holdings Breakdown</CardTitle>
                      <CardDescription>Current value by position</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {portfolio.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <div>
                                <p className="font-medium">{item.symbol}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} shares @ ${item.current_price?.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${item.current_value?.toFixed(2)}</p>
                              <p className={`text-sm ${(item.return_percentage || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {(item.return_percentage || 0) >= 0 ? '+' : ''}{item.return_percentage?.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription>Portfolio value trends</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {performanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No transaction history available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Recent trading activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {transactions.length > 0 ? (
                      <div className="space-y-3">
                        {transactions.slice(0, 10).map((txn) => (
                          <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${txn.transaction_type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                              <div>
                                <p className="font-medium">{txn.symbol}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(txn.transaction_date).toLocaleDateString()} • {txn.quantity} shares
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${txn.transaction_type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                {txn.transaction_type === 'buy' ? '-' : '+'}${Math.abs(txn.total_amount).toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @ ${txn.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No transactions yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;
