import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FinanceChatbot } from "@/components/ai/FinanceChatbot";
import { SentimentAnalysis } from "@/components/ai/SentimentAnalysis";
import { PricePrediction } from "@/components/ai/PricePrediction";
import { TechnicalAnalysis } from "@/components/ai/TechnicalAnalysis";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const AIAnalysis = () => {
  const [symbol, setSymbol] = useState("AAPL");
  const [inputSymbol, setInputSymbol] = useState("AAPL");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSymbol.trim()) {
      setSymbol(inputSymbol.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold gradient-text">AI Analysis Hub</h1>
            <p className="text-muted-foreground">Powered by advanced machine learning</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              placeholder="Stock symbol"
              className="w-32"
            />
            <Button type="submit" size="icon"><Search className="h-4 w-4" /></Button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FinanceChatbot />
          <div className="space-y-6">
            <SentimentAnalysis symbol={symbol} />
            <PricePrediction symbol={symbol} />
          </div>
        </div>
        
        <TechnicalAnalysis symbol={symbol} />
      </main>
    </div>
  );
};

export default AIAnalysis;
