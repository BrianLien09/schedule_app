'use client';

import type { ReactNode } from 'react';
import styles from './EditorForm.module.css';

interface EditorFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

/** 標籤 + 控制項 + 說明文字的標準欄位，讓所有新增卡片的欄位節奏一致。 */
export function EditorField({ label, htmlFor, required, hint, children }: EditorFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {children}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

/** 兩欄並排；極窄螢幕由 CSS 自動改為單欄。 */
export function EditorRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface EditorSegmentedProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  /** compact 用於標題列等空間有限的位置 */
  size?: 'default' | 'compact';
}

/** 2~3 個選項的單選分段控制；選項少時比下拉選單更快、也一眼看得出目前選擇。 */
export function EditorSegmented<T extends string>({ value, options, onChange, ariaLabel, size = 'default' }: EditorSegmentedProps<T>) {
  return (
    <div className={`${styles.segmented} ${size === 'compact' ? styles.segmentedCompact : ''}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          className={`${styles.segment} ${value === option.value ? styles.segmentActive : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface EditorToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

/** 整張卡片可點擊的開關。 */
export function EditorToggle({ checked, disabled, onChange, label, hint }: EditorToggleProps) {
  return (
    <label className={`${styles.toggle} ${checked ? styles.toggleChecked : ''} ${disabled ? styles.toggleDisabled : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className={styles.toggleText}>
        {label}
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
    </label>
  );
}
