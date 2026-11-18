'use client';

import React, { useState } from 'react';
import type { SalaryRecord } from '@/hooks/useSalaryData';
import type { ShiftTemplate } from '@/data/shiftTemplates';
import {
  getWorkRoleHourlyRate,
  getWorkRoleLabel,
  type RoleType,
  type WorkRole,
} from '@/data/workRoles';
import { calculateWorkHoursFromTimes } from '@/utils/salaryStats';
import { getAccentColorByName } from '@/utils/todos';
import { BriefcaseIcon } from '@/components/shared/Icons';
import DatePicker from '@/components/shared/pickers/DatePicker';
import MonthStepper from '@/components/shared/pickers/MonthStepper';
import TimeRangePicker, { type DurationPreset, type TimeField } from '@/components/shared/pickers/TimeRangePicker';
import { OptionCardGroup, PillGroup } from '@/components/shared/pickers/OptionPicker';
import { EditorField } from '@/components/shared/EditorForm';
import editorStyles from '@/components/shared/EditorForm.module.css';
import styles from './SalaryRecordForm.module.css';

// 與班表表單相同的班長快捷，兩處新增工作的操作手感一致
const SHIFT_DURATIONS: DurationPreset[] = [
  { label: '2 小時', minutes: 120 },
  { label: '3 小時', minutes: 180 },
  { label: '4 小時', minutes: 240 },
  { label: '8 小時', minutes: 480 },
];

type ActivePicker = 'date' | TimeField | null;

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
  onAddRecord: () => void | Promise<void>;
  isAddingRecord: boolean;
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
  isAddingRecord,
  onImportFromWorkShifts,
  onApplyTemplate,
}: SalaryRecordFormProps) {
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const isTemplateApplied = templates.some((template) => template.name === currentRecord.shiftCategory);
  const estimatedPay = Math.round((parseFloat(workHours) || 0) * (currentRecord.hourlyRate || 0));

  // 範本已記錄扣掉休息時間的計薪工時，套用範本時不能被起訖時間差蓋掉；自行輸入時才跟著時間自動計算
  const changeTime = (field: 'startTime' | 'endTime', value: string): void => {
    const next = { ...currentRecord, [field]: value };
    setCurrentRecord(next);
    if (!isTemplateApplied && next.startTime && next.endTime) {
      setWorkHours(String(Number(calculateWorkHoursFromTimes(next.startTime, next.endTime).toFixed(2))));
    }
  };

  const changeRole = (newRole: RoleType): void => {
    setCurrentRecord((prev) => ({
      ...prev,
      role: newRole,
      roleName: getWorkRoleLabel(newRole, roles),
      hourlyRate: getWorkRoleHourlyRate(newRole, roles),
    }));
  };

  return (
    <div id="add-record-form" className={`glass no-print ${styles.cardContainer}`}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>新增工作記錄</h3>
          <p className={styles.subtitle}>選班別範本一鍵帶入，或手動填寫日期與時間</p>
        </div>

        {/* 行程月曆同步：先選月份再匯入，避免一次把所有月份的班表都灌進來 */}
        <div className={styles.importGroup}>
          <MonthStepper value={importMonth} onChange={setImportMonth} ariaLabel="匯入月份" />
          <button type="button" className={styles.importButton} onClick={onImportFromWorkShifts}>
            從行程月曆匯入
          </button>
        </div>
      </div>

      <div className={styles.fields}>
        {templates.length > 0 && (
          <EditorField label="快速套用班別範本">
            <OptionCardGroup
              ariaLabel="班別範本"
              value={isTemplateApplied ? currentRecord.shiftCategory ?? '' : ''}
              onChange={(name) => {
                const template = templates.find((item) => item.name === name);
                if (template) onApplyTemplate(template);
              }}
              options={templates.map((template) => ({
                value: template.name,
                title: template.name,
                meta: `${template.startTime}–${template.endTime} · $${template.hourlyRate}/h`,
                accent: getAccentColorByName(template.name),
                icon: <BriefcaseIcon size={16} />,
              }))}
            />
          </EditorField>
        )}

        <div className={styles.pickerRow}>
          <EditorField label="日期" required>
            <DatePicker
              label="工作日期"
              value={currentRecord.date}
              onChange={(date) => setCurrentRecord((prev) => ({ ...prev, date }))}
              isOpen={activePicker === 'date'}
              onOpenChange={(open) => setActivePicker(open ? 'date' : null)}
            />
          </EditorField>
          <EditorField label="上班時間" required>
            <TimeRangePicker
              ariaLabel="上班時間"
              startTime={currentRecord.startTime}
              endTime={currentRecord.endTime}
              onStartChange={(value) => changeTime('startTime', value)}
              onEndChange={(value) => changeTime('endTime', value)}
              activeField={activePicker === 'date' ? null : activePicker}
              onActiveFieldChange={setActivePicker}
              startLabel="上班"
              endLabel="下班"
              durations={SHIFT_DURATIONS}
            />
          </EditorField>
        </div>

        <EditorField label="職稱／職位">
          <PillGroup
            ariaLabel="職稱／職位"
            value={currentRecord.role}
            onChange={changeRole}
            options={[
              ...(!roles.some((role) => role.id === currentRecord.role)
                ? [{ value: currentRecord.role, label: `${getWorkRoleLabel(currentRecord.role, roles, currentRecord.roleName)}${roles.length ? '（已移除）' : ''}` }]
                : []),
              ...roles.map((role) => ({ value: role.id, label: role.name, meta: `$${role.hourlyRate}` })),
            ]}
          />
        </EditorField>

        <div className={styles.numberRow}>
          <EditorField label={isTemplateApplied ? '計薪工時（依範本）' : '計薪工時（小時）'} htmlFor="salary-work-hours">
            <input
              id="salary-work-hours"
              className={editorStyles.control}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={workHours}
              onChange={(e) => setWorkHours(e.target.value)}
              placeholder="例：8"
            />
          </EditorField>
          <EditorField label="時薪 (NT$)" htmlFor="salary-hourly-rate">
            <input
              id="salary-hourly-rate"
              className={editorStyles.control}
              type="number"
              inputMode="numeric"
              min="0"
              value={currentRecord.hourlyRate}
              onChange={(e) => setCurrentRecord((prev) => ({ ...prev, hourlyRate: Number(e.target.value) }))}
            />
          </EditorField>
          <EditorField label="班別（選填）" htmlFor="salary-shift-category">
            <select
              id="salary-shift-category"
              className={`${editorStyles.control} ${editorStyles.select}`}
              value={currentRecord.shiftCategory || ''}
              onChange={(e) => {
                const value = e.target.value;
                setCurrentRecord((prev) => ({ ...prev, shiftCategory: value }));
              }}
            >
              <option value="">無班別</option>
              {shiftCategoryOptions.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </EditorField>
        </div>

        <div className={styles.footer}>
          <div className={editorStyles.summary} aria-live="polite">
            <span>{parseFloat(workHours) || 0} 小時 × ${currentRecord.hourlyRate || 0}</span>
            <strong>預估 NT$ {estimatedPay.toLocaleString()}</strong>
          </div>
          <button
            type="button"
            className={`${editorStyles.btn} ${editorStyles.btnSave} ${styles.addButton}`}
            onClick={() => { void onAddRecord(); }}
            disabled={isAddingRecord}
          >
            {isAddingRecord ? '新增中…' : '新增記錄'}
          </button>
        </div>
      </div>
    </div>
  );
}
