'use client';

import { calculateKongBalance, formatDateForCopy, type AllowanceRecord } from '@/data/allowance';
import AllowanceSourceTypeBadge from './AllowanceSourceTypeBadge';
import styles from './AllowanceManager.module.css';

interface AllowanceRecordListProps {
  displayedRecords: AllowanceRecord[];
  filterMonth: string;
  canEdit: boolean;
  isExpanded: boolean;
  hasMore: boolean;
  filteredRecordCount: number;
  isAllowanceType: (sourceType: string) => boolean;
  onCopy: (record: AllowanceRecord) => void;
  onEdit: (record: AllowanceRecord) => void;
  onDelete: (id: string) => void;
  onToggleExpanded: () => void;
}

/** 只負責生活費記錄的卡片呈現與展開收合，不承擔資料存取或表單狀態。 */
export default function AllowanceRecordList({
  displayedRecords,
  filterMonth,
  canEdit,
  isExpanded,
  hasMore,
  filteredRecordCount,
  isAllowanceType,
  onCopy,
  onEdit,
  onDelete,
  onToggleExpanded,
}: AllowanceRecordListProps) {
  if (filteredRecordCount === 0) {
    return (
      <div className="glass card page-section-enter page-section-enter-delay-3">
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📭</div>
          <div className={styles.emptyStateTitle}>尚無記錄</div>
          <div className={styles.emptyStateSubtitle}>
            {filterMonth ? '此月份沒有任何記錄' : '開始新增你的第一筆生活費記錄吧'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {displayedRecords.map((record, index) => {
        const recordKongBalance = calculateKongBalance(record.totalBalance, record.xiaoBalance);
        const recordIsAllowance = isAllowanceType(record.sourceType);

        return (
          <div
            key={record.id}
            className={`glass ${styles.recordCard}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <AllowanceSourceTypeBadge type={record.sourceType} />

            <div className={styles.recordHeader}>
              <div className={styles.recordDate}>{formatDateForCopy(record.date)}</div>
              <button
                className={styles.copyButton}
                onClick={() => onCopy(record)}
                title="複製此記錄"
              >
                📋 複製
              </button>
            </div>

            <div className={styles.amountSection}>
              <div className={styles.amountLabel}>匯入金額</div>
              <div className={styles.amountValue}>
                +{record.amount.toLocaleString()} 元
              </div>
            </div>

            <div className={styles.balanceGrid}>
              <div className={styles.balanceItem}>
                <div className={styles.balanceLabel}>帳簿餘額</div>
                <div className={styles.balanceValue}>
                  {record.totalBalance.toLocaleString()} 元
                </div>
              </div>

              <div className={styles.balanceItem}>
                <div className={styles.balanceLabel}>小呆餘額</div>
                <div className={styles.balanceValue}>
                  {record.xiaoBalance.toLocaleString()} 元
                </div>
              </div>

              {recordIsAllowance && (
                <div className={styles.balanceItem}>
                  <div className={styles.balanceLabel}>孔呆餘額</div>
                  <div className={styles.balanceValue}>
                    {recordKongBalance.toLocaleString()} 元
                  </div>
                </div>
              )}
            </div>

            {record.note && (
              <div className={styles.recordNote}>
                <strong>備註：</strong> {record.note}
              </div>
            )}

            {canEdit && (
              <div className={styles.recordActions}>
                <button className={styles.btnEdit} onClick={() => onEdit(record)}>
                  編輯
                </button>
                <button className={styles.btnDelete} onClick={() => onDelete(record.id)}>
                  刪除
                </button>
              </div>
            )}
          </div>
        );
      })}

      {hasMore && !isExpanded && (
        <button
          className={`${styles.btn} ${styles.btnSecondary} ${styles.expandButton}`}
          onClick={onToggleExpanded}
        >
          查看全部 (共 {filteredRecordCount} 筆)
        </button>
      )}

      {isExpanded && (
        <button
          className={`${styles.btn} ${styles.btnSecondary} ${styles.expandButton}`}
          onClick={onToggleExpanded}
        >
          收起記錄
        </button>
      )}
    </>
  );
}
