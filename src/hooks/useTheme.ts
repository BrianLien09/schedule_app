import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type Theme = 'light' | 'dark';

/**
 * Theme Management Hook
 * 管理應用程式的主題設定
 */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('schedule_theme', 'dark');

  useEffect(() => {
    // 更新 HTML 元素的 data-theme 屬性
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return { theme, setTheme, toggleTheme };
}
