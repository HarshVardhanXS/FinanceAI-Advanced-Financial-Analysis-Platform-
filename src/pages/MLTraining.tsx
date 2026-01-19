import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatasetUpload } from '@/components/ml/DatasetUpload';
import { TrainingConfig } from '@/components/ml/TrainingConfig';
import { TrainingProgress } from '@/components/ml/TrainingProgress';
import { ConfusionMatrix } from '@/components/ml/ConfusionMatrix';
import { CorrelationHeatmap } from '@/components/ml/CorrelationHeatmap';
import { ModelAnalytics } from '@/components/ml/ModelAnalytics';
import { ReportsPanel } from '@/components/ml/ReportsPanel';
import { useMLTraining } from '@/hooks/useMLTraining';
import { TrainingConfig as TrainingConfigType, DatasetInfo, TrainingReport } from '@/types/ml-training';
import { toast } from 'sonner';
import { Brain, Database, BarChart3, FileText } from 'lucide-react';

const defaultConfig: TrainingConfigType = {
  modelType: 'BERT+LSTM',
  epochs: 20,
  batchSize: 32,
  learningRate: 0.001,
  validationSplit: 0.2,
  sequenceLength: 60,
  hiddenUnits: 128,
  dropoutRate: 0.2,
  optimizer: 'adam',
  earlyStopping: true,
};

const MLTraining = () => {
  const [config, setConfig] = useState<TrainingConfigType>(defaultConfig);
  const [selectedDataset, setSelectedDataset] = useState<DatasetInfo | null>(null);
  const [selectedReport, setSelectedReport] = useState<TrainingReport | null>(null);
  const [activeTab, setActiveTab] = useState('training');

  const {
    datasets,
    reports,
    currentTraining,
    uploadDataset,
    deleteDataset,
    startTraining,
    deleteReport,
  } = useMLTraining();

  const handleStartTraining = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset first');
      return;
    }

    if (selectedDataset.instances < 100) {
      toast.warning('Dataset is small. Results may be less reliable.');
    }

    toast.info(`Starting ${config.modelType} training on ${selectedDataset.symbol}...`);
    
    try {
      const report = await startTraining(selectedDataset, config);
      setSelectedReport(report);
      setActiveTab('analytics');
      toast.success(`Training complete! Accuracy: ${(report.finalMetrics.accuracy * 100).toFixed(1)}%`);
    } catch (error) {
      toast.error('Training failed. Please try again.');
    }
  };

  const handleViewReport = (report: TrainingReport) => {
    setSelectedReport(report);
    setActiveTab('analytics');
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold gradient-text">ML Training Lab</h1>
          <p className="text-muted-foreground">Train BERT & LSTM models on your stock datasets</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="training" className="gap-2">
              <Brain className="h-4 w-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="datasets" className="gap-2">
              <Database className="h-4 w-4" />
              Datasets
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="training" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <DatasetUpload
                  datasets={datasets}
                  onUpload={uploadDataset}
                  onDelete={deleteDataset}
                  onSelect={setSelectedDataset}
                  selectedDataset={selectedDataset}
                />
                <TrainingConfig
                  config={config}
                  onChange={setConfig}
                  onStartTraining={handleStartTraining}
                  isTraining={currentTraining.isTraining}
                  selectedDataset={selectedDataset}
                />
              </div>
              <div className="lg:col-span-2">
                <TrainingProgress
                  isTraining={currentTraining.isTraining}
                  progress={currentTraining.progress}
                  currentEpoch={currentTraining.currentEpoch}
                  totalEpochs={config.epochs}
                  metrics={currentTraining.metrics}
                  status={currentTraining.status}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {selectedReport ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedReport.symbol} - {selectedReport.modelType} Analysis
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Dataset: {selectedReport.datasetName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ConfusionMatrix data={selectedReport.confusionMatrix} />
                  <CorrelationHeatmap data={selectedReport.heatmap} />
                </div>

                <ModelAnalytics report={selectedReport} />
              </>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Report Selected</h3>
                <p>Complete a training session or select a saved report to view analytics</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="datasets" className="space-y-6">
            <DatasetUpload
              datasets={datasets}
              onUpload={uploadDataset}
              onDelete={deleteDataset}
              onSelect={setSelectedDataset}
              selectedDataset={selectedDataset}
            />
            {datasets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="p-4 bg-secondary/30 rounded-lg border">
                    <h3 className="font-semibold">{dataset.symbol}</h3>
                    <p className="text-sm text-muted-foreground">{dataset.name}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>{dataset.instances.toLocaleString()} instances</p>
                      <p>{dataset.columns.length} features</p>
                      <p className="truncate">Columns: {dataset.columns.slice(0, 5).join(', ')}...</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ReportsPanel
                reports={reports}
                onDelete={deleteReport}
                onView={handleViewReport}
                selectedReport={selectedReport}
              />
              <div className="lg:col-span-2">
                {selectedReport ? (
                  <ModelAnalytics report={selectedReport} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground border rounded-lg">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Select a report to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MLTraining;
