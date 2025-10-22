import { TrendingUp, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const DashboardHeader = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading } = useUserRole();

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
      navigate("/auth");
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
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
            
            {!loading && <SubscriptionBadge role={role} />}
            
            {role === "admin" && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
