const Watermark = () => {
  const watermarkText = "Harsh & Shoubhagya";
  
  // Create multiple rows for the repeating pattern
  const rows = Array.from({ length: 8 }, (_, i) => i);
  const cols = Array.from({ length: 4 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden select-none">
      {/* Repeating diagonal pattern */}
      <div 
        className="absolute inset-0 flex flex-col justify-around"
        style={{ transform: 'rotate(-15deg) scale(1.5)', transformOrigin: 'center center' }}
      >
        {rows.map((row) => (
          <div 
            key={row} 
            className="flex justify-around whitespace-nowrap"
            style={{ marginLeft: row % 2 === 0 ? '0' : '-10%' }}
          >
            {cols.map((col) => (
              <span
                key={col}
                className="text-3xl md:text-5xl lg:text-6xl font-heading font-black text-primary/[0.15] dark:text-primary/[0.20] px-8 md:px-16 uppercase tracking-wider"
                style={{ 
                  letterSpacing: '0.1em',
                  textShadow: '0 0 20px hsl(var(--primary) / 0.1)'
                }}
              >
                {watermarkText}
              </span>
            ))}
          </div>
        ))}
      </div>
      
      {/* Corner attribution */}
      <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50">
        <span className="text-xs font-medium text-muted-foreground">
          By <span className="text-primary font-semibold">Harsh & Shoubhagya</span>
        </span>
      </div>
    </div>
  );
};

export default Watermark;
