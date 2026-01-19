import { useState, useCallback } from 'react';
import { 
  DatasetInfo, 
  TrainingConfig, 
  TrainingMetrics, 
  TrainingReport,
  ConfusionMatrixData,
  HeatmapData
} from '@/types/ml-training';

const generateSimulatedMetrics = (
  epoch: number, 
  totalEpochs: number,
  modelType: string
): TrainingMetrics => {
  const progress = epoch / totalEpochs;
  const noise = () => (Math.random() - 0.5) * 0.05;
  
  // Simulate learning curve with diminishing returns
  const baseAccuracy = modelType === 'BERT+LSTM' ? 0.92 : modelType === 'BERT' ? 0.88 : 0.85;
  const accuracy = Math.min(0.98, 0.5 + (baseAccuracy - 0.5) * (1 - Math.exp(-3 * progress)) + noise());
  const loss = Math.max(0.05, 1.5 * Math.exp(-2.5 * progress) + noise() * 0.1);
  
  return {
    epoch,
    trainLoss: loss,
    valLoss: loss + 0.05 + noise() * 0.02,
    trainAccuracy: accuracy,
    valAccuracy: accuracy - 0.02 + noise(),
    f1Score: accuracy - 0.03 + noise(),
    precision: accuracy - 0.01 + noise(),
    recall: accuracy - 0.04 + noise(),
  };
};

const generateConfusionMatrix = (accuracy: number): ConfusionMatrixData => {
  const labels = ['Bullish', 'Bearish', 'Neutral'];
  const total = 1000;
  const correct = Math.floor(total * accuracy / 3);
  const incorrect = Math.floor((total - correct * 3) / 6);
  
  return {
    labels,
    matrix: [
      [correct + Math.floor(Math.random() * 20), incorrect + Math.floor(Math.random() * 10), incorrect + Math.floor(Math.random() * 10)],
      [incorrect + Math.floor(Math.random() * 10), correct + Math.floor(Math.random() * 20), incorrect + Math.floor(Math.random() * 10)],
      [incorrect + Math.floor(Math.random() * 10), incorrect + Math.floor(Math.random() * 10), correct + Math.floor(Math.random() * 20)],
    ],
  };
};

const generateHeatmap = (features: string[]): HeatmapData => {
  const correlations: number[][] = [];
  for (let i = 0; i < features.length; i++) {
    correlations[i] = [];
    for (let j = 0; j < features.length; j++) {
      if (i === j) {
        correlations[i][j] = 1;
      } else if (i > j) {
        correlations[i][j] = correlations[j][i];
      } else {
        correlations[i][j] = Math.round((Math.random() * 2 - 1) * 100) / 100;
      }
    }
  }
  return { features, correlations };
};

const generateFeatureImportance = (features: string[]) => {
  const importances = features.map(feature => ({
    feature,
    importance: Math.round(Math.random() * 100) / 100,
  }));
  return importances.sort((a, b) => b.importance - a.importance);
};

export const useMLTraining = () => {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [reports, setReports] = useState<TrainingReport[]>([]);
  const [currentTraining, setCurrentTraining] = useState<{
    isTraining: boolean;
    progress: number;
    currentEpoch: number;
    metrics: TrainingMetrics[];
    status: string;
  }>({
    isTraining: false,
    progress: 0,
    currentEpoch: 0,
    metrics: [],
    status: '',
  });

  const uploadDataset = useCallback((file: File, symbol: string, data: Record<string, unknown>[]) => {
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    const dataset: DatasetInfo = {
      id: crypto.randomUUID(),
      name: file.name,
      symbol: symbol.toUpperCase(),
      instances: data.length,
      columns,
      uploadedAt: new Date(),
      rawData: data,
    };
    setDatasets(prev => [...prev, dataset]);
    return dataset;
  }, []);

  const deleteDataset = useCallback((id: string) => {
    setDatasets(prev => prev.filter(d => d.id !== id));
  }, []);

  const startTraining = useCallback(async (
    dataset: DatasetInfo,
    config: TrainingConfig
  ): Promise<TrainingReport> => {
    return new Promise((resolve) => {
      const allMetrics: TrainingMetrics[] = [];
      let epoch = 0;

      setCurrentTraining({
        isTraining: true,
        progress: 0,
        currentEpoch: 0,
        metrics: [],
        status: 'Initializing model...',
      });

      const trainingSteps = [
        { step: 0, status: 'Loading dataset...', duration: 500 },
        { step: 5, status: 'Preprocessing data...', duration: 800 },
        { step: 10, status: 'Tokenizing text (BERT)...', duration: 1000 },
        { step: 15, status: 'Building model architecture...', duration: 600 },
        { step: 20, status: 'Initializing weights...', duration: 400 },
      ];

      let stepIndex = 0;
      
      const runStep = () => {
        if (stepIndex < trainingSteps.length) {
          const step = trainingSteps[stepIndex];
          setCurrentTraining(prev => ({
            ...prev,
            progress: step.step,
            status: step.status,
          }));
          stepIndex++;
          setTimeout(runStep, step.duration);
        } else {
          runEpoch();
        }
      };

      const runEpoch = () => {
        if (epoch < config.epochs) {
          epoch++;
          const metrics = generateSimulatedMetrics(epoch, config.epochs, config.modelType);
          allMetrics.push(metrics);
          
          const progress = 20 + (epoch / config.epochs) * 75;
          
          setCurrentTraining({
            isTraining: true,
            progress,
            currentEpoch: epoch,
            metrics: [...allMetrics],
            status: `Training epoch ${epoch}/${config.epochs}...`,
          });

          setTimeout(runEpoch, 300 + Math.random() * 200);
        } else {
          setCurrentTraining(prev => ({
            ...prev,
            progress: 98,
            status: 'Generating analytics...',
          }));

          setTimeout(() => {
            const finalMetrics = allMetrics[allMetrics.length - 1];
            const report: TrainingReport = {
              id: crypto.randomUUID(),
              datasetId: dataset.id,
              datasetName: dataset.name,
              symbol: dataset.symbol,
              modelType: config.modelType,
              config,
              metrics: allMetrics,
              finalMetrics: {
                accuracy: finalMetrics.valAccuracy,
                f1Score: finalMetrics.f1Score,
                precision: finalMetrics.precision,
                recall: finalMetrics.recall,
                auc: 0.85 + Math.random() * 0.1,
              },
              confusionMatrix: generateConfusionMatrix(finalMetrics.valAccuracy),
              featureImportance: generateFeatureImportance(dataset.columns.slice(0, 10)),
              heatmap: generateHeatmap(dataset.columns.slice(0, 8)),
              predictions: {
                sentiment: { 
                  bullish: 35 + Math.floor(Math.random() * 20), 
                  bearish: 25 + Math.floor(Math.random() * 15), 
                  neutral: 20 + Math.floor(Math.random() * 15) 
                },
                priceDirection: { 
                  up: 40 + Math.floor(Math.random() * 20), 
                  down: 30 + Math.floor(Math.random() * 15), 
                  stable: 15 + Math.floor(Math.random() * 10) 
                },
                technicalSignal: { 
                  buy: 45 + Math.floor(Math.random() * 15), 
                  sell: 25 + Math.floor(Math.random() * 15), 
                  hold: 20 + Math.floor(Math.random() * 10) 
                },
              },
              createdAt: new Date(),
              status: 'completed',
            };

            setReports(prev => [...prev, report]);
            setCurrentTraining({
              isTraining: false,
              progress: 100,
              currentEpoch: config.epochs,
              metrics: allMetrics,
              status: 'Training complete!',
            });

            resolve(report);
          }, 500);
        }
      };

      runStep();
    });
  }, []);

  const deleteReport = useCallback((id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  }, []);

  return {
    datasets,
    reports,
    currentTraining,
    uploadDataset,
    deleteDataset,
    startTraining,
    deleteReport,
  };
};
