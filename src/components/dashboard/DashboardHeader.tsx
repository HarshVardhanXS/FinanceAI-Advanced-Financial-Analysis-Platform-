import { TrendingUp } from "lucide-react";

export const DashboardHeader = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                FinanceAI
              </h1>
              <p className="text-xs text-muted-foreground">Advanced Financial Analysis Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
              Markets Open
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
