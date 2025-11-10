import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StockComparison } from "@/components/StockComparison";
import { Button } from "@/components/ui/button";
import { Plus, BarChart2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ComparisonPage = () => {
  const [selectedStocks, setSelectedStocks] = useState<string[]>(["AAPL", "MSFT"]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");

  const handleAddStock = () => {
    if (newSymbol && selectedStocks.length < 4) {
      setSelectedStocks([...selectedStocks, newSymbol.toUpperCase()]);
      setNewSymbol("");
      setDialogOpen(false);
    }
  };

  const handleRemoveStock = (symbol: string) => {
    if (selectedStocks.length > 1) {
      setSelectedStocks(selectedStocks.filter(s => s !== symbol));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-3">
                <BarChart2 className="h-8 w-8 text-primary" />
                Stock Comparison
              </h1>
              <p className="text-muted-foreground mt-2">
                Compare up to 4 stocks side-by-side with synchronized charts
              </p>
            </div>
            
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={selectedStocks.length >= 4}
              className="gap-2 hover-lift"
            >
              <Plus className="h-4 w-4" />
              Add Stock
            </Button>
          </div>

          {/* Selected Stocks Pills */}
          <div className="flex flex-wrap gap-2">
            {selectedStocks.map((symbol) => (
              <div
                key={symbol}
                className="px-4 py-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-full flex items-center gap-2 hover:border-primary/50 transition-all group"
              >
                <span className="font-semibold text-foreground">{symbol}</span>
                <button
                  onClick={() => handleRemoveStock(symbol)}
                  disabled={selectedStocks.length === 1}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Comparison Component */}
          <StockComparison symbols={selectedStocks} />
        </div>
      </main>

      {/* Add Stock Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Stock to Comparison</DialogTitle>
            <DialogDescription>
              Enter a stock symbol to add to the comparison (max 4 stocks)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Stock Symbol</Label>
              <Input
                id="symbol"
                placeholder="e.g., GOOGL"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleAddStock()}
                className="uppercase"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddStock} className="flex-1">
                Add Stock
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComparisonPage;
