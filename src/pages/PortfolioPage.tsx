import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Portfolio } from "@/components/Portfolio";

const PortfolioPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          <Portfolio />
        </div>
      </main>
    </div>
  );
};

export default PortfolioPage;
