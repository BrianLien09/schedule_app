'use client';

import React, { RefObject } from 'react';
import type { SalaryRecord } from '@/hooks/useSalaryData';
import { type RoleType, type WorkRole } from '@/data/workRoles';
import SalaryRecordDialogs from './SalaryRecordDialogs';
import SalaryRecordTable from './SalaryRecordTable';

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
  onSaveEdit: () => Promise<boolean>;
  isSavingEdit: boolean;
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
  isSavingBatchEdit: boolean;
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
  isSavingEdit,
  onCancelEdit,
  setEditingRecord,
  showBatchEditModal,
  batchNewHourlyRate,
  setBatchNewHourlyRate,
  batchEditData,
  setBatchEditData,
  shiftCategoryOptions,
  onBatchEditHourlyRate,
  isSavingBatchEdit,
  onCancelBatchEdit,
}: SalaryRecordListProps) {

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
          <SalaryRecordTable
            filteredRecords={filteredRecords}
            roles={roles}
            selectedRecordIds={selectedRecordIds}
            toggleRecordSelection={toggleRecordSelection}
            toggleSelectAll={toggleSelectAll}
            onEditRecord={onEditRecord}
            onCopyRecord={onCopyRecord}
            onDeleteRecord={onDeleteRecord}
            getDisplayShiftName={getDisplayShiftName}
            calculatePay={calculatePay}
            calculateHours={calculateHours}
          />
        )}
      </div>
      <SalaryRecordDialogs
        showEditModal={showEditModal}
        editingRecord={editingRecord}
        editingWorkHours={editingWorkHours}
        roles={roles}
        onEditWorkHoursChange={onEditWorkHoursChange}
        onEditStartTimeChange={onEditStartTimeChange}
        onEditEndTimeChange={onEditEndTimeChange}
        onSaveEdit={onSaveEdit}
        isSavingEdit={isSavingEdit}
        onCancelEdit={onCancelEdit}
        setEditingRecord={setEditingRecord}
        showBatchEditModal={showBatchEditModal}
        selectedRecordCount={selectedRecordIds.size}
        batchNewHourlyRate={batchNewHourlyRate}
        setBatchNewHourlyRate={setBatchNewHourlyRate}
        batchEditData={batchEditData}
        setBatchEditData={setBatchEditData}
        shiftCategoryOptions={shiftCategoryOptions}
        onBatchEditHourlyRate={onBatchEditHourlyRate}
        isSavingBatchEdit={isSavingBatchEdit}
        onCancelBatchEdit={onCancelBatchEdit}
      />
    </>
  );
}
