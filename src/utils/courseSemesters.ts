import type { Course } from '@/data/schedule';
import {
  LEGACY_PERSONAL_COURSE_SEMESTER,
  SHARED_COURSE_SEMESTER,
} from '@/data/schedule';

export type CourseCollectionSource = 'personal' | 'shared';

function isSameOverlappingCourse(first: Course, second: Course): boolean {
  return (
    first.id !== second.id &&
    first.day === second.day &&
    first.name.trim() === second.name.trim() &&
    (first.location ?? '').trim() === (second.location ?? '').trim() &&
    first.startTime < second.endTime &&
    first.endTime > second.startTime
  );
}

function keepMostRecentlyUpdatedCourse(first: Course, second: Course): Course {
  return (second.updatedAt ?? '') > (first.updatedAt ?? '') ? second : first;
}

/**
 * 隱藏意外重複寫入且時段重疊的同一門課，避免兩張卡片在課表上互相覆蓋。
 * 原始 Firestore 文件會保留，讓使用者仍可從資料端復原或清理。
 */
function removeOverlappingCourseDuplicates(courses: Course[]): Course[] {
  return courses.reduce<Course[]>((uniqueCourses, course) => {
    const duplicateIndex = uniqueCourses.findIndex((existingCourse) =>
      isSameOverlappingCourse(existingCourse, course)
    );

    if (duplicateIndex === -1) {
      return [...uniqueCourses, course];
    }

    const nextCourses = [...uniqueCourses];
    nextCourses[duplicateIndex] = keepMostRecentlyUpdatedCourse(
      uniqueCourses[duplicateIndex],
      course
    );
    return nextCourses;
  }, []);
}

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

  const semesterCourses = courses
    .filter((course) => (course.semester ?? legacySemester) === semester)
    .map((course) => ({
      ...course,
      semester: course.semester ?? legacySemester,
    }));

  return removeOverlappingCourseDuplicates(semesterCourses);
}
