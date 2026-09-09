import assert from 'node:assert/strict';
import test from 'node:test';
import type { Course } from '../src/data/schedule';
import { getCourseTimetablePlacement } from '../src/utils/courseTimetable';

const course: Course = {
  id: 'course-1',
  name: '演算法',
  day: 2,
  startTime: '10:10',
  endTime: '12:00',
};

test('跨節課程使用固定的格線座標', () => {
  assert.deepEqual(getCourseTimetablePlacement(course), {
    columnStart: 3,
    rowStart: 4,
    rowEnd: 7,
  });
});

test('不在學校節次表內的課程不產生錯誤座標', () => {
  assert.equal(
    getCourseTimetablePlacement({ ...course, startTime: '09:00' }),
    null
  );
});
