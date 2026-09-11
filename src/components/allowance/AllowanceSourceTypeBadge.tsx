'use client';

import styles from './AllowanceManager.module.css';

const sourceTypeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  '生活費匯款': { icon: '🎓', color: 'var(--color-primary)', bgColor: 'rgba(184, 126, 107, 0.15)' },
  '打工收入': { icon: '💼', color: 'var(--color-secondary)', bgColor: 'rgba(95, 113, 134, 0.15)' },
  '獎學金': { icon: '🏆', color: 'var(--color-highlight)', bgColor: 'rgba(217, 119, 6, 0.15)' },
  '退費': { icon: '💸', color: 'var(--muted)', bgColor: 'rgba(220, 208, 194, 0.3)' },
  '其他': { icon: '📦', color: 'var(--muted-dark)', bgColor: 'rgba(220, 208, 194, 0.3)' },
};

interface AllowanceSourceTypeBadgeProps {
  type: string;
}

/** 以固定色票呈現生活費來源，讓記錄卡片維持一致的辨識方式。 */
export default function AllowanceSourceTypeBadge({
  type,
}: AllowanceSourceTypeBadgeProps) {
  const config = sourceTypeConfig[type] || sourceTypeConfig['其他'];

  return (
    <div
      className={styles.sourceBadge}
      style={{
        borderColor: config.color,
        color: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      <span>{config.icon}</span>
      <span>{type}</span>
    </div>
  );
}
