import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UI_PREFERENCES_STORAGE_KEY = 'icu_ui_preferences';

const DEFAULT_UI_PREFERENCES = {
  themeMode: 'light',
  colorPreset: 'horizon-blue',
  density: 'comfortable',
};

const PRESET_OPTIONS = [
  { id: 'horizon-blue', label: 'Horizon Blue' },
  { id: 'horizon-violet', label: 'Horizon Violet' },
  { id: 'horizon-aqua', label: 'Horizon Aqua' },
];

const ThemeContext = createContext(null);

const readStoredPreferences = () => {
  if (typeof window === 'undefined') return DEFAULT_UI_PREFERENCES;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY) || '{}');
    return {
      ...DEFAULT_UI_PREFERENCES,
      ...parsed,
    };
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
};

const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }) {
  const [preferences, setPreferences] = useState(readStoredPreferences);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemTheme(media.matches ? 'dark' : 'light');
    update();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const effectiveTheme = preferences.themeMode === 'system' ? systemTheme : preferences.themeMode;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = effectiveTheme;
    root.dataset.themeMode = preferences.themeMode;
    root.dataset.preset = preferences.colorPreset;
    root.dataset.density = preferences.density;
    root.style.colorScheme = effectiveTheme;
  }, [effectiveTheme, preferences.colorPreset, preferences.density, preferences.themeMode]);

  const value = useMemo(
    () => ({
      preferences,
      effectiveTheme,
      presetOptions: PRESET_OPTIONS,
      setThemeMode: (themeMode) => setPreferences((prev) => ({ ...prev, themeMode })),
      setColorPreset: (colorPreset) => setPreferences((prev) => ({ ...prev, colorPreset })),
      setDensity: (density) => setPreferences((prev) => ({ ...prev, density })),
      cycleThemeMode: () =>
        setPreferences((prev) => {
          const modes = ['light', 'dark', 'system'];
          const nextIndex = (modes.indexOf(prev.themeMode) + 1) % modes.length;
          return { ...prev, themeMode: modes[nextIndex] };
        }),
      resetPreferences: () => setPreferences(DEFAULT_UI_PREFERENCES),
    }),
    [effectiveTheme, preferences]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
