import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Calendar, Activity } from "lucide-react";
import { format } from "date-fns";

interface OptionsChainProps {
  options: any[];
  currentPrice: number;
  onSelectOption: (option: any) => void;
}

export const OptionsChain = ({ options, currentPrice, onSelectOption }: OptionsChainProps) => {
  // Group options by expiration date
  const groupedOptions = options.reduce((acc: any, option: any) => {
    const date = option.expiration_date;
    if (!acc[date]) {
      acc[date] = { calls: [], puts: [] };
    }
    if (option.option_type === 'call') {
      acc[date].calls.push(option);
    } else {
      acc[date].puts.push(option);
    }
    return acc;
  }, {});

  const expirationDates = Object.keys(groupedOptions).sort();

  return (
    <div className="space-y-4">
      <Tabs defaultValue={expirationDates[0]}>
        <TabsList className="grid w-full grid-cols-4">
          {expirationDates.map((date) => (
            <TabsTrigger key={date} value={date}>
              <Calendar className="h-4 w-4 mr-2" />
              {format(new Date(date), 'MMM dd')}
            </TabsTrigger>
          ))}
        </TabsList>

        {expirationDates.map((date) => (
          <TabsContent key={date} value={date} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Calls */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-bold">Call Options</h3>
                </div>
                <div className="space-y-2">
                  {groupedOptions[date].calls.map((option: any) => {
                    const isITM = parseFloat(option.strike_price) < currentPrice;
                    return (
                      <Card 
                        key={option.contract_symbol} 
                        className={`p-4 hover:border-green-500 transition-colors cursor-pointer ${isITM ? 'bg-green-500/5' : ''}`}
                        onClick={() => onSelectOption(option)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-lg">${option.strike_price}</p>
                            <p className="text-xs text-muted-foreground">Strike</p>
                          </div>
                          {isITM && <Badge variant="default" className="bg-green-500">ITM</Badge>}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Premium</p>
                            <p className="font-semibold text-green-500">${option.premium}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">IV</p>
                            <p className="font-semibold">{(parseFloat(option.implied_volatility) * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Delta</p>
                            <p className="font-semibold">{option.delta}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>

              {/* Puts */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-bold">Put Options</h3>
                </div>
                <div className="space-y-2">
                  {groupedOptions[date].puts.map((option: any) => {
                    const isITM = parseFloat(option.strike_price) > currentPrice;
                    return (
                      <Card 
                        key={option.contract_symbol} 
                        className={`p-4 hover:border-red-500 transition-colors cursor-pointer ${isITM ? 'bg-red-500/5' : ''}`}
                        onClick={() => onSelectOption(option)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-lg">${option.strike_price}</p>
                            <p className="text-xs text-muted-foreground">Strike</p>
                          </div>
                          {isITM && <Badge variant="destructive">ITM</Badge>}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Premium</p>
                            <p className="font-semibold text-red-500">${option.premium}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">IV</p>
                            <p className="font-semibold">{(parseFloat(option.implied_volatility) * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Delta</p>
                            <p className="font-semibold">{option.delta}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
