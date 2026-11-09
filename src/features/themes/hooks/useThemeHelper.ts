import { useState, useEffect, useCallback } from 'react';
import { ThemeSkin } from '@/shared/types';

const THEME_STORAGE_KEY = 'mptreco_theme_skin';

export const useThemeHelper = () => {
  const [currentSkin, setCurrentSkin] = useState<ThemeSkin>(ThemeSkin.WMP_CLASSIC_2000);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeSkin | null;
    if (stored && Object.values(ThemeSkin).includes(stored)) {
      setCurrentSkin(stored);
    }
  }, []);

  const changeSkin = useCallback((newSkin: ThemeSkin) => {
    setCurrentSkin(newSkin);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newSkin);
    }
  }, []);

  return {
    currentSkin,
    changeSkin,
  };
};
