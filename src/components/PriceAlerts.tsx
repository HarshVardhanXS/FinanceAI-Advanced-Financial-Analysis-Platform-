import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Lock } from "lucide-react";
import { toast } from "sonner";

interface PriceAlert {
  id: string;
  symbol: string;
  target_price: number;
  alert_type: "above" | "below";
  is_active: boolean;
  created_at: string;
}

export const PriceAlerts = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    symbol: "",
    targetPrice: "",
    alertType: "above" as "above" | "below"
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session) {
        fetchAlerts();
      } else {
        setLoading(false);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchAlerts();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts((data || []) as PriceAlert[]);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    if (!formData.symbol || !formData.targetPrice) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("price_alerts")
        .insert({
          user_id: user.id,
          symbol: formData.symbol.toUpperCase(),
          target_price: parseFloat(formData.targetPrice),
          alert_type: formData.alertType
        });

      if (error) throw error;

      toast.success("Alert created successfully");
      setIsDialogOpen(false);
      setFormData({ symbol: "", targetPrice: "", alertType: "above" });
      fetchAlerts();
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Failed to create alert");
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Alert deleted");
      fetchAlerts();
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Failed to delete alert");
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="glass-card p-6 hover-lift animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-heading font-bold mb-2 gradient-text">Sign In Required</h3>
          <p className="text-sm text-muted-foreground">
            Please sign in to set price alerts and get notified about important price movements.
          </p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading gradient-text">Price Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((i) => (
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading gradient-text">
              <Bell className="h-5 w-5" />
              Price Alerts
            </CardTitle>
            <CardDescription>Get notified when stocks hit your target price</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="hover-glow">
                <Plus className="h-4 w-4 mr-2" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Price Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Stock Symbol</Label>
                  <Input
                    placeholder="AAPL"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Target Price</Label>
                  <Input
                    type="number"
                    placeholder="150.00"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Alert When Price Goes</Label>
                  <Select
                    value={formData.alertType}
                    onValueChange={(value: "above" | "below") =>
                      setFormData({ ...formData, alertType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above target</SelectItem>
                      <SelectItem value="below">Below target</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createAlert} className="w-full">
                  Create Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <p className="font-heading font-semibold">No active alerts</p>
            <p className="text-sm mt-2">Create your first price alert</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border hover:border-primary/50 hover-lift transition-all duration-300 animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  {alert.alert_type === "above" ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-danger" />
                  )}
                  <div>
                    <p className="font-semibold">{alert.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      Alert when {alert.alert_type} ${alert.target_price}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Active</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
