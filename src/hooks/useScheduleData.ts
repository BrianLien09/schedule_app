import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  schoolSchedule,
  workShifts as defaultWorkShifts,
  importantEvents,
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
  batchSetDocuments,
} from '@/services/firestoreService';
import { hasWriteAccess } from '@/config/permissions';
import {
  createSalaryRecordFromWorkShift,
  isSalaryRecordLinkedToShift,
  mapSalaryRecordToWorkShift,
  type SalaryRecord,
} from '@/data/workRecords';
import {
  syncWorkShiftToFamilyWeb,
  updateWorkShiftInFamilyWeb,
  deleteWorkShiftFromFamilyWeb,
} from '@/services/familySyncService';

const SHARED_DATA_PATH = 'shared';

export function useScheduleData() {
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  /**
   * 舊版 workShifts 仍可能留在資料庫，這裡先補成薪資格式，避免切換來源後資料消失。
   */
  const migrateLegacyWorkShifts = async (
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
      await batchSetDocuments(SHARED_DATA_PATH, 'salaryRecords', recordsToCreate);
    }
  };

  const initializeDefaultData = async () => {
    try {
      const existingCourses = await getDocuments<Course>(SHARED_DATA_PATH, 'courses');
      const existingLegacyShifts = await getDocuments<WorkShift>(
        SHARED_DATA_PATH,
        'workShifts'
      );
      const existingSalaryRecords = await getDocuments<SalaryRecord>(
        SHARED_DATA_PATH,
        'salaryRecords'
      );
      const existingEvents = await getDocuments<Event>(SHARED_DATA_PATH, 'events');

      if (existingCourses.length === 0) {
        await batchSetDocuments(SHARED_DATA_PATH, 'courses', schoolSchedule);
      }

      if (existingSalaryRecords.length === 0 && existingLegacyShifts.length === 0) {
        const seededSalaryRecords = defaultWorkShifts.map((shift) =>
          createSalaryRecordFromWorkShift(shift, {
            id: `salary-${shift.id}`,
            legacyWorkShiftId: shift.id,
          })
        );
        await batchSetDocuments(SHARED_DATA_PATH, 'salaryRecords', seededSalaryRecords);
      } else if (existingLegacyShifts.length > 0) {
        await migrateLegacyWorkShifts(existingSalaryRecords, existingLegacyShifts);
      }

      if (existingEvents.length === 0) {
        await batchSetDocuments(SHARED_DATA_PATH, 'events', importantEvents);
      }
    } catch (error) {
      console.error('初始化共享資料失敗', error);
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

    initializeDefaultData().then(() => {
      setLoading(false);
    });

    const unsubscribeCourses = subscribeToCollection<Course>(
      SHARED_DATA_PATH,
      'courses',
      (data) => setCourses(data)
    );

    const unsubscribeShifts = subscribeToCollection<SalaryRecord>(
      SHARED_DATA_PATH,
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
      SHARED_DATA_PATH,
      'events',
      (data) => setEvents(data)
    );

    return () => {
      unsubscribeCourses();
      unsubscribeShifts();
      unsubscribeEvents();
    };
  }, [user]);

  const addCourse = async (course: Course) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await setDocument(SHARED_DATA_PATH, 'courses', course.id, course);
  };

  const updateCourse = async (id: string, updatedCourse: Partial<Course>) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await updateDocument(SHARED_DATA_PATH, 'courses', id, updatedCourse);
  };

  const deleteCourse = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await deleteDocument(SHARED_DATA_PATH, 'courses', id);
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

    await setDocument(SHARED_DATA_PATH, 'salaryRecords', record.id, record);
    // 🏠 同步至 family-web 家庭月曆
    await syncWorkShiftToFamilyWeb(record);
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

    await updateDocument(SHARED_DATA_PATH, 'salaryRecords', id, recordData);
    // 🏠 同步更新至 family-web 家庭月曆
    await updateWorkShiftInFamilyWeb(id, mergedShift);
  };

  const deleteWorkShift = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const targetShift = shifts.find((shift) => shift.id === id);
    await deleteDocument(SHARED_DATA_PATH, 'salaryRecords', id);

    if (targetShift?.legacyWorkShiftId) {
      await deleteDocument(SHARED_DATA_PATH, 'workShifts', targetShift.legacyWorkShiftId);
    }
    // 🏠 同步從 family-web 家庭月曆刪除
    await deleteWorkShiftFromFamilyWeb(id);
  };

  const addEvent = async (event: Event) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await setDocument(SHARED_DATA_PATH, 'events', event.id, event);
  };

  const updateEvent = async (id: string, updatedEvent: Partial<Event>) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await updateDocument(SHARED_DATA_PATH, 'events', id, updatedEvent);
  };

  const deleteEvent = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await deleteDocument(SHARED_DATA_PATH, 'events', id);
  };

  return {
    courses,
    shifts,
    events,
    loading,
    canEdit,
    addCourse,
    updateCourse,
    deleteCourse,
    addWorkShift,
    updateWorkShift,
    deleteWorkShift,
    addEvent,
    updateEvent,
    deleteEvent,
    /**
     * 一鍵將指定月份（如 "2026-08"）或全部打工班表同步至 family-web 家庭月曆
     */
    syncAllWorkShiftsToFamilyWeb: async (monthPrefix?: string) => {
      const targetShifts = monthPrefix
        ? shifts.filter((s) => s.date.startsWith(monthPrefix))
        : shifts;
      if (targetShifts.length === 0) return 0;

      const { batchSyncWorkShiftsToFamilyWeb } = await import('@/services/familySyncService');
      await batchSyncWorkShiftsToFamilyWeb(targetShifts);
      return targetShifts.length;
    },
  };
}
