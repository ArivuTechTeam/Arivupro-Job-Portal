import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
  light: {
    name: 'light',
    label: 'Light',
    icon: '☀️',
    // Page / layout
    pageBg:       '#f1f5f9',
    topbarBg:     '#ffffff',
    topbarBorder: '#e2e8f0',
    // Cards
    cardBg:       '#ffffff',
    cardBorder:   '#e2e8f0',
    cardShadow:   '0 1px 4px rgba(0,0,0,0.05)',
    // Text
    textPrimary:  '#0f172a',
    textSecondary:'#475569',
    textMuted:    '#94a3b8',
    // Input
    inputBg:      '#f8fafc',
    inputBorder:  '#e2e8f0',
    // Table rows
    tableRowAlt:  '#f8fafc',
    tableHover:   '#f1f5f9',
    // Sidebar (always dark gradient)
    sidebarBg:    'linear-gradient(180deg,#0f0e17 0%,#1a1830 60%,#0f0e17 100%)',
    sidebarActive:'rgba(255,255,255,0.09)',
    sidebarText:  'rgba(255,255,255,0.55)',
    sidebarHover: 'rgba(255,255,255,0.05)',
    // Section dividers
    divider:      '#f1f5f9',
    // Badge
    badgeBg:      '#f1f5f9',
    badgeText:    '#64748b',
  },
  dark: {
    name: 'dark',
    label: 'Dark',
    icon: '🌙',
    // Page / layout
    pageBg:       '#0d1117',
    topbarBg:     '#161b22',
    topbarBorder: '#21262d',
    // Cards
    cardBg:       '#161b22',
    cardBorder:   '#21262d',
    cardShadow:   '0 1px 4px rgba(0,0,0,0.4)',
    // Text
    textPrimary:  '#e6edf3',
    textSecondary:'#8b949e',
    textMuted:    '#484f58',
    // Input
    inputBg:      '#0d1117',
    inputBorder:  '#30363d',
    // Table rows
    tableRowAlt:  '#1c2128',
    tableHover:   '#1f2428',
    // Sidebar (darker in dark mode)
    sidebarBg:    'linear-gradient(180deg,#080b10 0%,#0d1117 60%,#080b10 100%)',
    sidebarActive:'rgba(255,255,255,0.07)',
    sidebarText:  'rgba(255,255,255,0.45)',
    sidebarHover: 'rgba(255,255,255,0.04)',
    // Section dividers
    divider:      '#21262d',
    // Badge
    badgeBg:      '#21262d',
    badgeText:    '#8b949e',
  },
};

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem('arivupro_theme') || 'light';
  });

  const theme = THEMES[themeName] || THEMES.light;

  useEffect(() => {
    localStorage.setItem('arivupro_theme', themeName);
    // Apply CSS variables to :root so global CSS also responds
    const root = document.documentElement;
    root.setAttribute('data-theme', themeName);
    root.style.setProperty('--page-bg',        theme.pageBg);
    root.style.setProperty('--card-bg',         theme.cardBg);
    root.style.setProperty('--card-border',     theme.cardBorder);
    root.style.setProperty('--text-primary',    theme.textPrimary);
    root.style.setProperty('--text-secondary',  theme.textSecondary);
    root.style.setProperty('--text-muted',      theme.textMuted);
    root.style.setProperty('--input-bg',        theme.inputBg);
    root.style.setProperty('--input-border',    theme.inputBorder);
    root.style.setProperty('--divider',         theme.divider);
    root.style.setProperty('--topbar-bg',       theme.topbarBg);
    root.style.setProperty('--topbar-border',   theme.topbarBorder);
    // Also update existing vars used in .card, .page etc
    root.style.setProperty('--bg',              theme.pageBg);
    root.style.setProperty('--bg-card',         theme.cardBg);
    root.style.setProperty('--border',          theme.cardBorder);
    root.style.setProperty('--border-light',    theme.divider);
    root.style.setProperty('--text',            theme.textPrimary);
    root.style.setProperty('--text-light',      theme.textSecondary);
    root.style.setProperty('--text-lighter',    theme.textMuted);
  }, [themeName, theme]);

  const toggleTheme = () => {
    setThemeName(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, toggleTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: THEMES.light, themeName: 'light', toggleTheme: () => {}, THEMES };
  }
  return ctx;
}
