'use client';

import React from 'react';
import type { SalaryRecord } from '@/hooks/useSalaryData';
import type { ShiftTemplate } from '@/data/shiftTemplates';
import {
  getWorkRoleHourlyRate,
  getWorkRoleLabel,
  type RoleType,
  type WorkRole,
} from '@/data/workRoles';
import styles from './SalaryRecordForm.module.css';

const WEEKDAY_SHORT_LABELS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'] as const;

interface SalaryRecordFormProps {
  currentRecord: Omit<SalaryRecord, 'id'>;
  setCurrentRecord: React.Dispatch<React.SetStateAction<Omit<SalaryRecord, 'id'>>>;
  workHours: string;
  setWorkHours: (val: string) => void;
  roles: WorkRole[];
  shiftCategoryOptions: string[];
  templates: ShiftTemplate[];
  importMonth: string;
  setImportMonth: (val: string) => void;
  onAddRecord: () => void;
  onImportFromWorkShifts: () => void;
  onApplyTemplate: (template: ShiftTemplate) => void;
}

/**
 * 新增打工記錄與快速帶入表單組件
 */
export default function SalaryRecordForm({
  currentRecord,
  setCurrentRecord,
  workHours,
  setWorkHours,
  roles,
  shiftCategoryOptions,
  templates,
  importMonth,
  setImportMonth,
  onAddRecord,
  onImportFromWorkShifts,
  onApplyTemplate,
}: SalaryRecordFormProps) {
  const getWeekdayLabel = (dateStr: string): string => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '--';
    return WEEKDAY_SHORT_LABELS[date.getDay()] ?? '--';
  };

  return (
    <div id="add-record-form" className="glass no-print" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
      {/* 標頭與工具列 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-md)',
        flexWrap: 'wrap',
        gap: 'var(--spacing-md)'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>
          新增工作記錄
        </h3>
        
        {/* 打工月曆同步按鈕區 */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            匯入月份：
          </label>
          <input 
            type="month"
            value={importMonth}
            onChange={(e) => setImportMonth(e.target.value)}
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          />
          <button
            onClick={onImportFromWorkShifts}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#a855f7',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.9rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            從打工月曆匯入
          </button>
        </div>
      </div>

      {/* 班別範本一鍵套用快捷標籤列 */}
      {templates.length > 0 && (
        <div style={{
          marginBottom: 'var(--spacing-md)',
          padding: '0.75rem 1rem',
          background: 'rgba(220, 208, 194, 0.2)',
          borderRadius: '10px',
          border: '1px dashed rgba(220, 208, 194, 0.5)',
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
            快捷套用班別範本：
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onApplyTemplate(tpl)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-primary)',
                  background: 'rgba(184, 126, 107, 0.15)',
                  color: 'var(--color-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-primary)';
                  e.currentTarget.style.color = '#f0ece1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(184, 126, 107, 0.15)';
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
              >
                {tpl.name} ({tpl.startTime}-{tpl.endTime})
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 主要輸入表單 Grid */}
      <div className={styles.formGrid}>
        {/* 日期 */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            日期
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <input 
              type="date"
              value={currentRecord.date}
              onChange={(e) => {
                setCurrentRecord(prev => ({ ...prev, date: e.target.value }));
              }}
              style={{
                width: '100%',
                minWidth: 0,
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '2px dashed rgba(220, 208, 194, 0.8)',
                background: 'rgba(220, 208, 194, 0.35)',
                color: 'var(--foreground)',
              }}
            />
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '2.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(95, 113, 134, 0.24)',
              background: 'rgba(95, 113, 134, 0.1)',
              fontSize: '0.9rem',
              color: 'var(--color-secondary)',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}>
              {getWeekdayLabel(currentRecord.date)}
            </span>
          </div>
        </div>

        {/* 身份 */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            身份
          </label>
          <select
            value={currentRecord.role}
            onChange={(e) => {
              const newRole: RoleType = e.target.value;
              setCurrentRecord(prev => ({
                ...prev,
                role: newRole,
                roleName: getWorkRoleLabel(newRole, roles),
                hourlyRate: getWorkRoleHourlyRate(newRole, roles),
              }));
            }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '2px dashed rgba(220, 208, 194, 0.8)',
              background: 'rgba(220, 208, 194, 0.35)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            {roles.length === 0 ? (
              <option value={currentRecord.role} style={{ background: '#f0ece1', color: '#3d3a36' }}>
                {getWorkRoleLabel(currentRecord.role, roles, currentRecord.roleName)}
              </option>
            ) : (
              <>
                {!roles.some((role) => role.id === currentRecord.role) && (
                  <option value={currentRecord.role} style={{ background: '#f0ece1', color: '#3d3a36' }}>
                    {getWorkRoleLabel(currentRecord.role, roles, currentRecord.roleName)}（已移除）
                  </option>
                )}
                {roles.map((role) => (
                  <option key={role.id} value={role.id} style={{ background: '#f0ece1', color: '#3d3a36' }}>
                    {role.name} (NT$ {role.hourlyRate}/小時)
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* 開始時間 */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            開始時間
          </label>
          <input 
            type="time"
            value={currentRecord.startTime}
            onChange={(e) => setCurrentRecord(prev => ({ ...prev, startTime: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '2px dashed rgba(220, 208, 194, 0.8)',
              background: 'rgba(220, 208, 194, 0.35)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        {/* 結束時間 */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            結束時間
          </label>
          <input 
            type="time"
            value={currentRecord.endTime}
            onChange={(e) => setCurrentRecord(prev => ({ ...prev, endTime: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '2px dashed rgba(220, 208, 194, 0.8)',
              background: 'rgba(220, 208, 194, 0.35)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        {/* 工作時數 */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            工作時數 (小時)
          </label>
          <input 
            type="number"
            step="0.01"
            min="0"
            value={workHours}
            onChange={(e) => setWorkHours(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '2px dashed rgba(220, 208, 194, 0.8)',
              background: 'rgba(220, 208, 194, 0.35)',
              color: 'var(--foreground)',
            }}
            placeholder="例：8"
          />
        </div>

        {/* 時薪 */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            時薪 (元)
          </label>
          <input 
            type="number"
            value={currentRecord.hourlyRate}
            onChange={(e) => setCurrentRecord(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '2px dashed rgba(220, 208, 194, 0.8)',
              background: 'rgba(220, 208, 194, 0.35)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        {/* 班別 */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            班別 (選填)
          </label>
          <select
            value={currentRecord.shiftCategory || ''}
            onChange={(e) => {
              const value = e.target.value;
              setCurrentRecord(prev => ({ ...prev, shiftCategory: value }));
            }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '2px dashed rgba(220, 208, 194, 0.8)',
              background: 'rgba(220, 208, 194, 0.35)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            <option value="" style={{ background: '#f0ece1', color: '#3d3a36' }}>-- 無班別 --</option>
            {shiftCategoryOptions.map((category) => (
              <option key={category} value={category} style={{ background: '#f0ece1', color: '#3d3a36' }}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onAddRecord}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          border: 'none',
          background: 'var(--color-primary)',
          color: '#f0ece1',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(139, 121, 101, 0.15)',
          cursor: 'pointer',
          transition: 'transform 0.2s, background 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.03)';
          e.currentTarget.style.background = 'var(--color-primary-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = 'var(--color-primary)';
        }}
      >
        新增記錄
      </button>
    </div>
  );
}
