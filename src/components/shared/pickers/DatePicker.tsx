'use client';

import { useId, useRef } from 'react';
import { CalendarIcon } from '@/components/shared/Icons';
import { useDismissOnOutside } from '@/hooks/useDismissOnOutside';
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
  /**
   * 精簡模式：觸發按鈕縮成單行，月曆在桌面改為浮在欄位下方，不把整張表單往下推。
   * 只給頁面上的表單使用；彈窗內仍用行內展開，避免浮層被彈窗的捲動區裁切。
   */
  compact?: boolean;
}

/** 單一日期欄位：觸發按鈕＋行內月曆。選完即收合，日期是單一值，少按一次「完成」在手機上更順手。 */
export default function DatePicker({ label, value, onChange, isOpen, onOpenChange, disabled, compact }: DatePickerProps) {
  const panelId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  useRevealOnOpen(panelRef, isOpen);
  useDismissOnOutside(anchorRef, Boolean(compact) && isOpen, () => onOpenChange(false));

  return (
    <div ref={anchorRef} className={compact ? styles.floatAnchor : undefined}>
      <PickerTrigger
        label={label}
        icon={<CalendarIcon size={compact ? 16 : 18} />}
        value={formatDateLabel(value, today)}
        placeholder="選擇日期"
        badge={relativeDayLabel(value, today)}
        isOpen={isOpen}
        panelId={panelId}
        disabled={disabled}
        compact={compact}
        onClick={() => onOpenChange(!isOpen)}
      />
      {isOpen && (
        <div id={panelId} ref={panelRef} className={`${styles.panel} ${compact ? styles.panelFloating : ''}`}>
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
