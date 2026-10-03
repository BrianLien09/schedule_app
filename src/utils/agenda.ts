import type { Course, Event, WorkShift } from '@/data/schedule';
import type { AgendaTask } from '@/data/todos';

export type AgendaKind = 'class' | 'work' | 'event' | 'homework' | 'exam' | 'todo';
export interface AgendaItem {
  id: string;
  sourceId: string;
  kind: AgendaKind;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  detail?: string;
}

export const AGENDA_LABELS: Record<AgendaKind, string> = {
  class: '課程', work: '打工', event: '事件', homework: '作業', exam: '考試', todo: '待辦',
};

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function getWeekDays(date: Date): Date[] {
  const monday = addCalendarDays(date, -((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(monday, index));
}

/** 筆記編輯器只收日期；舊資料以 UTC 午夜儲存，仍應視為該日整天的期限。 */
export function taskDueDate(note: AgendaTask): string | undefined {
  const date = (note.type === 'todo' ? note.endDate || note.startDate : note.dueDate)?.slice(0, 10);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) || localDateKey(parsed) !== date ? undefined : date;
}

export function isTaskOverdue(note: AgendaTask, now: Date): boolean {
  const due = taskDueDate(note);
  return !note.completed && Boolean(due && due < localDateKey(now));
}

export function getPendingTasks<T extends AgendaTask>(notes: T[], now: Date, recentOnly: boolean): T[] {
  const lastDate = localDateKey(addCalendarDays(now, 6));
  const priority = { high: 0, medium: 1, low: 2 };
  return notes.filter((note) => {
    if (note.completed || note.type === 'note') return false;
    const due = taskDueDate(note);
    if (note.type === 'todo' && recentOnly) return !due || (note.startDate || due) <= lastDate;
    return !recentOnly || Boolean(due && due <= lastDate);
  }).sort((a, b) =>
    (taskDueDate(a) ?? '9999').localeCompare(taskDueDate(b) ?? '9999') ||
    priority[a.priority ?? 'medium'] - priority[b.priority ?? 'medium'] ||
    a.title.localeCompare(b.title)
  );
}

export function buildAgenda(
  dates: Date[], courses: Course[], shifts: WorkShift[], events: Event[], notes: AgendaTask[],
): AgendaItem[] {
  return dates.flatMap((date) => {
    const key = localDateKey(date);
    const day = date.getDay() || 7;
    const items: AgendaItem[] = [
      ...courses.filter((course) => course.day === day).map((course): AgendaItem => ({
        id: `class-${key}-${course.id}`, sourceId: course.id, kind: 'class', title: course.name,
        date: key, startTime: course.startTime, endTime: course.endTime, detail: course.location,
      })),
      ...shifts.filter((shift) => shift.date === key).map((shift): AgendaItem => ({
        id: `work-${shift.id}`, sourceId: shift.id, kind: 'work',
        title: shift.shiftCategory || shift.note || shift.roleName || '打工班次',
        date: key, startTime: shift.startTime, endTime: shift.endTime, detail: shift.location,
      })),
      ...events.filter((event) => event.date === key).map((event): AgendaItem => ({
        id: `event-${event.id}`, sourceId: event.id, kind: 'event', title: event.title,
        date: key, detail: event.description,
      })),
      ...notes.filter((note) => !note.completed && note.type !== 'note' && (note.type === 'todo'
        ? Boolean(note.startDate && key === note.startDate) || Boolean(note.endDate && key === note.endDate)
        : taskDueDate(note) === key))
        .map((note): AgendaItem => ({
          id: `task-${key}-${note.id}`, sourceId: note.id, kind: note.type === 'todo' ? 'todo' : note.type === 'exam' ? 'exam' : 'homework',
          title: note.title, date: key, detail: note.type === 'todo' ? note.associationLabel : note.courseName,
        })),
    ];
    return items.sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '') || a.title.localeCompare(b.title));
  });
}

export function agendaHref(item: AgendaItem): string {
  if (item.kind === 'todo') return `/?todo=${encodeURIComponent(item.sourceId)}`;
  if (item.kind === 'work') return '/schedule/work';
  if (item.kind === 'class') return '/schedule/school';
  if (item.kind === 'event') return `/schedule/overview?date=${item.date}`;
  return `/schedule/school#note-${encodeURIComponent(item.sourceId)}`;
}

export function dateLabel(date: string, today: Date): string {
  if (date === localDateKey(today)) return '今天';
  if (date === localDateKey(addCalendarDays(today, 1))) return '明天';
  const parsed = new Date(`${date}T00:00:00`);
  return `${parsed.getMonth() + 1}/${parsed.getDate()}（${['日', '一', '二', '三', '四', '五', '六'][parsed.getDay()]}）`;
}
