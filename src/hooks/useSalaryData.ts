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

export type { RoleType, SalaryRecord } from '@/data/workRecords';

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
      user.uid,
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

    await setDocument(user.uid, 'salaryRecords', record.id, record);
  };

  const updateRecord = async (id: string, updatedRecord: Partial<SalaryRecord>) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await updateDocument(user.uid, 'salaryRecords', id, updatedRecord);
  };

  const deleteRecord = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const targetRecord = records.find((record) => record.id === id);

    await deleteDocument(user.uid, 'salaryRecords', id);

    if (targetRecord?.workShiftId) {
      await deleteDocument(user.uid, 'workShifts', targetRecord.workShiftId);
    }
  };

  const batchAddRecords = async (newRecords: SalaryRecord[]) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    await batchSetDocuments(user.uid, 'salaryRecords', newRecords);
  };

  const batchUpdateRecords = async (
    updates: Array<{ id: string; data: Partial<SalaryRecord> }>
  ) => {
    if (!user || !canEdit) {
      console.warn('目前沒有寫入權限');
      return;
    }

    const promises = updates.map(({ id, data }) =>
      updateDocument(user.uid, 'salaryRecords', id, data)
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
      deleteDocument(user.uid, 'salaryRecords', id)
    );
    const legacyShiftDeletePromises = recordsToDelete
      .map((record) => record.workShiftId)
      .filter((workShiftId): workShiftId is string => Boolean(workShiftId))
      .map((workShiftId) => deleteDocument(user.uid, 'workShifts', workShiftId));

    await Promise.all([...salaryDeletePromises, ...legacyShiftDeletePromises]);
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
