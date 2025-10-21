import { Crown, Sparkles, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/hooks/useUserRole";

interface SubscriptionBadgeProps {
  role: UserRole;
}

export const SubscriptionBadge = ({ role }: SubscriptionBadgeProps) => {
  if (role === "admin") {
    return (
      <Badge className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
        <Shield className="h-3 w-3" />
        Admin
      </Badge>
    );
  }

  if (role === "premium") {
    return (
      <Badge className="gap-1 bg-gradient-to-r from-primary to-primary/70 text-white border-0">
        <Crown className="h-3 w-3" />
        Premium
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Sparkles className="h-3 w-3" />
      Free
    </Badge>
  );
};
