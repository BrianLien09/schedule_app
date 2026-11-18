import { useEffect, type RefObject } from 'react';

// 與 Pickers.module.css 面板進場動畫（--dur-base）同步，動畫結束後量到的位置才準
const REVEAL_DELAY_MS = 220;

/**
 * 面板展開後把它捲進可視範圍。
 * 為什麼需要：彈窗內容高度有限，日期或時間面板常常展開在操作列下方，使用者會以為點了沒反應。
 */
export function useRevealOnOpen(ref: RefObject<HTMLElement | null>, isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      ref.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    }, REVEAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [ref, isOpen]);
}
