import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateMonthlyTakeHome, calculateRangeTakeHome } from '../src/utils/salaryStats';
import { normalizeSalarySettings } from '../src/data/salarySettings';

const record = (date: string, workHours: number, hourlyRate: number) => ({
  date, startTime: '09:00', endTime: '17:00', workHours, role: 'assistant', hourlyRate,
});

test('單月實際到帳＝應發扣掉勞保自付，沒有薪資的月份不扣', () => {
  assert.deepEqual(calculateMonthlyTakeHome(20000, 700), { grossPay: 20000, laborInsurance: 700, netPay: 19300 });
  assert.deepEqual(calculateMonthlyTakeHome(0, 700), { grossPay: 0, laborInsurance: 0, netPay: 0 });
  // 薪資少於勞保額時最多扣到 0，不出現負數
  assert.deepEqual(calculateMonthlyTakeHome(500, 700), { grossPay: 500, laborInsurance: 500, netPay: 0 });
});

test('跨月範圍逐月扣勞保，而不是總額只扣一次', () => {
  const records = [record('2026-10-03', 4, 200), record('2026-10-20', 4, 200), record('2026-11-02', 5, 200)];
  assert.deepEqual(calculateRangeTakeHome(records, 300), { grossPay: 2600, laborInsurance: 600, netPay: 2000 });
  assert.deepEqual(calculateRangeTakeHome([], 300), { grossPay: 0, laborInsurance: 0, netPay: 0 });
});

test('薪資設定讀回的異常值一律轉為非負整數', () => {
  assert.equal(normalizeSalarySettings(undefined).laborInsuranceEmployee, 0);
  assert.equal(normalizeSalarySettings({ laborInsuranceEmployee: -50 }).laborInsuranceEmployee, 0);
  assert.equal(normalizeSalarySettings({ laborInsuranceEmployee: 702.6 }).laborInsuranceEmployee, 703);
});
