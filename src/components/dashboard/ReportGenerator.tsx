import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, FileDown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface ReportGeneratorProps {
  selectedStock: string;
  marketData?: {
    indices: Array<{
      name: string;
      value: string;
      change: string;
      changePercent: string;
      isPositive: boolean;
    }>;
  };
}

interface ReportData {
  title: string;
  generatedAt: string;
  symbol: string;
  marketOverview: string;
  analysis: string;
  recommendation: string;
}

export const ReportGenerator = ({ selectedStock, marketData }: ReportGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Build market context from dashboard data
      const marketContext = marketData?.indices
        ? marketData.indices
            .map((idx) => `${idx.name}: ${idx.value} (${idx.change}, ${idx.changePercent})`)
            .join("\n")
        : "Market data currently unavailable";

      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: {
          symbol: selectedStock,
          marketContext,
          includeMarketData: true,
        },
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        if (error.message?.includes("402")) {
          toast.error("AI credits exhausted. Please add more credits.");
          return;
        }
        throw error;
      }

      if (data?.report) {
        const now = new Date();
        setReportData({
          title: `Financial Analysis Report - ${selectedStock}`,
          generatedAt: now.toLocaleString(),
          symbol: selectedStock,
          marketOverview: marketContext,
          analysis: data.report,
          recommendation: extractRecommendation(data.report),
        });
        toast.success("Report generated successfully");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const extractRecommendation = (report: string): string => {
    const recMatch = report.match(/recommendation[:\s]*(.*?)(?:\n|$)/i);
    return recMatch ? recMatch[1].trim() : "See full report for details";
  };

  const downloadPDF = () => {
    if (!reportData) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = 20;

    // Helper function to add text with wrapping
    const addWrappedText = (text: string, fontSize: number, isBold: boolean = false) => {
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = pdf.splitTextToSize(text, contentWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
      yPosition += 5;
    };

    // Title
    pdf.setTextColor(59, 130, 246); // Primary color
    addWrappedText("FINSIGHT FINANCIAL ANALYSIS REPORT", 18, true);
    
    // Horizontal line
    pdf.setDrawColor(59, 130, 246);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    // Report metadata
    addWrappedText(`Stock Symbol: ${reportData.symbol}`, 12, true);
    addWrappedText(`Generated: ${reportData.generatedAt}`, 10);
    addWrappedText(`Platform: Minor Project Website - FinSight`, 10);
    yPosition += 5;

    // Market Overview Section
    pdf.setTextColor(59, 130, 246);
    addWrappedText("MARKET OVERVIEW", 14, true);
    pdf.setTextColor(0, 0, 0);
    
    if (marketData?.indices) {
      marketData.indices.forEach((idx) => {
        const color = idx.isPositive ? [34, 197, 94] : [239, 68, 68];
        pdf.setTextColor(color[0], color[1], color[2]);
        addWrappedText(`${idx.name}: ${idx.value} (${idx.changePercent})`, 10);
      });
      pdf.setTextColor(0, 0, 0);
    }
    yPosition += 5;

    // Main Analysis Section
    pdf.setTextColor(59, 130, 246);
    addWrappedText("DETAILED ANALYSIS", 14, true);
    pdf.setTextColor(0, 0, 0);
    
    // Split analysis into paragraphs for better formatting
    const paragraphs = reportData.analysis.split("\n\n");
    paragraphs.forEach((para) => {
      if (para.trim()) {
        addWrappedText(para.trim(), 10);
        yPosition += 3;
      }
    });

    // Footer
    const pageCount = pdf.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i} of ${pageCount} | Generated by FinSight - Minor Project Website | By Harsh & Soubhagaya`,
        margin,
        285
      );
    }

    // Disclaimer on last page
    pdf.setPage(pageCount);
    yPosition = 260;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      "Disclaimer: This report is AI-generated for educational purposes only. Not financial advice.",
      margin,
      yPosition
    );

    // Save PDF
    const fileName = `${selectedStock}_FinSight_Report_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(fileName);
    toast.success("PDF report downloaded successfully");
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
          Generate comprehensive AI-powered PDF reports for <span className="font-semibold text-primary">{selectedStock}</span> including 
          real-time market data, technical analysis, and investment recommendations.
        </p>

        {/* Market Data Preview */}
        {marketData?.indices && (
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Current Market Data (included in report):</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {marketData.indices.map((idx) => (
                <div key={idx.name} className="flex items-center gap-1">
                  <span className="text-muted-foreground">{idx.name}:</span>
                  <span className={idx.isPositive ? "text-success" : "text-danger"}>
                    {idx.changePercent}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={generateReport} disabled={isGenerating} className="flex-1 gap-2 hover-glow">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>

          {reportData && (
            <Button onClick={downloadPDF} variant="default" className="gap-2 hover-glow bg-success hover:bg-success/90">
              <FileDown className="h-4 w-4" />
              Download PDF
            </Button>
          )}
        </div>

        {reportData && (
          <div className="space-y-3 animate-fade-in">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border max-h-64 overflow-y-auto hover-lift transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-heading font-bold text-primary">{reportData.title}</h3>
                <span className="text-xs text-muted-foreground">{reportData.generatedAt}</span>
              </div>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                {reportData.analysis}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
