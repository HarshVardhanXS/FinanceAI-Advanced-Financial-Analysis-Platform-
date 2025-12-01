import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const tradeSchema = z.object({
  contracts: z.number().int().positive().min(1).max(1000),
});

interface OptionsTradeDialogProps {
  option: any;
  currentPrice: number;
  onClose: () => void;
}

export const OptionsTradeDialog = ({ option, currentPrice, onClose }: OptionsTradeDialogProps) => {
  const [contracts, setContracts] = useState("1");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [errors, setErrors] = useState<{ contracts?: string }>({});

  const validateInput = () => {
    try {
      tradeSchema.parse({ contracts: parseInt(contracts) });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { contracts?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'contracts') {
            fieldErrors.contracts = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleTrade = async (action: 'buy' | 'sell') => {
    if (!validateInput()) {
      toast({
        title: "Validation Error",
        description: "Please check your input and try again",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const numContracts = parseInt(contracts);
      const premium = parseFloat(option.premium);
      const totalCost = numContracts * premium * 100; // Options are per 100 shares

      const { error } = await supabase.from('options_trades').insert({
        user_id: user.id,
        contract_symbol: option.contract_symbol,
        underlying_symbol: option.underlying_symbol,
        option_type: option.option_type,
        trade_action: action,
        contracts: numContracts,
        strike_price: parseFloat(option.strike_price),
        premium: premium,
        expiration_date: option.expiration_date,
        total_cost: totalCost,
        status: 'open'
      });

      if (error) throw error;

      toast({
        title: "Trade Executed",
        description: `${action === 'buy' ? 'Bought' : 'Sold'} ${numContracts} ${option.option_type} contract(s)`
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Trade failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCost = (parseInt(contracts || "0") * parseFloat(option.premium) * 100).toFixed(2);
  const isCall = option.option_type === 'call';
  const isITM = isCall 
    ? parseFloat(option.strike_price) < currentPrice 
    : parseFloat(option.strike_price) > currentPrice;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCall ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
            Trade {option.underlying_symbol} {option.option_type.toUpperCase()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Strike Price</Label>
              <p className="text-xl font-bold">${option.strike_price}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Badge variant={isITM ? "default" : "secondary"} className={isITM ? (isCall ? "bg-green-500" : "bg-red-500") : ""}>
                {isITM ? "In The Money" : "Out of Money"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Premium</Label>
              <p className="text-lg font-semibold">${option.premium}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Expiration
              </Label>
              <p className="text-sm font-medium">{format(new Date(option.expiration_date), 'MMM dd, yyyy')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Greeks</Label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Delta</p>
                <p className="font-semibold">{option.delta}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gamma</p>
                <p className="font-semibold">{option.gamma}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Theta</p>
                <p className="font-semibold">{option.theta}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vega</p>
                <p className="font-semibold">{option.vega}</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="contracts">Number of Contracts</Label>
            <Input
              id="contracts"
              type="number"
              min="1"
              max="1000"
              value={contracts}
              onChange={(e) => {
                setContracts(e.target.value);
                setErrors({});
              }}
              className={errors.contracts ? "border-destructive" : ""}
            />
            {errors.contracts && (
              <p className="text-sm text-destructive mt-1">{errors.contracts}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Each contract = 100 shares</p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Total Cost
              </Label>
              <p className="text-2xl font-bold">${totalCost}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => handleTrade('buy')} 
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              Buy to Open
            </Button>
            <Button 
              onClick={() => handleTrade('sell')} 
              disabled={loading}
              variant="secondary"
              className="flex-1"
            >
              Sell to Open
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
