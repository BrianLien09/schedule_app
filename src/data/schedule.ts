export interface Course {
  id: string;
  name: string;
  day: number; // 1-7 for Mon-Sun
  startTime: string;
  endTime: string;
  location?: string;
  teacher?: string;
  color?: string;
  semester?: string; // 學期標識，如 "2025-1"（大一上）, "2025-2"（大一下）
}

export interface WorkShift {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location?: string;
  note?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  type: 'exam' | 'deadline' | 'personal' | 'holiday';
}

export const schoolSchedule: Course[] = [
  // Monday - 使用多樣化色系
  { id: 'mon-1', name: '職涯分析與規劃', day: 1, startTime: '08:10', endTime: '10:00', location: '博愛CB105D', color: '#FCD34D' },
  { id: 'mon-2', name: '國文(II)：語文表達', day: 1, startTime: '10:10', endTime: '12:00', location: '博愛C306', color: '#FB923C' },
  { id: 'mon-3', name: '數位電子學', day: 1, startTime: '13:10', endTime: '16:00', location: '博愛G313', color: '#A78BFA' },

  // Tuesday - 使用亮色系
  { id: 'tue-1', name: '網際網路概論', day: 2, startTime: '08:10', endTime: '10:00', location: '博愛G512電腦教室', color: '#60A5FA' },
  { id: 'tue-2', name: '大學生活學習與輔導', day: 2, startTime: '13:10', endTime: '15:00', location: '博愛G313', color: '#F9A8D4' },

  // Wednesday - 使用綠色系與紅色系
  { id: 'wed-1', name: '英文(II)', day: 3, startTime: '08:10', endTime: '10:00', location: '博愛C608', color: '#34D399' },
  { id: 'wed-2', name: '羽球', day: 3, startTime: '10:10', endTime: '12:00', location: '博愛公誠樓籃球場', color: '#F87171' },
  { id: 'wed-3', name: '資料結構', day: 3, startTime: '15:10', endTime: '18:00', location: '博愛G513電腦教室', color: '#818CF8' },

  // Friday - 使用多彩色系
  { id: 'fri-1', name: '民歌與吉他', day: 5, startTime: '08:10', endTime: '10:00', location: '博愛M304', color: '#2DD4BF' },
  { id: 'fri-2', name: 'Python資料視覺化', day: 5, startTime: '10:10', endTime: '12:00', location: '博愛G521電腦教室', color: '#A3E635' },
  { id: 'fri-3', name: 'C程式設計', day: 5, startTime: '13:10', endTime: '16:00', location: '博愛G512電腦教室', color: '#FB7185' },
];

export const workShifts: WorkShift[] = [
  // Autumn Class (Jan)
  { id: 'aut-1', date: '2026-01-11', startTime: '09:00', endTime: '18:00', note: '秋季班' },
  { id: 'aut-2', date: '2026-01-17', startTime: '09:00', endTime: '18:00', note: '秋季班' },
  { id: 'aut-3', date: '2026-01-18', startTime: '09:00', endTime: '18:00', note: '秋季班' },

  // Winter Camp (Jan - Feb)
  { id: 'win-1', date: '2026-01-27', startTime: '09:00', endTime: '18:00', note: '冬令營助教' },
  { id: 'win-2', date: '2026-01-29', startTime: '09:00', endTime: '18:00', note: '冬令營助教' },
  { id: 'win-3', date: '2026-02-02', startTime: '09:00', endTime: '18:00', note: '冬令營助教' },
  { id: 'win-4', date: '2026-02-04', startTime: '09:00', endTime: '18:00', note: '冬令營助教' },
  { id: 'win-5', date: '2026-02-05', startTime: '09:00', endTime: '18:00', note: '冬令營助教' },
  { id: 'win-6', date: '2026-02-06', startTime: '09:00', endTime: '18:00', note: '冬令營助教' },
  { id: 'win-7', date: '2026-02-09', startTime: '09:00', endTime: '18:00', note: '冬令營助教' },
  { id: 'win-8', date: '2026-02-10', startTime: '09:00', endTime: '18:00', note: '冬令營助教' },
  { id: 'win-9', date: '2026-02-11', startTime: '09:00', endTime: '18:00', note: '冬令營助教' },
  { id: 'win-10', date: '2026-02-13', startTime: '09:00', endTime: '18:00', note: '冬令營助教' },
];

export const importantEvents: Event[] = [
  { id: 'evt-1', title: '期中考週', date: '2026-04-13', type: 'exam', description: '準備資料結構與C程式設計' },
  { id: 'evt-2', title: '期末考週', date: '2026-06-15', type: 'exam', description: '本學期最後一週' },
];

export function generateWorkShiftId(): string {
  return `shift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}
