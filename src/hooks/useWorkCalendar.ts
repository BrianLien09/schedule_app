import { useState, useEffect, useRef } from 'react';
import { workShifts, type WorkShift } from '../data/schedule';

/**
 * 打工月曆 Hook
 * 負責處理月曆資料與互動邏輯
 */
export function useWorkCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); // 預設 Jan 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const scrollTargetRef = useRef<string | null>(null);

  // 計算月曆資訊
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun

    // 調整為週一開始: Mon=0, Sun=6
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    return { days, startDay };
  };

  // 切換月份
  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  // 取得指定日期的班表
  const getShiftsForDate = (day: number): WorkShift[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return workShifts.filter((s) => s.date === dateStr);
  };

  // 取得當月所有班表 (已排序)
  const currentMonthShifts = workShifts
    .filter((s: WorkShift) => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    })
    .sort((a: WorkShift, b: WorkShift) => a.date.localeCompare(b.date));

  // 處理日期點擊 (設定 scroll 目標)
  const handleDateClick = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    setSelectedDate(dateStr);
    scrollTargetRef.current = dateStr;
  };

  // 當 scrollTargetRef 改變時觸發滾動 (透過 useEffect 而非 setTimeout)
  useEffect(() => {
    if (scrollTargetRef.current) {
      const element = document.querySelector(`[data-date="${scrollTargetRef.current}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      scrollTargetRef.current = null;
    }
  }, [selectedDate]);

  return {
    currentMonth,
    selectedDate,
    changeMonth,
    getDaysInMonth,
    getShiftsForDate,
    currentMonthShifts,
    handleDateClick,
  };
}
