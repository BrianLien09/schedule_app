'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/shared/Icons';
import { monthKeyOf, shiftMonthKey } from '@/utils/pickerDateTime';
import styles from './MonthStepper.module.css';

interface MonthStepperProps {
  /** YYYY-MM；空字串代表「全部月份」 */
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
}

/**
 * 月份切換器：左右箭頭逐月切換，中間顯示「2026 年 11 月」。
 * 為什麼取代原生 month input：Safari 與 Firefox 桌面版不支援 type="month"，會退化成純文字框；
 * 薪資、匯入這類情境幾乎都是「看上個月／下個月」，箭頭比展開選單少很多步。
 */
export default function MonthStepper({ value, onChange, ariaLabel, disabled }: MonthStepperProps) {
  const currentMonth = monthKeyOf(new Date());
  const base = value || currentMonth;
  const [year, month] = base.split('-').map(Number);

  return (
    <div className={styles.stepper} role="group" aria-label={ariaLabel}>
      <button type="button" className={styles.arrow} aria-label="上個月" disabled={disabled} onClick={() => onChange(shiftMonthKey(base, -1))}>
        <ChevronLeftIcon size={18} />
      </button>
      <span className={styles.label} aria-live="polite">
        {value ? <>{year} 年 <strong>{month}</strong> 月</> : '全部月份'}
      </span>
      <button type="button" className={styles.arrow} aria-label="下個月" disabled={disabled} onClick={() => onChange(shiftMonthKey(base, 1))}>
        <ChevronRightIcon size={18} />
      </button>
      {value !== currentMonth && (
        <button type="button" className={styles.today} disabled={disabled} onClick={() => onChange(currentMonth)}>
          本月
        </button>
      )}
    </div>
  );
}
