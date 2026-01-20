/**
 * Firebase 初始化設定
 * 
 * 此檔案負責初始化 Firebase SDK，包含：
 * - Firebase App 初始化
 * - Firestore 資料庫連接
 * - Authentication 身份驗證
 * 
 * 使用方式：
 * import { db, auth } from '@/lib/firebase';
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Firebase 專案設定
 * 
 * 這些設定值應該從環境變數讀取，而非硬編碼在程式碼中。
 * 請在專案根目錄建立 .env.local 檔案，並填入你的 Firebase 設定。
 * 
 * 取得設定的方式：
 * 1. 前往 Firebase Console: https://console.firebase.google.com/
 * 2. 選擇你的專案 (如果沒有請先建立一個)
 * 3. 點選「專案設定」(齒輪圖示)
 * 4. 在「一般」分頁中找到「你的應用程式」區塊
 * 5. 選擇「網頁應用程式」並複製 firebaseConfig
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * 初始化 Firebase App
 * 
 * 使用 getApps() 檢查是否已經初始化，避免在開發環境中
 * 因 Hot Reload 而重複初始化導致錯誤。
 */
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

/**
 * Firestore Database 實例
 * 
 * 用於存取雲端資料庫，所有的課表、打工班表、薪資記錄
 * 都會儲存在 Firestore 中。
 */
export const db: Firestore = getFirestore(app);

/**
 * Firebase Authentication 實例
 * 
 * 用於使用者登入/登出，確保每個使用者只能存取自己的資料。
 */
export const auth: Auth = getAuth(app);

/**
 * 匯出 Firebase App 實例
 * 
 * 某些進階功能可能需要直接存取 app 實例。
 */
export default app;
