'use client';

import { useId, useRef } from 'react';
import { CalendarIcon, ClockIcon } from '@/components/shared/Icons';
import { useRevealOnOpen } from '@/hooks/useRevealOnOpen';
import { formatDateLabel, relativeDayLabel } from '@/utils/pickerDateTime';
import CalendarPanel from './CalendarPanel';
import PickerTrigger from './PickerTrigger';
import TimePanel from './TimePanel';
import { renderTimeValue } from './TimeRangePicker';
import styles from './Pickers.module.css';

export type DateTimePart = 'date' | 'time';

interface DateTimePickerProps {
  /** 例如「開始」「結束」，會組成「開始日期」「開始時間」 */
  label: string;
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  activePart: DateTimePart | null;
  onActivePartChange: (part: DateTimePart | null) => void;
  /** 時間面板空值時按「設定」帶入的時間 */
  defaultTime: string;
  minDate?: string;
  /** 另一端的日期，用來在月曆上把起訖區間串色 */
  rangeEdge?: string;
  disabled?: boolean;
}

/**
 * 一個時間點的「日期＋時間」選擇器，兩個觸發按鈕並排、共用下方一個全寬面板。
 * 為什麼不各自展開：手機上兩欄各只剩半寬，月曆塞在半寬裡會小到點不準。
 * 代辦的日期、時間都是選填，所以兩個面板都提供清除。
 */
export default function DateTimePicker({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  activePart,
  onActivePartChange,
  defaultTime,
  minDate,
  rangeEdge,
  disabled,
}: DateTimePickerProps) {
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  useRevealOnOpen(panelRef, activePart !== null);
  const toggle = (part: DateTimePart): void => onActivePartChange(activePart === part ? null : part);

  return (
    <div>
      <div className={`${styles.pairGrid} ${styles.dateTimeGrid}`}>
        <PickerTrigger
          label={`${label}日期`}
          icon={<CalendarIcon size={18} />}
          value={formatDateLabel(date, today)}
          placeholder="不指定"
          badge={relativeDayLabel(date, today)}
          isOpen={activePart === 'date'}
          panelId={panelId}
          disabled={disabled}
          onClick={() => toggle('date')}
        />
        <PickerTrigger
          label={`${label}時間`}
          icon={<ClockIcon size={18} />}
          value={renderTimeValue(time)}
          placeholder="不指定"
          isOpen={activePart === 'time'}
          panelId={panelId}
          disabled={disabled}
          onClick={() => toggle('time')}
        />
      </div>

      {activePart && (
        <div id={panelId} ref={panelRef} className={styles.panel}>
          {activePart === 'date' ? (
            <CalendarPanel
              value={date}
              min={minDate}
              rangeEdge={rangeEdge}
              today={today}
              onSelect={(next) => {
                onDateChange(next);
                onActivePartChange(null);
              }}
              onClear={() => {
                onDateChange('');
                onActivePartChange(null);
              }}
            />
          ) : (
            <TimePanel
              ariaLabel={`${label}時間`}
              value={time}
              defaultValue={defaultTime}
              showNow
              onChange={onTimeChange}
              onClear={() => onTimeChange('')}
              onDone={() => onActivePartChange(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
