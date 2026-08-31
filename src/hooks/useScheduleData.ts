import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  workShifts as defaultWorkShifts,
  importantEvents,
  DEFAULT_COURSE_SEMESTER,
  LEGACY_PERSONAL_COURSE_SEMESTER,
  SHARED_COURSE_SEMESTER,
  Course,
  WorkShift,
  Event,
} from '../data/schedule';
import {
  getDocuments,
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  subscribeToSharedCollection,
  batchSetDocuments,
} from '@/services/firestoreService';
import {
  hasFamilyWebSyncAccess,
  hasWriteAccess,
  isBrianAccount,
} from '@/config/permissions';
import {
  createSalaryRecordFromWorkShift,
  isSalaryRecordLinkedToShift,
  mapSalaryRecordToWorkShift,
  type SalaryRecord,
} from '@/data/workRecords';
import {
  batchSyncWorkShiftsToFamilyWeb,
  deleteWorkShiftFromFamilyWeb,
  syncWorkShiftToFamilyWeb,
  updateWorkShiftInFamilyWeb,
} from '@/services/familySyncService';

type CourseCollectionSource = 'personal' | 'shared';

function getCourseCollectionSource(email: string | null | undefined): CourseCollectionSource {
  return isBrianAccount(email) ? 'personal' : 'shared';
}

function normalizeCourses(
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
      // 舊路徑文件沒有 semester 欄位時，依資料庫路徑補上既有學期。
      semester: course.semester ?? legacySemester,
    }));
}

export function useScheduleData(selectedSemester = DEFAULT_COURSE_SEMESTER) {
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const canSyncToFamilyWeb = hasFamilyWebSyncAccess(user?.email);
  const courseCollectionSource = getCourseCollectionSource(user?.email);
  const canEditCourses = canEdit && isBrianAccount(user?.email);

  /**
   * 舊版 workShifts 仍可能留在資料庫，這裡先補成薪資格式，避免切換來源後資料消失。
   */
  const migrateLegacyWorkShifts = async (
    userId: string,
    existingSalaryRecords: SalaryRecord[],
    legacyShifts: WorkShift[]
  ) => {
    const recordsToCreate = legacyShifts
      .filter(
        (shift) =>
          !existingSalaryRecords.some((record) => isSalaryRecordLinkedToShift(record, shift))
      )
      .map((shift) =>
        createSalaryRecordFromWorkShift(shift, {
          id: `salary-${shift.id}`,
          legacyWorkShiftId: shift.id,
        })
      );

    if (recordsToCreate.length > 0) {
      await batchSetDocuments(userId, 'salaryRecords', recordsToCreate);
    }
  };

  const initializeDefaultData = async (userId: string) => {
    try {
      const existingLegacyShifts = await getDocuments<WorkShift>(
        userId,
        'workShifts'
      );
      const existingSalaryRecords = await getDocuments<SalaryRecord>(
        userId,
        'salaryRecords'
      );
      const existingEvents = await getDocuments<Event>(userId, 'events');

      if (existingSalaryRecords.length === 0 && existingLegacyShifts.length === 0) {
        const seededSalaryRecords = defaultWorkShifts.map((shift) =>
          createSalaryRecordFromWorkShift(shift, {
            id: `salary-${shift.id}`,
            legacyWorkShiftId: shift.id,
          })
        );
        await batchSetDocuments(userId, 'salaryRecords', seededSalaryRecords);
      } else if (existingLegacyShifts.length > 0) {
        await migrateLegacyWorkShifts(userId, existingSalaryRecords, existingLegacyShifts);
      }

      if (existingEvents.length === 0) {
        await batchSetDocuments(userId, 'events', importantEvents);
      }
    } catch (error) {
      console.error('初始化個人資料失敗', error);
    }
  };

  useEffect(() => {
    if (!user) {
      setCourses([]);
      setShifts([]);
      setEvents([]);
      setLoading(false);
      setCanEdit(false);
      return;
    }

    setLoading(true);
    setCanEdit(hasWriteAccess(user.email));

    initializeDefaultData(user.uid).then(() => {
      setLoading(false);
    });

    const handleCourses = (data: Course[]) => {
      setCourses(normalizeCourses(data, selectedSemester, courseCollectionSource));
    };

    const unsubscribeCourses = courseCollectionSource === 'shared'
      ? subscribeToSharedCollection<Course>('courses', handleCourses)
      : subscribeToCollection<Course>(user.uid, 'courses', handleCourses);

    const unsubscribeShifts = subscribeToCollection<SalaryRecord>(
      user.uid,
      'salaryRecords',
      (data) =>
        setShifts(
          data
            .map(mapSalaryRecordToWorkShift)
            .sort(
              (a, b) =>
                a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
            )
        )
    );

    const unsubscribeEvents = subscribeToCollection<Event>(
      user.uid,
      'events',
      (data) => setEvents(data)
    );

    return () => {
      unsubscribeCourses();
      unsubscribeShifts();
      unsubscribeEvents();
    };
  }, [courseCollectionSource, selectedSemester, user]);

  const addCourse = async (course: Course) => {
    if (!user || !canEditCourses) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const courseData = { ...course, semester: course.semester ?? selectedSemester };
    await setDocument(user.uid, 'courses', course.id, courseData);
  };

  const updateCourse = async (id: string, updatedCourse: Partial<Course>) => {
    if (!user || !canEditCourses) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const courseData = { ...updatedCourse, semester: selectedSemester };
    await updateDocument(user.uid, 'courses', id, courseData);
  };

  const deleteCourse = async (id: string) => {
    if (!user || !canEditCourses) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await deleteDocument(user.uid, 'courses', id);
  };

  const addWorkShift = async (shift: WorkShift) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const recordId = (shift.salaryRecordId && shift.salaryRecordId.trim()) || (shift.id && shift.id.trim()) || undefined;
    const record = createSalaryRecordFromWorkShift(shift, {
      id: recordId,
      legacyWorkShiftId: shift.legacyWorkShiftId,
    });

    await setDocument(user.uid, 'salaryRecords', record.id, record);
    await syncWorkShiftToFamilyWeb(shift, user.email);
  };

  const updateWorkShift = async (id: string, updatedShift: Partial<WorkShift>) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const existingShift = shifts.find((shift) => shift.id === id);
    if (!existingShift) {
      return;
    }

    const mergedShift: WorkShift = {
      ...existingShift,
      ...updatedShift,
      id,
      salaryRecordId: existingShift.salaryRecordId ?? id,
      legacyWorkShiftId: existingShift.legacyWorkShiftId,
    };
    const record = createSalaryRecordFromWorkShift(mergedShift, {
      id: mergedShift.salaryRecordId ?? id,
      legacyWorkShiftId: mergedShift.legacyWorkShiftId,
    });
    const { id: _recordId, ...recordData } = record;

    await updateDocument(user.uid, 'salaryRecords', id, recordData);
    await updateWorkShiftInFamilyWeb(id, mergedShift, user.email);
  };

  const deleteWorkShift = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const targetShift = shifts.find((shift) => shift.id === id);
    await deleteDocument(user.uid, 'salaryRecords', id);

    if (targetShift?.legacyWorkShiftId) {
      await deleteDocument(user.uid, 'workShifts', targetShift.legacyWorkShiftId);
    }
    await deleteWorkShiftFromFamilyWeb(id, user.email);
  };

  const addEvent = async (event: Event) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await setDocument(user.uid, 'events', event.id, event);
  };

  const updateEvent = async (id: string, updatedEvent: Partial<Event>) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await updateDocument(user.uid, 'events', id, updatedEvent);
  };

  const deleteEvent = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await deleteDocument(user.uid, 'events', id);
  };

  return {
    courses,
    shifts,
    events,
    loading,
    canEdit,
    canEditCourses,
    addCourse,
    updateCourse,
    deleteCourse,
    addWorkShift,
    updateWorkShift,
    deleteWorkShift,
    addEvent,
    updateEvent,
    deleteEvent,
    canSyncToFamilyWeb,
    /**
     * 一鍵將指定月份（如 "2026-08"）或全部個人打工班表同步至 family-web。
     */
    syncAllWorkShiftsToFamilyWeb: async (monthPrefix?: string) => {
      if (!user || !canSyncToFamilyWeb) return 0;

      const targetShifts = monthPrefix
        ? shifts.filter((shift) => shift.date.startsWith(monthPrefix))
        : shifts;
      if (targetShifts.length === 0) return 0;

      return batchSyncWorkShiftsToFamilyWeb(targetShifts, user.email);
    },
  };
}
