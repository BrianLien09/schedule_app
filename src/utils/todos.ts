import type { Todo, TodoInput } from '@/data/todos';

export function validateTodo(input: TodoInput): string | null {
  if (!input.title.trim()) return '請填寫標題';
  for (const date of [input.startDate, input.endDate]) {
    if (!date) continue;
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return '請填寫有效日期';
  }
  if (input.startDate && input.endDate && input.endDate < input.startDate) return '結束日期不能早於開始日期';
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
    title: todo.title.trim(), date, startTime: '', endTime: '', category: '待辦',
    description: [todo.associationLabel, todo.startDate && `開始：${todo.startDate}`, todo.endDate && `結束：${todo.endDate}`].filter(Boolean).join(' · '),
    source: 'schedule-app-todo', todoId: todo.id, ownerUid, updatedAt: todo.updatedAt,
  };
}
