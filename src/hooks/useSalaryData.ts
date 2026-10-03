import { startTransition, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  setDocument,
  updateDocument,
  deleteRelatedDocuments,
  subscribeToCollectionWithError,
  batchSetDocuments,
} from '@/services/firestoreService';
import { PERSONAL_COLLECTIONS } from '@/services/firestoreCollections';
import { hasWriteAccess } from '@/config/permissions';
import type { SalaryRecord } from '@/data/workRecords';

export type { RoleType, SalaryRecord } from '@/data/workRecords';

export function useSalaryData() {
  const { user } = useAuth();
  const [recordState, setRecordState] = useState<{
    userId: string | null;
    data: SalaryRecord[];
  }>({ userId: null, data: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const records = recordState.userId === user?.uid ? recordState.data : [];

  useEffect(() => {
    if (!user) {
      startTransition(() => {
        setRecordState({ userId: null, data: [] });
        setLoading(false);
        setCanEdit(false);
        setLoadError(null);
      });
      return;
    }

    startTransition(() => {
      setLoading(true);
      setLoadError(null);
      setCanEdit(hasWriteAccess(user.email));
    });

    const failed = (): void => { setLoadError('薪資資料讀取失敗'); setLoading(false); };
    try {
      return subscribeToCollectionWithError<SalaryRecord>(user.uid, PERSONAL_COLLECTIONS.salaryRecords, (data) => {
        setRecordState({ userId: user.uid, data }); setLoading(false); setLoadError(null);
      }, failed);
    } catch { startTransition(failed); }
  }, [user]);

  const addRecord = async (record: SalaryRecord) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await setDocument(user.uid, PERSONAL_COLLECTIONS.salaryRecords, record.id, record);
  };

  const updateRecord = async (id: string, updatedRecord: Partial<SalaryRecord>) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await updateDocument(user.uid, PERSONAL_COLLECTIONS.salaryRecords, id, updatedRecord);
  };

  const deleteRecord = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const targetRecord = records.find((record) => record.id === id);

    await deleteRelatedDocuments(user.uid, [
      { collectionName: PERSONAL_COLLECTIONS.salaryRecords, id },
      ...(targetRecord?.workShiftId ? [{ collectionName: PERSONAL_COLLECTIONS.workShifts, id: targetRecord.workShiftId }] : []),
    ]);
  };

  const batchAddRecords = async (newRecords: SalaryRecord[]) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await batchSetDocuments(user.uid, PERSONAL_COLLECTIONS.salaryRecords, newRecords);
  };

  const batchUpdateRecords = async (
    updates: Array<{ id: string; data: Partial<SalaryRecord> }>
  ) => {
    if (!user || !canEdit) {
      throw new Error('目前沒有批次修改權限');
    }

    const promises = updates.map(({ id, data }) =>
      updateDocument(user.uid, PERSONAL_COLLECTIONS.salaryRecords, id, data)
    );
    const results = await Promise.allSettled(promises);
    if (results.some((result) => result.status === 'rejected')) throw new Error('部分記錄更新失敗');
  };

  const batchDeleteRecords = async (ids: string[]) => {
    if (!user || !canEdit) {
      throw new Error('目前沒有批次刪除權限');
    }

    const promises = ids.map((id) => {
      const record = records.find((record) => record.id === id);
      return deleteRelatedDocuments(user.uid, [
        { collectionName: PERSONAL_COLLECTIONS.salaryRecords, id },
        ...(record?.workShiftId ? [{ collectionName: PERSONAL_COLLECTIONS.workShifts, id: record.workShiftId }] : []),
      ]);
    });
    const results = await Promise.allSettled(promises);
    if (results.some((result) => result.status === 'rejected')) throw new Error('部分記錄刪除失敗');
  };

  return {
    records,
    loading,
    loadError,
    canEdit,
    addRecord,
    updateRecord,
    deleteRecord,
    batchAddRecords,
    batchUpdateRecords,
    batchDeleteRecords,
  };
}
