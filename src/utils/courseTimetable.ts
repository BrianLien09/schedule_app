import type { Course } from '@/data/schedule';

export interface TimetablePeriod {
  id: number;
  label: string;
  time: string;
  start: string;
  end: string;
}

export interface CourseTimetablePlacement {
  columnStart: number;
  rowStart: number;
  rowEnd: number;
}

export const SCHOOL_PERIODS: TimetablePeriod[] = [
  { id: 1, label: '第 1 節', time: '0810-0900', start: '08:10', end: '09:00' },
  { id: 2, label: '第 2 節', time: '0910-1000', start: '09:10', end: '10:00' },
  { id: 3, label: '第 3 節', time: '1010-1100', start: '10:10', end: '11:00' },
  { id: 4, label: '第 4 節', time: '1110-1200', start: '11:10', end: '12:00' },
  { id: 5, label: '第 5 節', time: '1210-1300', start: '12:10', end: '13:00' },
  { id: 6, label: '第 6 節', time: '1310-1400', start: '13:10', end: '14:00' },
  { id: 7, label: '第 7 節', time: '1410-1500', start: '14:10', end: '15:00' },
  { id: 8, label: '第 8 節', time: '1510-1600', start: '15:10', end: '16:00' },
  { id: 9, label: '第 9 節', time: '1610-1700', start: '16:10', end: '17:00' },
  { id: 10, label: '第 10 節', time: '1710-1800', start: '17:10', end: '18:00' },
];

/**
 * 將課程固定到對應的星期欄與節次列，避免跨節課程影響其他格子的自動排版。
 */
export function getCourseTimetablePlacement(
  course: Course,
  periods: TimetablePeriod[] = SCHOOL_PERIODS
): CourseTimetablePlacement | null {
  if (course.day < 1 || course.day > 5) {
    return null;
  }

  const startIndex = periods.findIndex((period) => period.start === course.startTime);
  const endIndex = periods.findIndex((period) => period.end === course.endTime);

  if (startIndex === -1 || endIndex < startIndex) {
    return null;
  }

  return {
    columnStart: course.day + 1,
    rowStart: startIndex + 2,
    rowEnd: endIndex + 3,
  };
}
