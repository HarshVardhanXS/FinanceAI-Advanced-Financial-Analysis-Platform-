import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import StockBrowser from "./pages/StockBrowser";
import StockDetail from "./pages/StockDetail";
import OptionsTrading from "./pages/OptionsTrading";
import WatchlistPage from "./pages/WatchlistPage";
import PortfolioPage from "./pages/PortfolioPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AlertsPage from "./pages/AlertsPage";
import AIAnalysis from "./pages/AIAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/*"
            element={
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <AppSidebar />
                  <div className="flex-1">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/stocks" element={<StockBrowser />} />
                      <Route path="/stocks/:symbol" element={<StockDetail />} />
                      <Route path="/options" element={<OptionsTrading />} />
                      <Route path="/portfolio" element={<PortfolioPage />} />
                      <Route path="/watchlist" element={<WatchlistPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/alerts" element={<AlertsPage />} />
                      <Route path="/ai" element={<AIAnalysis />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </div>
              </SidebarProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
