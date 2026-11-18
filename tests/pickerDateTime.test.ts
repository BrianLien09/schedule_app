import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localDateKey } from '../src/utils/agenda';
import {
  buildMonthGrid, durationLabel, formatDateLabel, minutesToTime, parseDateKey, periodLabel, relativeDayLabel, shiftMonthKey,
} from '../src/utils/pickerDateTime';

test('日期字串以本地時區解析，並擋下不存在的日期', () => {
  assert.equal(localDateKey(parseDateKey('2026-11-18') as Date), '2026-11-18');
  assert.equal(parseDateKey('2026-02-30'), null);
  assert.equal(parseDateKey(''), null);
});

test('月曆格從週一排到週日，且涵蓋整個月份', () => {
  const grid = buildMonthGrid(new Date(2026, 10, 1));
  assert.equal(grid.length % 7, 0);
  assert.equal(grid[0].getDay(), 1);
  assert.equal(grid[grid.length - 1].getDay(), 0);
  assert.ok(grid.some((day) => localDateKey(day) === '2026-11-30'));
});

test('相對日期與日期文字', () => {
  const today = new Date(2026, 10, 18, 15, 30);
  assert.equal(relativeDayLabel('2026-11-18', today), '今天');
  assert.equal(relativeDayLabel('2026-11-19', today), '明天');
  assert.equal(relativeDayLabel('2026-11-25', today), null);
  assert.equal(formatDateLabel('2026-11-18', today), '11月18日 週三');
  assert.equal(formatDateLabel('2027-01-02', today), '2027年1月2日 週六');
});

test('月份位移跨年', () => {
  assert.equal(shiftMonthKey('2026-01', -1), '2025-12');
  assert.equal(shiftMonthKey('2026-12', 1), '2027-01');
});

test('時間換算繞過午夜，時長依是否允許跨夜決定', () => {
  assert.equal(minutesToTime(-30), '23:30');
  assert.equal(minutesToTime(1470), '00:30');
  assert.equal(periodLabel('13:00'), '下午');
  assert.equal(durationLabel('09:00', '17:30', false), '共 8 小時 30 分');
  assert.equal(durationLabel('22:00', '06:00', false), null);
  assert.equal(durationLabel('22:00', '06:00', true), '跨夜，共 8 小時');
});
