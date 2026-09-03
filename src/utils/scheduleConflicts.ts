import type { Course, WorkShift } from '@/data/schedule';

export interface ScheduleConflict {
  sourceType: 'course' | 'work';
  title: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
}

export function getCourseDayForDate(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 0 ? 7 : weekday;
}

function isTimeOverlapping(
  startTime: string,
  endTime: string,
  otherStartTime: string,
  otherEndTime: string
): boolean {
  return startTime < otherEndTime && endTime > otherStartTime;
}

function getCourseLabel(course: Course): string {
  return course.location ? `${course.name}（${course.location}）` : course.name;
}

export function findWorkShiftConflicts(
  candidate: WorkShift,
  _courses: Course[],
  shifts: WorkShift[],
  excludedShiftId?: string
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  // 依需求僅比對打工班表之間的重疊，不與上學課程產生衝突提醒
  shifts
    .filter(
      (shift) =>
        shift.id !== excludedShiftId &&
        shift.date === candidate.date &&
        isTimeOverlapping(candidate.startTime, candidate.endTime, shift.startTime, shift.endTime)
    )
    .forEach((shift) => {
      conflicts.push({
        sourceType: 'work',
        title: shift.shiftCategory || shift.note || '打工班表',
        dateLabel: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
      });
    });

  return conflicts;
}

export function findCourseConflicts(
  candidate: Course,
  courses: Course[],
  _shifts: WorkShift[],
  excludedCourseId?: string
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  // 依需求僅比對同一天的課程重疊，不與打工班表產生衝突提醒
  courses
    .filter(
      (course) =>
        course.id !== excludedCourseId &&
        course.day === candidate.day &&
        isTimeOverlapping(candidate.startTime, candidate.endTime, course.startTime, course.endTime)
    )
    .forEach((course) => {
      conflicts.push({
        sourceType: 'course',
        title: getCourseLabel(course),
        dateLabel: `星期${candidate.day}`,
        startTime: course.startTime,
        endTime: course.endTime,
      });
    });

  return conflicts;
}

export function formatConflictMessage(conflicts: ScheduleConflict[]): string {
  const uniqueLines = Array.from(
    new Set(
      conflicts.map(
        (conflict) =>
          `・${conflict.sourceType === 'course' ? '課程' : '打工'}「${conflict.title}」 ${conflict.dateLabel} ${conflict.startTime}-${conflict.endTime}`
      )
    )
  );
  const lines = uniqueLines.slice(0, 5);
  const extraCount = Math.max(0, uniqueLines.length - lines.length);
  return `發現時間重疊：\n${lines.join('\n')}${extraCount > 0 ? `\n另有 ${extraCount} 筆衝突` : ''}\n\n仍要儲存嗎？`;
}
