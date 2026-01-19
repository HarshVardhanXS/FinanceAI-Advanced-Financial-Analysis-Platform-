import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid3X3 } from 'lucide-react';
import { ConfusionMatrixData } from '@/types/ml-training';

interface ConfusionMatrixProps {
  data: ConfusionMatrixData;
}

export const ConfusionMatrix = ({ data }: ConfusionMatrixProps) => {
  const maxValue = Math.max(...data.matrix.flat());
  
  const getColor = (value: number, row: number, col: number) => {
    const intensity = value / maxValue;
    if (row === col) {
      // Diagonal (correct predictions) - green shades
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
    }
    // Off-diagonal (errors) - red shades
    return `rgba(239, 68, 68, ${0.1 + intensity * 0.5})`;
  };

  const total = data.matrix.flat().reduce((a, b) => a + b, 0);
  const correct = data.matrix.reduce((acc, row, i) => acc + row[i], 0);
  const accuracy = (correct / total * 100).toFixed(1);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-accent" />
          Confusion Matrix
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            Overall Accuracy: {accuracy}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="text-xs text-muted-foreground mb-2">Predicted Labels →</div>
          <div className="flex">
            <div className="flex flex-col justify-center mr-2">
              <span className="text-xs text-muted-foreground writing-mode-vertical transform -rotate-180" style={{ writingMode: 'vertical-rl' }}>
                ← Actual Labels
              </span>
            </div>
            <div>
              {/* Header row */}
              <div className="flex">
                <div className="w-20 h-10" />
                {data.labels.map((label) => (
                  <div
                    key={`header-${label}`}
                    className="w-20 h-10 flex items-center justify-center text-xs font-medium text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}
              </div>
              
              {/* Matrix rows */}
              {data.matrix.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  <div className="w-20 h-20 flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {data.labels[rowIndex]}
                  </div>
                  {row.map((value, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="w-20 h-20 flex flex-col items-center justify-center border border-border/50 rounded-lg m-0.5 transition-transform hover:scale-105"
                      style={{ backgroundColor: getColor(value, rowIndex, colIndex) }}
                    >
                      <span className="text-lg font-bold">{value}</span>
                      <span className="text-xs text-muted-foreground">
                        {((value / total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/70" />
              <span>Correct Predictions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/40" />
              <span>Misclassifications</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
