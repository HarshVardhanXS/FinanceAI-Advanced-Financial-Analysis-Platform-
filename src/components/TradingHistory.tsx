import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface Trade {
  id: string;
  symbol: string;
  trade_type: string;
  quantity: number;
  price: number;
  total_amount: number;
  trade_date: string;
}

export const TradingHistory = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('paper_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTrades(data || []);
    } catch (error: any) {
      toast({
        title: "Failed to load trades",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="p-12 text-center">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No trades yet. Start trading to see your history!</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Trading History</h2>
      <div className="space-y-3">
        {trades.map((trade) => (
          <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${trade.trade_type === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {trade.trade_type === 'buy' ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{trade.symbol}</span>
                  <Badge variant={trade.trade_type === 'buy' ? 'default' : 'secondary'}>
                    {trade.trade_type.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {trade.quantity} shares @ ${trade.price.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">${trade.total_amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(trade.trade_date), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
