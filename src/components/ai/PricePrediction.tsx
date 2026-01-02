import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Target, AlertTriangle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PredictionData {
  currentPrice: number;
  predictedPrice: number;
  priceTarget: { low: number; mid: number; high: number };
  confidence: number;
  direction: "up" | "down" | "sideways";
  percentageChange: number;
  supportLevel: number;
  resistanceLevel: number;
  keyFactors: string[];
  riskLevel: "low" | "medium" | "high";
  reasoning: string;
  disclaimer: string;
}

interface PricePredictionProps {
  symbol: string;
}

export const PricePrediction = ({ symbol }: PricePredictionProps) => {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [timeframe, setTimeframe] = useState<"1d" | "1w" | "1m" | "3m">("1w");
  const [isLoading, setIsLoading] = useState(false);

  const generatePrediction = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("price-prediction", {
        body: { symbol, timeframe },
      });

      if (error) throw error;

      if (data?.prediction) {
        setPrediction(data.prediction);
        toast.success("Price prediction generated");
      }
    } catch (error) {
      console.error("Error generating prediction:", error);
      toast.error("Failed to generate prediction");
    } finally {
      setIsLoading(false);
    }
  };

  const getDirectionIcon = () => {
    if (!prediction) return <Minus className="h-5 w-5" />;
    switch (prediction.direction) {
      case "up": return <TrendingUp className="h-5 w-5 text-success" />;
      case "down": return <TrendingDown className="h-5 w-5 text-danger" />;
      default: return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-success bg-success/10 border-success/20";
      case "high": return "text-danger bg-danger/10 border-danger/20";
      default: return "text-warning bg-warning/10 border-warning/20";
    }
  };

  const timeframeLabels = {
    "1d": "1 Day",
    "1w": "1 Week",
    "1m": "1 Month",
    "3m": "3 Months"
  };

  return (
    <Card className="glass-card p-6 border-primary/20 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-lg">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-heading font-bold">AI Price Prediction</h3>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 Day</SelectItem>
              <SelectItem value="1w">1 Week</SelectItem>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={generatePrediction}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Predict
          </Button>
        </div>
      </div>

      {prediction ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Current Price</p>
              <p className="text-xl font-bold font-heading">${prediction.currentPrice.toFixed(2)}</p>
            </div>
            <div className={`p-3 rounded-lg border ${
              prediction.direction === "up" ? "bg-success/10 border-success/20" :
              prediction.direction === "down" ? "bg-danger/10 border-danger/20" :
              "bg-secondary/50 border-border"
            }`}>
              <p className="text-xs text-muted-foreground mb-1">Predicted ({timeframeLabels[timeframe]})</p>
              <div className="flex items-center gap-2">
                {getDirectionIcon()}
                <p className="text-xl font-bold font-heading">${prediction.predictedPrice.toFixed(2)}</p>
              </div>
              <p className={`text-xs ${
                prediction.percentageChange > 0 ? "text-success" :
                prediction.percentageChange < 0 ? "text-danger" : "text-muted-foreground"
              }`}>
                {prediction.percentageChange > 0 ? "+" : ""}{prediction.percentageChange.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <p className="text-xs font-medium mb-2">Price Target Range</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-danger">${prediction.priceTarget.low.toFixed(2)}</span>
              <div className="flex-1 h-2 bg-gradient-to-r from-danger via-muted to-success rounded-full relative">
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-lg"
                  style={{ 
                    left: `${Math.max(0, Math.min(100, ((prediction.priceTarget.mid - prediction.priceTarget.low) / (prediction.priceTarget.high - prediction.priceTarget.low)) * 100))}%`
                  }}
                />
              </div>
              <span className="text-xs text-success">${prediction.priceTarget.high.toFixed(2)}</span>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1">
              Mid: ${prediction.priceTarget.mid.toFixed(2)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">Support</p>
              <p className="text-sm font-bold">${prediction.supportLevel.toFixed(2)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="text-sm font-bold">{prediction.confidence}%</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">Resistance</p>
              <p className="text-sm font-bold">${prediction.resistanceLevel.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${getRiskColor(prediction.riskLevel)}`}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {prediction.riskLevel} risk
            </Badge>
          </div>

          {prediction.keyFactors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium">Key Factors:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {prediction.keyFactors.slice(0, 3).map((factor, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <Sparkles className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground">{prediction.reasoning}</p>
          </div>

          <p className="text-xs text-muted-foreground italic">{prediction.disclaimer}</p>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Click "Predict" for AI-powered price forecasting for {symbol}</p>
        </div>
      )}
    </Card>
  );
};
