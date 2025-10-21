import { Crown, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const UpgradePrompt = () => {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Upgrade to Premium</CardTitle>
        </div>
        <CardDescription>
          Unlock advanced features and real-time market data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Real-time stock data updates
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Unlimited AI-powered reports
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Advanced portfolio analytics
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Price alerts and notifications
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Priority support
          </li>
        </ul>
        
        <Button className="w-full gap-2" size="lg">
          <Mail className="h-4 w-4" />
          Contact us for Premium Access
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Email us with your account details to upgrade
        </p>
      </CardContent>
    </Card>
  );
};
