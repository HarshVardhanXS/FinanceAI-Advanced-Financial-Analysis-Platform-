import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/50 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl animate-scale-in",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium group-[.toast]:transition-all group-[.toast]:hover:scale-105 group-[.toast]:hover:shadow-glow-primary group-[.toast]:active:scale-95",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:transition-all group-[.toast]:hover:bg-muted/80",
          success: "group-[.toast]:border-success/50 group-[.toast]:shadow-glow-success",
          error: "group-[.toast]:border-danger/50",
          info: "group-[.toast]:border-primary/50 group-[.toast]:shadow-glow-primary",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
