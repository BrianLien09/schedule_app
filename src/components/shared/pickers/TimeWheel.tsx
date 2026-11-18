'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import styles from './Pickers.module.css';

const ITEM_HEIGHT = 44;
// 上下各露出兩格，使用者看得到前後的值，知道還能繼續滾
const VISIBLE_PADDING = 2;
// 捲動停下後才提交：避免滑動途中每經過一格就更新一次，造成整張表單連續重繪
const SETTLE_DELAY_MS = 120;

const pad = (value: number): string => String(value).padStart(2, '0');

interface WheelColumnProps {
  ariaLabel: string;
  /** 例如 24（時）或 60（分）：數值為 0 ~ count-1 */
  count: number;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}

/**
 * 單一滾輪欄位（時或分）。
 * 為什麼用原生捲動＋scroll-snap 而不是自己算拖曳：手機慣性滑動、桌面滑鼠滾輪、觸控板都交給瀏覽器處理，
 * 手感與系統一致；我們只在捲動停下後讀取對齊的格子。
 */
function WheelColumn({ ariaLabel, count, value, unit, onChange }: WheelColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const hasMounted = useRef(false);
  const [centerIndex, setCenterIndex] = useState(value);

  // 外部改值（快速時長、微調按鈕）時把滾輪轉到對應位置；首次掛載直接定位，不播捲動動畫
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const target = value * ITEM_HEIGHT;
    if (Math.abs(list.scrollTop - target) >= 1) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      list.scrollTo({ top: target, behavior: hasMounted.current && !reduceMotion ? 'smooth' : 'auto' });
    }
    hasMounted.current = true;
  }, [value]);

  useEffect(() => () => {
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
  }, []);

  const handleScroll = (): void => {
    const list = listRef.current;
    if (!list) return;
    const index = Math.min(count - 1, Math.max(0, Math.round(list.scrollTop / ITEM_HEIGHT)));
    setCenterIndex(index);
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      if (index !== value) onChange(index);
    }, SETTLE_DELAY_MS);
  };

  // 鍵盤上下鍵逐格調整並循環，桌面不用滑鼠也能精準選到任何一分鐘
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const steps: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -10, PageDown: 10 };
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    onChange((value + step + count) % count);
  };

  return (
    <div className={styles.wheelColumn}>
      <div
        ref={listRef}
        role="spinbutton"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={count - 1}
        aria-valuenow={value}
        aria-valuetext={`${value} ${unit}`}
        className={styles.wheelList}
        style={{
          height: ITEM_HEIGHT * (VISIBLE_PADDING * 2 + 1),
          paddingTop: ITEM_HEIGHT * VISIBLE_PADDING,
          paddingBottom: ITEM_HEIGHT * VISIBLE_PADDING,
        }}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
      >
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className={`${styles.wheelItem} ${index === centerIndex ? styles.wheelItemActive : ''}`}
            style={{ height: ITEM_HEIGHT }}
            onClick={() => onChange(index)}
          >
            {pad(index)}
          </button>
        ))}
      </div>
      {/* 中央選取帶：數字捲過時像被框住，一眼知道目前選的是哪一格 */}
      <div aria-hidden="true" className={styles.wheelBand} style={{ top: ITEM_HEIGHT * VISIBLE_PADDING, height: ITEM_HEIGHT }} />
    </div>
  );
}

interface TimeWheelProps {
  /** 必須是有效的 HH:mm；空值的處理交給呼叫端決定 */
  value: string;
  ariaLabel: string;
  onChange: (value: string) => void;
}

/** 時、分兩欄滾輪：0～59 任何分鐘都能直接滑到，不必先點時、再點分、再按確認。 */
export default function TimeWheel({ value, ariaLabel, onChange }: TimeWheelProps) {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText) || 0;
  const minute = Number(minuteText) || 0;

  return (
    <div role="group" aria-label={ariaLabel} className={styles.wheelGroup}>
      <WheelColumn ariaLabel="時" unit="點" count={24} value={hour} onChange={(next) => onChange(`${pad(next)}:${pad(minute)}`)} />
      <span aria-hidden="true" className={styles.wheelColon}>:</span>
      <WheelColumn ariaLabel="分" unit="分" count={60} value={minute} onChange={(next) => onChange(`${pad(hour)}:${pad(next)}`)} />
    </div>
  );
}
