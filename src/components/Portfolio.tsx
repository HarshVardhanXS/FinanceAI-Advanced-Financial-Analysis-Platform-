import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface PortfolioItem {
  id: string;
  symbol: string;
  quantity: number;
  average_price: number;
}

export const Portfolio = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    symbol: "",
    quantity: "",
    price: ""
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .order("symbol", { ascending: true });

      if (error) throw error;
      setPortfolio(data || []);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      toast.error("Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  const addPosition = async () => {
    if (!formData.symbol || !formData.quantity || !formData.price) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("portfolios")
        .insert({
          user_id: user.id,
          symbol: formData.symbol.toUpperCase(),
          quantity: parseFloat(formData.quantity),
          average_price: parseFloat(formData.price)
        });

      if (error) throw error;

      toast.success("Position added successfully");
      setIsDialogOpen(false);
      setFormData({ symbol: "", quantity: "", price: "" });
      fetchPortfolio();
    } catch (error) {
      console.error("Error adding position:", error);
      toast.error("Failed to add position");
    }
  };

  const totalValue = portfolio.reduce(
    (sum, item) => sum + item.quantity * item.average_price,
    0
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Portfolio</CardTitle>
            <CardDescription>Track your holdings</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Position
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Position</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Symbol</Label>
                  <Input
                    placeholder="AAPL"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Average Price</Label>
                  <Input
                    type="number"
                    placeholder="150.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <Button onClick={addPosition} className="w-full">
                  Add Position
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
          <p className="text-3xl font-bold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        {portfolio.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No positions in your portfolio yet</p>
            <p className="text-sm mt-2">Add your first position to start tracking</p>
          </div>
        ) : (
          <div className="space-y-2">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card border hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-lg">{item.symbol}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} shares @ ${item.average_price}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${(item.quantity * item.average_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
