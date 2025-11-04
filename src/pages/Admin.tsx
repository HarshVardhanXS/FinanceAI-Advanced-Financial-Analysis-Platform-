import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserWithRole {
  user_id: string;
  email: string;
  role: "admin" | "premium" | "free";
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { role, loading } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!loading && role !== "admin") {
      navigate("/");
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access this page",
      });
    }
  }, [role, loading, navigate, toast]);

  useEffect(() => {
    if (role === "admin") {
      fetchUsers();
    }
  }, [role]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          role,
          created_at,
          profiles (email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedUsers = data.map((item: any) => ({
        user_id: item.user_id,
        email: item.profiles?.email || "No email",
        role: item.role,
        created_at: item.created_at,
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: "admin" | "premium" | "free") => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role",
      });
    }
  };

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return (
          <Badge className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case "premium":
        return (
          <Badge className="gap-1 bg-gradient-to-r from-primary to-primary/70 text-white border-0">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Free
          </Badge>
        );
    }
  };

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 animate-scale-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full shadow-glow-primary animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-heading font-semibold gradient-text">Loading Admin Panel</p>
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 animate-fade-in">
        <Card className="glass-card hover-lift">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-primary rounded-lg shadow-glow-primary">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="font-heading gradient-text">User Management</CardTitle>
                <CardDescription>Manage user roles and subscriptions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-secondary/30 hover:border-primary/50 hover-lift transition-all duration-300"
                >
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getRoleBadge(user.role)}
                    
                    <Select
                      value={user.role}
                      onValueChange={(newRole) => updateUserRole(user.user_id, newRole as "admin" | "premium" | "free")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              
              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
