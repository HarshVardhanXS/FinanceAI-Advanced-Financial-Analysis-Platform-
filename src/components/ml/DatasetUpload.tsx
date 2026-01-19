import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, Trash2, Database, CheckCircle } from 'lucide-react';
import { DatasetInfo } from '@/types/ml-training';
import { toast } from 'sonner';

interface DatasetUploadProps {
  datasets: DatasetInfo[];
  onUpload: (file: File, symbol: string, data: Record<string, unknown>[]) => DatasetInfo;
  onDelete: (id: string) => void;
  onSelect: (dataset: DatasetInfo) => void;
  selectedDataset: DatasetInfo | null;
}

export const DatasetUpload = ({ 
  datasets, 
  onUpload, 
  onDelete, 
  onSelect,
  selectedDataset 
}: DatasetUploadProps) => {
  const [symbol, setSymbol] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!symbol.trim()) {
      toast.error('Please enter a stock symbol first');
      return;
    }

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as Record<string, unknown>[];
        if (data.length < 100) {
          toast.warning(`Dataset has only ${data.length} instances. Recommend 10,000+ for better results.`);
        }
        const dataset = onUpload(file, symbol, data);
        toast.success(`Uploaded ${dataset.instances.toLocaleString()} instances for ${dataset.symbol}`);
        setSymbol('');
      },
      error: (error) => {
        toast.error(`Failed to parse file: ${error.message}`);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-accent" />
          Dataset Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="symbol" className="text-xs text-muted-foreground">Stock Symbol</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., AAPL"
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={!symbol.trim()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload CSV
            </Button>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? 'border-accent bg-accent/10' : 'border-border'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop CSV file here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Required: Date, Open, High, Low, Close, Volume columns
          </p>
        </div>

        {datasets.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Uploaded Datasets</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDataset?.id === dataset.id 
                      ? 'border-accent bg-accent/10' 
                      : 'border-border hover:border-accent/50'
                  }`}
                  onClick={() => onSelect(dataset)}
                >
                  <div className="flex items-center gap-3">
                    {selectedDataset?.id === dataset.id && (
                      <CheckCircle className="h-4 w-4 text-accent" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dataset.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {dataset.instances.toLocaleString()} instances
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{dataset.name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(dataset.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
