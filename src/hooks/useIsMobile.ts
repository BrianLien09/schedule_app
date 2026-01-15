import { useState, useEffect } from 'react';

/**
 * Responsive Mobile Detection Hook
 * 使用 CSS media query 而非 resize listener,避免效能問題
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 使用 matchMedia API 取代 resize listener
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    // 初始檢查
    setIsMobile(mediaQuery.matches);

    // 監聽 media query 變化 (內建 debounce)
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // 新版瀏覽器使用 addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // 舊版瀏覽器 fallback
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [breakpoint]);

  return isMobile;
}
