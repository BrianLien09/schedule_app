import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Todo, TodoInput } from '../src/data/todos';
import { validateTodo, todoDates, familyTodoPayload } from '../src/utils/todos';
import { buildAgenda, getPendingTasks, isTaskOverdue, localDateKey, getWeekDays } from '../src/utils/agenda';

const input: TodoInput = { title: '準備教材', startDate: '', endDate: '', association: 'none', associationId: '', associationLabel: '', syncToFamily: false };
const todo: Todo = { ...input, id: 'one', type: 'todo', completed: false, createdAt: '', updatedAt: '' };

test('待辦日期可不填，家庭同步至少需要單一日期，且驗證標題與關聯', () => {
  assert.equal(validateTodo(input), null);
  assert.ok(validateTodo({ ...input, title: '   ' }));
  assert.ok(validateTodo({ ...input, syncToFamily: true }));
  assert.equal(validateTodo({ ...input, syncToFamily: true, endDate: '2026-10-02' }), null);
  assert.ok(validateTodo({ ...input, association: 'course' }));
  assert.ok(validateTodo({ ...input, startDate: '2026-02-30' }));
  assert.ok(validateTodo({ ...input, startDate: '2026-10-04', endDate: '2026-10-02' }));
});

test('起訖範圍跨月逐日同步，只有單一日期也可同步，限制大量展開', () => {
  assert.deepEqual(todoDates({ startDate: '2026-09-30', endDate: '2026-10-02' }), ['2026-09-30', '2026-10-01', '2026-10-02']);
  assert.deepEqual(todoDates({ startDate: '', endDate: '2026-10-02' }), ['2026-10-02']);
  assert.deepEqual(todoDates(input), []);
  assert.ok(validateTodo({ ...input, syncToFamily: true, startDate: '2026-01-01', endDate: '2028-01-01' }));
});

test('家庭標題不加百頁前綴，來源、擁有者與待辦識別碼不混入班表', () => {
  const payload = familyTodoPayload({ ...todo, title: '  準備教材  ', associationLabel: '程式設計' }, 'uid', '2026-10-02');
  assert.equal(payload.title, '準備教材');
  assert.equal(payload.ownerUid, 'uid');
  assert.equal(payload.todoId, 'one');
  assert.equal(payload.source, 'schedule-app-todo');
  assert.equal(payload.description, '程式設計');
});

test('無日期與進行中的長期待辦仍顯示，完成者排除，結束日當天不逾期', () => {
  const now = new Date(2026, 9, 2);
  const ongoing = { ...todo, id: 'range', startDate: '2026-10-01', endDate: '2026-10-20' };
  assert.deepEqual(getPendingTasks([todo, ongoing, { ...todo, id: 'done', completed: true }], now, true).map((item) => item.id), ['range', 'one']);
  assert.equal(isTaskOverdue({ ...todo, endDate: '2026-10-02' }, now), false);
  assert.equal(isTaskOverdue({ ...todo, endDate: '2026-10-01' }, now), true);
});

test('週視圖只在個人待辦的起始日與結束日顯示，不將無日期待辦塞入行程', () => {
  const days = getWeekDays(new Date(2026, 9, 2));
  const range = { ...todo, id: 'range', startDate: '2026-09-30', endDate: '2026-10-02' };
  const items = buildAgenda(days, [], [], [], [todo, range, { ...range, id: 'done', completed: true }]);
  assert.deepEqual(items.map((item) => item.date), [localDateKey(days[2]), localDateKey(days[4])]);
  assert.equal(new Set(items.map((item) => item.id)).size, 2);
});
