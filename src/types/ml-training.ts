export interface DatasetInfo {
  id: string;
  name: string;
  symbol: string;
  instances: number;
  columns: string[];
  uploadedAt: Date;
  rawData: Record<string, unknown>[];
}

export interface TrainingConfig {
  modelType: 'BERT' | 'LSTM' | 'BERT+LSTM';
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  sequenceLength: number;
  hiddenUnits: number;
  dropoutRate: number;
  optimizer: 'adam' | 'sgd' | 'rmsprop';
  earlyStopping: boolean;
}

export interface TrainingMetrics {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  trainAccuracy: number;
  valAccuracy: number;
  f1Score: number;
  precision: number;
  recall: number;
}

export interface ConfusionMatrixData {
  labels: string[];
  matrix: number[][];
}

export interface HeatmapData {
  features: string[];
  correlations: number[][];
}

export interface TrainingReport {
  id: string;
  datasetId: string;
  datasetName: string;
  symbol: string;
  modelType: string;
  config: TrainingConfig;
  metrics: TrainingMetrics[];
  finalMetrics: {
    accuracy: number;
    f1Score: number;
    precision: number;
    recall: number;
    auc: number;
  };
  confusionMatrix: ConfusionMatrixData;
  featureImportance: { feature: string; importance: number }[];
  heatmap: HeatmapData;
  predictions: {
    sentiment: { bullish: number; bearish: number; neutral: number };
    priceDirection: { up: number; down: number; stable: number };
    technicalSignal: { buy: number; sell: number; hold: number };
  };
  createdAt: Date;
  status: 'completed' | 'training' | 'failed';
}
