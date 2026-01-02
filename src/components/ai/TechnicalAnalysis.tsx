import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TechnicalData {
  trend: {
    direction: "bullish" | "bearish" | "sideways";
    strength: "strong" | "moderate" | "weak";
    duration: "short-term" | "medium-term" | "long-term";
  };
  indicators: {
    rsi: { value: number; signal: "overbought" | "oversold" | "neutral" };
    macd: { signal: "bullish" | "bearish" | "neutral"; crossover: boolean };
    movingAverages: {
      sma20: number;
      sma50: number;
      sma200: number;
      goldenCross: boolean;
      deathCross: boolean;
    };
    bollingerBands: { position: "upper" | "middle" | "lower"; squeeze: boolean };
  };
  patterns: Array<{ name: string; type: "bullish" | "bearish"; reliability: "high" | "medium" | "low" }>;
  supportResistance: { support: number[]; resistance: number[]; pivotPoint: number };
  volume: { trend: "increasing" | "decreasing" | "stable"; signal: "accumulation" | "distribution" | "neutral" };
  recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  signals: { buy: number; sell: number; neutral: number };
  summary: string;
}

interface TechnicalAnalysisProps {
  symbol: string;
}

export const TechnicalAnalysis = ({ symbol }: TechnicalAnalysisProps) => {
  const [analysis, setAnalysis] = useState<TechnicalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeStock = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("technical-analysis", {
        body: { symbol },
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(data.analysis);
        toast.success("Technical analysis complete");
      }
    } catch (error) {
      console.error("Error analyzing stock:", error);
      toast.error("Failed to generate technical analysis");
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case "strong_buy": return { color: "text-success", bg: "bg-success/20", label: "Strong Buy" };
      case "buy": return { color: "text-success", bg: "bg-success/10", label: "Buy" };
      case "sell": return { color: "text-danger", bg: "bg-danger/10", label: "Sell" };
      case "strong_sell": return { color: "text-danger", bg: "bg-danger/20", label: "Strong Sell" };
      default: return { color: "text-muted-foreground", bg: "bg-muted/50", label: "Hold" };
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "bullish": return <TrendingUp className="h-4 w-4 text-success" />;
      case "bearish": return <TrendingDown className="h-4 w-4 text-danger" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const totalSignals = analysis ? analysis.signals.buy + analysis.signals.sell + analysis.signals.neutral : 0;

  return (
    <Card className="glass-card p-6 border-primary/20 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-heading font-bold">Technical Analysis</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={analyzeStock}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Analyze
        </Button>
      </div>

      {analysis ? (
        <div className="space-y-4">
          {/* Recommendation */}
          <div className={`p-4 rounded-lg text-center ${getRecommendationStyle(analysis.recommendation).bg}`}>
            <p className="text-xs text-muted-foreground mb-1">AI Recommendation</p>
            <p className={`text-2xl font-bold font-heading ${getRecommendationStyle(analysis.recommendation).color}`}>
              {getRecommendationStyle(analysis.recommendation).label}
            </p>
          </div>

          {/* Signal Distribution */}
          <div className="space-y-2">
            <p className="text-xs font-medium">Signal Distribution</p>
            <div className="flex gap-1 h-4 rounded-full overflow-hidden">
              <div 
                className="bg-success transition-all" 
                style={{ width: `${totalSignals ? (analysis.signals.buy / totalSignals) * 100 : 33}%` }}
              />
              <div 
                className="bg-muted-foreground transition-all" 
                style={{ width: `${totalSignals ? (analysis.signals.neutral / totalSignals) * 100 : 34}%` }}
              />
              <div 
                className="bg-danger transition-all" 
                style={{ width: `${totalSignals ? (analysis.signals.sell / totalSignals) * 100 : 33}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="text-success">Buy: {analysis.signals.buy}</span>
              <span>Neutral: {analysis.signals.neutral}</span>
              <span className="text-danger">Sell: {analysis.signals.sell}</span>
            </div>
          </div>

          {/* Trend */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2">
              {getTrendIcon(analysis.trend.direction)}
              <span className="text-sm font-medium capitalize">{analysis.trend.direction} Trend</span>
            </div>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs">{analysis.trend.strength}</Badge>
              <Badge variant="outline" className="text-xs">{analysis.trend.duration}</Badge>
            </div>
          </div>

          {/* Key Indicators */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">RSI</span>
                <Badge variant={
                  analysis.indicators.rsi.signal === "overbought" ? "destructive" :
                  analysis.indicators.rsi.signal === "oversold" ? "default" : "secondary"
                } className="text-xs">
                  {analysis.indicators.rsi.signal}
                </Badge>
              </div>
              <Progress value={analysis.indicators.rsi.value} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 text-right">{analysis.indicators.rsi.value.toFixed(1)}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">MACD</span>
                <Badge variant={
                  analysis.indicators.macd.signal === "bullish" ? "default" :
                  analysis.indicators.macd.signal === "bearish" ? "destructive" : "secondary"
                } className="text-xs">
                  {analysis.indicators.macd.signal}
                </Badge>
              </div>
              {analysis.indicators.macd.crossover && (
                <p className="text-xs text-primary">Crossover detected!</p>
              )}
            </div>
          </div>

          {/* Moving Averages */}
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <p className="text-xs font-medium mb-2">Moving Averages</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">SMA 20</p>
                <p className="text-sm font-bold">${analysis.indicators.movingAverages.sma20.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">SMA 50</p>
                <p className="text-sm font-bold">${analysis.indicators.movingAverages.sma50.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">SMA 200</p>
                <p className="text-sm font-bold">${analysis.indicators.movingAverages.sma200.toFixed(2)}</p>
              </div>
            </div>
            {(analysis.indicators.movingAverages.goldenCross || analysis.indicators.movingAverages.deathCross) && (
              <div className="mt-2 flex justify-center">
                <Badge variant={analysis.indicators.movingAverages.goldenCross ? "default" : "destructive"}>
                  {analysis.indicators.movingAverages.goldenCross ? "Golden Cross ✨" : "Death Cross ⚠️"}
                </Badge>
              </div>
            )}
          </div>

          {/* Patterns */}
          {analysis.patterns.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Detected Patterns</p>
              <div className="flex flex-wrap gap-1">
                {analysis.patterns.map((pattern, i) => (
                  <Badge 
                    key={i} 
                    variant={pattern.type === "bullish" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {pattern.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Volume */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs">Volume</span>
            </div>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs capitalize">{analysis.volume.trend}</Badge>
              <Badge variant={
                analysis.volume.signal === "accumulation" ? "default" :
                analysis.volume.signal === "distribution" ? "destructive" : "secondary"
              } className="text-xs capitalize">
                {analysis.volume.signal}
              </Badge>
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground">{analysis.summary}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Click "Analyze" for comprehensive technical analysis of {symbol}</p>
        </div>
      )}
    </Card>
  );
};
