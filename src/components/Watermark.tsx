import { DollarSign, TrendingUp, BarChart3, Landmark, PieChart, Banknote, LineChart, Gem } from "lucide-react";

const icons = [DollarSign, TrendingUp, BarChart3, Landmark, PieChart, Banknote, LineChart, Gem];

const Watermark = () => {
  const rows = Array.from({ length: 6 }, (_, i) => i);
  const cols = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <div 
        className="absolute inset-0 flex flex-col justify-around animate-watermark-float"
        style={{ transform: 'rotate(-15deg) scale(1.5)', transformOrigin: 'center center' }}
      >
        {rows.map((row) => (
          <div 
            key={row} 
            className="flex justify-around"
            style={{ marginLeft: row % 2 === 0 ? '0' : '-8%' }}
          >
            {cols.map((col) => {
              const Icon = icons[(row * cols.length + col) % icons.length];
              return (
                <Icon
                  key={col}
                  className="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 mx-8 md:mx-14"
                  style={{
                    color: 'hsl(189 94% 53% / 0.08)',
                    filter: 'drop-shadow(0 0 12px hsl(189 94% 53% / 0.06))',
                  }}
                  strokeWidth={1.2}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Corner attribution */}
      <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50">
        <span className="text-xs font-medium text-muted-foreground">
          By <span className="text-primary font-semibold">HarshVardhanXS</span>
        </span>
      </div>
    </div>
  );
};

export default Watermark;
