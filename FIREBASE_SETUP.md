# Firebase 串接完整實戰指南

本文件記錄了完整的 Firebase 串接流程，包含所有遇到的問題與解決方案。適用於 Next.js + TypeScript 專案。

---

## 📋 目錄

1. [Firebase Console 設定](#1-firebase-console-設定)
2. [本地開發環境設定](#2-本地開發環境設定)
3. [程式碼整合](#3-程式碼整合)
4. [GitHub Actions CI/CD 設定](#4-github-actions-cicd-設定)
5. [授權域名設定](#5-授權域名設定)
6. [常見問題與解決方案](#6-常見問題與解決方案)
7. [完整檢查清單](#7-完整檢查清單)

---

## 1. Firebase Console 設定

### 1.1 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點選「新增專案」
3. 輸入專案名稱（例如：`schedule-app`）
4. Google Analytics 可選擇停用（個人專案通常不需要）
5. 等待專案建立完成（約 10-30 秒）

### 1.2 註冊網頁應用程式

1. 在專案首頁點選網頁圖示 `</>`
2. 輸入應用程式暱稱（例如：`Schedule Web App`）
3. **不要**勾選 Firebase Hosting（如果使用 GitHub Pages）
4. 點選「註冊應用程式」
5. **複製 firebaseConfig 物件**（稍後會用到）

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc..."
};
```

### 1.3 啟用 Cloud Firestore

1. 左側選單 → Firestore Database
2. 點選「建立資料庫」
3. 選擇「以測試模式啟動」
4. 選擇資料中心位置：
   - 建議：`asia-east1 (Taiwan)` 或 `asia-northeast1 (Tokyo)`
   - ⚠️ **位置無法更改，請謹慎選擇**
5. 等待資料庫建立完成（約 1-2 分鐘）

### 1.4 設定 Firestore 安全規則

1. Firestore Database 頁面 → 點選「規則」分頁
2. 將預設規則替換為以下內容：

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 使用者只能存取自己的資料
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 禁止存取其他路徑
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. 點選「發布」

**規則說明**：
- ✅ 只有已登入的使用者才能讀寫資料
- ✅ 使用者只能存取 `/users/{自己的UID}/` 底下的資料
- ✅ 確保資料完全隔離（A 使用者無法看到 B 使用者的資料）

### 1.5 啟用 Google Authentication

1. 左側選單 → Authentication
2. 點選「開始使用」
3. 點選「Sign-in method」分頁
4. 找到「Google」，點選編輯圖示
5. 將「啟用」開關切換為 **ON**
6. 設定專案公開名稱（例如：`Schedule App`）
7. 選擇專案支援電子郵件（你的 Google 帳號）
8. 點選「儲存」

---

## 2. 本地開發環境設定

### 2.1 安裝 Firebase SDK

```bash
npm install firebase
```

### 2.2 建立環境變數檔案

1. 在專案根目錄建立 `.env.local.example`（範例檔案，會提交到 Git）：

```env
# Firebase 設定
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

2. 複製並重新命名為 `.env.local`（真實設定，不會提交到 Git）：

```bash
cp .env.local.example .env.local
```

3. 將剛才從 Firebase Console 複製的 firebaseConfig 值填入 `.env.local`

4. 確認 `.gitignore` 包含 `.env.local`：

```gitignore
# 環境變數
.env*.local
```

### 2.3 建立 Firebase 初始化檔案

`src/lib/firebase.ts`：

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// 檢查 Firebase 是否已設定
export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  db = getFirestore(app);
  auth = getAuth(app);
}

export { db, auth };
export default app;
```

**重點**：
- 使用 `|| ''` 提供預設值，避免 build 時報錯
- 匯出 `isFirebaseConfigured` 用於檢查 Firebase 是否已設定
- 允許 `db` 和 `auth` 為 `null`（未設定 Firebase 時）

---

## 3. 程式碼整合

### 3.1 建立 AuthContext

`src/context/AuthContext.tsx`：

```typescript
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase 未設定');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase 未設定');
    }
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必須在 AuthProvider 內部使用');
  }
  return context;
}
```

### 3.2 建立 Firestore Service

`src/services/firestoreService.ts`：

```typescript
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export function getUserCollection(userId: string, collectionName: string) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定');
  }
  return collection(db, 'users', userId, collectionName);
}

export async function setDocument(
  userId: string,
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定');
  }
  const docRef = doc(db, 'users', userId, collectionName, docId);
  await setDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function getDocuments<T>(
  userId: string,
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const colRef = getUserCollection(userId, collectionName);
  const querySnapshot = await getDocs(colRef);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

export async function updateDocument(
  userId: string,
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定');
  }
  const docRef = doc(db, 'users', userId, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteDocument(
  userId: string,
  collectionName: string,
  docId: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定');
  }
  const docRef = doc(db, 'users', userId, collectionName, docId);
  await deleteDoc(docRef);
}

export function subscribeToCollection<T>(
  userId: string,
  collectionName: string,
  callback: (data: T[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  const colRef = getUserCollection(userId, collectionName);
  
  return onSnapshot(colRef, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
    callback(data);
  });
}

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
```

### 3.3 在主應用程式包裹 AuthProvider

`src/app/layout.tsx`：

```typescript
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 3.4 雙模式資料存取（已登入/未登入）

在你的資料管理 Hook 中實作雙模式運作：

```typescript
export function useScheduleData() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // 未登入：使用 localStorage
      const localCourses = localStorage.getItem('schedule_courses');
      setCourses(localCourses ? JSON.parse(localCourses) : defaultCourses);
      setLoading(false);
      return;
    }

    // 已登入：使用 Firestore 即時同步
    const unsubscribe = subscribeToCollection<Course>(
      user.uid,
      'courses',
      (data) => {
        setCourses(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addCourse = async (course: Course) => {
    if (!user) {
      // 未登入：更新 localStorage
      const newCourses = [...courses, course];
      setCourses(newCourses);
      localStorage.setItem('schedule_courses', JSON.stringify(newCourses));
      return;
    }

    // 已登入：寫入 Firestore
    await setDocument(user.uid, 'courses', course.id, course);
  };

  // 其他 CRUD 操作...
}
```

---

## 4. GitHub Actions CI/CD 設定

### 4.1 設定 GitHub Repository Secrets

1. 前往你的 GitHub Repository
2. Settings → Secrets and variables → Actions
3. 點選「New repository secret」
4. 新增以下 6 個 secrets：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | 你的 API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | your-project |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 你的 Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 你的 App ID |

⚠️ **注意事項**：
- Secret 名稱必須完全一致（區分大小寫）
- 不要包含引號
- 不要有多餘的空格

### 4.2 更新 GitHub Actions Workflow

`.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout 🛎️
        uses: actions/checkout@v4

      - name: Setup Node.js ⚙️
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: 'npm'

      - name: Install Dependencies 🔧
        run: npm ci

      # 重點：在 build 步驟注入環境變數
      - name: Build 🏗️
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}
        run: npm run build

      - name: Create .nojekyll file
        run: touch out/.nojekyll

      - name: Deploy 🚀
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: out
          branch: gh-pages
```

---

## 5. 授權域名設定

### 5.1 為什麼需要授權域名？

Firebase Authentication 只允許從授權的域名發起登入請求。如果未授權，會出現：

```
Firebase: Error (auth/unauthorized-domain)
```

### 5.2 需要授權的域名

1. **Firebase Console** → Authentication → Settings → Authorized domains
2. 點選「Add domain」，新增以下域名：

| 域名 | 用途 |
|------|------|
| `localhost` | 本地開發 |
| `你的電腦IP` (例如 `192.168.0.235`) | 手機透過區域網路測試 |
| `yourusername.github.io` | GitHub Pages 部署 |

⚠️ **重點**：
- GitHub Pages 只需新增主域名（例如 `brianlien09.github.io`）
- 不需要加上子路徑（例如 `/schedule_app`）
- 新增後立即生效，不需要重新部署

### 5.3 如何取得電腦 IP

```bash
# Windows
ipconfig | findstr "IPv4"

# macOS/Linux
ifconfig | grep "inet "
```

---

## 6. 常見問題與解決方案

### 問題 1：Build 時出現 `Firebase: Error (auth/invalid-api-key)`

**原因**：環境變數未設定或設定錯誤。

**解決方案**：
1. **本地開發**：確認 `.env.local` 檔案存在且內容正確
2. **GitHub Actions**：確認 Repository Secrets 已正確設定
3. **檢查**：環境變數名稱必須以 `NEXT_PUBLIC_` 開頭

### 問題 2：手機登入出現 `auth/unauthorized-domain`

**原因**：手機訪問的 IP 地址未在 Firebase 授權域名中。

**解決方案**：
1. 取得電腦 IP（例如 `192.168.0.235`）
2. 在 Firebase Console → Authentication → Settings → Authorized domains 新增該 IP
3. 重新嘗試登入（無需重新部署）

### 問題 3：部署後登入失敗

**原因**：GitHub Pages 域名未授權。

**解決方案**：
1. 確認 GitHub Pages 網址（例如 `https://yourusername.github.io/project/`）
2. 在 Firebase Authorized domains 新增 `yourusername.github.io`
3. **只加主域名**，不要加子路徑

### 問題 4：資料沒有隔離，其他使用者能看到我的資料

**原因**：Firestore 安全規則未正確設定。

**解決方案**：
檢查 Firestore 規則是否為：

```javascript
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

這確保了：
- ✅ 只有已登入的使用者能存取資料
- ✅ 使用者只能存取自己 UID 底下的資料

### 問題 5：首次登入後看不到預設資料

**原因**：未實作資料初始化或遷移邏輯。

**解決方案**：
在 Hook 中加入初始化邏輯：

```typescript
const initializeDefaultData = async (userId: string) => {
  const existingCourses = await getDocuments<Course>(userId, 'courses');
  
  if (existingCourses.length === 0) {
    await batchSetDocuments(userId, 'courses', defaultCourses);
  }
};

// 在登入後執行
useEffect(() => {
  if (user) {
    initializeDefaultData(user.uid);
  }
}, [user]);
```

### 問題 6：TypeScript 報錯 `Type 'null' is not assignable to type 'Firestore'`

**原因**：`db` 和 `auth` 可能為 `null`（Firebase 未設定時）。

**解決方案**：
在所有 Firestore 操作前檢查：

```typescript
export function getUserCollection(userId: string, collectionName: string) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定');
  }
  return collection(db, 'users', userId, collectionName);
}
```

---

## 7. 完整檢查清單

### Firebase Console 設定

- [ ] Firebase 專案已建立
- [ ] 網頁應用程式已註冊
- [ ] Firestore Database 已啟用（位置：Taiwan 或 Tokyo）
- [ ] Firestore 安全規則已設定並發布
- [ ] Google Authentication 已啟用
- [ ] 授權域名已新增：
  - [ ] `localhost`
  - [ ] 電腦 IP（手機測試用）
  - [ ] GitHub Pages 域名

### 本地開發環境

- [ ] 安裝 Firebase SDK：`npm install firebase`
- [ ] 建立 `.env.local.example` 範例檔案
- [ ] 建立 `.env.local` 並填入 Firebase 設定
- [ ] 確認 `.env.local` 已加入 `.gitignore`
- [ ] 建立 `src/lib/firebase.ts` 初始化檔案
- [ ] 建立 `src/context/AuthContext.tsx`
- [ ] 建立 `src/services/firestoreService.ts`
- [ ] 在 `layout.tsx` 包裹 `<AuthProvider>`

### 程式碼整合

- [ ] 實作雙模式資料存取（已登入/未登入）
- [ ] 實作 localStorage → Firestore 資料遷移
- [ ] 實作即時同步（使用 `onSnapshot`）
- [ ] 所有 Firestore 操作都有 `isFirebaseConfigured` 檢查
- [ ] 本地 `npm run dev` 可正常運作
- [ ] 本地 `npm run build` 可正常運作

### GitHub Actions 設定

- [ ] Repository Secrets 已設定（6 個環境變數）
- [ ] Workflow 已更新（在 build 步驟注入環境變數）
- [ ] 推送至 GitHub 後 Actions 成功執行
- [ ] GitHub Pages 已啟用（Settings → Pages）

### 測試驗證

- [ ] 本地登入/登出功能正常
- [ ] 資料可正確儲存至 Firestore
- [ ] Firestore Console 可看到資料結構：`users/{uid}/courses`
- [ ] 多裝置即時同步正常（電腦改資料，手機立即更新）
- [ ] 不同帳號登入，資料完全隔離
- [ ] 未登入時使用 localStorage，資料不丟失
- [ ] 首次登入時 localStorage 資料自動遷移至 Firestore
- [ ] 部署後的網站登入功能正常

---

## 📚 參考資源

- [Firebase 官方文件](https://firebase.google.com/docs)
- [Firestore 入門指南](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Authentication 文件](https://firebase.google.com/docs/auth)
- [Next.js 環境變數](https://nextjs.org/docs/basic-features/environment-variables)
- [GitHub Actions 環境變數](https://docs.github.com/en/actions/learn-github-actions/variables)

---

## 🎯 總結

完成以上步驟後，你的應用程式將具備：

✅ **雲端同步**：資料儲存在 Firestore，多裝置自動同步  
✅ **身份驗證**：Google 登入，資料完全隔離  
✅ **即時更新**：使用 `onSnapshot` 實作即時同步  
✅ **向後相容**：未登入時仍可使用 localStorage  
✅ **資料遷移**：首次登入自動遷移本地資料至雲端  
✅ **CI/CD**：GitHub Actions 自動部署至 GitHub Pages  

**恭喜！你的應用程式已完成 Firebase 串接！** 🎉
