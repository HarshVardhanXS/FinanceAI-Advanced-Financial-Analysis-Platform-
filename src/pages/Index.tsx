import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StockGrid } from "@/components/dashboard/StockGrid";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { ReportGenerator } from "@/components/dashboard/ReportGenerator";

const Index = () => {
  const [selectedStock, setSelectedStock] = useState<string>("AAPL");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <MarketOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <StockGrid selectedStock={selectedStock} onSelectStock={setSelectedStock} />
            <ReportGenerator selectedStock={selectedStock} />
          </div>
          
          <div className="space-y-6">
            <AIInsights selectedStock={selectedStock} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
