'use client';

import { useId, useRef } from 'react';
import { ClockIcon } from '@/components/shared/Icons';
import { useRevealOnOpen } from '@/hooks/useRevealOnOpen';
import { durationLabel, minutesToTime, periodLabel, timeToMinutes } from '@/utils/pickerDateTime';
import PickerTrigger from './PickerTrigger';
import TimePanel from './TimePanel';
import styles from './Pickers.module.css';

export type TimeField = 'start' | 'end';

export interface DurationPreset {
  label: string;
  minutes: number;
}

// 一般行程的常見長度；打工班表會由呼叫端傳入較長的預設
const DEFAULT_DURATIONS: DurationPreset[] = [
  { label: '30 分', minutes: 30 },
  { label: '1 小時', minutes: 60 },
  { label: '2 小時', minutes: 120 },
  { label: '3 小時', minutes: 180 },
];

interface TimeRangePickerProps {
  /** 群組名稱，供螢幕閱讀器辨識是哪一組時間 */
  ariaLabel: string;
  startTime: string;
  endTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  activeField: TimeField | null;
  onActiveFieldChange: (field: TimeField | null) => void;
  startLabel?: string;
  endLabel?: string;
  durations?: DurationPreset[];
  /** 打工班表不允許跨夜；代辦這類行程才需要 */
  allowOvernight?: boolean;
  disabled?: boolean;
}

/** 時間數字後面接時段文字，而不是另佔一欄，手機並排兩個觸發按鈕時才放得下 */
export function renderTimeValue(value: string) {
  if (!value) return '';
  const period = periodLabel(value);
  return <>{value}{period && <span className={styles.triggerPeriod}>{period}</span>}</>;
}

/**
 * 開始／結束時間選擇器：兩個觸發按鈕並排，點哪個就在下方全寬面板編輯哪個。
 * 時長快捷常駐在觸發按鈕下方：結束時間＝開始＋時長，多數情況不必打開面板就能一鍵設好。
 */
export default function TimeRangePicker({
  ariaLabel,
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  activeField,
  onActiveFieldChange,
  startLabel = '開始時間',
  endLabel = '結束時間',
  durations = DEFAULT_DURATIONS,
  allowOvernight = false,
  disabled,
}: TimeRangePickerProps) {
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useRevealOnOpen(panelRef, activeField !== null);
  const startMinutes = timeToMinutes(startTime);
  const isEditingEnd = activeField === 'end';
  const duration = durationLabel(startTime, endTime, allowOvernight);
  const toggle = (field: TimeField): void => onActiveFieldChange(activeField === field ? null : field);

  return (
    <div role="group" aria-label={ariaLabel}>
      <div className={styles.pairGrid}>
        <PickerTrigger
          label={startLabel}
          icon={<ClockIcon size={18} />}
          value={renderTimeValue(startTime)}
          isOpen={activeField === 'start'}
          panelId={panelId}
          disabled={disabled}
          onClick={() => toggle('start')}
        />
        <PickerTrigger
          label={endLabel}
          icon={<ClockIcon size={18} />}
          value={renderTimeValue(endTime)}
          isOpen={isEditingEnd}
          panelId={panelId}
          disabled={disabled}
          onClick={() => toggle('end')}
        />
      </div>

      {startMinutes !== null && (
        <div className={`${styles.chipRow} ${styles.durationRow}`} role="group" aria-label="快速設定時長">
          <span className={styles.chipRowLabel}>時長</span>
          {durations.map((preset) => {
            const value = minutesToTime(startMinutes + preset.minutes);
            // 不允許跨夜時，會超過午夜的時長直接不提供，避免一鍵就產生無效班表
            if (!allowOvernight && startMinutes + preset.minutes >= 1440) return null;
            return (
              <button
                key={preset.label}
                type="button"
                disabled={disabled}
                aria-pressed={endTime === value}
                aria-label={`結束時間設為開始後 ${preset.label}`}
                className={`${styles.chip} ${endTime === value ? styles.chipActive : ''}`}
                onClick={() => onEndChange(value)}
              >
                {preset.label}
              </button>
            );
          })}
          {duration && <span className={styles.chipRowNote}>{duration}</span>}
        </div>
      )}

      {activeField && (
        <div id={panelId} ref={panelRef} className={styles.panel}>
          {/* key 綁欄位：切換開始／結束時重建滾輪，直接定位到新欄位的值 */}
          <TimePanel
            key={activeField}
            ariaLabel={isEditingEnd ? endLabel : startLabel}
            value={isEditingEnd ? endTime : startTime}
            onChange={isEditingEnd ? onEndChange : onStartChange}
            defaultValue={isEditingEnd ? minutesToTime((startMinutes ?? 540) + 60) : '09:00'}
            showNow={!isEditingEnd}
            nextAction={isEditingEnd ? undefined : { label: '設定結束', onClick: () => onActiveFieldChange('end') }}
            onDone={() => onActiveFieldChange(null)}
          />
        </div>
      )}
    </div>
  );
}
