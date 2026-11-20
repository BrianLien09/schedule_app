'use client';

import { useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon, CloseIcon } from '@/components/shared/Icons';
import { useRevealOnOpen } from '@/hooks/useRevealOnOpen';
import styles from './Pickers.module.css';

/** CSS 自訂屬性不在 CSSProperties 內，交集型別讓每張卡片能帶自己的主題色又不必用 any */
type AccentStyle = CSSProperties & Record<'--option-accent' | '--option-tint', string>;

export interface OptionCardItem<T extends string> {
  value: T;
  title: string;
  meta?: string;
  /** 十六進位色碼；未提供時沿用主色 */
  accent?: string;
  icon?: ReactNode;
}

/** #rrggbb 轉成帶透明度的 rgba，選取底色才會和卡片主題色同色系 */
function tintOf(hex: string, alpha: number): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return `rgba(184, 126, 107, ${alpha})`;
  return `rgba(${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)}, ${alpha})`;
}

function accentStyle(accent: string | undefined): AccentStyle | undefined {
  if (!accent) return undefined;
  return { '--option-accent': accent, '--option-tint': tintOf(accent, 0.08) };
}

interface OptionCardGroupProps<T extends string> {
  ariaLabel: string;
  options: OptionCardItem<T>[];
  value: T | '';
  onChange: (value: T) => void;
  /** 放在最後、與卡片同尺寸的額外操作，例如「自訂班別」 */
  trailing?: ReactNode;
  disabled?: boolean;
  /** 提供時再點一次已選的卡片就會取消選取；「套用範本」這類可有可無的選擇才需要 */
  onDeselect?: () => void;
  /** 精簡膠囊：單行顯示名稱與說明，選項多時只佔一兩列，適合欄位密集的表單 */
  compact?: boolean;
}

/**
 * 卡片式單選：適合「選了會帶入其他欄位」的分類（班別範本、課程）。
 * 為什麼不用下拉選單：下拉只能看到名稱，卡片能同時顯示時間與時薪，選之前就知道會帶入什麼；
 * 手機上也不必跳出系統選單再捲動尋找。
 */
export function OptionCardGroup<T extends string>({ ariaLabel, options, value, onChange, trailing, disabled, onDeselect, compact }: OptionCardGroupProps<T>) {
  return (
    <div className={compact ? styles.optionChips : styles.optionGrid} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            title={isSelected && onDeselect ? '再點一次取消' : undefined}
            className={`${styles.optionCard} ${compact ? styles.optionCardCompact : ''} ${isSelected ? styles.optionCardActive : ''}`}
            style={accentStyle(option.accent)}
            onClick={() => (isSelected && onDeselect ? onDeselect() : onChange(option.value))}
          >
            {option.icon && <span className={styles.optionDot} aria-hidden="true">{option.icon}</span>}
            <span className={styles.optionText}>
              <span className={styles.optionTitle}>{option.title}</span>
              {option.meta && <span className={styles.optionMeta}>{option.meta}</span>}
            </span>
            {/* 可取消時改用 ×，讓使用者知道再點一次就能退回手動填寫；不可取消的維持打勾 */}
            {isSelected && (onDeselect && compact ? (
              <span className={styles.optionClear} aria-hidden="true"><CloseIcon size={13} /></span>
            ) : (
              <span className={styles.optionCheck} aria-hidden="true"><CheckIcon size={13} /></span>
            ))}
          </button>
        );
      })}
      {trailing}
    </div>
  );
}

interface OptionSelectProps<T extends string> {
  ariaLabel: string;
  options: OptionCardItem<T>[];
  value: T | '';
  onChange: (value: T) => void;
  placeholder: string;
  /** 未選取時觸發按鈕顯示的圖示 */
  icon: ReactNode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** 清單最後的額外操作，例如「自訂班別」；點了會一併收合 */
  trailingAction?: { label: string; icon: ReactNode; onClick: () => void };
  disabled?: boolean;
}

/**
 * 下拉式單選：與 OptionCardGroup 同一份資料，收合時只佔一列。
 * 為什麼另做一個：手機上卡片一張佔滿一整列，五個班別就把日期、時間擠到第二屏；
 * 收成觸發按鈕後仍顯示已選項的時間與時薪，展開清單也保留每一項的說明，不必退回只看得到名稱的原生 select。
 * 面板採行內展開（和 DatePicker 一樣），避免浮層被彈窗的捲動區裁切。
 */
export function OptionSelect<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  placeholder,
  icon,
  isOpen,
  onOpenChange,
  trailingAction,
  disabled,
}: OptionSelectProps<T>) {
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  useRevealOnOpen(panelRef, isOpen);

  return (
    <div>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        style={accentStyle(selected?.accent)}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => onOpenChange(!isOpen)}
      >
        <span className={`${styles.triggerIcon} ${selected ? styles.selectTriggerIconSelected : ''}`} aria-hidden="true">
          {selected?.icon ?? icon}
        </span>
        <span className={styles.triggerText}>
          <span className={`${styles.triggerValue} ${selected ? '' : styles.triggerPlaceholder}`}>
            {selected ? selected.title : placeholder}
          </span>
          {selected?.meta && <span className={styles.selectTriggerMeta}>{selected.meta}</span>}
        </span>
        <ChevronDownIcon size={18} className={`${styles.triggerChevron} ${styles.selectChevron}`} />
      </button>
      {isOpen && (
        <div id={panelId} ref={panelRef} className={`${styles.panel} ${styles.selectPanel}`} role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.selectRow} ${isSelected ? styles.selectRowActive : ''}`}
                style={accentStyle(option.accent)}
                onClick={() => {
                  onChange(option.value);
                  onOpenChange(false);
                }}
              >
                {option.icon && <span className={styles.optionDot} aria-hidden="true">{option.icon}</span>}
                <span className={styles.optionText}>
                  <span className={styles.optionTitle}>{option.title}</span>
                  {option.meta && <span className={styles.optionMeta}>{option.meta}</span>}
                </span>
                {isSelected && <CheckIcon size={16} className={styles.selectRowCheck} />}
              </button>
            );
          })}
          {trailingAction && (
            <button
              type="button"
              className={`${styles.selectRow} ${styles.selectRowAdd}`}
              onClick={() => {
                trailingAction.onClick();
                onOpenChange(false);
              }}
            >
              {trailingAction.icon}{trailingAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface OptionAddCardProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

/** 與選項卡片同尺寸的新增入口，排在最後一格不會打亂格線 */
export function OptionAddCard({ label, icon, onClick, disabled }: OptionAddCardProps) {
  return (
    <button type="button" className={`${styles.optionCard} ${styles.optionAdd}`} disabled={disabled} onClick={onClick}>
      {icon}{label}
    </button>
  );
}

export interface PillItem<T extends string> {
  value: T;
  label: string;
  meta?: string;
}

interface PillGroupProps<T extends string> {
  ariaLabel: string;
  options: PillItem<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** 和 46px 輸入框等高並維持單行，放進格線表單時才不會比旁邊欄位高一截 */
  compact?: boolean;
}

/** 膠囊單選：選項文字短（職稱）時比卡片省空間，寬度隨文字收縮。 */
export function PillGroup<T extends string>({ ariaLabel, options, value, onChange, disabled, compact }: PillGroupProps<T>) {
  return (
    <div className={`${styles.pillGroup} ${compact ? styles.pillGroupCompact : ''}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          disabled={disabled}
          className={`${styles.pill} ${option.value === value ? styles.pillActive : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.meta && <span className={styles.pillMeta}>{option.meta}</span>}
        </button>
      ))}
    </div>
  );
}
