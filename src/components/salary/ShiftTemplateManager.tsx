'use client';

import React from 'react';
import type { ShiftTemplate, Weekday } from '@/data/shiftTemplates';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const;

interface ShiftTemplateManagerProps {
  templates: ShiftTemplate[];
  templatesLoading: boolean;
  canEditTemplates: boolean;
  newTemplate: Omit<ShiftTemplate, 'id' | 'createdAt'>;
  setNewTemplate: React.Dispatch<React.SetStateAction<Omit<ShiftTemplate, 'id' | 'createdAt'>>>;
  editingTemplateId: string | null;
  onSaveTemplate: () => void;
  onStartEditTemplate: (template: ShiftTemplate) => void;
  onSetDefaultTemplate: (template: ShiftTemplate) => void;
  onDeleteTemplate: (template: ShiftTemplate) => void;
  onResetTemplateForm: () => void;
}

/**
 * 班別範本管理組件
 * 
 * 獨立管理常態工作班別設定（如名稱、星期、時間段、時薪、時數與預設設定）。
 */
export default function ShiftTemplateManager({
  templates,
  templatesLoading,
  canEditTemplates,
  newTemplate,
  setNewTemplate,
  editingTemplateId,
  onSaveTemplate,
  onStartEditTemplate,
  onSetDefaultTemplate,
  onDeleteTemplate,
  onResetTemplateForm,
}: ShiftTemplateManagerProps) {
  return (
    <div className="glass no-print" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-md)',
        flexWrap: 'wrap',
        gap: 'var(--spacing-md)',
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>
          班別範本管理
        </h3>
        {templatesLoading && (
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>載入中...</span>
        )}
      </div>

      {editingTemplateId && (
        <div style={{
          marginBottom: 'var(--spacing-md)',
          color: 'var(--text-secondary)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
        }}>
          <span>正在編輯：{newTemplate.name || '未命名班別'}</span>
          <button
            type="button"
            onClick={onResetTemplateForm}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            取消編輯
          </button>
        </div>
      )}

      {/* 班別建立/編輯表單 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-md)'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            班別名稱
          </label>
          <input
            type="text"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
            placeholder="例：週六班"
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

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            星期
          </label>
          <select
            value={newTemplate.weekday}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, weekday: Number(e.target.value) as Weekday }))}
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
            {WEEKDAY_LABELS.map((label, index) => (
              <option key={label} value={index} style={{ background: '#f0ece1', color: '#3d3a36' }}>
                {`星期${label}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            開始時間
          </label>
          <input
            type="time"
            value={newTemplate.startTime}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, startTime: e.target.value }))}
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

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            結束時間
          </label>
          <input
            type="time"
            value={newTemplate.endTime}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, endTime: e.target.value }))}
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

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            時薪 (元)
          </label>
          <input
            type="number"
            value={newTemplate.hourlyRate}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
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

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            工作時數 (小時)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={newTemplate.workHours ?? 0}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, workHours: Number(e.target.value) }))}
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

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--foreground)',
        }}>
          <input
            type="checkbox"
            checked={newTemplate.isDefault}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, isDefault: e.target.checked }))}
          />
          設為該星期的預設範本
        </label>
      </div>

      <button
        type="button"
        onClick={onSaveTemplate}
        disabled={!canEditTemplates}
        style={{
          padding: '0.6rem 1.4rem',
          borderRadius: '8px',
          border: 'none',
          background: 'var(--color-primary)',
          color: '#f0ece1',
          fontWeight: '600',
          cursor: canEditTemplates ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(139, 121, 101, 0.15)',
        }}
      >
        {editingTemplateId ? '更新班別' : '新增班別'}
      </button>

      {/* 班別範本列表 */}
      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        {templates.length === 0 ? (
          <div style={{ color: 'var(--muted)' }}>目前尚未建立班別範本</div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
            {templates.map(template => (
              <div
                key={template.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr auto',
                  gap: 'var(--spacing-sm)',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '2px dashed rgba(220, 208, 194, 0.7)',
                  background: '#f0ece1',
                }}
              >
                <div style={{ fontWeight: 600 }}>{template.name}</div>
                <div style={{ color: 'var(--muted)' }}>{`星期${WEEKDAY_LABELS[template.weekday]}`}</div>
                <div>{template.startTime} - {template.endTime}</div>
                <div>{template.workHours ?? '-'}h / ${template.hourlyRate}</div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => onStartEditTemplate(template)}
                    disabled={!canEditTemplates}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px dashed rgba(95, 113, 134, 0.4)',
                      background: 'rgba(95, 113, 134, 0.12)',
                      color: 'var(--color-secondary)',
                      fontWeight: '600',
                      cursor: canEditTemplates ? 'pointer' : 'not-allowed',
                    }}
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetDefaultTemplate(template)}
                    disabled={!canEditTemplates}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px dashed rgba(184, 126, 107, 0.4)',
                      background: template.isDefault ? 'var(--color-primary)' : 'rgba(184, 126, 107, 0.15)',
                      color: template.isDefault ? '#f0ece1' : 'var(--color-primary)',
                      fontWeight: '600',
                      cursor: canEditTemplates ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {template.isDefault ? '預設中' : '設為預設'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTemplate(template)}
                    disabled={!canEditTemplates}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px dashed rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#dc2626',
                      fontWeight: '600',
                      cursor: canEditTemplates ? 'pointer' : 'not-allowed',
                    }}
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
