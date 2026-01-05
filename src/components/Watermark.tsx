const Watermark = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none">
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="text-6xl md:text-8xl font-heading font-bold text-primary/5 dark:text-primary/10 whitespace-nowrap transform -rotate-12"
          style={{ letterSpacing: '0.1em' }}
        >
          Harsh & Soubhagaya
        </div>
      </div>
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground/50">
        By Harsh & Soubhagaya
      </div>
    </div>
  );
};

export default Watermark;
