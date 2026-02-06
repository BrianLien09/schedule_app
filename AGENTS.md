# AGENTS.md - Schedule App 開發指南

本文檔提供給 AI 編碼代理使用，包含建置命令、程式碼風格規範與專案架構說明。

## 專案概述

**類型**: Next.js 16.1.1 (App Router) + TypeScript + Firebase  
**用途**: 個人日程管理助手（學校課表、打工班表、遊戲攻略、薪資計算、課程筆記）  
**部署**: GitHub Pages 靜態匯出 (`output: "export"`)  
**共用資料策略**: Firestore `/shared/data/{collection}` 路徑（家庭/小團隊共用）

---

## 🛠️ 建置與測試命令

### 開發環境
```bash
npm run dev              # 啟動開發伺服器（http://localhost:3000）
npm run lint             # ESLint 檢查
npm run build            # 建置靜態網站（輸出至 ./out）
npm run deploy           # 建置並部署到 GitHub Pages
```

### 測試命令
**⚠️ 專案目前無測試框架**  
- 無 Jest/Vitest 配置
- 無測試檔案
- 修改代碼後需手動測試 UI

---

## 📦 技術堆疊

| 技術 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.1.1 | App Router + 靜態匯出 |
| **React** | 19.2.3 | UI 元件 |
| **TypeScript** | 5.x | 型別安全 |
| **Firebase** | 12.8.0 | Firestore + Auth (Google OAuth) |
| **CSS** | - | CSS Modules + CSS Variables（無 Tailwind） |
| **xlsx / jspdf** | - | Excel/PDF 匯出功能 |

---

## 📂 專案架構

```
src/
├── app/                    # Next.js App Router 頁面
│   ├── layout.tsx          # 根佈局（含 AuthProvider）
│   ├── globals.css         # 全域樣式（主題系統：data-theme="dark|light"）
│   ├── login/              # 登入頁面
│   ├── schedule/           # 學校課表、打工月曆
│   └── tools/salary/       # 薪資計算器
├── components/             # 可覆用 React 元件（23 個檔案）
├── hooks/                  # Custom Hooks（useScheduleData, useHomeDashboard 等）
├── context/                # React Context（AuthContext）
├── services/               # Firestore 服務層（firestoreService.ts）
├── data/                   # TypeScript 型別定義與預設資料
├── lib/                    # 第三方服務初始化（firebase.ts）
└── config/                 # 配置檔案（權限管理）
```

### 資料流向
```
UI Component (page.tsx)
    ↓ 使用
Custom Hook (useScheduleData)
    ↓ 呼叫
Service Layer (firestoreService.ts)
    ↓ 存取
Firebase Firestore (/shared/data/{collection})
```

---

## 🎨 程式碼風格規範

### Import 順序
```typescript
// 1. React/Next.js 核心模組
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 2. 自訂 Hooks/Context（使用 @ 別名）
import { useAuth } from '@/context/AuthContext';
import { useScheduleData } from '@/hooks/useScheduleData';

// 3. 服務層
import { getDocuments, addDocument } from '@/services/firestoreService';

// 4. 型別定義
import type { Course, WorkShift } from '@/data/schedule';

// 5. 元件
import Navbar from '@/components/Navbar';

// 6. 樣式（CSS Modules）
import styles from './page.module.css';
```

### TypeScript 型別規範
- ✅ **必須啟用嚴格模式** (`"strict": true`)
- ❌ **禁止使用 `any`**：必須定義明確的 Interface 或 Type
- ❌ **禁止 `@ts-ignore`**：修正實際型別問題
- ✅ **泛型優先**：如 `getDocuments<Course>(...)`
- ✅ **明確回傳型別**：公開函數必須標註回傳型別

```typescript
// ✅ 正確範例
export async function getDocuments<T>(
  userId: string,
  collectionName: string
): Promise<T[]> {
  // ...
}

// ❌ 錯誤範例
export async function getData(id: any) {  // 禁止 any
  return await fetch(...);  // 缺少回傳型別
}
```

### 命名慣例
- **檔案名稱**: camelCase（如 `firestoreService.ts`）
- **元件檔案**: PascalCase（如 `Navbar.tsx`）
- **CSS Modules**: PascalCase（如 `Navbar.module.css`）
- **函數**: camelCase（如 `addDocument`, `getUserCollection`）
- **型別/介面**: PascalCase（如 `Course`, `WorkShift`）
- **常數**: UPPER_SNAKE_CASE（如 `SHARED_DATA_PATH`）

### CSS 規範
- **樣式方法**: CSS Modules + CSS Variables
- **主題系統**: `data-theme="dark"` / `data-theme="light"`
- **顏色變數**: `var(--color-primary)`, `var(--color-highlight)`
- **玻璃擬態**: `.glass` 類別（定義於 `globals.css`）

```tsx
// ✅ 正確範例
import styles from './Component.module.css';

<div className={styles.container}>
  <button className={`${styles.button} glass`}>按鈕</button>
</div>
```

### 錯誤處理
```typescript
// ✅ Firebase 未設定時的防禦性檢查
export function getUserCollection(userId: string, collectionName: string) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  return collection(db, 'shared', 'data', collectionName);
}

// ✅ 清理 Firestore 不允許的 undefined 值
function cleanUndefined<T extends DocumentData>(data: T): DocumentData {
  const cleaned: DocumentData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}
```

### 註解規範
- **必須使用繁體中文**
- **重點解釋 Why（決策原因），而非 What（做了什麼）**
- **複雜函數需加 JSDoc**

```typescript
/**
 * 監聽 Collection 變更
 * 
 * 當資料有任何變更時，會自動觸發 callback 函數。
 * 這是實作即時同步的核心功能。
 * 
 * @param userId - 使用者 UID
 * @param collectionName - Collection 名稱
 * @param callback - 當資料變更時執行的函數
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
export function subscribeToCollection<T>(...) { ... }
```

---

## 🔥 Firebase/Firestore 規範

### 共用資料路徑結構
```
/shared (collection)
  └── /data (document)
      ├── /courses (sub-collection)         # 學校課表
      ├── /workShifts (sub-collection)      # 打工班表
      ├── /salaryRecords (sub-collection)   # 薪資記錄
      ├── /events (sub-collection)          # 重要事件
      ├── /gameGuides (sub-collection)      # 遊戲攻略
      └── /courseNotes (sub-collection)     # 課程筆記 🆕
```

### ⚠️ 關鍵規則
1. **路徑必須為偶數段**：`/shared/data/courses` ✅ | `/shared/courses` ❌
2. **使用白名單權限**：Email 列表在 Firestore Rules 中管理
3. **即時同步**：使用 `subscribeToCollection` + `onSnapshot`
4. **清理 undefined**：Firestore 不允許 `undefined`，需轉換為 `null` 或移除

### Service Layer 使用方式
```typescript
// ✅ 正確範例：透過服務層存取資料
import { getDocuments, addDocument } from '@/services/firestoreService';

const courses = await getDocuments<Course>('shared', 'courses');
const newId = await addDocument('shared', 'courses', { name: '資料結構' });

// ❌ 錯誤範例：直接使用 Firebase SDK
import { collection, getDocs } from 'firebase/firestore';
const snapshot = await getDocs(collection(db, 'courses'));  // 路徑錯誤
```

---

## 🧩 元件開發規範

### 'use client' 指令
- **必須加**：使用 `useState`, `useEffect`, `useContext` 的元件
- **頁面檔案**：`app/*/page.tsx` 通常需要加（因為有互動）
- **純展示元件**：不需要（可利用 Server Components 優勢）

### Custom Hooks 模式
```typescript
// ✅ hooks/useScheduleData.ts
export function useScheduleData() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToCollection<Course>(
      'shared', 
      'courses', 
      setCourses
    );
    return () => unsubscribe();  // 清理訂閱
  }, [user]);

  const addCourse = async (course: Omit<Course, 'id'>) => {
    await addDocument('shared', 'courses', course);
  };

  return { courses, addCourse, /* ... */ };
}
```

### 登入狀態檢查
```tsx
// ✅ 所有需要驗證的頁面必須加這段
const { user, loading } = useAuth();

if (loading) {
  return <div>載入中...</div>;
}

if (!user) {
  return <LoginPrompt />;
}
```

---

## ⚡ 效能與最佳實踐

1. **覆用優先**：新增功能前先搜尋是否已有類似實現
2. **避免重複渲染**：使用 `useCallback`, `useMemo` 優化（但不過度）
3. **清理副作用**：`useEffect` 必須 return cleanup function
4. **圖片優化**：因為 GitHub Pages 限制，已設定 `images.unoptimized: true`
5. **Base Path**：生產環境自動加上 `/schedule_app`，開發環境不加

---

## 🚫 禁止事項

1. ❌ **不要刪除或重構現有架構**（除非使用者明確要求）
2. ❌ **不要註釋掉未使用的代碼**（直接刪除）
3. ❌ **不要為了向後兼容保留廢棄代碼**
4. ❌ **不要使用 `eslint-disable` 或 `@ts-ignore` 繞過錯誤**
5. ❌ **不要新增 UI 框架**（如 Tailwind, MUI）- 保持 Vanilla CSS

---

## 📚 相關技能文檔

本專案有以下專業 Agent Skill 可用：

- **harsh-code-reviewer**: 嚴格代碼審查（安全性、效能、可讀性）
- **firestore-shared-data**: Firebase/Firestore 共用資料架構專家

---

## 🌐 環境變數

```bash
# .env.local（不提交到 Git）
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

**⚠️ 注意**: 建置時若環境變數未設定，專案仍可正常 build（有防禦性檢查）

---

本文檔最後更新：2026-02-07
