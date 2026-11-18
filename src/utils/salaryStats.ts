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

export interface PayBreakdown {
  /** 應發總額：工時 × 時薪的加總 */
  grossPay: number;
  /** 勞保勞工自付的扣除額 */
  laborInsurance: number;
  /** 實際到帳 */
  netPay: number;
}

/**
 * 計算單月的實際到帳。
 * 當月沒有任何薪資時不扣勞保：雇主是從薪資中代扣，沒有發薪就沒有扣款，畫面上也不該出現負的到帳金額。
 * 扣除額最多扣到 0 為止，同樣避免出現負數。
 */
export function calculateMonthlyTakeHome(grossPay: number, laborInsuranceEmployee: number): PayBreakdown {
  const laborInsurance = grossPay > 0 ? Math.min(grossPay, Math.max(0, laborInsuranceEmployee)) : 0;
  return { grossPay, laborInsurance, netPay: grossPay - laborInsurance };
}

/**
 * 計算任意範圍（全部或單月）的實際到帳：勞保按「有薪資的月份」逐月扣除。
 * 不能直接用總額減一次勞保，否則統計「全部」時只會扣到一個月。
 */
export function calculateRangeTakeHome(records: SalaryRecordInput[], laborInsuranceEmployee: number): PayBreakdown {
  const monthlyGross = new Map<string, number>();
  for (const record of records) {
    const month = record.date.slice(0, 7);
    monthlyGross.set(month, (monthlyGross.get(month) ?? 0) + calculatePay(record));
  }
  let grossPay = 0;
  let laborInsurance = 0;
  for (const gross of monthlyGross.values()) {
    const breakdown = calculateMonthlyTakeHome(gross, laborInsuranceEmployee);
    grossPay += breakdown.grossPay;
    laborInsurance += breakdown.laborInsurance;
  }
  return { grossPay, laborInsurance, netPay: grossPay - laborInsurance };
}
