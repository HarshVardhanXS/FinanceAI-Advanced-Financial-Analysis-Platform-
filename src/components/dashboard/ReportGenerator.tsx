import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportGeneratorProps {
  selectedStock: string;
}

export const ReportGenerator = ({ selectedStock }: ReportGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<string | null>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: { symbol: selectedStock },
      });

      if (error) throw error;

      if (data?.report) {
        setReportData(data.report);
        toast.success("Report generated successfully");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    const blob = new Blob([reportData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedStock}_analysis_report_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="glass-card p-6 hover-lift">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-primary rounded-lg shadow-glow-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-heading font-bold gradient-text">Report Generator</h2>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate comprehensive AI-powered analysis reports for {selectedStock} including technical indicators, market
          sentiment, and forecasts.
        </p>

        <div className="flex gap-3">
          <Button onClick={generateReport} disabled={isGenerating} className="flex-1 gap-2 hover-glow">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>

          {reportData && (
            <Button onClick={downloadReport} variant="outline" className="gap-2 hover-glow">
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
        </div>

        {reportData && (
          <div className="p-4 rounded-lg bg-secondary/50 border border-border max-h-64 overflow-y-auto hover-lift transition-all duration-300 animate-fade-in">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{reportData}</pre>
          </div>
        )}
      </div>
    </Card>
  );
};
