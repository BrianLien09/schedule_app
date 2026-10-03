/**
 * 課表資料啟動與舊資料遷移服務。
 *
 * 將一次性的資料準備工作放在服務層，讓 Hook 只負責訂閱資料與管理畫面狀態，
 * 只轉換登入者已儲存的班表，不將個人的內建資料寫入其他帳號。
 */

import {
  batchSetDocuments,
  getDocuments,
} from '@/services/firestoreService';
import { PERSONAL_COLLECTIONS } from '@/services/firestoreCollections';
import type { WorkShift } from '@/data/schedule';
import {
  createSalaryRecordFromWorkShift,
  isSalaryRecordLinkedToShift,
  type SalaryRecord,
} from '@/data/workRecords';

async function migrateLegacyWorkShifts(
  userId: string,
  existingSalaryRecords: SalaryRecord[],
  legacyShifts: WorkShift[]
): Promise<void> {
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
    await batchSetDocuments(userId, PERSONAL_COLLECTIONS.salaryRecords, recordsToCreate);
  }
}

/**
 * 將登入者自己的舊版班表轉成薪資記錄。
 *
 * 空白帳號維持空白；舊班表只補上尚未連結的薪資記錄，避免重複建立資料。
 */
export async function bootstrapScheduleData(userId: string): Promise<void> {
  try {
    const existingLegacyShifts = await getDocuments<WorkShift>(
      userId,
      PERSONAL_COLLECTIONS.workShifts
    );
    const existingSalaryRecords = await getDocuments<SalaryRecord>(
      userId,
      PERSONAL_COLLECTIONS.salaryRecords
    );
    if (existingLegacyShifts.length > 0) {
      await migrateLegacyWorkShifts(userId, existingSalaryRecords, existingLegacyShifts);
    }
  } catch (error) {
    console.error('初始化個人資料失敗', error);
  }
}
