import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCourses } from '../src/utils/courseSemesters';
import type { Course } from '../src/data/schedule';

const legacyCourse: Course = {
  id: 'legacy-course',
  name: '資料結構',
  day: 3,
  startTime: '15:10',
  endTime: '18:00',
};

test('個人課表將未標記學期的舊資料歸入 2025-2', () => {
  assert.deepEqual(normalizeCourses([legacyCourse], '2025-2', 'personal'), [
    { ...legacyCourse, semester: '2025-2' },
  ]);
  assert.deepEqual(normalizeCourses([legacyCourse], '2026-1', 'personal'), []);
});

test('共用課表將未標記學期的舊資料歸入 2026-1', () => {
  assert.deepEqual(normalizeCourses([legacyCourse], '2026-1', 'shared'), [
    { ...legacyCourse, semester: '2026-1' },
  ]);
});

test('已標記學期的課程不受舊資料預設值影響', () => {
  const courses: Course[] = [
    { ...legacyCourse, id: 'old', semester: '2025-2' },
    { ...legacyCourse, id: 'current', semester: '2026-1' },
  ];

  assert.deepEqual(
    normalizeCourses(courses, '2026-1', 'personal').map((course) => course.id),
    ['current']
  );
});
