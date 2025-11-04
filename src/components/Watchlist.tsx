import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  added_at: string;
}

export const Watchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const { data, error } = await supabase
        .from("watchlists")
        .select("*")
        .order("added_at", { ascending: false });

      if (error) throw error;
      setWatchlist(data || []);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      toast.error("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!newSymbol.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("watchlists")
        .insert({
          user_id: user.id,
          symbol: newSymbol.toUpperCase(),
          name: newSymbol.toUpperCase()
        });

      if (error) throw error;

      toast.success("Added to watchlist");
      setNewSymbol("");
      fetchWatchlist();
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast.error("Failed to add to watchlist");
    }
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("watchlists")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Removed from watchlist");
      fetchWatchlist();
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("Failed to remove from watchlist");
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading gradient-text">My Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-shimmer rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="font-heading gradient-text">My Watchlist</CardTitle>
        <CardDescription>Track your favorite stocks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter symbol (e.g., AAPL)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addToWatchlist()}
            className="hover:border-primary/50 transition-colors"
          />
          <Button onClick={addToWatchlist} size="icon" className="hover-glow">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {watchlist.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <p className="font-heading font-semibold">No stocks in your watchlist yet</p>
            <p className="text-sm mt-2">Add your first stock above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border hover:border-primary/50 hover-lift transition-all duration-300 animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-heading font-bold">{item.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(item.added_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromWatchlist(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
