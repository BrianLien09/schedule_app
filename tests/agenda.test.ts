import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addCalendarDays, buildAgenda, dateLabel, getPendingTasks, getWeekDays, isTaskOverdue, localDateKey, taskDueDate } from '../src/utils/agenda';
import type { CourseNote } from '../src/data/courseNotes';

function note(id: string, dueDate?: string, extra: Partial<CourseNote> = {}): CourseNote {
  return { id, courseId: 'course', title: id, type: 'homework', content: '', completed: false, createdAt: '', updatedAt: '', dueDate, ...extra };
}

test('以當地日曆建立週一到週日，正確處理跨月與跨年', () => {
  const dates = getWeekDays(new Date(2027, 0, 3, 15));
  assert.deepEqual(dates.map(localDateKey), ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
});

test('日期型待辦在截止日當天不算逾期，隔天才算逾期', () => {
  const task = note('today', '2026-10-02T00:00:00.000Z');
  assert.equal(isTaskOverdue(task, new Date(2026, 9, 2, 23, 59)), false);
  assert.equal(isTaskOverdue(task, new Date(2026, 9, 3)), true);
  assert.equal(isTaskOverdue({ ...task, completed: true }, new Date(2026, 9, 3)), false);
});

test('近期待辦包含逾期與七個日曆日，不包含完成、一般筆記與第八天', () => {
  const now = new Date(2026, 9, 2, 13);
  const notes = [note('later', '2026-10-09'), note('last', '2026-10-08'), note('past', '2026-10-01'), note('today', '2026-10-02'), note('done', '2026-10-02', { completed: true }), note('plain', '2026-10-02', { type: 'note' }), note('no-date')];
  assert.deepEqual(getPendingTasks(notes, now, true).map((task) => task.id), ['past', 'today', 'last']);
  assert.deepEqual(getPendingTasks(notes, now, false).map((task) => task.id), ['past', 'today', 'last', 'later', 'no-date']);
  assert.equal(notes[0].id, 'later');
});

test('同日待辦依優先級排序，不接受無效截止日', () => {
  assert.equal(taskDueDate(note('invalid', '2026-02-30')), undefined);
  assert.equal(taskDueDate(note('bad', 'not-a-date')), undefined);
  assert.deepEqual(getPendingTasks([note('low', '2026-10-02', { priority: 'low' }), note('high', '2026-10-02', { priority: 'high' })], new Date(2026, 9, 2), true).map((task) => task.id), ['high', 'low']);
});

test('週視圖整合課程、班表、事件與截止事項，保留重疊行程並排除已完成待辦', () => {
  const dates = getWeekDays(new Date(2026, 9, 2));
  const agenda = buildAgenda(dates,
    [{ id: 'course', name: '資料結構', day: 5, startTime: '09:00', endTime: '10:00' }],
    [{ id: 'shift', date: '2026-10-02', startTime: '09:30', endTime: '12:00', shiftCategory: '助教' }],
    [{ id: 'event', title: '聚餐', date: '2026-10-02', type: 'personal' }],
    [note('task', '2026-10-02'), note('done', '2026-10-02', { completed: true })]);
  assert.deepEqual(agenda.map((item) => item.kind), ['event', 'homework', 'class', 'work']);
  assert.equal(new Set(agenda.map((item) => item.id)).size, 4);
});

test('跨月近期安排不受本月篩選限制，週日課程採第七天', () => {
  const dates = Array.from({ length: 7 }, (_, index) => addCalendarDays(new Date(2026, 8, 30), index));
  const agenda = buildAgenda(dates, [{ id: 'sun', name: '週日課', day: 7, startTime: '10:00', endTime: '11:00' }], [{ id: 'next-month', date: '2026-10-01', startTime: '08:00', endTime: '09:00' }], [], []);
  assert.deepEqual(agenda.map((item) => item.date), ['2026-10-01', '2026-10-04']);
  assert.equal(dateLabel('2026-10-01', new Date(2026, 8, 30)), '明天');
});
