export interface Course {
  id: string;
  name: string;
  day: number; // 1-7 for Mon-Sun
  startTime: string;
  endTime: string;
  location?: string;
  color?: string;
}

export interface WorkShift {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
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
  // Monday
  { id: 'mon-1', name: '職涯分析與規劃', day: 1, startTime: '08:10', endTime: '10:00', location: '博愛CB105D', color: '#fca5a5' },
  { id: 'mon-2', name: '國文(II)：語文表達', day: 1, startTime: '10:10', endTime: '12:00', location: '博愛C306', color: '#fda4af' },
  { id: 'mon-3', name: '數位電子學', day: 1, startTime: '13:10', endTime: '16:00', location: '博愛G313', color: 'var(--color-primary)' },

  // Tuesday
  { id: 'tue-1', name: '網際網路概論', day: 2, startTime: '08:10', endTime: '10:00', location: '博愛G512電腦教室', color: '#fdba74' },
  { id: 'tue-2', name: '大學生活學習與輔導', day: 2, startTime: '13:10', endTime: '15:00', location: '博愛G313', color: 'var(--color-highlight)' },

  // Wednesday
  { id: 'wed-1', name: '英文(II)', day: 3, startTime: '08:10', endTime: '10:00', location: '博愛C608', color: '#86efac' },
  { id: 'wed-2', name: '羽球', day: 3, startTime: '10:10', endTime: '12:00', location: '博愛公誠樓籃球場', color: '#bef264' },
  { id: 'wed-3', name: '資料結構', day: 3, startTime: '15:10', endTime: '18:00', location: '博愛G513電腦教室', color: 'var(--color-secondary)' },

  // Friday
  { id: 'fri-1', name: '民歌與吉他', day: 5, startTime: '08:10', endTime: '10:00', location: '博愛M304', color: '#93c5fd' },
  { id: 'fri-2', name: 'Python資料視覺化', day: 5, startTime: '10:10', endTime: '12:00', location: '博愛G521電腦教室', color: '#c4b5fd' },
  { id: 'fri-3', name: 'C程式設計', day: 5, startTime: '13:10', endTime: '16:00', location: '博愛G512電腦教室', color: '#a78bfa' },
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
  { id: 'sel-1', title: '志願序結果查詢 & 本班選課', date: '2026-01-05', description: '09:00 查詢結果 / 19:00 開始選課', type: 'deadline' },
  { id: 'sel-2', title: '本系選課 (含輔雙)', date: '2026-01-06', description: '19:00 開始', type: 'deadline' },
  { id: 'sel-3', title: '跨系/跨班選課', date: '2026-01-08', description: '19:00 開始', type: 'deadline' },
  { id: 'sel-4', title: '全校網路加退選', date: '2026-02-23', description: '上午 10:00 開始', type: 'deadline' },
  { id: 'sel-5', title: '人工加退選', date: '2026-03-02', description: '上午 09:00 開始', type: 'personal' },
];
