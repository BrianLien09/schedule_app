import type { Todo, TodoInput } from '@/data/todos';

export function validateTodo(input: TodoInput): string | null {
  if (!input.title.trim()) return '請填寫標題';
  for (const date of [input.startDate, input.endDate]) {
    if (!date) continue;
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return '請填寫有效日期';
  }
  if (input.startDate && input.endDate && input.endDate < input.startDate) return '結束日期不能早於開始日期';
  for (const [date, time] of [[input.startDate, input.startTime], [input.endDate, input.endTime]]) {
    if (!time) continue;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return '請填寫有效時間';
    if (!date) return '設定時間時也需要填寫日期';
  }
  if (input.startDate && input.startDate === input.endDate && input.startTime && input.endTime && input.endTime < input.startTime) return '結束時間不能早於開始時間';
  if (input.association !== 'none' && !input.associationId) return '請選擇關聯的課程或打工';
  if (input.syncToFamily && !input.startDate && !input.endDate) return '同步家庭月曆需要至少一個日期';
  return null;
}

/** 家庭月曆只標示起訖日，同一天不重複建立行程。 */
export function todoDates(todo: Pick<Todo, 'startDate' | 'endDate'>): string[] {
  const start = todo.startDate || todo.endDate;
  const end = todo.endDate || todo.startDate;
  if (!start || !end || start > end) return [];
  return start === end ? [start] : [start, end];
}

export function familyTodoPayload(todo: Todo, ownerUid: string, date: string): Record<string, string> {
  return {
    title: todo.title.trim(), date, ...todoTimesForDate(todo, date), category: '待辦',
    description: [todo.associationLabel, todo.startDate && `開始：${todo.startDate}${todo.startTime ? ` ${todo.startTime}` : ''}`, todo.endDate && `結束：${todo.endDate}${todo.endTime ? ` ${todo.endTime}` : ''}`].filter(Boolean).join(' · '),
    source: 'schedule-app-todo', todoId: todo.id, ownerUid, updatedAt: todo.updatedAt,
  };
}

/** 跨日待辦以兩個時間點標示起訖，避免在單日行程中產生倒置的時間區段。 */
export function todoTimesForDate(todo: Pick<Todo, 'startDate' | 'endDate' | 'startTime' | 'endTime'>, date: string): { startTime: string; endTime: string } {
  if (date === todo.startDate && date === todo.endDate) return { startTime: todo.startTime || todo.endTime || '', endTime: todo.startTime ? todo.endTime || '' : '' };
  return { startTime: (date === todo.startDate ? todo.startTime : date === todo.endDate ? todo.endTime : '') || '', endTime: '' };
}
