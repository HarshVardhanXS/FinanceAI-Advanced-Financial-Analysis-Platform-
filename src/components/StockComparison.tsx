import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

interface StockData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  high: string;
  low: string;
  volume: string;
  chartData: Array<{ time: string; value: number }>;
}

interface StockComparisonProps {
  symbols: string[];
}

export const StockComparison = ({ symbols }: StockComparisonProps) => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);

  useEffect(() => {
    fetchStockData();
  }, [symbols]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const promises = symbols.map(symbol =>
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
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Merge chart data from all stocks for synchronized view
  const mergedChartData = stocks.length > 0
    ? stocks[0].chartData.map((point, index) => {
        const dataPoint: any = { time: point.time };
        stocks.forEach(stock => {
          dataPoint[stock.symbol] = stock.chartData[index]?.value || 0;
        });
        return dataPoint;
      })
    : [];

  // Generate colors for each stock
  const colors = ["hsl(189, 94%, 53%)", "hsl(142, 76%, 36%)", "hsl(45, 93%, 47%)", "hsl(263, 70%, 50%)"];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {symbols.map((symbol) => (
          <Card key={symbol} className="glass-card border-border/50">
            <CardHeader>
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Individual Stock Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stocks.map((stock) => (
          <Card 
            key={stock.symbol} 
            className="glass-card border-border/50 hover-lift transition-all group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
                    {stock.symbol}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{stock.name}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  stock.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  {stock.isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-semibold text-sm">{stock.changePercent}%</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">${stock.price}</span>
                <span className={`flex items-center gap-1 text-lg font-medium ${
                  stock.isPositive ? "text-success" : "text-destructive"
                }`}>
                  {stock.isPositive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  {stock.change}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">High</p>
                  <p className="text-lg font-semibold">${stock.high}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Low</p>
                  <p className="text-lg font-semibold">${stock.low}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Synchronized Chart */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Synchronized Price Chart
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Compare price movements across all selected stocks
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart 
              data={mergedChartData}
              onMouseMove={(e: any) => {
                if (e?.activeLabel) {
                  setHoveredTime(e.activeLabel);
                }
              }}
              onMouseLeave={() => setHoveredTime(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
              />
              {stocks.map((stock, index) => (
                <Line
                  key={stock.symbol}
                  type="monotone"
                  dataKey={stock.symbol}
                  stroke={colors[index]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: colors[index] }}
                  name={stock.symbol}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Metric</th>
                  {stocks.map((stock) => (
                    <th key={stock.symbol} className="text-right py-3 px-4 text-sm font-semibold">
                      {stock.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                  <td className="py-3 px-4 text-sm text-muted-foreground">Current Price</td>
                  {stocks.map((stock) => (
                    <td key={stock.symbol} className="text-right py-3 px-4 font-semibold">
                      ${stock.price}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                  <td className="py-3 px-4 text-sm text-muted-foreground">Change %</td>
                  {stocks.map((stock) => (
                    <td 
                      key={stock.symbol} 
                      className={`text-right py-3 px-4 font-semibold ${
                        stock.isPositive ? "text-success" : "text-destructive"
                      }`}
                    >
                      {stock.changePercent}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                  <td className="py-3 px-4 text-sm text-muted-foreground">Day High</td>
                  {stocks.map((stock) => (
                    <td key={stock.symbol} className="text-right py-3 px-4 font-semibold">
                      ${stock.high}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-accent/20 transition-colors">
                  <td className="py-3 px-4 text-sm text-muted-foreground">Day Low</td>
                  {stocks.map((stock) => (
                    <td key={stock.symbol} className="text-right py-3 px-4 font-semibold">
                      ${stock.low}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
