'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/shared/Icons';
import { addCalendarDays, localDateKey } from '@/utils/agenda';
import { addMonths, buildMonthGrid, parseDateKey, startOfMonth, weekdayLabel } from '@/utils/pickerDateTime';
import styles from './Pickers.module.css';

const WEEK_HEADERS = ['一', '二', '三', '四', '五', '六', '日'] as const;

interface CalendarPanelProps {
  /** YYYY-MM-DD；空字串代表尚未選擇 */
  value: string;
  onSelect: (value: string) => void;
  /** 可選的最早日期（含），例如代辦結束日不可早於開始日 */
  min?: string;
  /** 另一端的日期，用來把起訖區間串色；只在代辦的起訖日使用 */
  rangeEdge?: string;
  /** 有值時顯示「清除」，選填日期才需要 */
  onClear?: () => void;
  today: Date;
}

/**
 * 行內月曆面板。
 * 為什麼不做浮動 popover：彈窗本體會捲動且有 overflow 限制，浮層容易被裁切或在手機鍵盤彈出時錯位；
 * 行內展開會把下方欄位推開，在任何螢幕尺寸都能完整操作。
 */
export default function CalendarPanel({ value, onSelect, min, rangeEdge, onClear, today }: CalendarPanelProps) {
  const selected = parseDateKey(value);
  // 面板每次展開都會重新掛載，因此初始值就是「已選日期所在月份」，不會停在上次翻到的月份
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected ?? today));
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const todayKey = localDateKey(today);
  const rangeStart = rangeEdge && value ? (rangeEdge < value ? rangeEdge : value) : '';
  const rangeEnd = rangeEdge && value ? (rangeEdge < value ? value : rangeEdge) : '';
  const quickOptions = [
    { label: '今天', key: todayKey },
    { label: '明天', key: localDateKey(addCalendarDays(today, 1)) },
    { label: '下週同天', key: localDateKey(addCalendarDays(today, 7)) },
  ].filter((option) => !min || option.key >= min);

  const changeMonth = (delta: number): void => {
    setDirection(delta > 0 ? 'next' : 'prev');
    setViewMonth((current) => addMonths(current, delta));
  };

  // 快捷日期可能跨月，選完後讓月曆也跟過去，下次展開前就能確認位置
  const selectKey = (key: string): void => {
    const date = parseDateKey(key);
    if (date) setViewMonth(startOfMonth(date));
    onSelect(key);
  };

  const monthKey = `${viewMonth.getFullYear()}-${viewMonth.getMonth()}`;

  return (
    <>
      <div className={styles.calendarHeader}>
        <button type="button" className={styles.iconButton} aria-label="上個月" onClick={() => changeMonth(-1)}>
          <ChevronLeftIcon size={20} />
        </button>
        <span className={styles.calendarTitle} aria-live="polite">
          {viewMonth.getFullYear()} 年 {viewMonth.getMonth() + 1} 月
        </span>
        <button type="button" className={styles.iconButton} aria-label="下個月" onClick={() => changeMonth(1)}>
          <ChevronRightIcon size={20} />
        </button>
      </div>

      <div className={styles.chipRow}>
        {quickOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={value === option.key}
            className={`${styles.chip} ${value === option.key ? styles.chipActive : ''}`}
            onClick={() => selectKey(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div>
        <div className={styles.weekRow} aria-hidden="true">
          {WEEK_HEADERS.map((day) => <span key={day}>{day}</span>)}
        </div>
        {/* key 綁月份：翻月時重新掛載，進場動畫才會依方向播放 */}
        <div key={monthKey} className={`${styles.dayGrid} ${direction === 'next' ? styles.dayGridNext : styles.dayGridPrev}`}>
          {buildMonthGrid(viewMonth).map((day) => {
            const key = localDateKey(day);
            const isSelected = key === value;
            const isToday = key === todayKey;
            const isOutside = day.getMonth() !== viewMonth.getMonth();
            const isInRange = Boolean(rangeStart) && key > rangeStart && key < rangeEnd;
            const className = [
              styles.day,
              isOutside && styles.dayOutside,
              isInRange && styles.dayInRange,
              isToday && styles.dayToday,
              isSelected && styles.daySelected,
            ].filter(Boolean).join(' ');
            return (
              <button
                key={key}
                type="button"
                className={className}
                disabled={min ? key < min : false}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                aria-label={`${isToday ? '今天，' : ''}${day.getMonth() + 1}月${day.getDate()}日 ${weekdayLabel(day)}`}
                onClick={() => selectKey(key)}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {onClear && value && (
        <div className={styles.panelFooter}>
          <button type="button" className={styles.dangerButton} onClick={onClear}>
            <CloseIcon size={16} />清除日期
          </button>
        </div>
      )}
    </>
  );
}
