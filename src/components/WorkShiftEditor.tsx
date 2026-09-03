'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { generateWorkShiftId, type Course, type WorkShift } from '../data/schedule';
import { getWorkRoleHourlyRate, getWorkRoleLabel, type RoleType } from '@/data/workRoles';
import { getShiftTemplateWorkHours } from '@/data/shiftTemplates';
import Modal, { ModalContent } from './Modal';
import styles from './WorkShiftEditor.module.css';

import { useShiftTemplates } from '@/hooks/useShiftTemplates';
import { useWorkRoles } from '@/hooks/useWorkRoles';
import { findWorkShiftConflicts, formatConflictMessage } from '@/utils/scheduleConflicts';

interface WorkShiftEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: WorkShift) => void | Promise<boolean | void>;
  onDelete?: (shiftId: string) => void;
  shift?: WorkShift | null;
  mode: 'add' | 'edit';
  existingCourses?: Course[];
  existingShifts?: WorkShift[];
}

/**
 * 計算兩時間點之間的工時 (小時)
 */
function calculateHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const totalMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
  return totalMinutes > 0 ? Number((totalMinutes / 60).toFixed(2)) : 0;
}

/**
 * Work Shift Editor Dialog Component
 * 新增或編輯打工班表的對話框，包含薪資格式同步與刪除功能
 */
export default function WorkShiftEditor({
  isOpen,
  onClose,
  onSave,
  onDelete,
  shift,
  mode,
  existingCourses = [],
  existingShifts = [],
}: WorkShiftEditorProps) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { templates } = useShiftTemplates();
  const { roles } = useWorkRoles();
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<WorkShift>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '18:00',
    role: 'assistant',
    hourlyRate: 200,
    workHours: 9,
    shiftCategory: '',
    note: '',
  });

  useEffect(() => {
    if (shift && mode === 'edit') {
      const calculatedH = calculateHours(shift.startTime, shift.endTime);
      const cat = shift.shiftCategory || shift.note || '';
      const matchedTemplate = templates.find((template) => template.name === cat);
      setFormData({
        ...shift,
        role: shift.role || roles[0]?.id || 'assistant',
        roleName: shift.roleName || getWorkRoleLabel(shift.role || roles[0]?.id || 'assistant', roles),
        hourlyRate: shift.hourlyRate ?? getWorkRoleHourlyRate(shift.role || roles[0]?.id || 'assistant', roles),
        workHours: matchedTemplate
          ? getShiftTemplateWorkHours(matchedTemplate, calculatedH)
          : shift.workHours ?? calculatedH,
        shiftCategory: cat,
        note: shift.note || shift.shiftCategory || '',
      });
      // 檢查目前的類別是否在既有範本中
      const matchTemplate = templates.some((t) => t.name === cat);
      setIsCustomCategory(!matchTemplate && Boolean(cat));
    } else if (mode === 'add') {
      const startDate = shift?.date ?? new Date().toISOString().split('T')[0];
      const startT = shift?.startTime ?? '09:00';
      const endT = shift?.endTime ?? '18:00';
      const cat = shift?.shiftCategory || shift?.note || '';
      const role = shift?.role || roles[0]?.id || 'assistant';
      const matchedTemplate = templates.find((template) => template.name === cat);
      setFormData({
        date: startDate,
        startTime: startT,
        endTime: endT,
        role,
        roleName: shift?.roleName || getWorkRoleLabel(role, roles),
        hourlyRate: shift?.hourlyRate ?? getWorkRoleHourlyRate(role, roles),
        workHours: matchedTemplate
          ? getShiftTemplateWorkHours(matchedTemplate, calculateHours(startT, endT))
          : shift?.workHours ?? calculateHours(startT, endT),
        shiftCategory: cat,
        note: shift?.note || '',
      });
      setIsCustomCategory(false);
    }
  }, [shift, mode, roles, templates]);

  /**
   * 當使用者選擇下拉選單範本時，自動將該範本的欄位（時間、職稱／職位、工時、時薪）帶入表單
   */
  const handleSelectTemplate = (selectedName: string) => {
    if (selectedName === '__custom__') {
      setIsCustomCategory(true);
      setFormData((prev) => ({
        ...prev,
        shiftCategory: '',
        note: '',
        workHours: calculateHours(prev.startTime || '09:00', prev.endTime || '18:00'),
      }));
      return;
    }

    setIsCustomCategory(false);
    const selectedTpl = templates.find((t) => t.name === selectedName);
    if (selectedTpl) {
      const startT = selectedTpl.startTime || formData.startTime || '09:00';
      const endT = selectedTpl.endTime || formData.endTime || '18:00';
      const calculatedH = calculateHours(startT, endT);
      const role = selectedTpl.role || formData.role || roles[0]?.id || 'assistant';
      const hourlyRate = selectedTpl.hourlyRate ?? getWorkRoleHourlyRate(role, roles);

      setFormData((prev) => ({
        ...prev,
        shiftCategory: selectedTpl.name,
        note: selectedTpl.name,
        startTime: startT,
        endTime: endT,
        role,
        roleName: getWorkRoleLabel(role, roles),
        hourlyRate,
        workHours: getShiftTemplateWorkHours(selectedTpl, calculatedH),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        shiftCategory: selectedName,
        note: selectedName,
        workHours: calculateHours(prev.startTime || '09:00', prev.endTime || '18:00'),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent, closeModal: () => void = onClose) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.warning('請填寫所有必填欄位');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.warning('結束時間必須晚於開始時間');
      return;
    }

    const role = formData.role || roles[0]?.id || 'assistant';
    const hourlyRate = formData.hourlyRate ?? getWorkRoleHourlyRate(role, roles);
    const autoHours = calculateHours(formData.startTime, formData.endTime);
    const category = formData.shiftCategory?.trim() || formData.note?.trim() || '';
    const matchedTemplate = !isCustomCategory
      ? templates.find((template) => template.name === category)
      : undefined;
    const workHours = matchedTemplate
      ? getShiftTemplateWorkHours(matchedTemplate, autoHours)
      : formData.workHours !== undefined
        ? formData.workHours
        : autoHours;

    const newShift: WorkShift = {
      id: shift?.id || generateWorkShiftId(),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      role,
      roleName: formData.roleName || getWorkRoleLabel(role, roles),
      hourlyRate,
      workHours,
      shiftCategory: category,
      note: category || formData.note,
      salaryRecordId: shift?.salaryRecordId,
      legacyWorkShiftId: shift?.legacyWorkShiftId,
    };

    const conflicts = findWorkShiftConflicts(
      newShift,
      existingCourses,
      existingShifts,
      shift?.id
    );
    if (conflicts.length > 0) {
      const confirmed = await confirm({
        title: '發現行程衝突',
        message: formatConflictMessage(conflicts),
        confirmText: '仍要儲存',
      });
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      const saved = await onSave(newShift);
      if (saved !== false) closeModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (newRole: RoleType) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      roleName: getWorkRoleLabel(newRole, roles),
      hourlyRate: getWorkRoleHourlyRate(newRole, roles),
    }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      const hours = calculateHours(next.startTime || '09:00', next.endTime || '18:00');
      const matchedTemplate = !isCustomCategory
        ? templates.find((template) => template.name === next.shiftCategory)
        : undefined;
      return {
        ...next,
        workHours: matchedTemplate
          ? getShiftTemplateWorkHours(matchedTemplate, hours)
          : hours,
      };
    });
  };

  const handleDelete = (closeModal: () => void = onClose) => {
    if (shift?.id && onDelete) {
      onDelete(shift.id);
      closeModal();
    }
  };

  const selectedTemplate = !isCustomCategory
    ? templates.find((template) => template.name === formData.shiftCategory)
    : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? '新增打工班表' : '編輯打工班表'}
    >
      <ModalContent render={(requestClose) => <form onSubmit={(e) => handleSubmit(e, requestClose)} className={styles.form}>
        {/* 日期與職稱／職位 */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="date">
              日期 <span className={styles.required}>*</span>
            </label>
            <input
              id="date"
              type="date"
              value={formData.date || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="role">
              職稱／職位 <span className={styles.required}>*</span>
            </label>
            <select
              id="role"
              value={formData.role || roles[0]?.id || 'assistant'}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              {roles.length === 0 ? (
                <option value={formData.role || 'assistant'}>
                  {getWorkRoleLabel(formData.role, roles, formData.roleName)}
                </option>
              ) : (
                <>
                  {formData.role && !roles.some((role) => role.id === formData.role) && (
                    <option value={formData.role}>
                      {getWorkRoleLabel(formData.role, roles, formData.roleName)}（已移除）
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

        {/* 時間 */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="startTime">
              開始時間 <span className={styles.required}>*</span>
            </label>
            <input
              id="startTime"
              type="time"
              value={formData.startTime || ''}
              onChange={(e) => handleTimeChange('startTime', e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="endTime">
              結束時間 <span className={styles.required}>*</span>
            </label>
            <input
              id="endTime"
              type="time"
              value={formData.endTime || ''}
              onChange={(e) => handleTimeChange('endTime', e.target.value)}
              required
            />
          </div>
        </div>

        {/* 時薪與計算工時 */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="hourlyRate">時薪 (NT$)</label>
            <input
              id="hourlyRate"
              type="number"
              min="0"
              step="10"
              value={formData.hourlyRate ?? 200}
              onChange={(e) => setFormData((prev) => ({ ...prev, hourlyRate: Number(e.target.value) }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="workHours">
              計薪工時（{selectedTemplate ? '依班別範本' : '小時'}）
            </label>
            <input
              id="workHours"
              type="number"
              min="0"
              step="0.01"
              value={formData.workHours ?? 0}
              readOnly={Boolean(selectedTemplate)}
              onChange={(e) => setFormData((prev) => ({ ...prev, workHours: Number(e.target.value) }))}
            />
          </div>
        </div>

        {/* 班別名稱 / 類別（連動讀取薪資計算中的班別範本管理） */}
        <div className={styles.formGroup}>
          <label htmlFor="shiftCategory">班別名稱 / 類別 (薪資範本)</label>
          {!isCustomCategory ? (
            <select
              id="shiftCategory"
              value={formData.shiftCategory || ''}
              onChange={(e) => handleSelectTemplate(e.target.value)}
            >
              <option value="">-- 請選擇班別範本 --</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.name}>
                  {tpl.name} ({tpl.startTime}~{tpl.endTime} | NT$ {tpl.hourlyRate}/小時)
                </option>
              ))}
              <option value="__custom__">✍️ 自訂輸入班別名稱...</option>
            </select>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="shiftCategory"
                type="text"
                value={formData.shiftCategory || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shiftCategory: e.target.value,
                    note: e.target.value,
                  }))
                }
                placeholder="請輸入自訂班別名稱..."
              />
              <button
                type="button"
                className="btn"
                style={{ fontSize: '0.85rem', flexShrink: 0, padding: '0 12px' }}
                onClick={() => setIsCustomCategory(false)}
              >
                選取範本
              </button>
            </div>
          )}
        </div>

        {/* 按鈕組 */}
        <div className={styles.buttonGroup}>
          {mode === 'edit' && onDelete && (
            <button
              type="button"
              className={`btn ${styles.deleteButton}`}
              onClick={() => handleDelete(requestClose)}
              disabled={isSubmitting}
            >
              🗑️ 刪除
            </button>
          )}
          <button type="button" className={`btn ${styles.cancelButton}`} onClick={requestClose} disabled={isSubmitting}>
            取消
          </button>
          <button type="submit" className={`btn ${styles.saveButton}`} disabled={isSubmitting}>
            {isSubmitting ? '儲存中...' : mode === 'add' ? '新增' : '儲存'}
          </button>
        </div>
      </form>} />
    </Modal>
  );
}
