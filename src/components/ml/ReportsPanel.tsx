import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Trash2, 
  Download, 
  Eye, 
  Clock,
  Database,
  Brain,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { TrainingReport } from '@/types/ml-training';
import { format } from 'date-fns';

interface ReportsPanelProps {
  reports: TrainingReport[];
  onDelete: (id: string) => void;
  onView: (report: TrainingReport) => void;
  selectedReport: TrainingReport | null;
}

export const ReportsPanel = ({ reports, onDelete, onView, selectedReport }: ReportsPanelProps) => {
  const downloadReport = (report: TrainingReport) => {
    const reportData = {
      ...report,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml-report-${report.symbol}-${format(report.createdAt, 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          Saved Reports
          <Badge variant="secondary" className="ml-auto">
            {reports.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {reports.length === 0 ? (
            <div className="text-center py-12 px-4 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No training reports yet</p>
              <p className="text-xs mt-1">Complete a training session to see reports here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 transition-colors cursor-pointer hover:bg-secondary/50 ${
                    selectedReport?.id === report.id ? 'bg-accent/10 border-l-2 border-accent' : ''
                  }`}
                  onClick={() => onView(report)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{report.symbol}</span>
                        <Badge 
                          variant={report.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {report.status === 'completed' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Complete</>
                          ) : (
                            <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Training</>
                          )}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {report.datasetName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      {report.modelType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(report.createdAt, 'MMM d, h:mm a')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <p className="text-muted-foreground">Accuracy</p>
                      <p className="font-bold text-accent">
                        {(report.finalMetrics.accuracy * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <p className="text-muted-foreground">F1</p>
                      <p className="font-bold text-green-400">
                        {(report.finalMetrics.f1Score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <p className="text-muted-foreground">AUC</p>
                      <p className="font-bold text-purple-400">
                        {report.finalMetrics.auc.toFixed(3)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(report);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadReport(report);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(report.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
