import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findCourseConflicts,
  findWorkShiftConflicts,
  formatConflictMessage,
  getCourseDayForDate,
} from '../src/utils/scheduleConflicts';
import type { Course, WorkShift } from '../src/data/schedule';

test('getCourseDayForDate 將週日正規化為第七天', () => {
  assert.equal(getCourseDayForDate('2026-09-06'), 7);
  assert.equal(getCourseDayForDate('2026-09-07'), 1);
});

test('班表只回報同日且時間重疊的打工項目', () => {
  const candidate: WorkShift = {
    id: 'candidate',
    date: '2026-09-04',
    startTime: '10:00',
    endTime: '12:00',
  };
  const shifts: WorkShift[] = [
    { id: 'overlap', date: '2026-09-04', startTime: '11:00', endTime: '13:00', note: '重疊班' },
    { id: 'touching', date: '2026-09-04', startTime: '12:00', endTime: '14:00', note: '相鄰班' },
    { id: 'other-day', date: '2026-09-05', startTime: '10:00', endTime: '12:00' },
  ];

  assert.deepEqual(findWorkShiftConflicts(candidate, [], shifts), [
    {
      sourceType: 'work',
      title: '重疊班',
      dateLabel: '2026-09-04',
      startTime: '11:00',
      endTime: '13:00',
    },
  ]);
});

test('課程衝突包含地點，且編輯中的課程可排除自己', () => {
  const candidate: Course = {
    id: 'candidate',
    name: '資料結構',
    day: 3,
    startTime: '10:00',
    endTime: '12:00',
  };
  const courses: Course[] = [
    { id: 'self', name: '資料結構', day: 3, startTime: '10:00', endTime: '12:00' },
    { id: 'overlap', name: '英文', day: 3, startTime: '11:00', endTime: '13:00', location: 'C608' },
  ];

  assert.equal(findCourseConflicts(candidate, courses, [], 'self')[0]?.title, '英文（C608）');
});

test('formatConflictMessage 去除重複內容並限制顯示五筆', () => {
  const conflicts = Array.from({ length: 7 }, (_, index) => ({
    sourceType: 'work' as const,
    title: `班次 ${index}`,
    dateLabel: '2026-09-04',
    startTime: '09:00',
    endTime: '10:00',
  }));

  const message = formatConflictMessage([...conflicts, conflicts[0]]);
  assert.match(message, /另有 2 筆衝突/);
  assert.equal((message.match(/班次 0/g) ?? []).length, 1);
});
