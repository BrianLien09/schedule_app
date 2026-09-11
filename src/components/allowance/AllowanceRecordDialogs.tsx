'use client';

import type { Dispatch, SetStateAction } from 'react';
import { type AllowanceRecord } from '@/data/allowance';
import styles from './AllowanceManager.module.css';

type AllowanceDraft = Omit<AllowanceRecord, 'id' | 'timestamp'>;

interface AllowanceRecordDialogsProps {
  showEditModal: boolean;
  showAddModal: boolean;
  editingRecord: AllowanceRecord | null;
  currentRecord: AllowanceDraft;
  sourceTypes: string[];
  submittingAction: 'add' | 'edit' | null;
  editingKongBalance: number;
  shouldShowKongBalance: boolean;
  kongBalance: number;
  onCloseEdit: () => void;
  onCloseAdd: () => void;
  onSaveEdit: () => void;
  onAdd: () => void;
  onAmountChange: (amount: number) => void;
  onSourceTypeChange: (sourceType: string) => void;
  setEditingRecord: Dispatch<SetStateAction<AllowanceRecord | null>>;
  setCurrentRecord: Dispatch<SetStateAction<AllowanceDraft>>;
}

/** 集中管理新增與編輯生活費記錄的彈窗，避免主元件混合表單與列表呈現。 */
export default function AllowanceRecordDialogs({
  showEditModal,
  showAddModal,
  editingRecord,
  currentRecord,
  sourceTypes,
  submittingAction,
  editingKongBalance,
  shouldShowKongBalance,
  kongBalance,
  onCloseEdit,
  onCloseAdd,
  onSaveEdit,
  onAdd,
  onAmountChange,
  onSourceTypeChange,
  setEditingRecord,
  setCurrentRecord,
}: AllowanceRecordDialogsProps) {
  return (
    <>
      {showEditModal && editingRecord && (
        <div className={styles.modalOverlay} onClick={onCloseEdit}>
          <div className={`glass ${styles.modal}`} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>編輯記錄</h2>
              <button className={styles.closeButton} onClick={onCloseEdit}>
                ✕
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>匯入日期 *</label>
                <input
                  type="date"
                  className={styles.input}
                  value={editingRecord.date}
                  onChange={(event) =>
                    setEditingRecord({ ...editingRecord, date: event.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>匯入金額 (元) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={editingRecord.amount}
                  onChange={(event) =>
                    setEditingRecord({ ...editingRecord, amount: Number(event.target.value) })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>帳簿餘額 (元) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={editingRecord.totalBalance}
                  onChange={(event) =>
                    setEditingRecord({
                      ...editingRecord,
                      totalBalance: Number(event.target.value),
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>小呆餘額 (元) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={editingRecord.xiaoBalance}
                  onChange={(event) =>
                    setEditingRecord({
                      ...editingRecord,
                      xiaoBalance: Number(event.target.value),
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>孔呆餘額 (元)</label>
                <input
                  type="text"
                  className={`${styles.input} ${styles.readOnlyField}`}
                  value={editingKongBalance.toLocaleString()}
                  readOnly
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>來源類型 *</label>
                <select
                  className={styles.select}
                  value={editingRecord.sourceType}
                  onChange={(event) =>
                    setEditingRecord({ ...editingRecord, sourceType: event.target.value })
                  }
                >
                  {sourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>備註</label>
              <textarea
                className={styles.textarea}
                value={editingRecord.note || ''}
                onChange={(event) =>
                  setEditingRecord({ ...editingRecord, note: event.target.value })
                }
              />
            </div>

            <div className={styles.formActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={onCloseEdit}
                disabled={submittingAction === 'edit'}
              >
                取消
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={onSaveEdit}
                disabled={submittingAction === 'edit'}
              >
                {submittingAction === 'edit' ? '儲存中...' : '儲存變更'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={onCloseAdd}>
          <div className={`glass ${styles.modal}`} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>新增記錄</h2>
              <button className={styles.closeButton} onClick={onCloseAdd}>
                ✕
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>匯入日期 *</label>
                <input
                  type="date"
                  className={styles.input}
                  value={currentRecord.date}
                  onChange={(event) =>
                    setCurrentRecord({ ...currentRecord, date: event.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>匯入金額 (元) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={currentRecord.amount || ''}
                  onChange={(event) => onAmountChange(Number(event.target.value))}
                  placeholder="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>帳簿餘額 (元) *</label>
                <input
                  type="number"
                  className={styles.input}
                  value={currentRecord.totalBalance || ''}
                  onChange={(event) =>
                    setCurrentRecord({
                      ...currentRecord,
                      totalBalance: Number(event.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  小呆餘額 (元) *{' '}
                  {!shouldShowKongBalance && <span className={styles.autoCalcHint}>（自動計算）</span>}
                </label>
                <input
                  type="number"
                  className={`${styles.input} ${!shouldShowKongBalance ? styles.readOnlyField : ''}`}
                  value={currentRecord.xiaoBalance || ''}
                  onChange={(event) =>
                    setCurrentRecord({
                      ...currentRecord,
                      xiaoBalance: Number(event.target.value),
                    })
                  }
                  disabled={!shouldShowKongBalance}
                  readOnly={!shouldShowKongBalance}
                  placeholder="0"
                />
              </div>

              {shouldShowKongBalance && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>孔呆餘額 (元)</label>
                  <input
                    type="text"
                    className={`${styles.input} ${styles.readOnlyField}`}
                    value={kongBalance.toLocaleString()}
                    readOnly
                    disabled
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>來源類型 *</label>
                <select
                  className={styles.select}
                  value={currentRecord.sourceType}
                  onChange={(event) => onSourceTypeChange(event.target.value)}
                >
                  {sourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              className={styles.formGroup}
              style={{ gridColumn: '1 / -1', marginTop: 'var(--spacing-md)' }}
            >
              <label className={styles.label}>備註</label>
              <textarea
                className={styles.textarea}
                value={currentRecord.note || ''}
                onChange={(event) =>
                  setCurrentRecord({ ...currentRecord, note: event.target.value })
                }
                placeholder="選填"
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={onCloseAdd}
                disabled={submittingAction === 'add'}
              >
                取消
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={onAdd}
                disabled={submittingAction === 'add'}
              >
                {submittingAction === 'add' ? '新增中...' : '確認新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
