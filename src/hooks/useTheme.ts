import { useEffect } from 'react';

export type Theme = 'dark';

/**
 * Theme Management Hook
 * 應用程式鎖定為深色模式
 */
export function useTheme() {
  const theme: Theme = 'dark';

  useEffect(() => {
    // 強制設定為深色模式
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // 保持介面一致性，但功能已停用
  const toggleTheme = () => {
    // 不執行任何操作
  };

  const setTheme = () => {
    // 不執行任何操作
  };

  return { theme, setTheme, toggleTheme };
}
