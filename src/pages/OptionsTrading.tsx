import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, TrendingDown, Lock, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { OptionsChain } from "@/components/options/OptionsChain";
import { OptionsTradeDialog } from "@/components/options/OptionsTradeDialog";
import { OptionsPositions } from "@/components/options/OptionsPositions";

export default function OptionsTrading() {
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState("0");
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any | null>(null);
  const { toast } = useToast();
  const { role, hasAccess, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleLoading && !hasAccess('admin')) {
      toast({
        title: "Access Denied",
        description: "Options trading is only available for admin users",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [hasAccess, roleLoading, navigate, toast]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-options', {
        body: { symbol: searchQuery.toUpperCase() }
      });

      if (error) throw error;
      setOptions(data.options || []);
      setCurrentPrice(data.currentPrice || "0");
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>;
  }

  if (!hasAccess('admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold">Options Trading</h1>
              <p className="text-muted-foreground">Trade call and put options</p>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              Admin Only
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="chain" className="space-y-6">
          <TabsList>
            <TabsTrigger value="chain">Options Chain</TabsTrigger>
            <TabsTrigger value="positions">My Positions</TabsTrigger>
          </TabsList>

          <TabsContent value="chain" className="space-y-6">
            <Card className="p-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Enter stock symbol (e.g., AAPL, MSFT)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? "Loading..." : "Get Options"}
                </Button>
              </div>
            </Card>

            {currentPrice !== "0" && (
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Underlying Stock Price</p>
                    <p className="text-2xl font-bold">{searchQuery.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">${currentPrice}</p>
                  </div>
                </div>
              </Card>
            )}

            {options.length > 0 && (
              <OptionsChain 
                options={options} 
                currentPrice={parseFloat(currentPrice)}
                onSelectOption={setSelectedOption}
              />
            )}

            {!loading && options.length === 0 && searchQuery && (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No options found. Try searching for a stock symbol.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="positions">
            <OptionsPositions />
          </TabsContent>
        </Tabs>

        {selectedOption && (
          <OptionsTradeDialog
            option={selectedOption}
            currentPrice={parseFloat(currentPrice)}
            onClose={() => setSelectedOption(null)}
          />
        )}
      </div>
    </div>
  );
}
