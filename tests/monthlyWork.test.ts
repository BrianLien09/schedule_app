import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeMonthlyWork } from '../src/utils/monthlyWork';
import type { WorkShift } from '../src/data/schedule';

test('本月統計區分同日班數與天數，使用設定工時和時薪，結束時間當下算完成', () => {
  const shifts: WorkShift[] = [
    { id: 'a', date: '2026-10-03', startTime: '09:00', endTime: '13:00', workHours: 3.5, hourlyRate: 200 },
    { id: 'b', date: '2026-10-03', startTime: '13:00', endTime: '16:00', workHours: 2.5, hourlyRate: 300 },
    { id: 'c', date: '2026-10-17', startTime: '09:00', endTime: '12:00', workHours: 0, hourlyRate: 200 },
    { id: 'other', date: '2026-11-01', startTime: '09:00', endTime: '12:00', hourlyRate: 200 },
  ];
  const result = summarizeMonthlyWork(shifts, new Date(2026, 9, 3, 13));
  assert.equal(result.items.length, 3);
  assert.equal(result.days, 2);
  assert.equal(result.completedCount, 1);
  assert.equal(result.items[1].ongoing, true);
  assert.equal(result.totalHours, 6);
  assert.equal(result.completedHours, 3.5);
  assert.equal(result.totalPay, 1450);
  assert.equal(result.progress, 33);
  assert.equal(shifts[3].id, 'other');
});

test('空月不產生 NaN，未設定工時沿用時間差', () => {
  assert.equal(summarizeMonthlyWork([], new Date(2026, 9, 3)).progress, 0);
  const result = summarizeMonthlyWork([{ id: 'a', date: '2026-10-03', startTime: '09:00', endTime: '10:30', hourlyRate: 200 }], new Date(2026, 9, 3, 11));
  assert.equal(result.totalHours, 1.5);
  assert.equal(result.totalPay, 300);
  assert.equal(result.progress, 100);
});
