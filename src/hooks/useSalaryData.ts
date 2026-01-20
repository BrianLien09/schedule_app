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
import { hasWriteAccess } from '@/config/permissions';

/**
 * 共用資料路徑
 * 
 * 所有家人共用同一份資料，儲存在 Firestore 的 /shared/ 路徑下。
 * 權限控制由 Firestore Security Rules 處理。
 */
const SHARED_DATA_PATH = 'shared';

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
 * - Firestore 雲端同步（必須登入）
 * - 即時監聽資料變更
 * - 共用資料（所有白名單成員共用同一份資料）
 */
export function useSalaryData() {
  const { user } = useAuth();
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  /**
   * 當使用者登入時，訂閱 Firestore 資料變更
   */
  useEffect(() => {
    if (!user) {
      // 未登入：不顯示任何資料
      setRecords([]);
      setLoading(false);
      setCanEdit(false);
      return;
    }

    // 已登入：使用共用資料路徑
    setLoading(true);
    setCanEdit(hasWriteAccess(user.email));

    // 訂閱即時資料變更
    const unsubscribe = subscribeToCollection<SalaryRecord>(
      SHARED_DATA_PATH,
      'salaryRecords',
      (data) => {
        setRecords(data);
        setLoading(false);
      }
    );

    // 清理函數：元件卸載時取消訂閱
    return () => unsubscribe();
  }, [user]);

  // ========== 薪資記錄管理 ==========
  
  const addRecord = async (record: SalaryRecord) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await setDocument(SHARED_DATA_PATH, 'salaryRecords', record.id, record);
  };

  const updateRecord = async (id: string, updatedRecord: Partial<SalaryRecord>) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await updateDocument(SHARED_DATA_PATH, 'salaryRecords', id, updatedRecord);
  };

  const deleteRecord = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await deleteDocument(SHARED_DATA_PATH, 'salaryRecords', id);
  };

  const batchAddRecords = async (newRecords: SalaryRecord[]) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await batchSetDocuments(SHARED_DATA_PATH, 'salaryRecords', newRecords);
  };

  const batchUpdateRecords = async (updates: Array<{ id: string; data: Partial<SalaryRecord> }>) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    const promises = updates.map(({ id, data }) => 
      updateDocument(SHARED_DATA_PATH, 'salaryRecords', id, data)
    );
    await Promise.all(promises);
  };

  const batchDeleteRecords = async (ids: string[]) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    const promises = ids.map(id => deleteDocument(SHARED_DATA_PATH, 'salaryRecords', id));
    await Promise.all(promises);
  };

  return {
    records,
    loading,
    canEdit, // 新增：是否有編輯權限
    addRecord,
    updateRecord,
    deleteRecord,
    batchAddRecords,
    batchUpdateRecords,
    batchDeleteRecords,
  };
}
