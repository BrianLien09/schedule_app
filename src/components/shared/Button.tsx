import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** 儲存中等非同步狀態：顯示轉圈並自動停用，避免重複送出 */
  loading?: boolean;
  children: ReactNode;
}

/**
 * 統一按鈕
 *
 * 取代各 module.css 重複定義的 .btnSave / .btnCancel / .btnDelete，
 * 讓顏色、按壓回饋、loading 與 focus 樣式只維護一份。
 */
export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${styles.button} ${styles[variant]} ${className ?? ''}`}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
