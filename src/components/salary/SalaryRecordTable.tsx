'use client';

import { useMemo } from 'react';
import type { SalaryRecord } from '@/hooks/useSalaryData';
import { getWorkRoleLabel, type WorkRole } from '@/data/workRoles';
import styles from './SalaryRecordList.module.css';

const WEEKDAY_SHORT_LABELS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'] as const;

interface SalaryRecordTableProps {
  filteredRecords: SalaryRecord[];
  roles: WorkRole[];
  selectedRecordIds: Set<string>;
  toggleRecordSelection: (id: string) => void;
  toggleSelectAll: () => void;
  onEditRecord: (record: SalaryRecord) => void;
  onCopyRecord: (record: SalaryRecord) => void;
  onDeleteRecord: (id: string) => void;
  getDisplayShiftName: (record: SalaryRecord) => string;
  calculatePay: (record: Omit<SalaryRecord, 'id'>) => number;
  calculateHours: (record: Omit<SalaryRecord, 'id'>) => number;
}

/** 薪資記錄的桌面表格與行動卡片，集中處理排序、合計與單筆操作呈現。 */
export default function SalaryRecordTable({
  filteredRecords,
  roles,
  selectedRecordIds,
  toggleRecordSelection,
  toggleSelectAll,
  onEditRecord,
  onCopyRecord,
  onDeleteRecord,
  getDisplayShiftName,
  calculatePay,
  calculateHours,
}: SalaryRecordTableProps) {
  const sortedRecords = useMemo(
    () => [...filteredRecords].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime);
    }),
    [filteredRecords]
  );
  const totalWorkHours = useMemo(
    () => filteredRecords.reduce((sum, record) => sum + calculateHours(record), 0),
    [filteredRecords, calculateHours]
  );
  const totalSalary = useMemo(
    () => filteredRecords.reduce((sum, record) => sum + calculatePay(record), 0),
    [filteredRecords, calculatePay]
  );

  const getWeekdayLabel = (dateStr: string): string => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '--';
    return WEEKDAY_SHORT_LABELS[date.getDay()] ?? '--';
  };

  return (
    <>
      <div className={`${styles.tableWrapper} ${styles.desktopView}`}>
        <table className={styles.desktopTable}>
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: '50px' }}>
                <input
                  type="checkbox"
                  checked={selectedRecordIds.size === filteredRecords.length && filteredRecords.length > 0}
                  onChange={toggleSelectAll}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  title="全選/取消全選"
                />
              </th>
              <th style={{ textAlign: 'left' }}>日期</th>
              <th style={{ textAlign: 'left' }}>職稱／職位</th>
              <th style={{ textAlign: 'left' }}>班別</th>
              <th style={{ textAlign: 'left' }}>時間</th>
              <th style={{ textAlign: 'center' }}>工時</th>
              <th style={{ textAlign: 'right' }}>時薪</th>
              <th style={{ textAlign: 'right' }}>薪資</th>
              <th style={{ textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record) => {
              const displayShiftName = getDisplayShiftName(record);
              const isSelected = selectedRecordIds.has(record.id);
              const roleLabel = getWorkRoleLabel(record.role, roles, record.roleName);
              const isInstructor = record.role === 'instructor';
              return (
                <tr key={record.id} className={isSelected ? styles.trSelected : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRecordSelection(record.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    {record.date} <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>({getWeekdayLabel(record.date)})</span>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'inline-block',
                      background: isInstructor ? 'rgba(200, 141, 85, 0.18)' : 'rgba(95, 113, 134, 0.18)',
                      color: isInstructor ? '#c88d55' : 'var(--color-secondary)',
                      border: isInstructor ? '1px dashed rgba(200, 141, 85, 0.4)' : '1px dashed rgba(95, 113, 134, 0.4)',
                    }}>
                      {roleLabel}
                    </span>
                  </td>
                  <td>{displayShiftName}</td>
                  <td>{record.startTime} - {record.endTime}</td>
                  <td style={{ textAlign: 'center' }}>{calculateHours(record).toFixed(2)}h</td>
                  <td style={{ textAlign: 'right' }}>${record.hourlyRate}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    ${calculatePay(record).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button type="button" onClick={() => onEditRecord(record)} style={{
                        padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(95, 113, 134, 0.4)',
                        background: 'rgba(95, 113, 134, 0.12)', color: 'var(--color-secondary)', fontSize: '0.8rem', cursor: 'pointer',
                      }}>編輯</button>
                      <button type="button" onClick={() => onCopyRecord(record)} style={{
                        padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(184, 126, 107, 0.4)',
                        background: 'rgba(184, 126, 107, 0.12)', color: 'var(--color-primary)', fontSize: '0.8rem', cursor: 'pointer',
                      }}>複製</button>
                      <button type="button" onClick={() => onDeleteRecord(record.id)} style={{
                        padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', fontSize: '0.8rem', cursor: 'pointer',
                      }}>刪除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px dashed rgba(220, 208, 194, 0.8)', background: 'rgba(220, 208, 194, 0.3)', fontWeight: 'bold' }}>
              <td colSpan={5} style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>合計 ({filteredRecords.length} 筆記錄)：</td>
              <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', color: 'var(--color-secondary)' }}>{totalWorkHours.toFixed(2)}h</td>
              <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>--</td>
              <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', color: 'var(--color-primary)', fontSize: '1.1rem' }}>${totalSalary.toLocaleString()}</td>
              <td style={{ padding: '0.85rem 0.75rem' }}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className={styles.mobileView}>
        {sortedRecords.map((record) => {
          const displayShiftName = getDisplayShiftName(record);
          const isSelected = selectedRecordIds.has(record.id);
          const roleLabel = getWorkRoleLabel(record.role, roles, record.roleName);
          const isInstructor = record.role === 'instructor';
          const pay = calculatePay(record);
          const hours = calculateHours(record);
          return (
            <div key={record.id} className={`${styles.mobileCard} ${isSelected ? styles.mobileCardSelected : ''}`}>
              <div className={styles.mobileCardTop}>
                <div className={styles.dateBlock}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleRecordSelection(record.id)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <span className={styles.dateText}>{record.date}</span>
                  <span className={styles.weekdayBadge}>({getWeekdayLabel(record.date)})</span>
                </div>
                <span className={styles.roleBadge} style={{
                  background: isInstructor ? 'rgba(200, 141, 85, 0.18)' : 'rgba(95, 113, 134, 0.18)',
                  color: isInstructor ? '#c88d55' : 'var(--color-secondary)',
                  border: isInstructor ? '1px dashed rgba(200, 141, 85, 0.4)' : '1px dashed rgba(95, 113, 134, 0.4)',
                }}>
                  {roleLabel} NT$ {record.hourlyRate}/小時
                </span>
              </div>
              <div className={styles.mobileCardBody}>
                <div className={styles.categoryTag}>{displayShiftName}</div>
                <div className={styles.timeInfo}>
                  <span>⏰ {record.startTime} - {record.endTime}</span>
                  <span className={styles.hoursText}>{hours.toFixed(2)}h</span>
                </div>
              </div>
              <div className={styles.mobileCardFooter}>
                <span className={styles.payText}>${pay.toLocaleString()}</span>
                <div className={styles.actionGroup}>
                  <button type="button" className={`${styles.cardActionBtn} ${styles.editActionBtn}`} onClick={() => onEditRecord(record)}>編輯</button>
                  <button type="button" className={`${styles.cardActionBtn} ${styles.copyActionBtn}`} onClick={() => onCopyRecord(record)}>複製</button>
                  <button type="button" className={`${styles.cardActionBtn} ${styles.deleteActionBtn}`} onClick={() => onDeleteRecord(record.id)}>刪除</button>
                </div>
              </div>
            </div>
          );
        })}
        <div className={styles.mobileTotalCard}>
          <span>合計 ({filteredRecords.length} 筆記錄)</span>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-secondary)' }}>{totalWorkHours.toFixed(2)}h</span>
            <span style={{ color: 'var(--color-primary)', fontSize: '1.15rem', fontWeight: '800' }}>${totalSalary.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </>
  );
}
