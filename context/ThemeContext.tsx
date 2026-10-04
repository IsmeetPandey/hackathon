'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function subscribeTheme(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('campusconnect-theme-change', callback);
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('campusconnect-theme-change', callback);
    mediaQuery.removeEventListener('change', callback);
  };
}

function getThemeSnapshot(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem('campusconnect_theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    // ignore
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribeTheme, getThemeSnapshot, () => 'light');

  useEffect(() => {
    // Sync class list with current theme on documentElement
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem('campusconnect_theme', newTheme);
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('campusconnect-theme-change'));
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
