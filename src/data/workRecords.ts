import type { WorkShift } from '@/data/schedule';

export type RoleType = 'assistant' | 'instructor';

export interface SalaryRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  workHours: number;
  hourlyRate: number;
  role: RoleType;
  shiftCategory?: string;
  workShiftId?: string;
}

export const ROLE_HOURLY_RATES: Record<RoleType, number> = {
  assistant: 200,
  instructor: 500,
};

/**
 * 依照上下班時間換算工時，避免月曆端新增資料時缺少薪資欄位。
 */
export function calculateWorkHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return 0;
  }

  return Number((totalMinutes / 60).toFixed(2));
}

export function mapSalaryRecordToWorkShift(record: SalaryRecord): WorkShift {
  return {
    id: record.id,
    date: record.date,
    startTime: record.startTime,
    endTime: record.endTime,
    note: record.shiftCategory,
    role: record.role,
    hourlyRate: record.hourlyRate,
    workHours: record.workHours,
    shiftCategory: record.shiftCategory,
    salaryRecordId: record.id,
    legacyWorkShiftId: record.workShiftId,
  };
}

interface CreateSalaryRecordFromShiftOptions {
  id?: string;
  existingRecord?: SalaryRecord;
  legacyWorkShiftId?: string;
}

/**
 * 將月曆班表補齊成薪資格式，讓兩個畫面共用同一份資料來源。
 */
export function createSalaryRecordFromWorkShift(
  shift: WorkShift,
  options: CreateSalaryRecordFromShiftOptions = {}
): SalaryRecord {
  const existingRecord = options.existingRecord;
  const role = shift.role ?? existingRecord?.role ?? 'assistant';
  const hourlyRate =
    shift.hourlyRate ?? existingRecord?.hourlyRate ?? ROLE_HOURLY_RATES[role];
  const workHours =
    shift.workHours ?? calculateWorkHours(shift.startTime, shift.endTime);
  const shiftCategory = shift.shiftCategory ?? shift.note ?? existingRecord?.shiftCategory;

  const candidateId =
    (options.id && options.id.trim()) ||
    (shift.salaryRecordId && shift.salaryRecordId.trim()) ||
    (existingRecord?.id && existingRecord.id.trim()) ||
    (shift.id && shift.id.trim()) ||
    `shift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: candidateId,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    workHours: Number.isFinite(workHours) ? workHours : 0,
    hourlyRate,
    role,
    shiftCategory: shiftCategory?.trim() ? shiftCategory : undefined,
    workShiftId:
      options.legacyWorkShiftId ??
      shift.legacyWorkShiftId ??
      existingRecord?.workShiftId,
  };
}

/**
 * 遷移舊版 workShifts 時，用欄位比對避免重複建立薪資記錄。
 */
export function isSalaryRecordLinkedToShift(
  record: SalaryRecord,
  shift: WorkShift
): boolean {
  const normalizedShiftCategory = shift.shiftCategory ?? shift.note ?? '';
  const normalizedRecordCategory = record.shiftCategory ?? '';

  return (
    record.workShiftId === shift.id ||
    (
      record.date === shift.date &&
      record.startTime === shift.startTime &&
      record.endTime === shift.endTime &&
      normalizedRecordCategory === normalizedShiftCategory
    )
  );
}
