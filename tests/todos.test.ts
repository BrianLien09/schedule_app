import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Todo, TodoInput } from '../src/data/todos';
import { validateTodo, todoDates, familyTodoPayload } from '../src/utils/todos';
import { buildAgenda, getPendingTasks, isTaskOverdue, localDateKey, getWeekDays } from '../src/utils/agenda';
import { defaultTodoDateTimes, roundedTodoDateTime } from '../src/utils/todoDefaults';

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

test('起訖範圍跨月只同步開始日與結束日，只有單一日期也可同步', () => {
  assert.deepEqual(todoDates({ startDate: '2026-09-30', endDate: '2026-10-02' }), ['2026-09-30', '2026-10-02']);
  assert.deepEqual(todoDates({ startDate: '', endDate: '2026-10-02' }), ['2026-10-02']);
  assert.deepEqual(todoDates(input), []);
  assert.equal(validateTodo({ ...input, syncToFamily: true, startDate: '2026-01-01', endDate: '2028-01-01' }), null);
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

test('新增待辦採最近整點或半點，結束預設半小時後，午夜正確跨日', () => {
  assert.deepEqual(defaultTodoDateTimes(new Date(2026, 9, 4, 12, 22)), { startDate: '2026-10-04', startTime: '12:30', endDate: '2026-10-04', endTime: '13:00' });
  assert.equal(roundedTodoDateTime(new Date(2026, 9, 4, 12, 10)).time, '12:00');
  assert.equal(roundedTodoDateTime(new Date(2026, 9, 4, 12, 40), 60).time, '13:00');
  assert.deepEqual(defaultTodoDateTimes(new Date(2026, 9, 4, 23, 40)), { startDate: '2026-10-04', startTime: '23:30', endDate: '2026-10-05', endTime: '00:00' });
  assert.deepEqual(roundedTodoDateTime(new Date(2026, 11, 31, 23, 50)), { date: '2027-01-01', time: '00:00' });
});

test('分鐘可任意設定，拒絕錯誤時間、沒有日期的時間與同日倒置範圍', () => {
  const timed = { ...input, startDate: '2026-10-04', endDate: '2026-10-04', startTime: '12:17', endTime: '12:43' };
  assert.equal(validateTodo(timed), null);
  assert.ok(validateTodo({ ...timed, startTime: '24:00' }));
  assert.ok(validateTodo({ ...timed, endTime: '12:60' }));
  assert.ok(validateTodo({ ...timed, startDate: '' }));
  assert.ok(validateTodo({ ...timed, endTime: '12:16' }));
  assert.equal(validateTodo({ ...timed, endDate: '2026-10-05', endTime: '00:10' }), null);
});

test('家庭同日保留任意分鐘；跨日各顯示起訖時間並保留完整描述', () => {
  const timed = { ...todo, startDate: '2026-10-04', endDate: '2026-10-04', startTime: '12:17', endTime: '13:43' };
  const sameDay = familyTodoPayload(timed, 'uid', timed.startDate);
  assert.equal(sameDay.startTime, '12:17');
  assert.equal(sameDay.endTime, '13:43');
  const crossDay = { ...timed, endDate: '2026-10-05', endTime: '09:10' };
  const start = familyTodoPayload(crossDay, 'uid', crossDay.startDate);
  const end = familyTodoPayload(crossDay, 'uid', crossDay.endDate);
  assert.equal(start.startTime, '12:17');
  assert.equal(start.endTime, '');
  assert.equal(end.startTime, '09:10');
  assert.equal(end.endTime, '');
  assert.equal(end.description, '開始：2026-10-04 12:17 · 結束：2026-10-05 09:10');
  assert.equal(familyTodoPayload(todo, 'uid', '2026-10-04').startTime, '');
});

test('週視圖保留時間，待辦到分鐘判斷逾期並按期限排序', () => {
  const now = new Date(2026, 9, 4, 13, 0);
  const timed = { ...todo, startDate: '2026-10-04', endDate: '2026-10-04', startTime: '12:17', endTime: '12:43' };
  const items = buildAgenda([now], [], [], [], [timed]);
  assert.equal(items[0].startTime, '12:17');
  assert.equal(items[0].endTime, '12:43');
  assert.equal(isTaskOverdue(timed, now), true);
  assert.equal(isTaskOverdue({ ...timed, endTime: '13:00' }, now), false);
  assert.equal(isTaskOverdue({ ...todo, endDate: '2026-10-04' }, now), false);
  assert.deepEqual(getPendingTasks([{ ...timed, id: 'later', endTime: '14:00' }, timed], now, true).map((task) => task.id), ['one', 'later']);
});
