import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="relative overflow-hidden group">
      <div className="absolute inset-0 bg-primary/10 scale-0 group-hover:scale-100 rounded-md transition-transform duration-300" />
      {theme === "dark" ? (
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 group-hover:rotate-90 group-hover:text-primary" />
      ) : (
        <Moon className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 group-hover:-rotate-90 group-hover:text-primary" />
      )}
    </Button>
  );
};
