import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Layers,
  Cpu,
  Sparkles
} from 'lucide-react';
import { TrainingReport } from '@/types/ml-training';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ModelAnalyticsProps {
  report: TrainingReport;
}

const COLORS = ['hsl(var(--accent))', 'hsl(142, 76%, 36%)', 'hsl(262, 83%, 58%)', 'hsl(var(--destructive))'];

export const ModelAnalytics = ({ report }: ModelAnalyticsProps) => {
  const predictionData = [
    { name: 'Bullish', value: report.predictions.sentiment.bullish, color: 'hsl(142, 76%, 36%)' },
    { name: 'Bearish', value: report.predictions.sentiment.bearish, color: 'hsl(0, 84%, 60%)' },
    { name: 'Neutral', value: report.predictions.sentiment.neutral, color: 'hsl(var(--muted-foreground))' },
  ];

  const technicalData = [
    { name: 'Buy', value: report.predictions.technicalSignal.buy },
    { name: 'Hold', value: report.predictions.technicalSignal.hold },
    { name: 'Sell', value: report.predictions.technicalSignal.sell },
  ];

  return (
    <div className="space-y-4">
      {/* Final Metrics Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Model Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-accent">
                {(report.finalMetrics.accuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">F1 Score</p>
              <p className="text-2xl font-bold text-green-400">
                {(report.finalMetrics.f1Score * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Precision</p>
              <p className="text-2xl font-bold text-blue-400">
                {(report.finalMetrics.precision * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Recall</p>
              <p className="text-2xl font-bold text-purple-400">
                {(report.finalMetrics.recall * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">AUC-ROC</p>
              <p className="text-2xl font-bold text-orange-400">
                {(report.finalMetrics.auc).toFixed(3)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* Feature Importance */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-accent" />
              Feature Importance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.featureImportance.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis 
                    type="category" 
                    dataKey="feature" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    width={80}
                    tickFormatter={(value) => value.substring(0, 10)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="importance" fill="hsl(var(--accent))" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Prediction Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-accent" />
              Sentiment Prediction Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={predictionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {predictionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Signal & Price Direction */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-5 w-5 text-accent" />
              Technical Signal Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {technicalData.map((item, index) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {item.name === 'Buy' && <TrendingUp className="h-4 w-4 text-green-400" />}
                    {item.name === 'Sell' && <TrendingDown className="h-4 w-4 text-red-400" />}
                    {item.name === 'Hold' && <Minus className="h-4 w-4 text-yellow-400" />}
                    {item.name}
                  </span>
                  <span className="font-medium">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-5 w-5 text-accent" />
              Model Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model:</span>
                <Badge variant="outline">{report.modelType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Epochs:</span>
                <span>{report.config.epochs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch Size:</span>
                <span>{report.config.batchSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Learning Rate:</span>
                <span>{report.config.learningRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hidden Units:</span>
                <span>{report.config.hiddenUnits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dropout:</span>
                <span>{(report.config.dropoutRate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Optimizer:</span>
                <span className="capitalize">{report.config.optimizer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Val Split:</span>
                <span>{(report.config.validationSplit * 100).toFixed(0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
