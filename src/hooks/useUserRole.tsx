import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "premium" | "free" | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .order("role", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRole("free");
        } else {
          setRole(data?.role || "free");
        }
      } catch (error) {
        console.error("Error in fetchRole:", error);
        setRole("free");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasAccess = (requiredRole: "premium" | "admin") => {
    if (role === "admin") return true;
    if (requiredRole === "premium" && role === "premium") return true;
    return false;
  };

  return { role, loading, hasAccess };
};
