import type { WorkShift } from '@/data/schedule';
import { calculateWorkHours } from '@/data/workRecords';
import { localDateKey } from '@/utils/agenda';

/** 工時沿用薪資記錄的已設定值，避免扣除休息時間的班次被重新算成時間差。 */
export function summarizeMonthlyWork(shifts: WorkShift[], now: Date) {
  const today = localDateKey(now);
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const items = shifts.filter((shift) => shift.date.startsWith(today.slice(0, 7))).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map((shift) => {
    const completed = shift.date < today || (shift.date === today && shift.endTime <= time);
    const ongoing = shift.date === today && shift.startTime <= time && shift.endTime > time;
    const hours = shift.workHours ?? calculateWorkHours(shift.startTime, shift.endTime);
    return { shift, completed, ongoing, hours, title: shift.shiftCategory?.trim() || shift.note?.trim() || shift.roleName || '打工班次',
      status: completed ? '已完成' : ongoing ? '上班中' : shift.date === today ? '今日上班' : shift.date === localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)) ? '明天上班' : `${shift.date.slice(5)} 上班` };
  });
  const completed = items.filter((item) => item.completed);
  return { items, days: new Set(items.map((item) => item.shift.date)).size,
    completedCount: completed.length, remainingCount: items.length - completed.length,
    totalHours: items.reduce((sum, item) => sum + item.hours, 0), completedHours: completed.reduce((sum, item) => sum + item.hours, 0),
    totalPay: items.reduce((sum, item) => sum + item.hours * (item.shift.hourlyRate ?? 0), 0),
    progress: items.length ? Math.round(completed.length / items.length * 100) : 0 };
}
