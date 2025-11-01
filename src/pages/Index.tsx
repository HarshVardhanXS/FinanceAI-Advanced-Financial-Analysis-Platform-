import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StockGrid } from "@/components/dashboard/StockGrid";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { ReportGenerator } from "@/components/dashboard/ReportGenerator";
import { StockWorldMap } from "@/components/dashboard/StockWorldMap";

const Index = () => {
  const [selectedStock, setSelectedStock] = useState<string>("AAPL");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <MarketOverview />
        
        <StockWorldMap />
        
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
