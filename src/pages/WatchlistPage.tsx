import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Watchlist } from "@/components/Watchlist";

const WatchlistPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Watchlist />
        </div>
      </main>
    </div>
  );
};

export default WatchlistPage;
