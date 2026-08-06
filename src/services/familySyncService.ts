/**
 * Family Sync Service
 * 
 * 負責將 schedule-app 中的打工班表 (WorkShift / SalaryRecord)
 * 同步寫入 family-web 的 Firebase Firestore 資料庫 (schedules 集合) 中。
 */

import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { familyDb } from '@/lib/firebase';
import type { WorkShift } from '@/data/schedule';
import type { SalaryRecord } from '@/data/workRecords';

/**
 * 將打工資料格式轉為 family-web 的 ScheduleItem 格式
 */
function mapShiftToFamilySchedule(shift: WorkShift | SalaryRecord) {
  const note = 'note' in shift ? shift.note : '';
  const location = 'location' in shift ? shift.location : '';
  
  // 決定標題：移除 Emoji 及 "打工: " 前綴，直接以備註作為標題
  let title = '阿弟排班';
  if (note && note.trim()) {
    title = note.trim();
  }

  // 決定描述呈現
  const descParts: string[] = [];
  if (location) descParts.push(`地點: ${location}`);
  if (note && note.trim() !== title) descParts.push(note.trim());
  const description = descParts.join(' | ') || title;

  return {
    title,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    category: '阿弟排班',
    description,
    source: 'schedule-app',
    workShiftId: shift.id,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 取得在 family-web Firestore `schedules` 集合中對應的文件 ID
 */
function getFamilyDocId(workShiftId: string): string {
  return `workshift_${workShiftId}`;
}

/**
 * 同步 (新增或覆蓋) 一筆打工班表到 family-web 的 schedules 集合
 */
export async function syncWorkShiftToFamilyWeb(
  shift: WorkShift | SalaryRecord
): Promise<void> {
  try {
    if (!familyDb) return;
    const familyDocId = getFamilyDocId(shift.id);
    const docRef = doc(familyDb, 'schedules', familyDocId);
    const scheduleData = mapShiftToFamilySchedule(shift);

    await setDoc(docRef, scheduleData, { merge: true });
    console.log(`[FamilySync] 已成功同步打工班表 (${shift.date}) 到 family-web`);
  } catch (error) {
    console.error('[FamilySync] 同步至 family-web 失敗:', error);
  }
}

/**
 * 更新 family-web 中的打工班表
 */
export async function updateWorkShiftInFamilyWeb(
  id: string,
  updatedShift: Partial<WorkShift | SalaryRecord>
): Promise<void> {
  try {
    if (!familyDb) return;
    const familyDocId = getFamilyDocId(id);
    const docRef = doc(familyDb, 'schedules', familyDocId);

    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (updatedShift.date !== undefined) updatePayload.date = updatedShift.date;
    if (updatedShift.startTime !== undefined) updatePayload.startTime = updatedShift.startTime;
    if (updatedShift.endTime !== undefined) updatePayload.endTime = updatedShift.endTime;

    const note = 'note' in updatedShift ? updatedShift.note : undefined;
    if (note !== undefined) {
      updatePayload.title = note && note.trim() ? note.trim() : '阿弟排班';
      updatePayload.description = note;
    }

    // 補齊基礎 metadata，確保若文件不存在時（Upsert）也能符合 family-web 結構
    updatePayload.category = '阿弟排班';
    updatePayload.source = 'schedule-app';
    updatePayload.workShiftId = id;

    // 使用 setDoc(..., { merge: true }) 代替 updateDoc，
    // 若 document 已存在則更新，若不存在則自動創建（不會觸發 No document to update 錯誤）
    await setDoc(docRef, updatePayload, { merge: true });
    console.log(`[FamilySync] 已成功更新/同步 family-web 的打工班表 (${id})`);
  } catch (error) {
    console.error('[FamilySync] 更新 family-web 失敗:', error);
  }
}

/**
 * 刪除 family-web 中對應的打工班表
 */
export async function deleteWorkShiftFromFamilyWeb(id: string): Promise<void> {
  try {
    if (!familyDb) return;
    const familyDocId = getFamilyDocId(id);
    const docRef = doc(familyDb, 'schedules', familyDocId);

    await deleteDoc(docRef);
    console.log(`[FamilySync] 已成功從 family-web 刪除打工班表 (${id})`);
  } catch (error) {
    console.error('[FamilySync] 刪除 family-web 項目失敗:', error);
  }
}

/**
 * 批次同步多筆打工班表到 family-web
 */
export async function batchSyncWorkShiftsToFamilyWeb(
  shifts: Array<WorkShift | SalaryRecord>
): Promise<void> {
  try {
    if (!familyDb) return;
    const promises = shifts.map((shift) => syncWorkShiftToFamilyWeb(shift));
    await Promise.all(promises);
    console.log(`[FamilySync] 已批次同步 ${shifts.length} 筆打工班表到 family-web`);
  } catch (error) {
    console.error('[FamilySync] 批次同步至 family-web 失敗:', error);
  }
}
