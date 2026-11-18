'use client';

import type { ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/shared/Icons';
import styles from './Pickers.module.css';

interface PickerTriggerProps {
  label: string;
  icon: ReactNode;
  /** 已選取的值；空值時顯示 placeholder */
  value: ReactNode;
  placeholder?: string;
  /** 值右側的輔助標籤，例如「今天」 */
  badge?: string | null;
  isOpen: boolean;
  panelId: string;
  disabled?: boolean;
  /**
   * 精簡尺寸：單行、46px 高，和一般輸入框等高，用在欄位密集的表單（薪資記錄）。
   * 精簡時標籤預設只給螢幕閱讀器，外層欄位標籤已經寫了；inlineLabel 用於「上班／下班」這類需要看得到的短標籤。
   */
  compact?: boolean;
  inlineLabel?: boolean;
  onClick: () => void;
}

/**
 * 日期、時間選擇器共用的觸發按鈕。
 * 為什麼不用原生 input：原生 date／time 在 iOS、Android、桌面長得完全不同，字級與大地色系無法統一，
 * 手機上還常常小到難以點擊；改成按鈕＋行內面板後，外觀與 58px 觸控高度都由我們掌控。
 */
export default function PickerTrigger({
  label,
  icon,
  value,
  placeholder = '未設定',
  badge,
  isOpen,
  panelId,
  disabled,
  compact,
  inlineLabel,
  onClick,
}: PickerTriggerProps) {
  const isEmpty = value === '' || value === null || value === undefined;
  const labelClass = compact ? (inlineLabel ? styles.triggerLabelInline : styles.srOnly) : styles.triggerLabel;

  return (
    <button
      type="button"
      className={`${styles.trigger} ${compact ? styles.triggerCompact : ''} ${isOpen ? styles.triggerOpen : ''}`}
      aria-expanded={isOpen}
      aria-controls={panelId}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={styles.triggerIcon} aria-hidden="true">{icon}</span>
      <span className={styles.triggerText}>
        <span className={labelClass}>{label}</span>
        <span className={`${styles.triggerValue} ${isEmpty ? styles.triggerPlaceholder : ''}`}>
          {isEmpty ? placeholder : value}
        </span>
      </span>
      {badge && <span className={styles.badge}>{badge}</span>}
      <ChevronDownIcon size={compact ? 16 : 18} className={styles.triggerChevron} />
    </button>
  );
}
