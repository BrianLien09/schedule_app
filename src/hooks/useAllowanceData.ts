import { startTransition, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollectionWithError,
} from '@/services/firestoreService';
import { PERSONAL_COLLECTIONS, type PersonalCollectionName } from '@/services/firestoreCollections';
import { hasWriteAccess } from '@/config/permissions';
import { AllowanceRecord, DEFAULT_SOURCE_TYPES } from '@/data/allowance';

/**
 * 個人資料路徑
 *
 * 每位登入者的生活費資料儲存在自己的 /users/{uid}/ 路徑下，避免家庭帳號互相看到財務資料。
 * 權限控制由 Firestore Security Rules 再次確認使用者只能存取自己的 UID。
 */
/**
 * Allowance Data Management Hook
 * 
 * 管理生活費記錄的資料，支援：
 * - Firestore 雲端同步（必須登入）
 * - 即時監聽資料變更
 * - 個人資料（每個 Google 帳號各自一份）
 * - 來源類型自定義管理
 */
export function useAllowanceData() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AllowanceRecord[]>([]);
  const [sourceTypes, setSourceTypes] = useState<string[]>(DEFAULT_SOURCE_TYPES);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});
  const [canEdit, setCanEdit] = useState(false);

  /**
   * 當使用者登入時，訂閱 Firestore 資料變更
   */
  useEffect(() => {
    if (!user) {
      // 未登入：不顯示任何資料
      startTransition(() => {
        setRecords([]);
        setSourceTypes(DEFAULT_SOURCE_TYPES);
        setLoading(false);
        setCanEdit(false);
        setLoadErrors({});
      });
      return;
    }

    // 已登入：使用共用資料路徑
    startTransition(() => {
      setLoading(true);
      setLoadErrors({});
      setCanEdit(hasWriteAccess(user.email));
    });

    // 訂閱即時資料變更（生活費記錄）
    const settled = new Set<string>();
    const subscriptions: Array<() => void> = [];
    const subscribe = <T,>(collection: PersonalCollectionName, label: string, callback: (data: T[]) => void): void => {
      const finish = (): void => { settled.add(collection); if (settled.size === 2) setLoading(false); };
      const failed = (): void => { setLoadErrors((previous) => ({ ...previous, [collection]: `${label}讀取失敗` })); finish(); };
      try {
        subscriptions.push(subscribeToCollectionWithError<T>(user.uid, collection, (data) => {
          setLoadErrors((previous) => { const next = { ...previous }; delete next[collection]; return next; });
          callback(data); finish();
        }, failed));
      } catch { startTransition(failed); }
    };
    subscribe<AllowanceRecord>(
      PERSONAL_COLLECTIONS.allowanceRecords,
      '生活費',
      (data) => {
        // 按時間戳記排序（最新在前）
        const sorted = data.sort((a, b) => b.timestamp - a.timestamp);
        setRecords(sorted);
      }
    );

    // 訂閱即時資料變更（來源類型）
    subscribe<{ id: string; types: string[] }>(
      PERSONAL_COLLECTIONS.allowanceSourceTypes,
      '生活費來源類型',
      (data) => {
        if (data.length > 0 && data[0].types) {
          setSourceTypes(data[0].types);
        }
      }
    );

    // 清理函數：元件卸載時取消訂閱
    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  // ========== 生活費記錄管理 ==========
  
  /**
   * 新增生活費記錄
   * 
   * @param record - 完整的生活費記錄（包含 id）
   */
  const addRecord = async (record: AllowanceRecord) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await setDocument(user.uid, PERSONAL_COLLECTIONS.allowanceRecords, record.id, record);
  };

  /**
   * 更新生活費記錄
   * 
   * @param id - 記錄 ID
   * @param updatedRecord - 要更新的欄位（部分更新）
   */
  const updateRecord = async (id: string, updatedRecord: Partial<AllowanceRecord>) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await updateDocument(user.uid, PERSONAL_COLLECTIONS.allowanceRecords, id, updatedRecord);
  };

  /**
   * 刪除生活費記錄
   * 
   * @param id - 記錄 ID
   */
  const deleteRecord = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    await deleteDocument(user.uid, PERSONAL_COLLECTIONS.allowanceRecords, id);
  };

  // ========== 來源類型管理 ==========

  /**
   * 新增自訂來源類型
   * 
   * @param type - 來源類型名稱
   */
  const addSourceType = async (type: string) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    // 檢查是否已存在
    if (sourceTypes.includes(type)) {
      console.warn('⚠️ 來源類型已存在');
      return;
    }

    const newTypes = [...sourceTypes, type];
    setSourceTypes(newTypes);

    // 儲存到 Firestore（使用固定 ID 'config'）
    await setDocument(user.uid, PERSONAL_COLLECTIONS.allowanceSourceTypes, 'config', {
      id: 'config',
      types: newTypes,
    });
  };

  /**
   * 刪除自訂來源類型
   * 
   * @param type - 來源類型名稱
   */
  const deleteSourceType = async (type: string) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }

    // 不允許刪除預設類型
    if (DEFAULT_SOURCE_TYPES.includes(type)) {
      console.warn('⚠️ 無法刪除預設來源類型');
      return;
    }

    const newTypes = sourceTypes.filter(t => t !== type);
    setSourceTypes(newTypes);

    // 更新 Firestore
    await setDocument(user.uid, PERSONAL_COLLECTIONS.allowanceSourceTypes, 'config', {
      id: 'config',
      types: newTypes,
    });
  };

  return {
    records,              // 所有生活費記錄（已排序）
    sourceTypes,          // 可用的來源類型列表
    loading,              // 資料載入中
    loadError: Object.values(loadErrors).join('、') || null,
    canEdit,              // 是否有編輯權限
    addRecord,            // 新增記錄
    updateRecord,         // 更新記錄
    deleteRecord,         // 刪除記錄
    addSourceType,        // 新增來源類型
    deleteSourceType,     // 刪除來源類型
  };
}
