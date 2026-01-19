import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { HeatmapData } from '@/types/ml-training';

interface CorrelationHeatmapProps {
  data: HeatmapData;
}

export const CorrelationHeatmap = ({ data }: CorrelationHeatmapProps) => {
  const getColor = (value: number) => {
    // Blue for negative, white for zero, red for positive
    if (value >= 0) {
      const intensity = value;
      return `rgba(239, 68, 68, ${intensity * 0.8})`;
    } else {
      const intensity = -value;
      return `rgba(59, 130, 246, ${intensity * 0.8})`;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-accent" />
          Feature Correlation Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-max">
            {/* Header row */}
            <div className="flex">
              <div className="w-24 h-8" />
              {data.features.map((feature) => (
                <div
                  key={`header-${feature}`}
                  className="w-14 h-8 flex items-center justify-center"
                >
                  <span className="text-[10px] font-medium text-muted-foreground truncate transform -rotate-45 origin-center">
                    {feature.substring(0, 8)}
                  </span>
                </div>
              ))}
            </div>

            {/* Matrix rows */}
            {data.correlations.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                <div className="w-24 h-14 flex items-center pr-2">
                  <span className="text-[10px] font-medium text-muted-foreground truncate">
                    {data.features[rowIndex]}
                  </span>
                </div>
                {row.map((value, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="w-14 h-14 flex items-center justify-center border border-border/30 transition-all hover:scale-110 hover:z-10 relative group"
                    style={{ backgroundColor: getColor(value) }}
                  >
                    <span className="text-[10px] font-medium opacity-80">
                      {value.toFixed(2)}
                    </span>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                      {data.features[rowIndex]} × {data.features[colIndex]}: {value.toFixed(3)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center items-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            <div className="w-16 h-4 rounded" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.8), white, rgba(239, 68, 68, 0.8))' }} />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>-1 (Negative)</span>
            <span>0</span>
            <span>+1 (Positive)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
