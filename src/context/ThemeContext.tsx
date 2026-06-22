import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'dark' | 'light' | 'kelly' | 'navy';

export interface ThemeTokens {
  bg: string;
  surface: string;
  canvas: string;
  card: string;
  chip: string;
  ink: string;
  sub: string;
  line: string;
  accent: string;
  onAccent: string;
  danger: string;
  softA: number;
  accentSoft: string;
  shadow: string;
  dark: boolean;
}

const THEMES: Record<ThemeName, ThemeTokens> = {
  dark: {
    bg: '#0C0D0F', surface: '#15171B', canvas: '#08090A', card: '#121316',
    chip: '#191B1F', ink: '#F4F1EA', sub: '#8A8F98', line: '#2A2D33',
    accent: '#2E6BFF', onAccent: '#FFFFFF', danger: '#FF5A47',
    softA: 0.16, accentSoft: 'rgba(46,107,255,0.16)',
    shadow: '0 16px 40px rgba(0,0,0,.6)', dark: true,
  },
  light: {
    bg: '#FFFFFF', surface: '#F5F7FB', canvas: '#E7ECF4', card: '#FFFFFF',
    chip: '#EEF2F8', ink: '#101A30', sub: '#5B6478', line: '#DCE2EC',
    accent: '#2E6BFF', onAccent: '#FFFFFF', danger: '#E5483A',
    softA: 0.12, accentSoft: 'rgba(46,107,255,0.12)',
    shadow: '0 12px 30px rgba(20,40,80,.10)', dark: false,
  },
  kelly: {
    bg: '#0A0F0B', surface: '#121813', canvas: '#070B08', card: '#0F140F',
    chip: '#161D17', ink: '#EFF3EC', sub: '#7F8C7C', line: '#232C24',
    accent: '#1FA24A', onAccent: '#FFFFFF', danger: '#FF5A47',
    softA: 0.18, accentSoft: 'rgba(31,162,74,0.18)',
    shadow: '0 16px 40px rgba(0,0,0,.6)', dark: true,
  },
  navy: {
    bg: '#0A1130', surface: '#141D44', canvas: '#060B22', card: '#111A3D',
    chip: '#18234F', ink: '#EDF1FA', sub: '#8B98BE', line: '#283568',
    accent: '#3C5DC4', onAccent: '#FFFFFF', danger: '#FF6B5C',
    softA: 0.20, accentSoft: 'rgba(60,93,196,0.20)',
    shadow: '0 16px 40px rgba(4,8,30,.65)', dark: true,
  },
};

const THEME_DOTS: Record<ThemeName, string> = {
  dark: '#0C0D0F',
  light: '#FFFFFF',
  kelly: '#1FA24A',
  navy: '#3C5DC4',
};

interface ThemeContextType {
  theme: ThemeName;
  t: ThemeTokens;
  setTheme: (name: ThemeName) => void;
  themeDots: Record<ThemeName, string>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'fp_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'kelly' || stored === 'navy') return stored;
    return 'dark';
  });

  const setTheme = (name: ThemeName) => {
    setThemeState(name);
    localStorage.setItem(STORAGE_KEY, name);
  };

  useEffect(() => {
    const tk = THEMES[theme];
    const root = document.documentElement;
    root.style.setProperty('--bg', tk.bg);
    root.style.setProperty('--surface', tk.surface);
    root.style.setProperty('--canvas', tk.canvas);
    root.style.setProperty('--card', tk.card);
    root.style.setProperty('--chip', tk.chip);
    root.style.setProperty('--ink', tk.ink);
    root.style.setProperty('--sub', tk.sub);
    root.style.setProperty('--line', tk.line);
    root.style.setProperty('--accent', tk.accent);
    root.style.setProperty('--accent-soft', tk.accentSoft);
    root.style.setProperty('--on-accent', tk.onAccent);
    root.style.setProperty('--danger', tk.danger);
    root.style.setProperty('--shadow', tk.shadow);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, t: THEMES[theme], setTheme, themeDots: THEME_DOTS }}>
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
