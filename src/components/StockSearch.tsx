import { useState, useEffect, useRef } from "react";
import { Search, Clock, TrendingUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface StockSearchProps {
  onSelectStock: (symbol: string) => void;
}

const popularStocks = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "BRK.B", name: "Berkshire Hathaway" }
];

const RECENT_SEARCHES_KEY = "stock_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export const StockSearch = ({ onSelectStock }: StockSearchProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const filteredStocks = popularStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
  );

  const saveRecentSearch = (symbol: string) => {
    const updated = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSelect = (symbol: string) => {
    saveRecentSearch(symbol);
    onSelectStock(symbol);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const items = query ? filteredStocks : recentSearches;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const symbol = query ? filteredStocks[selectedIndex].symbol : recentSearches[selectedIndex];
      handleSelect(symbol);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          placeholder="Search stocks..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-9 bg-background/50 backdrop-blur-sm border-border/50 hover:border-primary/50 focus:border-primary transition-all"
        />
      </div>

      {isOpen && (
        <Card 
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full z-50 shadow-xl border-border/50 bg-card/95 backdrop-blur-md animate-fade-in overflow-hidden"
        >
          <CardContent className="p-0">
            {query ? (
              // Search Results
              <>
                {filteredStocks.length > 0 ? (
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>Search Results</span>
                    </div>
                    <div className="space-y-1">
                      {filteredStocks.map((stock, index) => (
                        <button
                          key={stock.symbol}
                          onClick={() => handleSelect(stock.symbol)}
                          className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-200 group ${
                            selectedIndex === index 
                              ? "bg-primary/10 border border-primary/20" 
                              : "hover:bg-accent/50"
                          }`}
                          style={{ 
                            animationDelay: `${index * 50}ms`,
                            animation: "fade-slide-in 0.3s ease-out forwards"
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {stock.symbol}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {stock.name}
                              </div>
                            </div>
                            <TrendingUp className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-8 text-center text-muted-foreground text-sm">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No stocks found</p>
                    <p className="text-xs mt-1">Try searching for a different stock</p>
                  </div>
                )}
              </>
            ) : (
              // Recent Searches & Popular Stocks
              <div className="p-2">
                {recentSearches.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Recent Searches</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="h-6 px-2 text-xs hover:text-destructive"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="space-y-1 mb-3">
                      {recentSearches.map((symbol, index) => {
                        const stock = popularStocks.find(s => s.symbol === symbol);
                        return (
                          <button
                            key={symbol}
                            onClick={() => handleSelect(symbol)}
                            className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-200 group ${
                              selectedIndex === index 
                                ? "bg-primary/10 border border-primary/20" 
                                : "hover:bg-accent/50"
                            }`}
                            style={{ 
                              animationDelay: `${index * 50}ms`,
                              animation: "fade-slide-in 0.3s ease-out forwards"
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {symbol}
                                </div>
                                {stock && (
                                  <div className="text-sm text-muted-foreground truncate">
                                    {stock.name}
                                  </div>
                                )}
                              </div>
                              <Clock className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <Separator className="my-2" />
                  </>
                )}
                
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Popular Stocks</span>
                </div>
                <div className="space-y-1">
                  {popularStocks.slice(0, 5).map((stock, index) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelect(stock.symbol)}
                      className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-200 group ${
                        selectedIndex === (recentSearches.length + index)
                          ? "bg-primary/10 border border-primary/20" 
                          : "hover:bg-accent/50"
                      }`}
                      style={{ 
                        animationDelay: `${(recentSearches.length + index) * 50}ms`,
                        animation: "fade-slide-in 0.3s ease-out forwards"
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {stock.symbol}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {stock.name}
                          </div>
                        </div>
                        <TrendingUp className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
