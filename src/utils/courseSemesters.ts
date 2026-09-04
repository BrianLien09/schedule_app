import type { Course } from '@/data/schedule';
import {
  LEGACY_PERSONAL_COURSE_SEMESTER,
  SHARED_COURSE_SEMESTER,
} from '@/data/schedule';

export type CourseCollectionSource = 'personal' | 'shared';

/**
 * 依資料來源補齊舊課程的學期，並只回傳目前選定學期的課程。
 *
 * 舊文件沒有 semester 時，個人與共用路徑代表的既有學期不同，不能用同一個預設值。
 */
export function normalizeCourses(
  courses: Course[],
  semester: string,
  collectionSource: CourseCollectionSource
): Course[] {
  const legacySemester = collectionSource === 'shared'
    ? SHARED_COURSE_SEMESTER
    : LEGACY_PERSONAL_COURSE_SEMESTER;

  return courses
    .filter((course) => (course.semester ?? legacySemester) === semester)
    .map((course) => ({
      ...course,
      semester: course.semester ?? legacySemester,
    }));
}
