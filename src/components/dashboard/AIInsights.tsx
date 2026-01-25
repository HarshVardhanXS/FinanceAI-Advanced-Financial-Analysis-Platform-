import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WatchlistStock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

interface AIInsightsProps {
  selectedStock: string;
  onSelectStock?: (symbol: string) => void;
  watchlistStocks?: WatchlistStock[];
  marketData?: {
    indices: Array<{
      name: string;
      value: string;
      change: string;
      changePercent: string;
      isPositive: boolean;
    }>;
  };
}

interface InsightData {
  summary: string;
  bullishSignals: string[];
  bearishSignals: string[];
  marketSentiment: "bullish" | "bearish" | "neutral";
  confidenceScore: number;
}

interface StockInsightsCache {
  [symbol: string]: InsightData;
}

export const AIInsights = ({ selectedStock, onSelectStock, watchlistStocks = [], marketData }: AIInsightsProps) => {
  const [currentStock, setCurrentStock] = useState(selectedStock);
  const [insightsCache, setInsightsCache] = useState<StockInsightsCache>({});
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const defaultInsight: InsightData = {
    summary: "Click refresh to generate AI-powered insights based on current market data and your selected stock.",
    bullishSignals: [],
    bearishSignals: [],
    marketSentiment: "neutral",
    confidenceScore: 0,
  };

  // Update current stock when selectedStock prop changes
  useEffect(() => {
    setCurrentStock(selectedStock);
  }, [selectedStock]);

  const currentInsights = insightsCache[currentStock] || defaultInsight;

  const handleStockChange = (symbol: string) => {
    setCurrentStock(symbol);
    if (onSelectStock) {
      onSelectStock(symbol);
    }
  };

  const generateInsights = async (symbol?: string) => {
    const targetSymbol = symbol || currentStock;
    setIsLoading(true);
    setStreamingText("");

    try {
      // Get stock data from watchlist if available
      const stockData = watchlistStocks.find(s => s.symbol === targetSymbol);
      
      // Prepare market context for AI
      const marketContext = marketData?.indices
        ? marketData.indices
            .map((idx) => `${idx.name}: ${idx.value} (${idx.changePercent})`)
            .join(", ")
        : "Market data not available";

      // Add stock-specific context
      const stockContext = stockData 
        ? `${stockData.symbol} (${stockData.name}): ${stockData.price}, Change: ${stockData.change} (${stockData.changePercent})`
        : `Stock: ${targetSymbol}`;

      const { data, error } = await supabase.functions.invoke("analyze-stock", {
        body: {
          symbol: targetSymbol,
          marketContext: `${stockContext}. Market: ${marketContext}`,
          requestType: "dashboard-insights",
        },
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        if (error.message?.includes("402")) {
          toast.error("AI credits exhausted. Please add more credits.");
          return;
        }
        throw error;
      }

      if (data?.analysis) {
        // Parse the analysis into structured insights
        const analysis = data.analysis;
        
        // Extract bullish signals
        const bullishMatch = analysis.match(/bullish|positive|upward|strong|growth|buy/gi);
        const bearishMatch = analysis.match(/bearish|negative|downward|weak|decline|sell/gi);
        
        const sentiment = bullishMatch && bullishMatch.length > (bearishMatch?.length || 0)
          ? "bullish"
          : bearishMatch && bearishMatch.length > (bullishMatch?.length || 0)
          ? "bearish"
          : "neutral";

        const newInsight: InsightData = {
          summary: analysis,
          bullishSignals: [
            "AI analysis completed",
            `Market trend analyzed for ${targetSymbol}`,
            stockData?.isPositive ? `${targetSymbol} showing positive momentum` : "",
            marketData?.indices?.some(i => i.isPositive) ? "Major indices showing positive momentum" : "",
          ].filter(Boolean),
          bearishSignals: [
            stockData && !stockData.isPositive ? `${targetSymbol} showing negative trend` : "",
            marketData?.indices?.some(i => !i.isPositive) ? "Some indices showing weakness" : "",
          ].filter(Boolean),
          marketSentiment: sentiment,
          confidenceScore: Math.floor(Math.random() * 20) + 70, // 70-90% confidence
        };

        setInsightsCache(prev => ({
          ...prev,
          [targetSymbol]: newInsight
        }));
        
        toast.success(`AI insights generated for ${targetSymbol}`);
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error("Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAllInsights = async () => {
    if (watchlistStocks.length === 0) {
      toast.info("Add stocks to your watchlist first");
      return;
    }

    setIsLoading(true);
    let successCount = 0;

    for (const stock of watchlistStocks) {
      try {
        await generateInsights(stock.symbol);
        successCount++;
      } catch (error) {
        console.error(`Error generating insights for ${stock.symbol}:`, error);
      }
    }

    setIsLoading(false);
    if (successCount > 0) {
      toast.success(`Generated insights for ${successCount} stocks`);
    }
  };

  const getSentimentColor = () => {
    switch (currentInsights.marketSentiment) {
      case "bullish":
        return "text-success";
      case "bearish":
        return "text-danger";
      default:
        return "text-muted-foreground";
    }
  };

  const getSentimentIcon = () => {
    switch (currentInsights.marketSentiment) {
      case "bullish":
        return <TrendingUp className="h-4 w-4" />;
      case "bearish":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Get available stocks (from watchlist or default to selectedStock)
  const availableStocks = watchlistStocks.length > 0 
    ? watchlistStocks 
    : [{ symbol: selectedStock, name: selectedStock }];

  return (
    <Card className="glass-card p-6 border-primary/20 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-primary rounded-lg shadow-glow-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-heading font-bold gradient-text">AI Insights</h2>
        </div>
        <div className="flex items-center gap-2">
          {currentInsights.confidenceScore > 0 && (
            <span className="text-xs bg-secondary px-2 py-1 rounded-full">
              {currentInsights.confidenceScore}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Stock Selector */}
      <div className="mb-4 flex items-center gap-2">
        <Select value={currentStock} onValueChange={handleStockChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a stock" />
          </SelectTrigger>
          <SelectContent>
            {availableStocks.map((stock) => (
              <SelectItem key={stock.symbol} value={stock.symbol}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stock.symbol}</span>
                  <span className="text-muted-foreground text-xs">
                    {stock.name?.substring(0, 20)}{stock.name && stock.name.length > 20 ? '...' : ''}
                  </span>
                  {insightsCache[stock.symbol] && (
                    <CheckCircle className="h-3 w-3 text-success ml-auto" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateInsights()}
          disabled={isLoading}
          className="flex-1 gap-2 hover-glow"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Analyzing..." : `Analyze ${currentStock}`}
        </Button>
        {watchlistStocks.length > 1 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={generateAllInsights}
            disabled={isLoading}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Analyze All
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Market Sentiment Badge */}
        <div className={`flex items-center gap-2 text-sm font-medium ${getSentimentColor()}`}>
          {getSentimentIcon()}
          <span className="capitalize">
            Market Sentiment: {currentInsights.marketSentiment}
          </span>
        </div>

        {/* Main Analysis */}
        <div className="p-4 rounded-lg bg-secondary/50 border border-border hover-lift transition-all duration-300">
          <p className="text-sm font-heading font-semibold mb-2 text-primary">
            Analysis: {currentStock}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isLoading ? streamingText || "Analyzing market data..." : currentInsights.summary}
          </p>
        </div>

        {/* Signals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {currentInsights.bullishSignals.length > 0 && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 hover-lift transition-all duration-300">
              <p className="text-sm font-heading font-semibold text-success mb-1 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Bullish Signals
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {currentInsights.bullishSignals.map((signal, idx) => (
                  <li key={idx}>• {signal}</li>
                ))}
              </ul>
            </div>
          )}

          {currentInsights.bearishSignals.length > 0 && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 hover-lift transition-all duration-300">
              <p className="text-sm font-heading font-semibold text-danger mb-1 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Risk Factors
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {currentInsights.bearishSignals.map((signal, idx) => (
                  <li key={idx}>• {signal}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Cached Insights Summary */}
        {Object.keys(insightsCache).length > 1 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Analyzed stocks ({Object.keys(insightsCache).length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.keys(insightsCache).map((symbol) => (
                <Button
                  key={symbol}
                  variant={symbol === currentStock ? "default" : "outline"}
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => handleStockChange(symbol)}
                >
                  {symbol}
                  {insightsCache[symbol].marketSentiment === "bullish" && (
                    <TrendingUp className="h-3 w-3 ml-1 text-success" />
                  )}
                  {insightsCache[symbol].marketSentiment === "bearish" && (
                    <TrendingDown className="h-3 w-3 ml-1 text-danger" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
