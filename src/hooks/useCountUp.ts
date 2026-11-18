import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 520;

/**
 * 數字從舊值滑動到新值。
 * 為什麼需要：切換月份時金額瞬間替換，使用者不容易察覺「變了多少」；短暫的滾動能吸引視線到差異。
 * 偏好減少動態效果時直接跳到新值。
 */
export function useCountUp(target: number): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fromRef.current = target;
      const frame = window.requestAnimationFrame(() => setDisplay(target));
      return () => window.cancelAnimationFrame(frame);
    }
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / DURATION_MS);
      // easeOutCubic：前段快、尾段慢，數字停下來時不會像被硬切
      const eased = 1 - (1 - progress) ** 3;
      const value = Math.round(from + (target - from) * eased);
      fromRef.current = value;
      setDisplay(value);
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  return display;
}
