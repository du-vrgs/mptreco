'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useThemeHelper } from '../hooks/useThemeHelper';
import { ThemeSkin } from '@/shared/types';

interface ThemeContextData {
  currentSkin: ThemeSkin;
  changeSkin: (skin: ThemeSkin) => void;
}

const ThemeContext = createContext<ThemeContextData | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useThemeHelper();

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextData => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
