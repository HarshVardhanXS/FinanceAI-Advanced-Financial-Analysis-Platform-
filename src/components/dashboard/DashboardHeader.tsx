import { useState, useEffect } from "react";
import { LogOut, Shield, LogIn } from "lucide-react";
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
import logo from "@/assets/logo.png";

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
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <SidebarTrigger className="min-h-[44px] min-w-[44px]" />
            <img src={logo} alt="RV College of Engineering" className="h-10 sm:h-12 w-auto" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-heading font-extrabold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent drop-shadow-sm tracking-tight">
                FinSight
              </h1>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground hidden lg:block tracking-widest uppercase">
                Smart Market Intelligence
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <StockSearch onSelectStock={handleStockSelect} />
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="px-2 sm:px-3 py-1 rounded-full bg-success/10 text-success text-xs sm:text-sm font-medium hidden lg:block">
              Markets Open
            </div>
            
            {isAuthenticated && !loading && <SubscriptionBadge role={role} />}
            
            {isAuthenticated && <NotificationCenter />}
            <ThemeToggle />
            
            {isAuthenticated && role === "admin" && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="gap-2 hidden md:flex min-h-[44px]">
                <Shield className="h-4 w-4" />
                <span className="hidden lg:inline">Admin</span>
              </Button>
            )}
            
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 min-h-[44px] min-w-[44px]">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => setAuthDialogOpen(true)} className="gap-2 min-h-[44px] min-w-[44px]">
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
