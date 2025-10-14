import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MarketIndex {
  name: string;
  value: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

export const MarketOverview = () => {
  const [indices, setIndices] = useState<MarketIndex[]>([
    { name: "S&P 500", value: "4,783.45", change: "+45.23", changePercent: "+0.95%", isPositive: true },
    { name: "DOW JONES", value: "37,305.16", change: "+123.45", changePercent: "+0.33%", isPositive: true },
    { name: "NASDAQ", value: "14,813.92", change: "-23.78", changePercent: "-0.16%", isPositive: false },
  ]);

  useEffect(() => {
    // In production, this would fetch real-time data from an edge function
    const fetchMarketData = async () => {
      try {
        // Placeholder for real-time market data integration
        console.log("Market overview loaded");
      } catch (error) {
        console.error("Error fetching market data:", error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {indices.map((index) => (
        <Card
          key={index.name}
          className="p-6 bg-gradient-to-br from-card to-card/50 border-border hover:border-primary/50 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{index.name}</p>
              <p className="text-2xl font-bold mt-2">{index.value}</p>
            </div>
            <div className={`p-2 rounded-lg ${index.isPositive ? 'bg-success/10' : 'bg-danger/10'}`}>
              {index.isPositive ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-danger" />
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className={`text-sm font-semibold ${index.isPositive ? 'text-success' : 'text-danger'}`}>
              {index.change}
            </span>
            <span className={`text-sm ${index.isPositive ? 'text-success' : 'text-danger'}`}>
              {index.changePercent}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
};
