import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { schoolSchedule, workShifts, importantEvents, Course, WorkShift, Event } from '../data/schedule';
import {
  getDocuments,
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  batchSetDocuments,
} from '@/services/firestoreService';
import { hasWriteAccess } from '@/config/permissions';

/**
 * 共用資料路徑
 * 
 * 所有家人共用同一份資料，儲存在 Firestore 的 /shared/ 路徑下。
 * 權限控制由 Firestore Security Rules 處理。
 */
const SHARED_DATA_PATH = 'shared';

/**
 * Schedule Data Management Hook
 * 
 * 管理課程、打工班表和重要事件的資料，支援：
 * - Firestore 雲端同步（必須登入）
 * - 即時監聽資料變更
 * - 共用資料（所有白名單成員共用同一份資料）
 * - 首次使用時自動初始化預設資料
 */
export function useScheduleData() {
  const { user } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  /**
   * 初始化預設資料（首次使用時執行）
   */
  const initializeDefaultData = async () => {
    try {
      const existingCourses = await getDocuments<Course>(SHARED_DATA_PATH, 'courses');
      const existingShifts = await getDocuments<WorkShift>(SHARED_DATA_PATH, 'workShifts');
      const existingEvents = await getDocuments<Event>(SHARED_DATA_PATH, 'events');

      // 如果 Firestore 是空的，寫入預設資料
      if (existingCourses.length === 0) {
        await batchSetDocuments(SHARED_DATA_PATH, 'courses', schoolSchedule);
      }
      if (existingShifts.length === 0) {
        await batchSetDocuments(SHARED_DATA_PATH, 'workShifts', workShifts);
      }
      if (existingEvents.length === 0) {
        await batchSetDocuments(SHARED_DATA_PATH, 'events', importantEvents);
      }
    } catch (error) {
      console.error('❌ 初始化預設資料失敗:', error);
    }
  };

  /**
   * 當使用者登入時，訂閱 Firestore 資料變更
   */
  useEffect(() => {
    if (!user) {
      // 未登入：不顯示任何資料
      setCourses([]);
      setShifts([]);
      setEvents([]);
      setLoading(false);
      setCanEdit(false);
      return;
    }

    // 已登入：使用共用資料路徑
    setLoading(true);
    setCanEdit(hasWriteAccess(user.email));

    // 首次使用時，確保有預設資料
    initializeDefaultData().then(() => {
      setLoading(false);
    });

    // 訂閱即時資料變更
    const unsubscribeCourses = subscribeToCollection<Course>(
      SHARED_DATA_PATH,
      'courses',
      (data) => setCourses(data)
    );

    const unsubscribeShifts = subscribeToCollection<WorkShift>(
      SHARED_DATA_PATH,
      'workShifts',
      (data) => setShifts(data)
    );

    const unsubscribeEvents = subscribeToCollection<Event>(
      SHARED_DATA_PATH,
      'events',
      (data) => setEvents(data)
    );

    // 清理函數：元件卸載時取消訂閱
    return () => {
      unsubscribeCourses();
      unsubscribeShifts();
      unsubscribeEvents();
    };
  }, [user]);

  // ========== 課程管理 ==========
  const addCourse = async (course: Course) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await setDocument(SHARED_DATA_PATH, 'courses', course.id, course);
  };

  const updateCourse = async (id: string, updatedCourse: Partial<Course>) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await updateDocument(SHARED_DATA_PATH, 'courses', id, updatedCourse);
  };

  const deleteCourse = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await deleteDocument(SHARED_DATA_PATH, 'courses', id);
  };

  // ========== 打工班表管理 ==========
  const addWorkShift = async (shift: WorkShift) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await setDocument(SHARED_DATA_PATH, 'workShifts', shift.id, shift);
  };

  const updateWorkShift = async (id: string, updatedShift: Partial<WorkShift>) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await updateDocument(SHARED_DATA_PATH, 'workShifts', id, updatedShift);
  };

  const deleteWorkShift = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await deleteDocument(SHARED_DATA_PATH, 'workShifts', id);
  };

  // ========== 重要事件管理 ==========
  const addEvent = async (event: Event) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await setDocument(SHARED_DATA_PATH, 'events', event.id, event);
  };

  const updateEvent = async (id: string, updatedEvent: Partial<Event>) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await updateDocument(SHARED_DATA_PATH, 'events', id, updatedEvent);
  };

  const deleteEvent = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await deleteDocument(SHARED_DATA_PATH, 'events', id);
  };

  return {
    // 資料
    courses,
    shifts,
    events,
    loading,
    canEdit, // 新增：是否有編輯權限
    
    // 課程管理方法
    addCourse,
    updateCourse,
    deleteCourse,
    
    // 打工班表管理方法
    addWorkShift,
    updateWorkShift,
    deleteWorkShift,
    
    // 重要事件管理方法
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
