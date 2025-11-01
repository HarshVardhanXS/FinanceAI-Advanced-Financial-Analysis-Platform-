import { useState, useEffect } from "react";
import { TrendingUp, LogOut, Shield, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import { StockSearch } from "@/components/StockSearch";
import { AuthDialog } from "@/components/AuthDialog";

export const DashboardHeader = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading } = useUserRole();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been successfully signed out",
      });
      navigate("/");
    }
  };

  const handleStockSelect = (symbol: string) => {
    navigate(`/?stock=${symbol}`);
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                FinanceAI
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Advanced Financial Analysis Platform</p>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <StockSearch onSelectStock={handleStockSelect} />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium hidden sm:block">
              Markets Open
            </div>
            
            {isAuthenticated && !loading && <SubscriptionBadge role={role} />}
            
            {isAuthenticated && <NotificationCenter />}
            <ThemeToggle />
            
            {isAuthenticated && role === "admin" && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="gap-2 hidden sm:flex">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            )}
            
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => setAuthDialogOpen(true)} className="gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </header>
  );
};
