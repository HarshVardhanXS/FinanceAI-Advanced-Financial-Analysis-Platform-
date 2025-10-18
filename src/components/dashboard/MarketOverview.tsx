import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface MarketIndex {
  name: string;
  value: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

export const MarketOverview = () => {
  const [indices, setIndices] = useState<MarketIndex[]>([
    { name: "S&P 500", value: "Loading...", change: "+0.00", changePercent: "+0.00%", isPositive: true },
    { name: "DOW JONES", value: "Loading...", change: "+0.00", changePercent: "+0.00%", isPositive: true },
    { name: "NASDAQ", value: "Loading...", change: "+0.00", changePercent: "+0.00%", isPositive: true },
  ]);
  const [loading, setLoading] = useState(false);

  const fetchMarketData = async () => {
    setLoading(true);
    const symbols = ['SPY', 'DIA', 'QQQ']; // ETFs representing major indices
    const names = ['S&P 500', 'DOW JONES', 'NASDAQ'];
    const newData: MarketIndex[] = [];
    let isDemoData = false;

    for (let i = 0; i < symbols.length; i++) {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
          body: { symbol: symbols[i] }
        });

        if (!error && data && !data.error) {
          if (data.isDemo) isDemoData = true;
          
          newData.push({
            name: names[i],
            value: `$${data.price}`,
            change: data.isPositive ? `+${data.change}` : data.change,
            changePercent: data.isPositive ? `+${data.changePercent}%` : `${data.changePercent}%`,
            isPositive: data.isPositive
          });
        } else {
          // Keep previous data if fetch fails
          newData.push(indices[i] || {
            name: names[i],
            value: "N/A",
            change: "+0.00",
            changePercent: "+0.00%",
            isPositive: true
          });
        }
      } catch (e) {
        console.error(`Error fetching ${names[i]}:`, e);
        newData.push(indices[i] || {
          name: names[i],
          value: "N/A",
          change: "+0.00",
          changePercent: "+0.00%",
          isPositive: true
        });
      }
    }

    setIndices(newData);
    setLoading(false);
    console.log("Market overview loaded", isDemoData ? "(demo data)" : "");
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-3 flex justify-end mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchMarketData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Markets
        </Button>
      </div>
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
