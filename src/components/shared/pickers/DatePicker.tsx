'use client';

import { useId, useRef } from 'react';
import { CalendarIcon } from '@/components/shared/Icons';
import { useRevealOnOpen } from '@/hooks/useRevealOnOpen';
import { formatDateLabel, relativeDayLabel } from '@/utils/pickerDateTime';
import CalendarPanel from './CalendarPanel';
import PickerTrigger from './PickerTrigger';
import styles from './Pickers.module.css';

interface DatePickerProps {
  label: string;
  /** YYYY-MM-DD */
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  disabled?: boolean;
}

/** 單一日期欄位：觸發按鈕＋行內月曆。選完即收合，日期是單一值，少按一次「完成」在手機上更順手。 */
export default function DatePicker({ label, value, onChange, isOpen, onOpenChange, disabled }: DatePickerProps) {
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  useRevealOnOpen(panelRef, isOpen);

  return (
    <div>
      <PickerTrigger
        label={label}
        icon={<CalendarIcon size={18} />}
        value={formatDateLabel(value, today)}
        placeholder="選擇日期"
        badge={relativeDayLabel(value, today)}
        isOpen={isOpen}
        panelId={panelId}
        disabled={disabled}
        onClick={() => onOpenChange(!isOpen)}
      />
      {isOpen && (
        <div id={panelId} ref={panelRef} className={styles.panel}>
          <CalendarPanel
            value={value}
            today={today}
            onSelect={(next) => {
              onChange(next);
              onOpenChange(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
