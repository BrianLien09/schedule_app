import { startTransition, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_COURSE_SEMESTER } from '../data/schedule';
import type { Course, WorkShift, Event } from '../data/schedule';
import { normalizeCourses, type CourseCollectionSource } from '@/utils/courseSemesters';
import {
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  subscribeToSharedCollection,
} from '@/services/firestoreService';
import {
  PERSONAL_COLLECTIONS,
  SHARED_COLLECTIONS,
} from '@/services/firestoreCollections';
import { bootstrapScheduleData } from '@/services/scheduleBootstrapService';
import {
  hasFamilyWebSyncAccess,
  hasWriteAccess,
  isBrianAccount,
} from '@/config/permissions';
import {
  mapSalaryRecordToWorkShift,
  createSalaryRecordFromWorkShift,
  type SalaryRecord,
} from '@/data/workRecords';
import {
  batchSyncWorkShiftsToFamilyWeb,
  deleteWorkShiftFromFamilyWeb,
  syncWorkShiftToFamilyWeb,
  updateWorkShiftInFamilyWeb,
} from '@/services/familySyncService';

function getCourseCollectionSource(email: string | null | undefined): CourseCollectionSource {
  return isBrianAccount(email) ? 'personal' : 'shared';
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

  useEffect(() => {
    if (!user) {
      startTransition(() => {
        setCourses([]);
        setShifts([]);
        setEvents([]);
        setLoading(false);
        setCanEdit(false);
      });
      return;
    }

    startTransition(() => {
      setLoading(true);
      setCanEdit(hasWriteAccess(user.email));
    });

    bootstrapScheduleData(user.uid).then(() => {
      setLoading(false);
    });

    const handleCourses = (data: Course[]) => {
      setCourses(normalizeCourses(data, selectedSemester, courseCollectionSource));
    };

    const unsubscribeCourses = courseCollectionSource === 'shared'
      ? subscribeToSharedCollection<Course>(SHARED_COLLECTIONS.courses, handleCourses)
      : subscribeToCollection<Course>(user.uid, PERSONAL_COLLECTIONS.courses, handleCourses);

    const unsubscribeShifts = subscribeToCollection<SalaryRecord>(
      user.uid,
      PERSONAL_COLLECTIONS.salaryRecords,
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
      PERSONAL_COLLECTIONS.events,
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
    await setDocument(user.uid, PERSONAL_COLLECTIONS.courses, course.id, courseData);
  };

  const updateCourse = async (id: string, updatedCourse: Partial<Course>) => {
    if (!user || !canEditCourses) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const courseData = { ...updatedCourse, semester: selectedSemester };
    await updateDocument(user.uid, PERSONAL_COLLECTIONS.courses, id, courseData);
  };

  const deleteCourse = async (id: string) => {
    if (!user || !canEditCourses) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await deleteDocument(user.uid, PERSONAL_COLLECTIONS.courses, id);
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

    await setDocument(user.uid, PERSONAL_COLLECTIONS.salaryRecords, record.id, record);
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
    const recordData = Object.fromEntries(
      Object.entries(record).filter(([key]) => key !== 'id')
    );

    await updateDocument(user.uid, PERSONAL_COLLECTIONS.salaryRecords, id, recordData);
    await updateWorkShiftInFamilyWeb(id, mergedShift, user.email);
  };

  const deleteWorkShift = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const targetShift = shifts.find((shift) => shift.id === id);
    await deleteDocument(user.uid, PERSONAL_COLLECTIONS.salaryRecords, id);

    if (targetShift?.legacyWorkShiftId) {
      await deleteDocument(user.uid, PERSONAL_COLLECTIONS.workShifts, targetShift.legacyWorkShiftId);
    }
    await deleteWorkShiftFromFamilyWeb(id, user.email);
  };

  const addEvent = async (event: Event) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await setDocument(user.uid, PERSONAL_COLLECTIONS.events, event.id, event);
  };

  const updateEvent = async (id: string, updatedEvent: Partial<Event>) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await updateDocument(user.uid, PERSONAL_COLLECTIONS.events, id, updatedEvent);
  };

  const deleteEvent = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await deleteDocument(user.uid, PERSONAL_COLLECTIONS.events, id);
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
