'use client';

import React, { RefObject, useMemo } from 'react';
import type { SalaryRecord } from '@/hooks/useSalaryData';
import { getWorkRoleLabel, type RoleType, type WorkRole } from '@/data/workRoles';
import styles from './SalaryRecordList.module.css';

const WEEKDAY_SHORT_LABELS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'] as const;

interface SalaryRecordListProps {
  records: SalaryRecord[];
  filteredRecords: SalaryRecord[];
  roles: WorkRole[];
  filterMonth: string;
  updateFilterMonth: (month: string) => void;
  quickFilters: Array<{ label: string; value: string; description: string }>;
  selectedRecordIds: Set<string>;
  toggleRecordSelection: (id: string) => void;
  toggleSelectAll: () => void;
  setSelectedRecordIds: (set: Set<string>) => void;
  
  // 批次操作
  onOpenBatchEdit: () => void;
  onBatchDelete: () => void;
  
  // 匯出 / 列印
  onPrint: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onImportClick: () => void;
  isImporting: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  // 單筆操作
  onEditRecord: (record: SalaryRecord) => void;
  onCopyRecord: (record: SalaryRecord) => void;
  onDeleteRecord: (id: string) => void;
  getDisplayShiftName: (record: SalaryRecord) => string;
  calculatePay: (record: Omit<SalaryRecord, 'id'>) => number;
  calculateHours: (record: Omit<SalaryRecord, 'id'>) => number;
  
  // 編輯Modal
  showEditModal: boolean;
  editingRecord: SalaryRecord | null;
  editingWorkHours: string;
  onEditWorkHoursChange: (val: string) => void;
  onEditStartTimeChange: (val: string) => void;
  onEditEndTimeChange: (val: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  setEditingRecord: React.Dispatch<React.SetStateAction<SalaryRecord | null>>;
  
  // 批次編輯Modal
  showBatchEditModal: boolean;
  batchNewHourlyRate: number;
  setBatchNewHourlyRate: (val: number) => void;
  batchEditData: {
    role: '' | RoleType;
    startTime: string;
    endTime: string;
    workHours: string;
    shiftCategory: string;
  };
  setBatchEditData: React.Dispatch<React.SetStateAction<{
    role: '' | RoleType;
    startTime: string;
    endTime: string;
    workHours: string;
    shiftCategory: string;
  }>>;
  shiftCategoryOptions: string[];
  onBatchEditHourlyRate: () => void;
  onCancelBatchEdit: () => void;
}

/**
 * 薪資記錄清單、表格、篩選器與批次/彈窗管理組件
 */
export default function SalaryRecordList({
  records,
  filteredRecords,
  roles,
  filterMonth,
  updateFilterMonth,
  quickFilters,
  selectedRecordIds,
  toggleRecordSelection,
  toggleSelectAll,
  setSelectedRecordIds,
  onOpenBatchEdit,
  onBatchDelete,
  onPrint,
  onExportPDF,
  onExportExcel,
  onImportClick,
  isImporting,
  fileInputRef,
  handleFileSelect,
  onEditRecord,
  onCopyRecord,
  onDeleteRecord,
  getDisplayShiftName,
  calculatePay,
  calculateHours,
  showEditModal,
  editingRecord,
  editingWorkHours,
  onEditWorkHoursChange,
  onEditStartTimeChange,
  onEditEndTimeChange,
  onSaveEdit,
  onCancelEdit,
  setEditingRecord,
  showBatchEditModal,
  batchNewHourlyRate,
  setBatchNewHourlyRate,
  batchEditData,
  setBatchEditData,
  shiftCategoryOptions,
  onBatchEditHourlyRate,
  onCancelBatchEdit,
}: SalaryRecordListProps) {

  const getWeekdayLabel = (dateStr: string): string => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '--';
    return WEEKDAY_SHORT_LABELS[date.getDay()] ?? '--';
  };

  // 計算總計工時與總計薪資
  const totalWorkHours = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + calculateHours(r), 0);
  }, [filteredRecords, calculateHours]);

  const totalSalary = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + calculatePay(r), 0);
  }, [filteredRecords, calculatePay]);

  return (
    <>
      {/* 跨月份提醒 */}
      {records.length > 0 && filteredRecords.length === 0 && Boolean(filterMonth) && (
        <div
          className="no-print"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: 'var(--spacing-lg)',
            borderRadius: '12px',
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 'bold' }}>提示：</span>
            <span>
              當前選擇的月份 (<strong>{filterMonth}</strong>) 尚無記錄，共有 <strong>{records.length}</strong> 筆打工記錄在其他月份。
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateFilterMonth('')}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid #d4c8bc',
              background: '#e4dcd2',
              color: '#5e5650',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            切換至「全部」顯示所有記錄
          </button>
        </div>
      )}

      {/* 記錄列表主要卡片 */}
      <div className="glass" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        {/* 標頭工具列 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>
            工作記錄明細
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {selectedRecordIds.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={onOpenBatchEdit}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px dashed rgba(200, 141, 85, 0.4)',
                    background: 'rgba(200, 141, 85, 0.12)',
                    color: '#c88d55',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  批次編輯 ({selectedRecordIds.size})
                </button>
                <button
                  type="button"
                  onClick={onBatchDelete}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px dashed rgba(184, 107, 107, 0.4)',
                    background: 'rgba(184, 107, 107, 0.12)',
                    color: '#b86b6b',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  批量刪除 ({selectedRecordIds.size})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRecordIds(new Set())}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px dashed rgba(120, 120, 120, 0.4)',
                    background: 'rgba(120, 120, 120, 0.12)',
                    color: '#787878',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  取消選擇
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onPrint}
              className="no-print"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px dashed rgba(139, 92, 246, 0.4)',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#a855f7',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              列印
            </button>
            <button
              type="button"
              onClick={onExportPDF}
              className="no-print"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px dashed rgba(184, 126, 107, 0.4)',
                background: 'rgba(184, 126, 107, 0.12)',
                color: 'var(--color-primary)',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              匯出 PDF
            </button>
            <button
              type="button"
              onClick={onExportExcel}
              className="no-print"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px dashed rgba(200, 141, 85, 0.4)',
                background: 'rgba(200, 141, 85, 0.12)',
                color: '#c88d55',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              匯出 Excel
            </button>
            <button
              type="button"
              onClick={onImportClick}
              className="no-print"
              disabled={isImporting}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px dashed rgba(95, 113, 134, 0.4)',
                background: 'rgba(95, 113, 134, 0.12)',
                color: 'var(--color-secondary)',
                fontWeight: '600',
                cursor: isImporting ? 'not-allowed' : 'pointer',
              }}
            >
              {isImporting ? '解析中...' : '匯入 Excel'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* 月份篩選列 */}
        <div className="no-print" style={{ 
          display: 'flex', 
          gap: 'var(--spacing-md)', 
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          background: 'rgba(220, 208, 194, 0.25)',
          borderRadius: '12px',
          border: '2px dashed rgba(220, 208, 194, 0.7)',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {quickFilters.map(filter => (
              <button
                key={filter.value}
                type="button"
                onClick={() => updateFilterMonth(filter.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: filterMonth === filter.value 
                    ? '2px solid var(--color-primary)' 
                    : '2px dashed rgba(220, 208, 194, 0.7)',
                  background: filterMonth === filter.value 
                    ? 'var(--color-primary)' 
                    : '#f0ece1',
                  color: filterMonth === filter.value 
                    ? '#f0ece1' 
                    : 'var(--foreground)',
                  fontWeight: filterMonth === filter.value ? '600' : '500',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                title={filter.description}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              自訂月份：
            </label>
            <input 
              type="month"
              value={filterMonth || ''}
              onChange={(e) => updateFilterMonth(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ 
            marginLeft: 'auto',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            fontWeight: '600',
          }}>
            顯示：
            <span style={{ color: 'var(--color-primary)', marginLeft: '0.25rem', fontSize: '1.1rem' }}>
              {filteredRecords.length}
            </span>
            {filterMonth && (
              <span style={{ opacity: 0.6 }}>
                {' '} / {records.length} 筆
              </span>
            )}
          </div>
        </div>

        {/* 表格 / 清單呈現 */}
        {filteredRecords.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
            目前沒有打工記錄
          </div>
        ) : (
          <>
            {/* 桌面端表格視圖 */}
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
                    <th style={{ textAlign: 'left' }}>身份</th>
                    <th style={{ textAlign: 'left' }}>班別</th>
                    <th style={{ textAlign: 'left' }}>時間</th>
                    <th style={{ textAlign: 'center' }}>工時</th>
                    <th style={{ textAlign: 'right' }}>時薪</th>
                    <th style={{ textAlign: 'right' }}>薪資</th>
                    <th style={{ textAlign: 'center' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredRecords]
                    .sort((a, b) => {
                      const dateCompare = a.date.localeCompare(b.date);
                      if (dateCompare !== 0) return dateCompare;
                      return a.startTime.localeCompare(b.startTime);
                    })
                    .map((record) => {
                      const displayShiftName = getDisplayShiftName(record);
                      const isSelected = selectedRecordIds.has(record.id);
                      const roleLabel = getWorkRoleLabel(record.role, roles, record.roleName);
                      const isInstructor = record.role === 'instructor';
                      return (
                        <tr 
                          key={record.id} 
                          className={isSelected ? styles.trSelected : ''}
                        >
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
                          <td>
                            {displayShiftName}
                          </td>
                          <td>
                            {record.startTime} - {record.endTime}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {calculateHours(record).toFixed(2)}h
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            ${record.hourlyRate}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            ${calculatePay(record).toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => onEditRecord(record)}
                                style={{
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(95, 113, 134, 0.4)',
                                  background: 'rgba(95, 113, 134, 0.12)',
                                  color: 'var(--color-secondary)',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                }}
                              >
                                編輯
                              </button>
                              <button
                                type="button"
                                onClick={() => onCopyRecord(record)}
                                style={{
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(184, 126, 107, 0.4)',
                                  background: 'rgba(184, 126, 107, 0.12)',
                                  color: 'var(--color-primary)',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                }}
                              >
                                複製
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteRecord(record.id)}
                                style={{
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#dc2626',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                }}
                              >
                                刪除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr style={{ 
                    borderTop: '2px dashed rgba(220, 208, 194, 0.8)',
                    background: 'rgba(220, 208, 194, 0.3)',
                    fontWeight: 'bold',
                  }}>
                    <td colSpan={5} style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                      合計 ({filteredRecords.length} 筆記錄)：
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', color: 'var(--color-secondary)' }}>
                      {totalWorkHours.toFixed(2)}h
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                      --
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                      ${totalSalary.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem' }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 行動端卡片視圖 */}
            <div className={styles.mobileView}>
              {[...filteredRecords]
                .sort((a, b) => {
                  const dateCompare = a.date.localeCompare(b.date);
                  if (dateCompare !== 0) return dateCompare;
                  return a.startTime.localeCompare(b.startTime);
                })
                .map((record) => {
                  const displayShiftName = getDisplayShiftName(record);
                  const isSelected = selectedRecordIds.has(record.id);
                  const roleLabel = getWorkRoleLabel(record.role, roles, record.roleName);
                  const isInstructor = record.role === 'instructor';
                  const pay = calculatePay(record);
                  const hours = calculateHours(record);

                  return (
                    <div
                      key={record.id}
                      className={`${styles.mobileCard} ${isSelected ? styles.mobileCardSelected : ''}`}
                    >
                      {/* 卡片頂部：Checkbox、日期與身份/時薪 */}
                      <div className={styles.mobileCardTop}>
                        <div className={styles.dateBlock}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRecordSelection(record.id)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span className={styles.dateText}>{record.date}</span>
                          <span className={styles.weekdayBadge}>({getWeekdayLabel(record.date)})</span>
                        </div>
                        <span
                          className={styles.roleBadge}
                          style={{
                            background: isInstructor ? 'rgba(200, 141, 85, 0.18)' : 'rgba(95, 113, 134, 0.18)',
                            color: isInstructor ? '#c88d55' : 'var(--color-secondary)',
                            border: isInstructor ? '1px dashed rgba(200, 141, 85, 0.4)' : '1px dashed rgba(95, 113, 134, 0.4)',
                          }}
                        >
                          {roleLabel} NT$ {record.hourlyRate}/小時
                        </span>
                      </div>

                      {/* 卡片中間：班別名稱與時間工時 */}
                      <div className={styles.mobileCardBody}>
                        <div className={styles.categoryTag}>
                          {displayShiftName}
                        </div>
                        <div className={styles.timeInfo}>
                          <span>⏰ {record.startTime} - {record.endTime}</span>
                          <span className={styles.hoursText}>{hours.toFixed(2)}h</span>
                        </div>
                      </div>

                      {/* 卡片底部：總金額與操作按鈕 */}
                      <div className={styles.mobileCardFooter}>
                        <span className={styles.payText}>${pay.toLocaleString()}</span>
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={`${styles.cardActionBtn} ${styles.editActionBtn}`}
                            onClick={() => onEditRecord(record)}
                          >
                            編輯
                          </button>
                          <button
                            type="button"
                            className={`${styles.cardActionBtn} ${styles.copyActionBtn}`}
                            onClick={() => onCopyRecord(record)}
                          >
                            複製
                          </button>
                          <button
                            type="button"
                            className={`${styles.cardActionBtn} ${styles.deleteActionBtn}`}
                            onClick={() => onDeleteRecord(record.id)}
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* 行動端合計卡片 */}
              <div className={styles.mobileTotalCard}>
                <span>合計 ({filteredRecords.length} 筆記錄)</span>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-secondary)' }}>{totalWorkHours.toFixed(2)}h</span>
                  <span style={{ color: 'var(--color-primary)', fontSize: '1.15rem', fontWeight: '800' }}>
                    ${totalSalary.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 單筆編輯 Modal */}
      {showEditModal && editingRecord && (
        <div style={{
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
        }}>
          <div className="glass" style={{ width: '90%', maxWidth: '500px', padding: '1.5rem', background: '#f0ece1' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
              編輯工作記錄
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>日期</label>
                <input
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>身份</label>
                <select
                  value={editingRecord.role}
                  onChange={(e) => {
                    const roleId: RoleType = e.target.value;
                    const selectedRole = roles.find((role) => role.id === roleId);
                    setEditingRecord({
                      ...editingRecord,
                      role: roleId,
                      roleName: selectedRole?.name,
                      hourlyRate: selectedRole?.hourlyRate ?? editingRecord.hourlyRate,
                    });
                  }}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
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

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>開始時間</label>
                <input
                  type="time"
                  value={editingRecord.startTime}
                  onChange={(e) => onEditStartTimeChange(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>結束時間</label>
                <input
                  type="time"
                  value={editingRecord.endTime}
                  onChange={(e) => onEditEndTimeChange(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>工作時數</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingWorkHours}
                  onChange={(e) => onEditWorkHoursChange(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>時薪 (元)</label>
                <input
                  type="number"
                  value={editingRecord.hourlyRate}
                  onChange={(e) => setEditingRecord({ ...editingRecord, hourlyRate: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCancelEdit}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批次編輯 Modal */}
      {showBatchEditModal && (
        <div style={{
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
        }}>
          <div className="glass" style={{ width: '90%', maxWidth: '500px', padding: '1.5rem', background: '#f0ece1' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
              批次修改 ({selectedRecordIds.size} 筆記錄)
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>修改時薪</label>
                <input
                  type="number"
                  value={batchNewHourlyRate}
                  onChange={(e) => setBatchNewHourlyRate(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>修改身份 (選填)</label>
                <select
                  value={batchEditData.role}
                  onChange={(e) => setBatchEditData(prev => ({ ...prev, role: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                  <option value="">-- 不修改 --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>修改班別 (選填)</label>
                <select
                  value={batchEditData.shiftCategory}
                  onChange={(e) => setBatchEditData(prev => ({ ...prev, shiftCategory: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                  <option value="">-- 不修改 --</option>
                  {shiftCategoryOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCancelBatchEdit}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={onBatchEditHourlyRate}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                套用修改
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
