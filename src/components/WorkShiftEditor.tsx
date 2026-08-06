'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { WorkShift } from '../data/schedule';
import Modal from './Modal';
import styles from './WorkShiftEditor.module.css';

import { useShiftTemplates } from '@/hooks/useShiftTemplates';

interface WorkShiftEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: WorkShift) => void;
  onDelete?: (shiftId: string) => void;
  shift?: WorkShift | null;
  mode: 'add' | 'edit';
}

const ROLE_RATES = {
  assistant: 200,
  instructor: 500,
};

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
}: WorkShiftEditorProps) {
  const { toast } = useToast();
  const { templates } = useShiftTemplates();
  const [isCustomCategory, setIsCustomCategory] = useState(false);

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
      setFormData({
        ...shift,
        role: shift.role || 'assistant',
        hourlyRate: shift.hourlyRate || (shift.role === 'instructor' ? 500 : 200),
        workHours: shift.workHours ?? calculatedH,
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
      setFormData({
        date: startDate,
        startTime: startT,
        endTime: endT,
        role: 'assistant',
        hourlyRate: 200,
        workHours: calculateHours(startT, endT),
        shiftCategory: cat,
        note: shift?.note || '',
      });
      setIsCustomCategory(false);
    }
  }, [shift, mode, templates]);

  /**
   * 當使用者選擇下拉選單範本時，自動將該範本的欄位 (時間/身份/時薪) 帶入表單
   */
  const handleSelectTemplate = (selectedName: string) => {
    if (selectedName === '__custom__') {
      setIsCustomCategory(true);
      setFormData((prev) => ({ ...prev, shiftCategory: '', note: '' }));
      return;
    }

    setIsCustomCategory(false);
    const selectedTpl = templates.find((t) => t.name === selectedName);
    if (selectedTpl) {
      const startT = selectedTpl.startTime || formData.startTime || '09:00';
      const endT = selectedTpl.endTime || formData.endTime || '18:00';
      const calculatedH = calculateHours(startT, endT);
      const role = selectedTpl.role || formData.role || 'assistant';
      const hourlyRate = selectedTpl.hourlyRate ?? ROLE_RATES[role];

      setFormData((prev) => ({
        ...prev,
        shiftCategory: selectedTpl.name,
        note: selectedTpl.name,
        startTime: startT,
        endTime: endT,
        role,
        hourlyRate,
        workHours: calculatedH > 0 ? calculatedH : prev.workHours,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        shiftCategory: selectedName,
        note: selectedName,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.warning('請填寫所有必填欄位');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.warning('結束時間必須晚於開始時間');
      return;
    }

    const role = formData.role || 'assistant';
    const hourlyRate = formData.hourlyRate ?? ROLE_RATES[role];
    const autoHours = calculateHours(formData.startTime, formData.endTime);
    const workHours = formData.workHours !== undefined ? formData.workHours : autoHours;
    const category = formData.shiftCategory?.trim() || formData.note?.trim() || '';

    const newShift: WorkShift = {
      id: shift?.id || `shift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      role,
      hourlyRate,
      workHours,
      shiftCategory: category,
      note: category || formData.note,
      salaryRecordId: shift?.salaryRecordId,
      legacyWorkShiftId: shift?.legacyWorkShiftId,
    };

    onSave(newShift);
    onClose();
  };

  const handleRoleChange = (newRole: 'assistant' | 'instructor') => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      hourlyRate: ROLE_RATES[newRole],
    }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      const hours = calculateHours(next.startTime || '09:00', next.endTime || '18:00');
      return { ...next, workHours: hours };
    });
  };

  const handleDelete = () => {
    if (shift?.id && onDelete) {
      onDelete(shift.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? '新增打工班表' : '編輯打工班表'}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* 日期與身份 */}
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
              身份權限 <span className={styles.required}>*</span>
            </label>
            <select
              id="role"
              value={formData.role || 'assistant'}
              onChange={(e) => handleRoleChange(e.target.value as 'assistant' | 'instructor')}
            >
              <option value="assistant">助教 ($200/hr)</option>
              <option value="instructor">講師 ($500/hr)</option>
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
            <label htmlFor="workHours">計薪工時 (小時)</label>
            <input
              id="workHours"
              type="number"
              min="0"
              step="0.5"
              value={formData.workHours ?? 0}
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
                  {tpl.name} ({tpl.startTime}~{tpl.endTime} | ${tpl.hourlyRate || (tpl.role === 'instructor' ? 500 : 200)}/h)
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
                autoFocus
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
              onClick={handleDelete}
            >
              🗑️ 刪除
            </button>
          )}
          <button type="button" className={`btn ${styles.cancelButton}`} onClick={onClose}>
            取消
          </button>
          <button type="submit" className={`btn ${styles.saveButton}`}>
            {mode === 'add' ? '新增' : '儲存'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
