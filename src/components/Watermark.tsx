const Watermark = () => {
  const watermarkText = "Harsh & Soubhagaya";
  
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
                className="text-2xl md:text-4xl lg:text-5xl font-heading font-bold text-primary/[0.07] dark:text-primary/[0.12] px-8 md:px-16"
                style={{ letterSpacing: '0.05em' }}
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
          By <span className="text-primary font-semibold">Harsh & Soubhagaya</span>
        </span>
      </div>
    </div>
  );
};

export default Watermark;
