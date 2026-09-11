/**
 * 課表資料啟動與舊資料遷移服務。
 *
 * 將一次性的資料準備工作放在服務層，讓 Hook 只負責訂閱資料與管理畫面狀態，
 * 同時保留既有預設資料與舊版班表轉換規則。
 */

import {
  batchSetDocuments,
  getDocuments,
} from '@/services/firestoreService';
import { PERSONAL_COLLECTIONS } from '@/services/firestoreCollections';
import {
  importantEvents,
  workShifts as defaultWorkShifts,
} from '@/data/schedule';
import type { Event, WorkShift } from '@/data/schedule';
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
 * 初始化個人課表所需的預設資料，並將舊版班表轉成薪資記錄。
 *
 * 這個流程維持冪等性：只有在對應集合為空時建立預設資料，
 * 舊班表也只會補上尚未連結的薪資記錄，因此重複進入頁面不會新增重複資料。
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
    const existingEvents = await getDocuments<Event>(
      userId,
      PERSONAL_COLLECTIONS.events
    );

    if (existingSalaryRecords.length === 0 && existingLegacyShifts.length === 0) {
      const seededSalaryRecords = defaultWorkShifts.map((shift) =>
        createSalaryRecordFromWorkShift(shift, {
          id: `salary-${shift.id}`,
          legacyWorkShiftId: shift.id,
        })
      );
      await batchSetDocuments(
        userId,
        PERSONAL_COLLECTIONS.salaryRecords,
        seededSalaryRecords
      );
    } else if (existingLegacyShifts.length > 0) {
      await migrateLegacyWorkShifts(userId, existingSalaryRecords, existingLegacyShifts);
    }

    if (existingEvents.length === 0) {
      await batchSetDocuments(userId, PERSONAL_COLLECTIONS.events, importantEvents);
    }
  } catch (error) {
    console.error('初始化個人資料失敗', error);
  }
}
