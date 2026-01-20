import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getDocuments,
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  batchSetDocuments,
} from '@/services/firestoreService';

/** 身份類型 */
type RoleType = 'assistant' | 'instructor';

/** 單筆工作記錄 */
export interface SalaryRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  breakMinutes: number;
  role: RoleType;
  shiftCategory?: string;
  workShiftId?: string;
}

/**
 * Salary Data Management Hook
 * 
 * 管理薪資記錄的資料，支援：
 * - Firestore 雲端同步
 * - 即時監聽資料變更
 * - 自動從 localStorage 遷移至 Firestore（首次登入時）
 * - 未登入時使用 localStorage 作為本地端儲存
 */
export function useSalaryData() {
  const { user } = useAuth();
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * 從 localStorage 遷移資料至 Firestore（僅首次登入時執行）
   */
  const migrateFromLocalStorage = async (userId: string) => {
    try {
      // 檢查是否已經遷移過薪資記錄
      const migrated = localStorage.getItem('salary_firestore_migrated');
      if (migrated) return;

      // 讀取 localStorage 中的薪資記錄
      const localRecords = localStorage.getItem('salary_records');

      // 如果 localStorage 有資料，則遷移至 Firestore
      if (localRecords) {
        const recordsData = JSON.parse(localRecords);
        await batchSetDocuments(userId, 'salaryRecords', recordsData);
        console.log(`✅ 成功遷移 ${recordsData.length} 筆薪資記錄至 Firestore`);
      }

      // 標記已遷移
      localStorage.setItem('salary_firestore_migrated', 'true');
    } catch (error) {
      console.error('❌ 薪資記錄遷移失敗:', error);
    }
  };

  /**
   * 當使用者登入時，訂閱 Firestore 資料變更
   */
  useEffect(() => {
    if (!user) {
      // 未登入時，從 localStorage 讀取資料
      setLoading(true);
      const localRecords = localStorage.getItem('salary_records');
      setRecords(localRecords ? JSON.parse(localRecords) : []);
      setLoading(false);
      return;
    }

    // 已登入：使用 Firestore
    const userId = user.uid;
    setLoading(true);

    // 首次登入時，嘗試從 localStorage 遷移資料
    migrateFromLocalStorage(userId).then(() => {
      setLoading(false);
    });

    // 訂閱即時資料變更
    const unsubscribe = subscribeToCollection<SalaryRecord>(
      userId,
      'salaryRecords',
      (data) => setRecords(data)
    );

    // 清理函數：元件卸載時取消訂閱
    return () => unsubscribe();
  }, [user]);

  /**
   * 將 records 同步到 localStorage（未登入時使用）
   */
  useEffect(() => {
    if (!user && records.length > 0) {
      localStorage.setItem('salary_records', JSON.stringify(records));
    }
  }, [records, user]);

  // ========== 薪資記錄管理 ==========
  
  const addRecord = async (record: SalaryRecord) => {
    if (!user) {
      // 未登入：更新 localStorage
      const newRecords = [...records, record];
      setRecords(newRecords);
      localStorage.setItem('salary_records', JSON.stringify(newRecords));
      return;
    }

    // 已登入：寫入 Firestore
    await setDocument(user.uid, 'salaryRecords', record.id, record);
  };

  const updateRecord = async (id: string, updatedRecord: Partial<SalaryRecord>) => {
    if (!user) {
      const newRecords = records.map(r => (r.id === id ? { ...r, ...updatedRecord } : r));
      setRecords(newRecords);
      localStorage.setItem('salary_records', JSON.stringify(newRecords));
      return;
    }

    await updateDocument(user.uid, 'salaryRecords', id, updatedRecord);
  };

  const deleteRecord = async (id: string) => {
    if (!user) {
      const newRecords = records.filter(r => r.id !== id);
      setRecords(newRecords);
      localStorage.setItem('salary_records', JSON.stringify(newRecords));
      return;
    }

    await deleteDocument(user.uid, 'salaryRecords', id);
  };

  const batchAddRecords = async (newRecords: SalaryRecord[]) => {
    if (!user) {
      const allRecords = [...records, ...newRecords];
      setRecords(allRecords);
      localStorage.setItem('salary_records', JSON.stringify(allRecords));
      return;
    }

    // 批次寫入 Firestore
    await batchSetDocuments(user.uid, 'salaryRecords', newRecords);
  };

  const batchUpdateRecords = async (updates: Array<{ id: string; data: Partial<SalaryRecord> }>) => {
    if (!user) {
      const newRecords = records.map(r => {
        const update = updates.find(u => u.id === r.id);
        return update ? { ...r, ...update.data } : r;
      });
      setRecords(newRecords);
      localStorage.setItem('salary_records', JSON.stringify(newRecords));
      return;
    }

    // 批次更新 Firestore
    const promises = updates.map(({ id, data }) => 
      updateDocument(user.uid!, 'salaryRecords', id, data)
    );
    await Promise.all(promises);
  };

  const batchDeleteRecords = async (ids: string[]) => {
    if (!user) {
      const newRecords = records.filter(r => !ids.includes(r.id));
      setRecords(newRecords);
      localStorage.setItem('salary_records', JSON.stringify(newRecords));
      return;
    }

    // 批次刪除 Firestore
    const promises = ids.map(id => deleteDocument(user.uid!, 'salaryRecords', id));
    await Promise.all(promises);
  };

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    batchAddRecords,
    batchUpdateRecords,
    batchDeleteRecords,
  };
}
