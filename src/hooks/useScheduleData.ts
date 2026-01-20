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

/**
 * Schedule Data Management Hook
 * 
 * 管理課程、打工班表和重要事件的資料，支援：
 * - Firestore 雲端同步
 * - 即時監聽資料變更
 * - 自動從 localStorage 遷移至 Firestore（首次登入時）
 * - 未登入時使用 localStorage 作為本地端儲存
 */
export function useScheduleData() {
  const { user } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * 從 localStorage 遷移資料至 Firestore（僅首次登入時執行）
   */
  const migrateFromLocalStorage = async (userId: string) => {
    try {
      // 檢查是否已經遷移過
      const migrated = localStorage.getItem('firestore_migrated');
      if (migrated) return;

      // 讀取 localStorage 中的資料
      const localCourses = localStorage.getItem('schedule_courses');
      const localShifts = localStorage.getItem('schedule_workShifts');
      const localEvents = localStorage.getItem('schedule_events');

      // 如果 localStorage 有資料，則遷移至 Firestore
      if (localCourses) {
        const coursesData = JSON.parse(localCourses);
        await batchSetDocuments(userId, 'courses', coursesData);
      }

      if (localShifts) {
        const shiftsData = JSON.parse(localShifts);
        await batchSetDocuments(userId, 'workShifts', shiftsData);
      }

      if (localEvents) {
        const eventsData = JSON.parse(localEvents);
        await batchSetDocuments(userId, 'events', eventsData);
      }

      // 標記已遷移
      localStorage.setItem('firestore_migrated', 'true');
      console.log('✅ 資料已成功遷移至 Firestore');
    } catch (error) {
      console.error('❌ 資料遷移失敗:', error);
    }
  };

  /**
   * 初始化預設資料（如果 Firestore 中沒有資料）
   */
  const initializeDefaultData = async (userId: string) => {
    try {
      const existingCourses = await getDocuments<Course>(userId, 'courses');
      const existingShifts = await getDocuments<WorkShift>(userId, 'workShifts');
      const existingEvents = await getDocuments<Event>(userId, 'events');

      // 如果 Firestore 是空的，寫入預設資料
      if (existingCourses.length === 0) {
        await batchSetDocuments(userId, 'courses', schoolSchedule);
      }
      if (existingShifts.length === 0) {
        await batchSetDocuments(userId, 'workShifts', workShifts);
      }
      if (existingEvents.length === 0) {
        await batchSetDocuments(userId, 'events', importantEvents);
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
      // 未登入時，從 localStorage 讀取資料
      setLoading(true);
      const localCourses = localStorage.getItem('schedule_courses');
      const localShifts = localStorage.getItem('schedule_workShifts');
      const localEvents = localStorage.getItem('schedule_events');

      setCourses(localCourses ? JSON.parse(localCourses) : schoolSchedule);
      setShifts(localShifts ? JSON.parse(localShifts) : workShifts);
      setEvents(localEvents ? JSON.parse(localEvents) : importantEvents);
      setLoading(false);
      return;
    }

    // 已登入：使用 Firestore
    const userId = user.uid;
    setLoading(true);

    // 首次登入時，嘗試從 localStorage 遷移資料
    migrateFromLocalStorage(userId).then(() => {
      // 確保有預設資料
      return initializeDefaultData(userId);
    }).then(() => {
      setLoading(false);
    });

    // 訂閱即時資料變更
    const unsubscribeCourses = subscribeToCollection<Course>(
      userId,
      'courses',
      (data) => setCourses(data)
    );

    const unsubscribeShifts = subscribeToCollection<WorkShift>(
      userId,
      'workShifts',
      (data) => setShifts(data)
    );

    const unsubscribeEvents = subscribeToCollection<Event>(
      userId,
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
    if (!user) {
      // 未登入：更新 localStorage
      const newCourses = [...courses, course];
      setCourses(newCourses);
      localStorage.setItem('schedule_courses', JSON.stringify(newCourses));
      return;
    }

    // 已登入：寫入 Firestore（subscribeToCollection 會自動更新 state）
    await setDocument(user.uid, 'courses', course.id, course);
  };

  const updateCourse = async (id: string, updatedCourse: Partial<Course>) => {
    if (!user) {
      const newCourses = courses.map(c => (c.id === id ? { ...c, ...updatedCourse } : c));
      setCourses(newCourses);
      localStorage.setItem('schedule_courses', JSON.stringify(newCourses));
      return;
    }

    await updateDocument(user.uid, 'courses', id, updatedCourse);
  };

  const deleteCourse = async (id: string) => {
    if (!user) {
      const newCourses = courses.filter(c => c.id !== id);
      setCourses(newCourses);
      localStorage.setItem('schedule_courses', JSON.stringify(newCourses));
      return;
    }

    await deleteDocument(user.uid, 'courses', id);
  };

  // ========== 打工班表管理 ==========
  const addWorkShift = async (shift: WorkShift) => {
    if (!user) {
      const newShifts = [...shifts, shift];
      setShifts(newShifts);
      localStorage.setItem('schedule_workShifts', JSON.stringify(newShifts));
      return;
    }

    await setDocument(user.uid, 'workShifts', shift.id, shift);
  };

  const updateWorkShift = async (id: string, updatedShift: Partial<WorkShift>) => {
    if (!user) {
      const newShifts = shifts.map(s => (s.id === id ? { ...s, ...updatedShift } : s));
      setShifts(newShifts);
      localStorage.setItem('schedule_workShifts', JSON.stringify(newShifts));
      return;
    }

    await updateDocument(user.uid, 'workShifts', id, updatedShift);
  };

  const deleteWorkShift = async (id: string) => {
    if (!user) {
      const newShifts = shifts.filter(s => s.id !== id);
      setShifts(newShifts);
      localStorage.setItem('schedule_workShifts', JSON.stringify(newShifts));
      return;
    }

    await deleteDocument(user.uid, 'workShifts', id);
  };

  // ========== 重要事件管理 ==========
  const addEvent = async (event: Event) => {
    if (!user) {
      const newEvents = [...events, event];
      setEvents(newEvents);
      localStorage.setItem('schedule_events', JSON.stringify(newEvents));
      return;
    }

    await setDocument(user.uid, 'events', event.id, event);
  };

  const updateEvent = async (id: string, updatedEvent: Partial<Event>) => {
    if (!user) {
      const newEvents = events.map(e => (e.id === id ? { ...e, ...updatedEvent } : e));
      setEvents(newEvents);
      localStorage.setItem('schedule_events', JSON.stringify(newEvents));
      return;
    }

    await updateDocument(user.uid, 'events', id, updatedEvent);
  };

  const deleteEvent = async (id: string) => {
    if (!user) {
      const newEvents = events.filter(e => e.id !== id);
      setEvents(newEvents);
      localStorage.setItem('schedule_events', JSON.stringify(newEvents));
      return;
    }

    await deleteDocument(user.uid, 'events', id);
  };

  // ========== 重置為預設資料 ==========
  const resetToDefault = async () => {
    if (!user) {
      setCourses(schoolSchedule);
      setShifts(workShifts);
      setEvents(importantEvents);
      localStorage.setItem('schedule_courses', JSON.stringify(schoolSchedule));
      localStorage.setItem('schedule_workShifts', JSON.stringify(workShifts));
      localStorage.setItem('schedule_events', JSON.stringify(importantEvents));
      return;
    }

    // 寫入預設資料至 Firestore
    await batchSetDocuments(user.uid, 'courses', schoolSchedule);
    await batchSetDocuments(user.uid, 'workShifts', workShifts);
    await batchSetDocuments(user.uid, 'events', importantEvents);
  };

  return {
    // 資料
    courses,
    shifts,
    events,
    loading,
    
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
    
    // 重置方法
    resetToDefault,
  };
}
