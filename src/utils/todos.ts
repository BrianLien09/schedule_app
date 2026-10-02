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
  if (input.syncToFamily && input.startDate && input.endDate &&
    (Date.parse(input.endDate) - Date.parse(input.startDate)) / 86400000 > 365) return '逐日同步的日期範圍最多一年';
  return null;
}

/** 使用 UTC 日曆運算，避免跨夏令時間時重複或遺漏日期。 */
export function todoDates(todo: Pick<Todo, 'startDate' | 'endDate'>): string[] {
  const start = todo.startDate || todo.endDate;
  const end = todo.endDate || todo.startDate;
  if (!start || !end || start > end) return [];
  const result: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  while (!Number.isNaN(cursor.getTime()) && cursor.toISOString().slice(0, 10) <= end) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

export function familyTodoPayload(todo: Todo, ownerUid: string, date: string): Record<string, string> {
  return {
    title: todo.title.trim(), date, startTime: '', endTime: '', category: '待辦',
    description: [todo.associationLabel, todo.startDate && `開始：${todo.startDate}`, todo.endDate && `結束：${todo.endDate}`].filter(Boolean).join(' · '),
    source: 'schedule-app-todo', todoId: todo.id, ownerUid, updatedAt: todo.updatedAt,
  };
}
