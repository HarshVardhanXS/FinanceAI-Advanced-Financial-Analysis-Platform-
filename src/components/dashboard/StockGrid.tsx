import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [watchlist, setWatchlist] = useState<Stock[]>([
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      price: "$178.23",
      change: "+2.45",
      changePercent: "+1.39%",
      isPositive: true,
      data: [
        { time: "9:30", value: 175 },
        { time: "10:00", value: 176 },
        { time: "10:30", value: 177 },
        { time: "11:00", value: 178 },
      ],
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      price: "$142.67",
      change: "-1.23",
      changePercent: "-0.85%",
      isPositive: false,
      data: [
        { time: "9:30", value: 144 },
        { time: "10:00", value: 143 },
        { time: "10:30", value: 143 },
        { time: "11:00", value: 142.67 },
      ],
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corp.",
      price: "$378.91",
      change: "+5.67",
      changePercent: "+1.52%",
      isPositive: true,
      data: [
        { time: "9:30", value: 373 },
        { time: "10:00", value: 375 },
        { time: "10:30", value: 377 },
        { time: "11:00", value: 378.91 },
      ],
    },
  ]);

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Watchlist</h2>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Stock
        </Button>
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
