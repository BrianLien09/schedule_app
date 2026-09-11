'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { SalaryRecord } from '@/hooks/useSalaryData';
import { getWorkRoleLabel, type RoleType, type WorkRole } from '@/data/workRoles';
import Modal, { ModalContent } from '@/components/shared/Modal';
import styles from './SalaryRecordList.module.css';

export interface SalaryBatchEditData {
  role: '' | RoleType;
  startTime: string;
  endTime: string;
  workHours: string;
  shiftCategory: string;
}

interface SalaryRecordDialogsProps {
  showEditModal: boolean;
  editingRecord: SalaryRecord | null;
  editingWorkHours: string;
  roles: WorkRole[];
  onEditWorkHoursChange: (value: string) => void;
  onEditStartTimeChange: (value: string) => void;
  onEditEndTimeChange: (value: string) => void;
  onSaveEdit: () => Promise<boolean>;
  isSavingEdit: boolean;
  onCancelEdit: () => void;
  setEditingRecord: Dispatch<SetStateAction<SalaryRecord | null>>;
  showBatchEditModal: boolean;
  selectedRecordCount: number;
  batchNewHourlyRate: number;
  setBatchNewHourlyRate: (value: number) => void;
  batchEditData: SalaryBatchEditData;
  setBatchEditData: Dispatch<SetStateAction<SalaryBatchEditData>>;
  shiftCategoryOptions: string[];
  onBatchEditHourlyRate: () => void;
  isSavingBatchEdit: boolean;
  onCancelBatchEdit: () => void;
}

/** 集中管理薪資單筆與批次編輯彈窗，讓清單元件只負責列表呈現。 */
export default function SalaryRecordDialogs({
  showEditModal,
  editingRecord,
  editingWorkHours,
  roles,
  onEditWorkHoursChange,
  onEditStartTimeChange,
  onEditEndTimeChange,
  onSaveEdit,
  isSavingEdit,
  onCancelEdit,
  setEditingRecord,
  showBatchEditModal,
  selectedRecordCount,
  batchNewHourlyRate,
  setBatchNewHourlyRate,
  batchEditData,
  setBatchEditData,
  shiftCategoryOptions,
  onBatchEditHourlyRate,
  isSavingBatchEdit,
  onCancelBatchEdit,
}: SalaryRecordDialogsProps) {
  return (
    <>
      {showEditModal && editingRecord && (
        <Modal isOpen={showEditModal} onClose={onCancelEdit} title="編輯工作記錄" maxWidth="560px">
          <ModalContent render={(requestClose) => (
            <form
              className={styles.recordEditForm}
              onSubmit={(event) => {
                event.preventDefault();
                void onSaveEdit().then((didSave) => {
                  if (didSave) requestClose();
                });
              }}
            >
              <div className={styles.recordEditRow}>
                <div className={styles.recordEditGroup}>
                  <label htmlFor="edit-record-date">日期</label>
                  <input
                    id="edit-record-date"
                    type="date"
                    value={editingRecord.date}
                    onChange={(event) =>
                      setEditingRecord({ ...editingRecord, date: event.target.value })
                    }
                  />
                </div>

                <div className={styles.recordEditGroup}>
                  <label htmlFor="edit-record-role">職稱／職位</label>
                  <select
                    id="edit-record-role"
                    value={editingRecord.role}
                    onChange={(event) => {
                      const roleId: RoleType = event.target.value;
                      const selectedRole = roles.find((role) => role.id === roleId);
                      setEditingRecord({
                        ...editingRecord,
                        role: roleId,
                        roleName: selectedRole?.name,
                        hourlyRate: selectedRole?.hourlyRate ?? editingRecord.hourlyRate,
                      });
                    }}
                  >
                    {roles.length === 0 ? (
                      <option value={editingRecord.role}>
                        {getWorkRoleLabel(editingRecord.role, roles, editingRecord.roleName)}
                      </option>
                    ) : (
                      <>
                        {!roles.some((role) => role.id === editingRecord.role) && (
                          <option value={editingRecord.role}>
                            {getWorkRoleLabel(editingRecord.role, roles, editingRecord.roleName)}（已移除）
                          </option>
                        )}
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} (NT$ {role.hourlyRate}/小時)
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className={styles.recordEditRow}>
                <div className={styles.recordEditGroup}>
                  <label htmlFor="edit-record-start-time">開始時間</label>
                  <input
                    id="edit-record-start-time"
                    type="time"
                    value={editingRecord.startTime}
                    onChange={(event) => onEditStartTimeChange(event.target.value)}
                  />
                </div>

                <div className={styles.recordEditGroup}>
                  <label htmlFor="edit-record-end-time">結束時間</label>
                  <input
                    id="edit-record-end-time"
                    type="time"
                    value={editingRecord.endTime}
                    onChange={(event) => onEditEndTimeChange(event.target.value)}
                  />
                </div>
              </div>

              <div className={styles.recordEditRow}>
                <div className={styles.recordEditGroup}>
                  <label htmlFor="edit-record-hours">工作時數</label>
                  <input
                    id="edit-record-hours"
                    type="number"
                    step="0.01"
                    value={editingWorkHours}
                    onChange={(event) => onEditWorkHoursChange(event.target.value)}
                  />
                </div>

                <div className={styles.recordEditGroup}>
                  <label htmlFor="edit-record-rate">時薪 (元)</label>
                  <input
                    id="edit-record-rate"
                    type="number"
                    value={editingRecord.hourlyRate}
                    onChange={(event) =>
                      setEditingRecord({
                        ...editingRecord,
                        hourlyRate: Number(event.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className={styles.recordEditActions}>
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={isSavingEdit}
                  className={styles.cancelEditButton}
                >
                  取消
                </button>
                <button type="submit" disabled={isSavingEdit} className={styles.saveEditButton}>
                  {isSavingEdit ? '儲存中...' : '儲存'}
                </button>
              </div>
            </form>
          )} />
        </Modal>
      )}

      {showBatchEditModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="glass"
            style={{ width: '90%', maxWidth: '500px', padding: '1.5rem', background: '#f0ece1' }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
              批次修改 ({selectedRecordCount} 筆記錄)
            </h3>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  修改時薪
                </label>
                <input
                  type="number"
                  value={batchNewHourlyRate}
                  onChange={(event) => setBatchNewHourlyRate(Number(event.target.value))}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  修改職稱／職位（選填）
                </label>
                <select
                  value={batchEditData.role}
                  onChange={(event) =>
                    setBatchEditData((previous) => ({ ...previous, role: event.target.value }))
                  }
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                  <option value="">-- 不修改 --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  修改班別 (選填)
                </label>
                <select
                  value={batchEditData.shiftCategory}
                  onChange={(event) =>
                    setBatchEditData((previous) => ({
                      ...previous,
                      shiftCategory: event.target.value,
                    }))
                  }
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                  <option value="">-- 不修改 --</option>
                  {shiftCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCancelBatchEdit}
                disabled={isSavingBatchEdit}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={onBatchEditHourlyRate}
                disabled={isSavingBatchEdit}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                {isSavingBatchEdit ? '套用中...' : '套用修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
