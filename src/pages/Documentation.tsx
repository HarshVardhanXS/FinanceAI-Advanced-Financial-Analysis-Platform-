import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const Documentation = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/FinSight_Project_Documentation.md");
      const text = await response.text();
      const blob = new Blob([text], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "FinSight_Project_Documentation.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Documentation downloaded successfully");
    } catch (error) {
      toast.error("Failed to download documentation");
    } finally {
      setDownloading(false);
    }
  };

  const sections = [
    "Project Overview & Objectives",
    "Full Architecture Diagram",
    "Technology Stack Breakdown (16 technologies)",
    "Complete Directory Structure",
    "Authentication & Security (JWT, RBAC, RLS)",
    "Database Schema (13 tables + functions)",
    "Backend Edge Functions (11 functions detailed)",
    "Frontend Pages (13 pages explained)",
    "UI Components (50+ components cataloged)",
    "AI/ML Components (7 AI + 7 ML components)",
    "Custom Hooks (5 hooks documented)",
    "External API Integrations (Finnhub + AI Gateway)",
    "Design System (CSS tokens, dark mode)",
    "Data Flow Diagrams (4 flows)",
    "Deployment & Configuration",
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold gradient-text">Project Documentation</h1>
          <p className="text-muted-foreground mt-1">
            Complete technical documentation for FinSight — every component, service, and file explained.
          </p>
        </div>

        <Card className="glass-card p-6 hover-lift">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-glow-primary">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold">FinSight_Project_Documentation.md</h2>
              <p className="text-sm text-muted-foreground">Comprehensive Markdown report (~800 lines)</p>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm font-semibold text-muted-foreground mb-3">Sections included:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sections.map((section, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                  <span className="text-muted-foreground">{section}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleDownload} disabled={downloading} className="w-full gap-2 hover-glow" size="lg">
            <FileDown className="h-5 w-5" />
            {downloading ? "Preparing download..." : "Download Documentation (.md)"}
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default Documentation;
