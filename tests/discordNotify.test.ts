import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDailyMessage, buildWeeklyMessage, shiftItems, splitMessage, todoItems, type NotifyTodo } from '../workers/discord-notify/src/message';
import { nextWeekRange, taiwanDate } from '../workers/discord-notify/src/time';

const todo: NotifyTodo = { id: 't1', title: '繳報告', startDate: '2026-11-09', endDate: '2026-11-11', startTime: '', endTime: '23:00', completed: false };

test('UTC 14:00 換算為台灣同日 22:00，跨日時不會誤判日期', () => {
  assert.equal(taiwanDate(new Date('2026-11-08T14:00:00Z')), '2026-11-08');
  assert.equal(taiwanDate(new Date('2026-11-08T16:30:00Z')), '2026-11-09');
});

test('週日觸發時下週範圍為隔天起連續七天', () => {
  assert.deepEqual(nextWeekRange('2026-11-08'), { start: '2026-11-09', end: '2026-11-15' });
});

test('明日通知合併班表與未完成代辦並依時間排序，無資料時回傳 null', () => {
  const shifts = shiftItems([{ date: '2026-11-09', startTime: '09:00', endTime: '12:00', title: '早班' }], '2026-11-09', '2026-11-09');
  const message = buildDailyMessage('2026-11-09', [...todoItems([todo], '2026-11-09', '2026-11-09'), ...shifts]);
  assert.ok(message);
  assert.ok(message.indexOf('早班') < message.indexOf('繳報告'));
  assert.equal(buildDailyMessage('2026-11-10', shifts), null);
});

test('代辦只在起訖日出現，已完成者不通知', () => {
  assert.equal(todoItems([todo], '2026-11-10', '2026-11-10').length, 0);
  assert.equal(todoItems([todo], '2026-11-11', '2026-11-11').length, 1);
  assert.equal(todoItems([{ ...todo, completed: true }], '2026-11-09', '2026-11-15').length, 0);
});

test('下週總覽整週無安排時明確告知，過長訊息會切段', () => {
  assert.match(buildWeeklyMessage('2026-11-09', '2026-11-15', []), /沒有安排/);
  const chunks = splitMessage(Array.from({ length: 200 }, (_, i) => `第 ${i} 行行程內容`).join('\n'), 100);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 100));
});
