import { useLocalStorage } from './useLocalStorage';
import { schoolSchedule, workShifts, importantEvents, Course, WorkShift, Event } from '../data/schedule';

/**
 * Schedule Data Management Hook
 * 管理課程、打工班表和重要事件的資料，支援 localStorage 持久化
 */
export function useScheduleData() {
  // 使用 localStorage 儲存資料，預設值為原始資料
  const [courses, setCourses] = useLocalStorage<Course[]>('schedule_courses', schoolSchedule);
  const [shifts, setShifts] = useLocalStorage<WorkShift[]>('schedule_workShifts', workShifts);
  const [events, setEvents] = useLocalStorage<Event[]>('schedule_events', importantEvents);

  // 課程管理
  const addCourse = (course: Course) => {
    setCourses(prev => [...prev, course]);
  };

  const updateCourse = (id: string, updatedCourse: Partial<Course>) => {
    setCourses(prev => prev.map(c => (c.id === id ? { ...c, ...updatedCourse } : c)));
  };

  const deleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  // 打工班表管理
  const addWorkShift = (shift: WorkShift) => {
    setShifts(prev => [...prev, shift]);
  };

  const updateWorkShift = (id: string, updatedShift: Partial<WorkShift>) => {
    setShifts(prev => prev.map(s => (s.id === id ? { ...s, ...updatedShift } : s)));
  };

  const deleteWorkShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  // 重要事件管理
  const addEvent = (event: Event) => {
    setEvents(prev => [...prev, event]);
  };

  const updateEvent = (id: string, updatedEvent: Partial<Event>) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...updatedEvent } : e)));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // 重置為預設資料
  const resetToDefault = () => {
    setCourses(schoolSchedule);
    setShifts(workShifts);
    setEvents(importantEvents);
  };

  return {
    // 資料
    courses,
    shifts,
    events,
    
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
