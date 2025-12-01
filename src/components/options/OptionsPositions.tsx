import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface OptionsTrade {
  id: string;
  contract_symbol: string;
  underlying_symbol: string;
  option_type: string;
  trade_action: string;
  contracts: number;
  strike_price: number;
  premium: number;
  expiration_date: string;
  total_cost: number;
  status: string;
  trade_date: string;
}

export const OptionsPositions = () => {
  const [positions, setPositions] = useState<OptionsTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('options_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false });

      if (error) throw error;
      setPositions(data || []);
    } catch (error: any) {
      toast({
        title: "Failed to load positions",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const closePosition = async (positionId: string) => {
    try {
      const { error } = await supabase
        .from('options_trades')
        .update({ status: 'closed' })
        .eq('id', positionId);

      if (error) throw error;

      toast({
        title: "Position Closed",
        description: "Your options position has been closed"
      });
      
      fetchPositions();
    } catch (error: any) {
      toast({
        title: "Failed to close position",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  const openPositions = positions.filter(p => p.status === 'open');
  const closedPositions = positions.filter(p => p.status !== 'open');

  if (positions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No options positions yet. Start trading to see your positions!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {openPositions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Open Positions</h2>
          <div className="space-y-3">
            {openPositions.map((position) => (
              <Card key={position.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {position.option_type === 'call' ? (
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-500" />
                      )}
                      <div>
                        <h3 className="text-xl font-bold">{position.underlying_symbol}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={position.option_type === 'call' ? 'default' : 'destructive'}>
                            {position.option_type.toUpperCase()}
                          </Badge>
                          <Badge variant={position.trade_action === 'buy' ? 'default' : 'secondary'}>
                            {position.trade_action.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{position.contracts} contracts</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Strike</p>
                        <p className="font-bold">${position.strike_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Premium</p>
                        <p className="font-semibold">${position.premium.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Expires
                        </p>
                        <p className="font-medium">{format(new Date(position.expiration_date), 'MMM dd')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Total Cost
                        </p>
                        <p className="font-bold">${position.total_cost.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => closePosition(position.id)}
                    variant="outline"
                    size="sm"
                  >
                    Close Position
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {closedPositions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Closed Positions</h2>
          <div className="space-y-2">
            {closedPositions.map((position) => (
              <Card key={position.id} className="p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {position.option_type === 'call' ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-bold">{position.underlying_symbol} ${position.strike_price} {position.option_type}</p>
                      <p className="text-xs text-muted-foreground">{position.contracts} contracts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${position.total_cost.toFixed(2)}</p>
                    <Badge variant="secondary" className="text-xs">Closed</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
