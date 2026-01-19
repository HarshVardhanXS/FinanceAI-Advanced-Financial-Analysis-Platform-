import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Brain, TrendingUp } from 'lucide-react';
import { TrainingMetrics } from '@/types/ml-training';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrainingProgressProps {
  isTraining: boolean;
  progress: number;
  currentEpoch: number;
  totalEpochs: number;
  metrics: TrainingMetrics[];
  status: string;
}

export const TrainingProgress = ({
  isTraining,
  progress,
  currentEpoch,
  totalEpochs,
  metrics,
  status,
}: TrainingProgressProps) => {
  const latestMetrics = metrics[metrics.length - 1];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent" />
            Training Progress
          </span>
          {isTraining && (
            <Badge variant="outline" className="animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{status}</span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Epoch {currentEpoch}/{totalEpochs}</span>
            {latestMetrics && (
              <span>Loss: {latestMetrics.trainLoss.toFixed(4)}</span>
            )}
          </div>
        </div>

        {latestMetrics && (
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="text-lg font-bold text-accent">
                {(latestMetrics.valAccuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">F1 Score</p>
              <p className="text-lg font-bold text-green-400">
                {(latestMetrics.f1Score * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Precision</p>
              <p className="text-lg font-bold text-blue-400">
                {(latestMetrics.precision * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Recall</p>
              <p className="text-lg font-bold text-purple-400">
                {(latestMetrics.recall * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {metrics.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="epoch" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="trainLoss" 
                  stroke="hsl(var(--destructive))" 
                  name="Train Loss"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="valLoss" 
                  stroke="hsl(var(--accent))" 
                  name="Val Loss"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="trainAccuracy" 
                  stroke="hsl(142, 76%, 36%)" 
                  name="Train Acc"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="valAccuracy" 
                  stroke="hsl(262, 83%, 58%)" 
                  name="Val Acc"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!isTraining && metrics.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Training metrics will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
