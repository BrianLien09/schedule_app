import styles from './Loading.module.css';
import CapybaraLoader from './CapybaraLoader';

interface LoadingSpinnerProps {
  text?: string;
  subtext?: string;
}

/**
 * Loading Spinner Component
 * 統一的載入動畫組件 - 使用可愛的水豚動畫
 */
export function LoadingSpinner({ text = '載入中...', subtext }: LoadingSpinnerProps) {
  return (
    <div className={styles.loadingContainer}>
      <CapybaraLoader />
      <div className={styles.loadingText}>{text}</div>
      {subtext && <div className={styles.loadingSubtext}>{subtext}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * Error State Component
 * 統一的錯誤狀態組件
 */
export function ErrorState({
  title = '發生錯誤',
  message = '無法載入資料，請稍後再試。',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>⚠️</div>
      <div className={styles.errorTitle}>{title}</div>
      <div className={styles.errorMessage}>{message}</div>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          重試
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

/**
 * Empty State Component
 * 統一的空狀態組件
 */
export function EmptyState({
  icon = '📭',
  title,
  message,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className={styles.emptyContainer}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyTitle}>{title}</div>
      {message && <div className={styles.emptyMessage}>{message}</div>}
      {actionText && onAction && (
        <button className={styles.actionButton} onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
