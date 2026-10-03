import { startTransition, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  setDocument,
  updateDocument,
  deleteDocument,
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

    await deleteDocument(user.uid, PERSONAL_COLLECTIONS.salaryRecords, id);

    if (targetRecord?.workShiftId) {
      await deleteDocument(user.uid, PERSONAL_COLLECTIONS.workShifts, targetRecord.workShiftId);
    }
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
      console.warn('目前沒有寫入權限');
      return;
    }

    const promises = updates.map(({ id, data }) =>
      updateDocument(user.uid, PERSONAL_COLLECTIONS.salaryRecords, id, data)
    );
    await Promise.all(promises);
  };

  const batchDeleteRecords = async (ids: string[]) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const recordsToDelete = records.filter((record) => ids.includes(record.id));
    const salaryDeletePromises = ids.map((id) =>
      deleteDocument(user.uid, PERSONAL_COLLECTIONS.salaryRecords, id)
    );
    const legacyShiftDeletePromises = recordsToDelete
      .map((record) => record.workShiftId)
      .filter((workShiftId): workShiftId is string => Boolean(workShiftId))
      .map((workShiftId) =>
        deleteDocument(user.uid, PERSONAL_COLLECTIONS.workShifts, workShiftId)
      );

    await Promise.all([...salaryDeletePromises, ...legacyShiftDeletePromises]);
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
