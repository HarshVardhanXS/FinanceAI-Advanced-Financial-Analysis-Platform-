import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, RefreshCw, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SentimentData {
  overallSentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  confidence: number;
  factors: Array<{ factor: string; impact: "positive" | "negative" | "neutral"; weight: number }>;
  socialMentions: { positive: number; negative: number; neutral: number };
  newsImpact: "high" | "medium" | "low";
  summary: string;
}

interface SentimentAnalysisProps {
  symbol: string;
}

export const SentimentAnalysis = ({ symbol }: SentimentAnalysisProps) => {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeSentiment = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sentiment-analysis", {
        body: { symbol },
      });

      if (error) throw error;

      if (data?.sentiment) {
        setSentiment(data.sentiment);
        toast.success("Sentiment analysis complete");
      }
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      toast.error("Failed to analyze sentiment");
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentIcon = () => {
    if (!sentiment) return <Minus className="h-5 w-5" />;
    switch (sentiment.overallSentiment) {
      case "bullish": return <TrendingUp className="h-5 w-5 text-success" />;
      case "bearish": return <TrendingDown className="h-5 w-5 text-danger" />;
      default: return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSentimentColor = () => {
    if (!sentiment) return "secondary";
    switch (sentiment.overallSentiment) {
      case "bullish": return "default";
      case "bearish": return "destructive";
      default: return "secondary";
    }
  };

  const normalizedScore = sentiment ? ((sentiment.sentimentScore + 100) / 200) * 100 : 50;

  return (
    <Card className="glass-card p-6 border-primary/20 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-heading font-bold">Sentiment Analysis</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={analyzeSentiment}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Analyze
        </Button>
      </div>

      {sentiment ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSentimentIcon()}
              <Badge variant={getSentimentColor()} className="capitalize">
                {sentiment.overallSentiment}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              Confidence: {sentiment.confidence}%
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bearish</span>
              <span>Sentiment Score: {sentiment.sentimentScore > 0 ? '+' : ''}{sentiment.sentimentScore}</span>
              <span>Bullish</span>
            </div>
            <div className="relative h-3 bg-gradient-to-r from-danger via-muted to-success rounded-full overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 w-1 bg-foreground rounded-full shadow-lg transition-all"
                style={{ left: `${normalizedScore}%`, transform: 'translateX(-50%)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-success/10 border border-success/20">
              <ThumbsUp className="h-4 w-4 text-success mx-auto mb-1" />
              <p className="text-xs font-medium text-success">{sentiment.socialMentions.positive}</p>
              <p className="text-xs text-muted-foreground">Positive</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 border border-border">
              <Minus className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs font-medium">{sentiment.socialMentions.neutral}</p>
              <p className="text-xs text-muted-foreground">Neutral</p>
            </div>
            <div className="p-2 rounded-lg bg-danger/10 border border-danger/20">
              <ThumbsDown className="h-4 w-4 text-danger mx-auto mb-1" />
              <p className="text-xs font-medium text-danger">{sentiment.socialMentions.negative}</p>
              <p className="text-xs text-muted-foreground">Negative</p>
            </div>
          </div>

          {sentiment.factors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Key Factors:</p>
              <div className="space-y-1">
                {sentiment.factors.slice(0, 3).map((factor, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${
                      factor.impact === "positive" ? "bg-success" :
                      factor.impact === "negative" ? "bg-danger" : "bg-muted-foreground"
                    }`} />
                    <span className="flex-1">{factor.factor}</span>
                    <span className="text-muted-foreground">{factor.weight}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground">{sentiment.summary}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              News Impact: {sentiment.newsImpact}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Click "Analyze" to get AI-powered sentiment analysis for {symbol}</p>
        </div>
      )}
    </Card>
  );
};
