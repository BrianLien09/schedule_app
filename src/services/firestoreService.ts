/**
 * Firestore Service
 * 
 * 封裝所有 Firestore 資料存取操作，提供：
 * - 通用的 CRUD 操作
 * - 即時監聽資料變更
 * - 批次操作
 * 
 * 個人資料結構：
 * /users/{userId}/courses/{courseId}
 * /users/{userId}/workShifts/{shiftId}
 * /users/{userId}/salaryRecords/{recordId}
 * /users/{userId}/workRoles/{roleId}
 * /users/{userId}/allowanceRecords/{recordId}
 * /users/{userId}/events/{eventId}
 * /users/{userId}/courseNotes/{noteId}
 *
 * 共用資料結構：
 * /shared/data/courses/{courseId}
 * /shared/data/gameGuides/{guideId}
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
  onSnapshot,
  QueryConstraint,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type {
  PersonalCollectionName,
  SharedCollectionName,
} from '@/services/firestoreCollections';

/**
 * 清理資料中的 undefined 值
 * Firestore 不允許 undefined，必須轉換為 null 或移除該欄位
 */
function cleanUndefined<T extends DocumentData>(data: T): DocumentData {
  const cleaned: DocumentData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * 取得指定使用者的個人 Collection 參考
 *
 * @param userId - Firebase Authentication 的使用者 UID
 * @param collectionName - Collection 名稱
 * @throws 如果 Firebase 未設定
 */
export function getUserCollection(
  userId: string,
  collectionName: PersonalCollectionName
) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  if (!userId.trim()) {
    throw new Error('缺少使用者 UID，無法取得個人資料');
  }
  return collection(db, 'users', userId, collectionName);
}

/** 取得 shared/data 下的共用 Collection 參考。 */
function getSharedCollection(collectionName: SharedCollectionName) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  return collection(db, 'shared', 'data', collectionName);
}

/**
 * 訂閱共用 Collection 的即時變更。
 */
export function subscribeToSharedCollection<T>(
  collectionName: SharedCollectionName,
  callback: (data: T[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  const colRef = getSharedCollection(collectionName);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;

  return onSnapshot(
    q,
    (querySnapshot) => {
      const data = querySnapshot.docs.map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      })) as T[];
      callback(data);
    },
    (error) => {
      console.error(`[Firestore] 讀取共用 ${collectionName} 失敗:`, error);
    }
  );
}

/** 取得共用 Collection 中的文件。 */
export async function getSharedDocuments<T>(
  collectionName: SharedCollectionName,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const colRef = getSharedCollection(collectionName);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  })) as T[];
}

/** 新增共用文件，並維持與個人資料一致的時間欄位。 */
export async function addSharedDocument(
  collectionName: SharedCollectionName,
  data: DocumentData
): Promise<string> {
  const timestamp = new Date().toISOString();
  const docRef = await addDoc(
    getSharedCollection(collectionName),
    cleanUndefined({ ...data, createdAt: timestamp, updatedAt: timestamp })
  );
  return docRef.id;
}

/** 更新共用文件，並維持更新時間。 */
export async function updateSharedDocument(
  collectionName: SharedCollectionName,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  await updateDoc(
    doc(getSharedCollection(collectionName), docId),
    cleanUndefined({ ...data, updatedAt: new Date().toISOString() })
  );
}

/** 刪除共用文件。 */
export async function deleteSharedDocument(
  collectionName: SharedCollectionName,
  docId: string
): Promise<void> {
  await deleteDoc(doc(getSharedCollection(collectionName), docId));
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
  collectionName: PersonalCollectionName,
  data: DocumentData
): Promise<string> {
  const colRef = getUserCollection(userId, collectionName);
  const cleanedData = cleanUndefined({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const docRef = await addDoc(colRef, cleanedData);
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
  collectionName: PersonalCollectionName,
  docId: string,
  data: DocumentData
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  const docRef = doc(getUserCollection(userId, collectionName), docId);
  const cleanedData = cleanUndefined({
    ...data,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, cleanedData);
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
  collectionName: PersonalCollectionName,
  docId: string
): Promise<T | null> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  const docRef = doc(getUserCollection(userId, collectionName), docId);
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
  collectionName: PersonalCollectionName,
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
  collectionName: PersonalCollectionName,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  const docRef = doc(getUserCollection(userId, collectionName), docId);
  const cleanedData = cleanUndefined({
    ...data,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(docRef, cleanedData);
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
  collectionName: PersonalCollectionName,
  docId: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  const docRef = doc(getUserCollection(userId, collectionName), docId);
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
  collectionName: PersonalCollectionName,
  callback: (data: T[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  const colRef = getUserCollection(userId, collectionName);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
      callback(data);
    },
    (error) => {
      // 即時監聽被 rules 拒絕時，不能默默維持空陣列，否則會誤判成沒有資料。
      console.error(`[Firestore] 讀取 ${collectionName} 失敗:`, error);
    }
  );
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
  collectionName: PersonalCollectionName,
  documents: Array<{ id: string } & DocumentData>
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
  collectionName: PersonalCollectionName
): Promise<void> {
  const colRef = getUserCollection(userId, collectionName);
  const querySnapshot = await getDocs(colRef);
  
  const promises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(promises);
}
