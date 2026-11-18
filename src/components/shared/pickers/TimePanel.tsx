'use client';

import { ChevronRightIcon, CloseIcon } from '@/components/shared/Icons';
import { minutesToTime, timeToMinutes } from '@/utils/pickerDateTime';
import TimeWheel from './TimeWheel';
import styles from './Pickers.module.css';

// 滾輪適合大範圍移動，小幅前後挪用按鈕更快；打工常見的半小時單位放在最前面
const NUDGES = [
  { label: '-30 分', minutes: -30 },
  { label: '-5 分', minutes: -5 },
  { label: '+5 分', minutes: 5 },
  { label: '+30 分', minutes: 30 },
] as const;

interface TimePanelProps {
  /** 螢幕閱讀器用的欄位名稱，例如「開始時間」 */
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  /** 空值時按「設定」帶入的起點；選填欄位不能一打開就被自動填值 */
  defaultValue: string;
  showNow?: boolean;
  /** 選填時間才提供清除 */
  onClear?: () => void;
  /** 「設定結束 →」這類下一步，省去收合後再點另一個欄位 */
  nextAction?: { label: string; onClick: () => void };
  onDone: () => void;
}

function nowString(): string {
  const now = new Date();
  return minutesToTime(now.getHours() * 60 + now.getMinutes());
}

/** 時間面板內容：快捷微調＋滾輪＋完成列。開始／結束、班表／代辦都共用這一份。 */
export default function TimePanel({ ariaLabel, value, onChange, defaultValue, showNow, onClear, nextAction, onDone }: TimePanelProps) {
  const minutes = timeToMinutes(value);

  return (
    <>
      <div className={styles.chipRow}>
        {showNow && (
          <button type="button" className={styles.chip} onClick={() => onChange(nowString())}>現在</button>
        )}
        {minutes !== null && NUDGES.map((nudge) => (
          <button
            key={nudge.label}
            type="button"
            className={styles.chip}
            aria-label={`${ariaLabel}${nudge.label}`}
            onClick={() => onChange(minutesToTime(minutes + nudge.minutes))}
          >
            {nudge.label}
          </button>
        ))}
      </div>

      {/* key 綁定是否有值：從空值切到有值時重建滾輪，直接定位到預設時間而不是從 00:00 捲過去 */}
      {minutes !== null ? (
        <TimeWheel key="wheel" ariaLabel={ariaLabel} value={value} onChange={onChange} />
      ) : (
        <div key="empty" className={styles.emptyState}>
          <span>尚未設定{ariaLabel}</span>
          <button type="button" className={styles.secondaryButton} onClick={() => onChange(defaultValue)}>
            設定{ariaLabel}
          </button>
        </div>
      )}

      <div className={styles.panelFooter}>
        {onClear && value ? (
          <button type="button" className={styles.dangerButton} onClick={onClear}>
            <CloseIcon size={16} />清除
          </button>
        ) : nextAction && value ? (
          <button type="button" className={styles.ghostButton} onClick={nextAction.onClick}>
            {nextAction.label}<ChevronRightIcon size={16} />
          </button>
        ) : <span />}
        <button type="button" className={styles.doneButton} onClick={onDone}>完成</button>
      </div>
    </>
  );
}
