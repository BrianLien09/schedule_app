'use client';

import React from 'react';
import type { ShiftTemplate } from '@/data/shiftTemplates';
import type { WorkRole } from '@/data/workRoles';
import { getWorkRoleLabel } from '@/data/workRoles';
import styles from './ShiftTemplateManager.module.css';

interface ShiftTemplateManagerProps {
  templates: ShiftTemplate[];
  templatesLoading: boolean;
  canEditTemplates: boolean;
  newTemplate: Omit<ShiftTemplate, 'id' | 'createdAt'>;
  setNewTemplate: React.Dispatch<React.SetStateAction<Omit<ShiftTemplate, 'id' | 'createdAt'>>>;
  editingTemplateId: string | null;
  onSaveTemplate: () => void;
  onStartEditTemplate: (template: ShiftTemplate) => void;
  onDeleteTemplate: (template: ShiftTemplate) => void;
  onResetTemplateForm: () => void;
  roles?: WorkRole[];
}

/**
 * 智慧解析班別範本之職位徽章標籤與樣式
 */
function getTemplateBadgeInfo(template: ShiftTemplate, roles: WorkRole[]) {
  if (template.role) {
    const roleObj = roles.find((r) => r.id === template.role);
    const label = roleObj?.name || template.roleName || getWorkRoleLabel(template.role, roles);
    const isInst = template.role === 'instructor' || label.includes('講師');
    return { label, isInstructor: isInst, isNeutral: false };
  }
  // 若舊資料沒有指派 role，根據名稱智慧推斷
  if (template.name.includes('講師')) {
    return { label: '講師', isInstructor: true, isNeutral: false };
  }
  if (template.name.includes('助教')) {
    return { label: '助教', isInstructor: false, isNeutral: false };
  }
  return { label: '一般班別', isInstructor: false, isNeutral: true };
}

/**
 * 班別範本管理組件
 * 
 * 獨立管理常態工作班別設定（包含名稱、職稱/職位、時間段、時薪與工作時數）。
 * 採用卡片化佈局以確保手機端舒適瀏覽，避免橫向排版擠壓換行。
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
  onDeleteTemplate,
  onResetTemplateForm,
  roles = [],
}: ShiftTemplateManagerProps) {
  return (
    <div className={`glass no-print ${styles.container}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          班別範本管理
        </h3>
        {templatesLoading && (
          <span className={styles.loading}>載入中...</span>
        )}
      </div>

      {/* 班別建立/編輯表單外框容器 */}
      <div className={styles.formContainer}>
        {editingTemplateId && (
          <div className={styles.editingBanner}>
            <span>正在編輯：{newTemplate.name || '未命名班別'}</span>
            <button
              type="button"
              onClick={onResetTemplateForm}
              className={styles.cancelEditBtn}
            >
              ✕ 放棄編輯
            </button>
          </div>
        )}

        {/* 雙行 3 欄 Grid 配置 */}
        <div className={styles.formGrid}>
          {/* 第 1 行：基本職務設定 */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              班別名稱
            </label>
            <input
              type="text"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例：週六班"
              className={styles.fieldInput}
            />
          </div>

          {/* 職稱／職位參數 */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              職稱／職位
            </label>
            <select
              value={newTemplate.role || (roles[0]?.id ?? 'assistant')}
              onChange={(e) => {
                const selectedRole = roles.find((r) => r.id === e.target.value);
                setNewTemplate((prev) => ({
                  ...prev,
                  role: e.target.value,
                  roleName: selectedRole?.name || '助教',
                  // 若切換職位，連動帶入該職位的預設時薪
                  hourlyRate: selectedRole?.hourlyRate ?? prev.hourlyRate,
                }));
              }}
              className={styles.fieldSelect}
            >
              {roles.length > 0 ? (
                roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (NT$ {r.hourlyRate}/h)
                  </option>
                ))
              ) : (
                <>
                  <option value="assistant">助教 (NT$ 200/h)</option>
                  <option value="instructor">講師 (NT$ 500/h)</option>
                </>
              )}
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              時薪 (元)
            </label>
            <input
              type="number"
              value={newTemplate.hourlyRate}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
              className={styles.fieldInput}
            />
          </div>

          {/* 第 2 行：時間與工作時數 */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              開始時間
            </label>
            <input
              type="time"
              value={newTemplate.startTime}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, startTime: e.target.value }))}
              className={styles.fieldInput}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              結束時間
            </label>
            <input
              type="time"
              value={newTemplate.endTime}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, endTime: e.target.value }))}
              className={styles.fieldInput}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              工作時數 (小時)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newTemplate.workHours ?? 0}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, workHours: Number(e.target.value) }))}
              className={styles.fieldInput}
            />
          </div>
        </div>

        {/* 表單操作按鈕區：明確靠右對齊，排版工整協調 */}
        <div className={styles.formActions}>
          {editingTemplateId && (
            <button
              type="button"
              onClick={onResetTemplateForm}
              className={styles.cancelBtn}
            >
              取消
            </button>
          )}
          <button
            type="button"
            onClick={onSaveTemplate}
            disabled={!canEditTemplates}
            className={styles.submitBtn}
          >
            {editingTemplateId ? '✓ 更新班別' : '＋ 新增班別'}
          </button>
        </div>
      </div>

      {/* 班別範本卡片列表 (與表單左右起始位置 100% 對齊) */}
      <div className={styles.listSection}>
        {templates.length === 0 ? (
          <div className={styles.emptyState}>目前尚未建立班別範本</div>
        ) : (
          <div className={styles.cardsGrid}>
            {templates.map((template) => {
              const badgeInfo = getTemplateBadgeInfo(template, roles);
              const badgeClass = badgeInfo.isInstructor
                ? styles.roleBadgeInstructor
                : badgeInfo.isNeutral
                ? styles.roleBadgeNeutral
                : '';

              return (
                <div key={template.id} className={styles.templateCard}>
                  {/* 1. 卡片頂部：班別名稱與職位徽章 */}
                  <div className={styles.cardHeader}>
                    <h4 className={styles.cardTitle} title={template.name}>
                      {template.name}
                    </h4>
                    <span className={`${styles.roleBadge} ${badgeClass}`}>
                      {badgeInfo.label}
                    </span>
                  </div>

                  {/* 2. 時間、工時與時薪資訊行（上次的精緻小卡片橫排） */}
                  <div className={styles.cardMetaRow}>
                    <span className={styles.timeDisplay}>
                      🕒 {template.startTime} - {template.endTime}
                    </span>
                    <span className={styles.hoursBadge}>
                      {template.workHours ?? '-'}h
                    </span>
                    <span className={styles.rateBadge}>
                      NT$ {template.hourlyRate}/h
                    </span>
                  </div>

                  {/* 4. 卡片底部：編輯與刪除操作 */}
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => onStartEditTemplate(template)}
                      disabled={!canEditTemplates}
                      className={styles.editBtn}
                    >
                      ✏️ 編輯
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTemplate(template)}
                      disabled={!canEditTemplates}
                      className={styles.deleteBtn}
                    >
                      🗑️ 刪除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
