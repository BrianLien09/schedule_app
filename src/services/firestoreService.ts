/**
 * Firestore Service
 * 
 * 封裝所有 Firestore 資料存取操作，提供：
 * - 通用的 CRUD 操作
 * - 即時監聽資料變更
 * - 批次操作
 * 
 * 資料結構（新）：
 * /shared/data/courses/{courseId}
 * /shared/data/workShifts/{shiftId}
 * /shared/data/salaryRecords/{recordId}
 * /shared/data/events/{eventId}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

/**
 * 取得共用資料的 Collection 參考
 * 
 * @param userId - 保留參數以兼容舊 API（實際上不使用，因為改用共用路徑）
 * @param collectionName - Collection 名稱（courses, workShifts, salaryRecords, events）
 * @throws 如果 Firebase 未設定
 */
export function getUserCollection(userId: string, collectionName: string) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  // 新路徑：/shared/data/{collectionName}
  return collection(db, 'shared', 'data', collectionName);
}

/**
 * 新增文件
 * 
 * @param userId - 使用者 UID
 * @param collectionName - Collection 名稱
 * @param data - 要新增的資料
 * @returns 新文件的 ID
 */
export async function addDocument(
  userId: string,
  collectionName: string,
  data: DocumentData
): Promise<string> {
  const colRef = getUserCollection(userId, collectionName);
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

/**
 * 使用自訂 ID 新增或更新文件
 * 
 * 適用於從 localStorage 遷移資料時，保留原有的 ID
 * 
 * @param userId - 使用者 UID
 * @param collectionName - Collection 名稱
 * @param docId - 文件 ID
 * @param data - 要儲存的資料
 * @throws 如果 Firebase 未設定
 */
export async function setDocument(
  userId: string,
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  // 新路徑：/shared/data/{collectionName}/{docId}
  const docRef = doc(db, 'shared', 'data', collectionName, docId);
  await setDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * 取得單一文件
 * 
 * @param userId - 使用者 UID
 * @param collectionName - Collection 名稱
 * @param docId - 文件 ID
 * @returns 文件資料，如果不存在則回傳 null
 * @throws 如果 Firebase 未設定
 */
export async function getDocument<T>(
  userId: string,
  collectionName: string,
  docId: string
): Promise<T | null> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  // 新路徑：/shared/data/{collectionName}/{docId}
  const docRef = doc(db, 'shared', 'data', collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as T;
  }
  return null;
}

/**
 * 取得 Collection 中的所有文件
 * 
 * @param userId - 使用者 UID
 * @param collectionName - Collection 名稱
 * @param constraints - 可選的查詢條件（where, orderBy 等）
 * @returns 文件陣列
 */
export async function getDocuments<T>(
  userId: string,
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const colRef = getUserCollection(userId, collectionName);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

/**
 * 更新文件
 * 
 * @param userId - 使用者 UID
 * @param collectionName - Collection 名稱
 * @param docId - 文件 ID
 * @param data - 要更新的欄位
 * @throws 如果 Firebase 未設定
 */
export async function updateDocument(
  userId: string,
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  // 新路徑：/shared/data/{collectionName}/{docId}
  const docRef = doc(db, 'shared', 'data', collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * 刪除文件
 * 
 * @param userId - 使用者 UID
 * @param collectionName - Collection 名稱
 * @param docId - 文件 ID
 * @throws 如果 Firebase 未設定
 */
export async function deleteDocument(
  userId: string,
  collectionName: string,
  docId: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  // 新路徑：/shared/data/{collectionName}/{docId}
  const docRef = doc(db, 'shared', 'data', collectionName, docId);
  await deleteDoc(docRef);
}

/**
 * 監聽 Collection 變更
 * 
 * 當資料有任何變更時，會自動觸發 callback 函數。
 * 這是實作即時同步的核心功能。
 * 
 * @param userId - 使用者 UID
 * @param collectionName - Collection 名稱
 * @param callback - 當資料變更時執行的函數
 * @param constraints - 可選的查詢條件
 * @returns 取消監聽的函數
 * 
 * @example
 * ```tsx
 * const unsubscribe = subscribeToCollection(
 *   userId,
 *   'courses',
 *   (courses) => setCourses(courses)
 * );
 * 
 * // 記得在元件卸載時取消監聽
 * return () => unsubscribe();
 * ```
 */
export function subscribeToCollection<T>(
  userId: string,
  collectionName: string,
  callback: (data: T[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  const colRef = getUserCollection(userId, collectionName);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
    callback(data);
  });
}

/**
 * 批次寫入多個文件
 * 
 * 適用於從 localStorage 遷移大量資料時使用。
 * 
 * @param userId - 使用者 UID
 * @param collectionName - Collection 名稱
 * @param documents - 要寫入的文件陣列，每個文件必須包含 id
 */
export async function batchSetDocuments(
  userId: string,
  collectionName: string,
  documents: Array<{ id: string; [key: string]: any }>
): Promise<void> {
  const promises = documents.map(doc => {
    const { id, ...data } = doc;
    return setDocument(userId, collectionName, id, data);
  });
  
  await Promise.all(promises);
}

/**
 * 刪除 Collection 中的所有文件
 * 
 * 注意：Firestore 不支援直接刪除 Collection，
 * 必須逐一刪除文件。此函數會先取得所有文件再批次刪除。
 * 
 * @param userId - 使用者 UID
 * @param collectionName - Collection 名稱
 */
export async function clearCollection(
  userId: string,
  collectionName: string
): Promise<void> {
  const colRef = getUserCollection(userId, collectionName);
  const querySnapshot = await getDocs(colRef);
  
  const promises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(promises);
}
