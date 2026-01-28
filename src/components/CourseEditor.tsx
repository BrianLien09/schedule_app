'use client';
import { useState, useEffect } from 'react';
import { Course } from '../data/schedule';
import styles from './CourseEditor.module.css';

interface CourseEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  course?: Course | null;
  mode: 'add' | 'edit';
}

/**
 * Course Editor Dialog Component
 * 新增或編輯課程的對話框
 */
export default function CourseEditor({ isOpen, onClose, onSave, course, mode }: CourseEditorProps) {
  const [formData, setFormData] = useState<Partial<Course>>({
    name: '',
    day: 1,
    startTime: '08:10',
    endTime: '10:00',
    location: '',
    color: '#d4a574',
  });

  useEffect(() => {
    if (course && mode === 'edit') {
      setFormData(course);
    } else if (mode === 'add') {
      setFormData({
        name: '',
        day: 1,
        startTime: '08:10',
        endTime: '10:00',
        location: '',
        color: '#d4a574',
      });
    }
  }, [course, mode]);

  // 鍵盤快捷鍵：Esc 關閉對話框
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.startTime || !formData.endTime) {
      alert('請填寫所有必填欄位');
      return;
    }

    // 驗證結束時間必須大於開始時間
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      alert('結束時間必須晚於開始時間');
      return;
    }

    const newCourse: Course = {
      id: course?.id || `course-${Date.now()}`,
      name: formData.name!,
      day: formData.day!,
      startTime: formData.startTime!,
      endTime: formData.endTime!,
      location: formData.location,
      color: formData.color,
    };

    onSave(newCourse);
    onClose();
  };

  const handleChange = (field: keyof Course, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`glass ${styles.dialog}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{mode === 'add' ? '新增課程' : '編輯課程'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">
              課程名稱 <span className={styles.required}>*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="例如：資料結構"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="day">
                星期 <span className={styles.required}>*</span>
              </label>
              <select
                id="day"
                value={formData.day}
                onChange={(e) => handleChange('day', parseInt(e.target.value))}
              >
                <option value={1}>星期一</option>
                <option value={2}>星期二</option>
                <option value={3}>星期三</option>
                <option value={4}>星期四</option>
                <option value={5}>星期五</option>
                <option value={6}>星期六</option>
                <option value={7}>星期日</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="color">顏色</label>
              <input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className={styles.colorPicker}
              />
            </div>
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
            <label htmlFor="location">地點</label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="例如：博愛G513電腦教室"
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
