/**
 * family-web 打工月曆同步服務
 *
 * 主資料依 Google 帳號隔離；本服務只將 Brian 與 lovesweet 的打工資料
 * 複製到 family-web，並在標題前加入可辨識的家庭成員前綴。
 */

import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { familyDb } from '@/lib/firebase';
import {
  getFamilyWebScheduleCategory,
  getFamilyWebTitlePrefix,
} from '@/config/permissions';
import type { WorkShift } from '@/data/schedule';

type FamilySyncShift = WorkShift;

function getFamilyDocId(workShiftId: string, titlePrefix: string): string {
  const ownerKey = titlePrefix === '百頁' ? 'brian' : 'lovesweet';
  return `workshift_${ownerKey}_${workShiftId}`;
}

function mapShiftToFamilySchedule(
  shift: FamilySyncShift,
  titlePrefix: string,
  category: string
): Record<string, string> {
  const note = 'note' in shift && typeof shift.note === 'string' ? shift.note.trim() : '';
  const shiftCategory = typeof shift.shiftCategory === 'string'
    ? shift.shiftCategory.trim()
    : '';
  const location = 'location' in shift && typeof shift.location === 'string'
    ? shift.location.trim()
    : '';
  const displayName = shiftCategory || note || '打工班表';
  const title = `${titlePrefix}${displayName}`;
  const descriptionParts: string[] = [];

  if (location) descriptionParts.push(`地點: ${location}`);
  if (note && note !== displayName) descriptionParts.push(note);

  return {
    title,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    category,
    description: descriptionParts.join(' | ') || title,
    source: 'schedule-app',
    workShiftId: shift.id,
    updatedAt: new Date().toISOString(),
  };
}

function getSyncContext(email: string | null | undefined) {
  const titlePrefix = getFamilyWebTitlePrefix(email);
  const category = getFamilyWebScheduleCategory(email);
  if (!familyDb || !titlePrefix || !category) return null;
  return { db: familyDb, titlePrefix, category };
}

/**
 * 同步指定帳號的一筆打工班表到 family-web。
 * 未列入同步白名單的帳號會直接略過，不會寫入 secondary Firebase。
 */
export async function syncWorkShiftToFamilyWeb(
  shift: FamilySyncShift,
  email: string | null | undefined
): Promise<void> {
  const context = getSyncContext(email);
  if (!context) return;

  try {
    const docRef = doc(context.db, 'schedules', getFamilyDocId(shift.id, context.titlePrefix));
    await setDoc(
      docRef,
      mapShiftToFamilySchedule(shift, context.titlePrefix, context.category),
      { merge: true }
    );
  } catch (error) {
    console.error('[FamilySync] 同步至 family-web 失敗:', error);
  }
}

/**
 * 更新 family-web 中對應的班表，使用完整合併資料確保標題前綴同步更新。
 */
export async function updateWorkShiftInFamilyWeb(
  id: string,
  updatedShift: Partial<FamilySyncShift>,
  email: string | null | undefined
): Promise<void> {
  const context = getSyncContext(email);
  if (!context) return;

  try {
    const docRef = doc(context.db, 'schedules', getFamilyDocId(id, context.titlePrefix));
    const updatePayload: Record<string, string> = {
      updatedAt: new Date().toISOString(),
      category: context.category,
      source: 'schedule-app',
      workShiftId: id,
    };

    if (updatedShift.date !== undefined) updatePayload.date = updatedShift.date;
    if (updatedShift.startTime !== undefined) updatePayload.startTime = updatedShift.startTime;
    if (updatedShift.endTime !== undefined) updatePayload.endTime = updatedShift.endTime;

    if (updatedShift.shiftCategory !== undefined || updatedShift.note !== undefined) {
      const shiftCategory = updatedShift.shiftCategory?.trim() || '';
      const note = updatedShift.note?.trim() || '';
      const displayName = shiftCategory || note || '打工班表';
      updatePayload.title = `${context.titlePrefix}${displayName}`;
      updatePayload.description = note && note !== displayName ? note : updatePayload.title;
    }

    await setDoc(docRef, updatePayload, { merge: true });
  } catch (error) {
    console.error('[FamilySync] 更新 family-web 失敗:', error);
  }
}

/**
 * 刪除 family-web 中對應的班表。
 */
export async function deleteWorkShiftFromFamilyWeb(
  id: string,
  email: string | null | undefined
): Promise<void> {
  const context = getSyncContext(email);
  if (!context) return;

  try {
    await deleteDoc(doc(context.db, 'schedules', getFamilyDocId(id, context.titlePrefix)));
  } catch (error) {
    console.error('[FamilySync] 刪除 family-web 項目失敗:', error);
  }
}

/**
 * 批次同步指定帳號的打工班表到 family-web。
 */
export async function batchSyncWorkShiftsToFamilyWeb(
  shifts: FamilySyncShift[],
  email: string | null | undefined
): Promise<number> {
  const context = getSyncContext(email);
  if (!context) return 0;

  await Promise.all(shifts.map((shift) => syncWorkShiftToFamilyWeb(shift, email)));
  return shifts.length;
}
