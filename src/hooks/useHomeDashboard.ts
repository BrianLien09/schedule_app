import { useMemo, useState, useEffect } from 'react';
import { schoolSchedule, workShifts, importantEvents } from '../data/schedule';

// 行程事件類型定義
export interface ScheduleEvent {
  type: 'class' | 'work';
  time: string;
  title: string;
  location: string;
  id: string;
}

export interface CurrentEvent extends ScheduleEvent {
  time: string; // 格式: "HH:MM - HH:MM"
}

/**
 * Home Dashboard 資料處理 Hook
 * 負責計算所有儀表板相關的資料統計與行程資訊
 */
export function useHomeDashboard() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // 每一分鐘更新一次時間
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
  const todayDateStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toTimeString().slice(0, 5); // "HH:MM"
  const currentDayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)

  // 1. 計算本週課程數量
  const thisWeekClasses = useMemo(() => {
    return schoolSchedule.filter(course => course.day >= 1 && course.day <= 7).length;
  }, []);

  // 2. 計算本月打工天數
  const thisMonthWorkDays = useMemo(() => {
    return workShifts.filter(s => s.date.startsWith(currentMonthStr)).length;
  }, [currentMonthStr]);

  // 3. 篩選即將到來的課程與打工
  const upcomingEvents = useMemo((): ScheduleEvent[] => {
    const upcomingClasses = schoolSchedule
      .filter(c => c.day === currentDayOfWeek && c.startTime > currentTimeStr)
      .map(c => ({
        type: 'class' as const,
        time: c.startTime,
        title: c.name,
        location: c.location || '',
        id: c.id.toString(),
      }));

    const upcomingWork = workShifts
      .filter(s => s.date === todayDateStr && s.startTime > currentTimeStr)
      .map(s => ({
        type: 'work' as const,
        time: s.startTime,
        title: s.note || '打工',
        location: '工作地點',
        id: s.id,
      }));

    return [...upcomingClasses, ...upcomingWork].sort((a, b) => a.time.localeCompare(b.time));
  }, [currentDayOfWeek, currentTimeStr, todayDateStr]);

  // 4. 取得下一個行程
  const nextEvent = upcomingEvents[0] || null;

  // 5. 篩選正在進行中的行程
  const currentEvent = useMemo((): CurrentEvent | null => {
    const DEFAULT_END_TIME = '23:59';

    const currentClasses = schoolSchedule
      .filter(
        c =>
          c.day === currentDayOfWeek &&
          c.startTime <= currentTimeStr &&
          (c.endTime || DEFAULT_END_TIME) > currentTimeStr
      )
      .map(c => ({
        type: 'class' as const,
        time: `${c.startTime} - ${c.endTime || '?'}`,
        title: c.name,
        location: c.location || '',
        id: c.id.toString(),
      }));

    const currentWork = workShifts
      .filter(s => s.date === todayDateStr && s.startTime <= currentTimeStr && s.endTime > currentTimeStr)
      .map(s => ({
        type: 'work' as const,
        time: `${s.startTime} - ${s.endTime}`,
        title: s.note || '打工',
        location: '工作地點',
        id: s.id,
      }));

    return [...currentClasses, ...currentWork][0] || null;
  }, [currentDayOfWeek, currentTimeStr, todayDateStr]);

  // 6. 今日課程列表 (最多顯示 5 筆)
  const todaySchedule = useMemo(() => {
    return schoolSchedule
      .filter(course => course.day === currentDayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  }, [currentDayOfWeek]);

  // 7. 本月打工班表
  const monthlyWorkShifts = useMemo(() => {
    return workShifts
      .filter(s => s.date.startsWith(currentMonthStr))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [currentMonthStr]);

  // 8. 即將到來的重要事件
  const upcomingImportantEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return importantEvents.filter(event => event.date >= today);
  }, []);

  return {
    // 時間資訊
    currentTimeStr,
    currentDayOfWeek,
    currentMonth,

    // 統計資料
    thisWeekClasses,
    thisMonthWorkDays,

    // 行程資訊
    nextEvent,
    currentEvent,
    todaySchedule,
    monthlyWorkShifts,
    upcomingImportantEvents,
  };
}
