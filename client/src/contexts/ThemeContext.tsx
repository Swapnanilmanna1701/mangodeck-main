import { createContext, useContext, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as Theme) || "light";
  });

  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: Theme) => {
      if (isAuthenticated) {
        await apiRequest("PATCH", "/api/auth/theme", { theme: newTheme });
      }
    },
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    updateThemeMutation.mutate(newTheme);
  };

  useEffect(() => {
    // Sync theme with user preference on login
    if (user?.theme && user.theme !== theme) {
      setThemeState(user.theme as Theme);
      localStorage.setItem("theme", user.theme);
      document.documentElement.classList.toggle("dark", user.theme === "dark");
    }
  }, [user?.theme]);

  useEffect(() => {
    // Apply theme on mount
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
