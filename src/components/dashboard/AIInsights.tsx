import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIInsightsProps {
  selectedStock: string;
}

export const AIInsights = ({ selectedStock }: AIInsightsProps) => {
  const [insights, setInsights] = useState<string>(
    "Based on current market trends and technical analysis, AAPL shows strong momentum with increasing volume. The stock is trading above its 50-day moving average, indicating bullish sentiment."
  );
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-stock", {
        body: { symbol: selectedStock },
      });

      if (error) throw error;

      if (data?.analysis) {
        setInsights(data.analysis);
        toast.success("AI analysis generated successfully");
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error("Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card p-6 border-primary/20 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-primary rounded-lg shadow-glow-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-heading font-bold gradient-text">AI Insights</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateInsights}
          disabled={isLoading}
          className="gap-2 hover-glow"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-secondary/50 border border-border hover-lift transition-all duration-300">
          <p className="text-sm font-heading font-semibold mb-2 text-primary">Current Analysis: {selectedStock}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{insights}</p>
        </div>

        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-gradient-success border border-success/20 hover-lift transition-all duration-300">
            <p className="text-sm font-heading font-semibold text-success mb-1">Bullish Signals</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Strong volume increase (+23%)</li>
              <li>• MACD crossover detected</li>
              <li>• Above 50-day MA</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-gradient-danger border border-danger/20 hover-lift transition-all duration-300">
            <p className="text-sm font-heading font-semibold text-danger mb-1">Risk Factors</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• High RSI (72) - overbought</li>
              <li>• Resistance at $180</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};
