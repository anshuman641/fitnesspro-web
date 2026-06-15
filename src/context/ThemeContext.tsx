import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'cream' | 'midnight' | 'sunrise';

export interface ThemeTokens {
  bg: string;
  surface: string;
  card: string;
  ink: string;
  sub: string;
  line: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  chip: string;
  danger: string;
  shadow: string;
  dark: boolean;
}

const THEMES: Record<ThemeName, ThemeTokens> = {
  cream: {
    bg: '#F4F1EC', surface: '#FFFFFF', card: '#FFFFFF', ink: '#211F1B', sub: '#857F75',
    line: '#E8E2D7', accent: '#1E885A', accentSoft: '#E2F0E9', onAccent: '#FFFFFF',
    chip: '#F5F2EB', danger: '#CF5038',
    shadow: '0 6px 18px rgba(40,35,25,0.06)',
    dark: false,
  },
  midnight: {
    bg: '#0E0E10', surface: '#1A1A1E', card: '#191A1D', ink: '#F5F4EF', sub: '#928F86',
    line: '#2A2A30', accent: '#C7FF3C', accentSoft: 'rgba(199,255,60,0.13)', onAccent: '#16240A',
    chip: '#222227', danger: '#FF6B57',
    shadow: '0 8px 22px rgba(0,0,0,0.4)',
    dark: true,
  },
  sunrise: {
    bg: '#FFF6F0', surface: '#FFFFFF', card: '#FFFFFF', ink: '#2C1D16', sub: '#A28A7C',
    line: '#F2E2D6', accent: '#EF6534', accentSoft: '#FFE6DA', onAccent: '#FFFFFF',
    chip: '#FCF1EA', danger: '#CF5038',
    shadow: '0 6px 18px rgba(120,60,30,0.07)',
    dark: false,
  },
};

interface ThemeContextType {
  theme: ThemeName;
  t: ThemeTokens;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'fp_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'cream' || stored === 'midnight' || stored === 'sunrise') return stored;
    return 'cream';
  });

  const setTheme = (name: ThemeName) => {
    setThemeState(name);
    localStorage.setItem(STORAGE_KEY, name);
  };

  useEffect(() => {
    const t = THEMES[theme];
    const root = document.documentElement;
    root.style.setProperty('--bg', t.bg);
    root.style.setProperty('--surface', t.surface);
    root.style.setProperty('--card', t.card);
    root.style.setProperty('--ink', t.ink);
    root.style.setProperty('--sub', t.sub);
    root.style.setProperty('--line', t.line);
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--accent-soft', t.accentSoft);
    root.style.setProperty('--on-accent', t.onAccent);
    root.style.setProperty('--chip', t.chip);
    root.style.setProperty('--danger', t.danger);
    root.style.setProperty('--shadow', t.shadow);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, t: THEMES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}

export { THEMES };
