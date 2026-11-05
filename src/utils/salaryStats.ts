import type { SalaryRecord } from '@/hooks/useSalaryData';
import type { MonthStats } from '@/components/salary/SalaryAnalytics';

type SalaryRecordInput = Omit<SalaryRecord, 'id'>;

/** 由開始、結束時間（HH:mm）計算工時；結束早於開始時視為 0，避免產生負薪資 */
export function calculateWorkHoursFromTimes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return Math.max(0, (endMinutes - startMinutes) / 60);
}

export function calculateHours(record: SalaryRecordInput): number {
  return record.workHours || 0;
}

export function calculatePay(record: SalaryRecordInput): number {
  return Math.round((record.workHours || 0) * record.hourlyRate);
}

/**
 * 以 anchorMonth（YYYY-MM）為終點，彙整最近 6 個月的薪資統計。
 * 沒有記錄的月份補 0，圖表才不會因缺月而斷開。
 */
export function buildMonthlyStats(records: SalaryRecord[], anchorMonth: string): MonthStats[] {
  const statsMap = new Map<string, MonthStats>();
  records.forEach((record) => {
    const month = record.date.slice(0, 7);
    const stats = statsMap.get(month) ?? { month, totalPay: 0, totalHours: 0, recordCount: 0 };
    stats.totalPay += calculatePay(record);
    stats.totalHours += calculateHours(record);
    stats.recordCount += 1;
    statsMap.set(month, stats);
  });

  let anchorDate = new Date();
  if (anchorMonth && /^\d{4}-\d{2}$/.test(anchorMonth)) {
    const [year, month] = anchorMonth.split('-').map(Number);
    anchorDate = new Date(year, month - 1, 1);
  }

  const result: MonthStats[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    result.push(statsMap.get(month) ?? { month, totalPay: 0, totalHours: 0, recordCount: 0 });
  }
  return result;
}
