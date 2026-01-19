'use client';
import { useState } from 'react';
import { useScheduleData } from '../hooks/useScheduleData';
import { useTheme } from '../hooks/useTheme';
import {
  exportCoursesToICS,
  exportWorkShiftsToICS,
  exportEventsToICS,
  exportAllToICS,
  downloadICS,
} from '../utils/icsExport';
import {
  createBackup,
  exportBackup,
  importBackup,
  validateBackup,
  exportCoursesToCSV,
  exportWorkShiftsToCSV,
  downloadCSV,
} from '../utils/backup';
import styles from './ExportImport.module.css';

/**
 * Export/Import Manager Component
 * 管理資料的匯出與匯入
 */
export default function ExportImport() {
  const { courses, shifts, events, addCourse, addWorkShift, addEvent, resetToDefault } = useScheduleData();
  const { theme } = useTheme();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 匯出為 ICS
  const handleExportICS = (type: 'courses' | 'work' | 'events' | 'all') => {
    try {
      let content: string;
      let filename: string;

      switch (type) {
        case 'courses':
          content = exportCoursesToICS(courses);
          filename = 'courses.ics';
          break;
        case 'work':
          content = exportWorkShiftsToICS(shifts);
          filename = 'work-shifts.ics';
          break;
        case 'events':
          content = exportEventsToICS(events);
          filename = 'events.ics';
          break;
        case 'all':
          content = exportAllToICS(courses, shifts, events);
          filename = 'complete-schedule.ics';
          break;
      }

      downloadICS(content, filename);
      showMessage('success', '匯出成功！可同步到 Google/Apple Calendar');
    } catch (error) {
      showMessage('error', '匯出失敗：' + (error as Error).message);
    }
  };

  // 匯出備份
  const handleExportBackup = () => {
    try {
      const backup = createBackup(courses, shifts, events, theme);
      exportBackup(backup);
      showMessage('success', '備份檔案已下載');
    } catch (error) {
      showMessage('error', '備份失敗：' + (error as Error).message);
    }
  };

  // 匯入備份
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const backup = await importBackup(file);
      const validation = validateBackup(backup);

      if (!validation.valid) {
        showMessage('error', '備份檔案格式錯誤：\n' + validation.errors.join('\n'));
        return;
      }

      // 確認是否要覆蓋現有資料
      if (
        !confirm(
          `確定要還原備份嗎？\n\n備份資訊：\n- 匯出日期：${new Date(backup.exportDate).toLocaleString()}\n- 課程數量：${backup.courses.length}\n- 打工班表：${backup.workShifts.length}\n- 重要事件：${backup.events.length}\n\n此操作會覆蓋目前的資料！`
        )
      ) {
        return;
      }

      // 清除現有資料並匯入
      resetToDefault();
      backup.courses.forEach((course) => addCourse(course));
      backup.workShifts.forEach((shift) => addWorkShift(shift));
      backup.events.forEach((event) => addEvent(event));

      showMessage('success', '備份已成功還原！');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      showMessage('error', '匯入失敗：' + (error as Error).message);
    }

    // 重置 input
    e.target.value = '';
  };

  // 匯出為 CSV
  const handleExportCSV = (type: 'courses' | 'work') => {
    try {
      let content: string;
      let filename: string;

      if (type === 'courses') {
        content = exportCoursesToCSV(courses);
        filename = 'courses.csv';
      } else {
        content = exportWorkShiftsToCSV(shifts);
        filename = 'work-shifts.csv';
      }

      downloadCSV(content, filename);
      showMessage('success', 'CSV 檔案已下載');
    } catch (error) {
      showMessage('error', '匯出失敗：' + (error as Error).message);
    }
  };

  return (
    <div className={styles.container}>
      <button className={`btn ${styles.toggleButton}`} onClick={() => setIsOpen(!isOpen)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>匯出 / 匯入</span>
      </button>

      {isOpen && (
        <div className={`glass ${styles.panel}`}>
          <div className={styles.header}>
            <h3>資料管理</h3>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className={styles.section}>
            <h4>📅 匯出行事曆 (ICS)</h4>
            <p className={styles.description}>可匯入 Google Calendar、Apple Calendar 等行事曆應用</p>
            <div className={styles.buttonGroup}>
              <button className="btn" onClick={() => handleExportICS('courses')}>
                課程表
              </button>
              <button className="btn" onClick={() => handleExportICS('work')}>
                打工班表
              </button>
              <button className="btn" onClick={() => handleExportICS('events')}>
                重要事件
              </button>
              <button className={`btn ${styles.primaryButton}`} onClick={() => handleExportICS('all')}>
                完整行程
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <h4>💾 備份與還原</h4>
            <p className={styles.description}>備份所有資料，包含課表、打工班表和主題設定</p>
            <div className={styles.buttonGroup}>
              <button className="btn" onClick={handleExportBackup}>
                下載備份檔
              </button>
              <label className={`btn ${styles.uploadButton}`}>
                匯入備份檔
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h4>📊 匯出為 CSV</h4>
            <p className={styles.description}>匯出為試算表格式，可用 Excel 或 Google Sheets 開啟</p>
            <div className={styles.buttonGroup}>
              <button className="btn" onClick={() => handleExportCSV('courses')}>
                課程表 CSV
              </button>
              <button className="btn" onClick={() => handleExportCSV('work')}>
                打工班表 CSV
              </button>
            </div>
          </div>

          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
