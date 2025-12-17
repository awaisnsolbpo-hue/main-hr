import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-10 h-10">
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 relative hover:bg-accent/50 transition-all duration-300 active:scale-95"
          style={{ willChange: 'transform' }}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-foreground" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-foreground" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[140px] bg-background/95 backdrop-blur-sm border-border"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="cursor-pointer flex items-center gap-2 focus:bg-accent"
        >
          <Sun className="h-4 w-4 text-yellow-500" />
          <span className={theme === "light" ? "font-semibold" : ""}>Light</span>
          {theme === "light" && (
            <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="cursor-pointer flex items-center gap-2 focus:bg-accent"
        >
          <Moon className="h-4 w-4 text-blue-400" />
          <span className={theme === "dark" ? "font-semibold" : ""}>Dark</span>
          {theme === "dark" && (
            <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="cursor-pointer flex items-center gap-2 focus:bg-accent"
        >
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span className={theme === "system" ? "font-semibold" : ""}>System</span>
          {theme === "system" && (
            <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

