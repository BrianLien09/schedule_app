/**
 * 課程筆記資料型別定義
 * 
 * 用於記錄每堂課的筆記、作業、考試等資訊
 */

export type NoteType = 'note' | 'homework' | 'exam';

export interface CourseNote {
  id: string;
  courseId: string;        // 關聯課程 ID
  courseName?: string;     // 課程名稱（冗餘欄位，方便顯示）
  type: NoteType;          // 筆記類型
  title: string;           // 標題
  content: string;         // 內容（支援 Markdown）
  dueDate?: string;        // 繳交/考試日期 (ISO 8601 格式)
  completed: boolean;      // 是否完成
  priority?: 'low' | 'medium' | 'high';  // 優先級
  tags?: string[];         // 標籤（可選）
  createdAt: string;       // 建立時間
  updatedAt: string;       // 更新時間
}

/**
 * 筆記類型顯示名稱映射
 */
export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  note: '📝 筆記',
  homework: '📚 作業',
  exam: '📝 考試',
};

/**
 * 筆記類型顏色映射（用於 UI 顯示）
 */
export const NOTE_TYPE_COLORS: Record<NoteType, string> = {
  note: 'var(--color-primary)',
  homework: 'var(--color-highlight)',
  exam: '#ff6b6b',
};

/**
 * 優先級顯示名稱映射
 */
export const PRIORITY_LABELS = {
  low: '低',
  medium: '中',
  high: '高',
};

/**
 * 優先級顏色映射
 */
export const PRIORITY_COLORS = {
  low: '#95a5a6',
  medium: '#f39c12',
  high: '#e74c3c',
};

/**
 * 預設筆記資料
 */
export const defaultNote: Omit<CourseNote, 'id' | 'createdAt' | 'updatedAt'> = {
  courseId: '',
  courseName: '',
  type: 'note',
  title: '',
  content: '',
  completed: false,
  priority: 'medium',
  tags: [],
};
