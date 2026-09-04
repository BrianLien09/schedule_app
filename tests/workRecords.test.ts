import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateWorkHours,
  createSalaryRecordFromWorkShift,
  isSalaryRecordLinkedToShift,
  mapSalaryRecordToWorkShift,
} from '../src/data/workRecords';
import type { WorkShift } from '../src/data/schedule';

test('calculateWorkHours 保留小數工時並拒絕無效時間範圍', () => {
  assert.equal(calculateWorkHours('09:00', '17:00'), 8);
  assert.equal(calculateWorkHours('09:15', '10:45'), 1.5);
  assert.equal(calculateWorkHours('17:00', '09:00'), 0);
});

test('createSalaryRecordFromWorkShift 保留班表已指定的薪資欄位', () => {
  const shift: WorkShift = {
    id: 'shift-1',
    date: '2026-09-04',
    startTime: '09:00',
    endTime: '12:30',
    role: 'instructor',
    roleName: '專任講師',
    hourlyRate: 650,
    workHours: 3.5,
    shiftCategory: '秋季班',
  };

  const record = createSalaryRecordFromWorkShift(shift, {
    id: 'salary-1',
    legacyWorkShiftId: 'legacy-shift-1',
  });

  assert.deepEqual(record, {
    id: 'salary-1',
    date: '2026-09-04',
    startTime: '09:00',
    endTime: '12:30',
    workHours: 3.5,
    hourlyRate: 650,
    role: 'instructor',
    roleName: '專任講師',
    shiftCategory: '秋季班',
    workShiftId: 'legacy-shift-1',
  });
});

test('薪資記錄與班表可互相映射並辨識舊資料連結', () => {
  const shift: WorkShift = {
    id: 'shift-2',
    date: '2026-09-05',
    startTime: '13:00',
    endTime: '17:00',
    note: '冬令營',
  };
  const record = createSalaryRecordFromWorkShift(shift, { legacyWorkShiftId: shift.id });

  assert.equal(isSalaryRecordLinkedToShift(record, shift), true);
  assert.equal(mapSalaryRecordToWorkShift(record).salaryRecordId, record.id);
  assert.equal(
    isSalaryRecordLinkedToShift({ ...record, workShiftId: undefined }, shift),
    true
  );
});
