import { Course, WorkShift, Event } from '../data/schedule';

/**
 * Backup and Restore Utilities
 * 用於備份和還原應用程式資料
 */

export interface BackupData {
  version: string;
  exportDate: string;
  courses: Course[];
  workShifts: WorkShift[];
  events: Event[];
  theme?: string;
}

/**
 * 建立備份資料
 */
export function createBackup(
  courses: Course[],
  shifts: WorkShift[],
  events: Event[],
  theme?: string
): BackupData {
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    courses,
    workShifts: shifts,
    events,
    theme,
  };
}

/**
 * 匯出備份為 JSON 檔案
 */
export function exportBackup(backup: BackupData, filename?: string): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `schedule-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 從 JSON 檔案匯入備份
 */
export function importBackup(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content) as BackupData;
        
        // 驗證備份資料格式
        if (!backup.version || !backup.courses || !backup.workShifts || !backup.events) {
          throw new Error('無效的備份檔案格式');
        }
        
        resolve(backup);
      } catch (error) {
        reject(new Error('無法讀取備份檔案：' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('檔案讀取失敗'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * 驗證備份資料
 */
export function validateBackup(backup: BackupData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 檢查版本
  if (!backup.version) {
    errors.push('缺少版本資訊');
  }
  
  // 檢查日期
  if (!backup.exportDate) {
    errors.push('缺少匯出日期');
  }
  
  // 檢查課程資料
  if (!Array.isArray(backup.courses)) {
    errors.push('課程資料格式錯誤');
  } else {
    backup.courses.forEach((course, index) => {
      if (!course.id || !course.name || !course.day || !course.startTime || !course.endTime) {
        errors.push(`課程 #${index + 1} 資料不完整`);
      }
    });
  }
  
  // 檢查打工班表資料
  if (!Array.isArray(backup.workShifts)) {
    errors.push('打工班表資料格式錯誤');
  } else {
    backup.workShifts.forEach((shift, index) => {
      if (!shift.id || !shift.date || !shift.startTime || !shift.endTime) {
        errors.push(`打工班表 #${index + 1} 資料不完整`);
      }
    });
  }
  
  // 檢查事件資料
  if (!Array.isArray(backup.events)) {
    errors.push('事件資料格式錯誤');
  } else {
    backup.events.forEach((event, index) => {
      if (!event.id || !event.title || !event.date || !event.type) {
        errors.push(`事件 #${index + 1} 資料不完整`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 匯出為 CSV 格式（課程）
 */
export function exportCoursesToCSV(courses: Course[]): string {
  const headers = ['課程名稱', '星期', '開始時間', '結束時間', '地點'];
  const dayNames = ['', '一', '二', '三', '四', '五', '六', '日'];
  
  const rows = courses.map(course => [
    course.name,
    `星期${dayNames[course.day]}`,
    course.startTime,
    course.endTime,
    course.location || '',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  return '\ufeff' + csvContent; // BOM for UTF-8
}

/**
 * 匯出為 CSV 格式（打工班表）
 */
export function exportWorkShiftsToCSV(shifts: WorkShift[]): string {
  const headers = ['日期', '開始時間', '結束時間', '備註'];
  
  const rows = shifts.map(shift => [
    shift.date,
    shift.startTime,
    shift.endTime,
    shift.note || '',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  return '\ufeff' + csvContent; // BOM for UTF-8
}

/**
 * 下載 CSV 檔案
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
