import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Portfolio } from "@/components/Portfolio";
import { TradingHistory } from "@/components/TradingHistory";

const PortfolioPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Portfolio />
          <TradingHistory />
        </div>
      </main>
    </div>
  );
};

export default PortfolioPage;
