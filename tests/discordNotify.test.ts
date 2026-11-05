import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDailyEmbed, buildWeeklyEmbed, parseUsers, shiftItems, todoItems, type NotifyTodo } from '../workers/discord-notify/src/message';
import { nextWeekRange, taiwanDate } from '../workers/discord-notify/src/time';

const todo: NotifyTodo = { id: 't1', title: '繳報告', startDate: '2026-11-09', endDate: '2026-11-11', startTime: '', endTime: '23:00', completed: false };

test('UTC 14:00 換算為台灣同日 22:00，跨日時不會誤判日期', () => {
  assert.equal(taiwanDate(new Date('2026-11-08T14:00:00Z')), '2026-11-08');
  assert.equal(taiwanDate(new Date('2026-11-08T16:30:00Z')), '2026-11-09');
});

test('週日觸發時下週範圍為隔天起連續七天', () => {
  assert.deepEqual(nextWeekRange('2026-11-08'), { start: '2026-11-09', end: '2026-11-15' });
});

const user = { uid: 'u1', name: 'Brianlien' };

test('明日通知依打工與代辦分區塊並依時間排序，無資料時回傳 null', () => {
  const shifts = shiftItems([{ date: '2026-11-09', startTime: '09:00', endTime: '12:00', title: '早班' }], '2026-11-09', '2026-11-09');
  const embed = buildDailyEmbed('2026-11-09', user, 1, [...todoItems([todo], '2026-11-09', '2026-11-09'), ...shifts]);
  assert.ok(embed);
  assert.equal(embed.author.name, 'Brianlien');
  assert.deepEqual(embed.fields?.map((field) => field.name), ['💼 打工班表', '📝 代辦行程']);
  assert.match(embed.fields?.[0].value ?? '', /早班/);
  assert.equal(buildDailyEmbed('2026-11-10', user, 1, shifts), null);
});

test('代辦只在起訖日出現，已完成者不通知', () => {
  assert.equal(todoItems([todo], '2026-11-10', '2026-11-10').length, 0);
  assert.equal(todoItems([todo], '2026-11-11', '2026-11-11').length, 1);
  assert.equal(todoItems([{ ...todo, completed: true }], '2026-11-09', '2026-11-15').length, 0);
});

test('下週總覽整週無安排時明確告知，有安排時逐日列出並帶類型圖示', () => {
  assert.match(buildWeeklyEmbed('2026-11-09', '2026-11-15', user, 1, []).description ?? '', /沒有安排/);
  const items = shiftItems([{ date: '2026-11-10', startTime: '09:00', endTime: '12:00', title: '早班' }], '2026-11-09', '2026-11-15');
  const description = buildWeeklyEmbed('2026-11-09', '2026-11-15', user, 1, items).description ?? '';
  assert.match(description, /11\/10（二）/);
  assert.match(description, /💼 .*早班/);
});

test('USER_UIDS 可用 uid=名稱 指定顯示名稱，未指定時以 uid 前六碼代替', () => {
  assert.deepEqual(parseUsers('abc123=小明, def456abc ,,'), [
    { uid: 'abc123', name: '小明' },
    { uid: 'def456abc', name: 'def456' },
  ]);
});
