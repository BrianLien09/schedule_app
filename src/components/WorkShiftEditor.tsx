'use client';
import { useState, useEffect } from 'react';
import { WorkShift } from '../data/schedule';
import styles from './WorkShiftEditor.module.css';

interface WorkShiftEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: WorkShift) => void;
  shift?: WorkShift | null;
  mode: 'add' | 'edit';
}

/**
 * Work Shift Editor Dialog Component
 * 新增或編輯打工班表的對話框
 */
export default function WorkShiftEditor({ isOpen, onClose, onSave, shift, mode }: WorkShiftEditorProps) {
  const [formData, setFormData] = useState<Partial<WorkShift>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '18:00',
    note: '',
  });

  useEffect(() => {
    if (shift && mode === 'edit') {
      setFormData(shift);
    } else if (mode === 'add') {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '18:00',
        note: '',
      });
    }
  }, [shift, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.startTime || !formData.endTime) {
      alert('請填寫所有必填欄位');
      return;
    }

    const newShift: WorkShift = {
      id: shift?.id || `shift-${Date.now()}`,
      date: formData.date!,
      startTime: formData.startTime!,
      endTime: formData.endTime!,
      note: formData.note,
    };

    onSave(newShift);
    onClose();
  };

  const handleChange = (field: keyof WorkShift, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`glass ${styles.dialog}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{mode === 'add' ? '新增打工班表' : '編輯打工班表'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="date">
              日期 <span className={styles.required}>*</span>
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="startTime">
                開始時間 <span className={styles.required}>*</span>
              </label>
              <input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
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
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="note">備註</label>
            <input
              id="note"
              type="text"
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="例如：冬令營助教"
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" className={`btn ${styles.cancelButton}`} onClick={onClose}>
              取消
            </button>
            <button type="submit" className={`btn ${styles.saveButton}`}>
              {mode === 'add' ? '新增' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
