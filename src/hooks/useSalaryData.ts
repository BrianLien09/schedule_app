import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  batchSetDocuments,
} from '@/services/firestoreService';
import { hasWriteAccess } from '@/config/permissions';
import type { SalaryRecord } from '@/data/workRecords';
import {
  syncWorkShiftToFamilyWeb,
  updateWorkShiftInFamilyWeb,
  deleteWorkShiftFromFamilyWeb,
  batchSyncWorkShiftsToFamilyWeb,
} from '@/services/familySyncService';

export type { RoleType, SalaryRecord } from '@/data/workRecords';

/**
 * 共用薪資資料固定放在 shared collection，讓月曆與薪資工具讀到同一份班表。
 */
const SHARED_DATA_PATH = 'shared';

export function useSalaryData() {
  const { user } = useAuth();
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      setCanEdit(false);
      return;
    }

    setLoading(true);
    setCanEdit(hasWriteAccess(user.email));

    const unsubscribe = subscribeToCollection<SalaryRecord>(
      SHARED_DATA_PATH,
      'salaryRecords',
      (data) => {
        setRecords(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addRecord = async (record: SalaryRecord) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await setDocument(SHARED_DATA_PATH, 'salaryRecords', record.id, record);
    // 🏠 同步至 family-web 家庭月曆
    await syncWorkShiftToFamilyWeb(record);
  };

  const updateRecord = async (id: string, updatedRecord: Partial<SalaryRecord>) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await updateDocument(SHARED_DATA_PATH, 'salaryRecords', id, updatedRecord);
    // 🏠 同步更新至 family-web 家庭月曆
    await updateWorkShiftInFamilyWeb(id, updatedRecord);
  };

  const deleteRecord = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const targetRecord = records.find((record) => record.id === id);

    await deleteDocument(SHARED_DATA_PATH, 'salaryRecords', id);

    if (targetRecord?.workShiftId) {
      await deleteDocument(SHARED_DATA_PATH, 'workShifts', targetRecord.workShiftId);
    }
    // 🏠 同步從 family-web 家庭月曆刪除
    await deleteWorkShiftFromFamilyWeb(id);
  };

  const batchAddRecords = async (newRecords: SalaryRecord[]) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await batchSetDocuments(SHARED_DATA_PATH, 'salaryRecords', newRecords);
    // 🏠 批次同步至 family-web 家庭月曆
    await batchSyncWorkShiftsToFamilyWeb(newRecords);
  };

  const batchUpdateRecords = async (
    updates: Array<{ id: string; data: Partial<SalaryRecord> }>
  ) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const promises = updates.map(({ id, data }) =>
      updateDocument(SHARED_DATA_PATH, 'salaryRecords', id, data)
    );
    await Promise.all(promises);

    // 🏠 批次更新至 family-web
    const familyUpdatePromises = updates.map(({ id, data }) =>
      updateWorkShiftInFamilyWeb(id, data)
    );
    await Promise.all(familyUpdatePromises);
  };

  const batchDeleteRecords = async (ids: string[]) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const recordsToDelete = records.filter((record) => ids.includes(record.id));
    const salaryDeletePromises = ids.map((id) =>
      deleteDocument(SHARED_DATA_PATH, 'salaryRecords', id)
    );
    const legacyShiftDeletePromises = recordsToDelete
      .map((record) => record.workShiftId)
      .filter((workShiftId): workShiftId is string => Boolean(workShiftId))
      .map((workShiftId) => deleteDocument(SHARED_DATA_PATH, 'workShifts', workShiftId));

    await Promise.all([...salaryDeletePromises, ...legacyShiftDeletePromises]);

    // 🏠 批次從 family-web 刪除
    const familyDeletePromises = ids.map((id) => deleteWorkShiftFromFamilyWeb(id));
    await Promise.all(familyDeletePromises);
  };

  return {
    records,
    loading,
    canEdit,
    addRecord,
    updateRecord,
    deleteRecord,
    batchAddRecords,
    batchUpdateRecords,
    batchDeleteRecords,
  };
}
