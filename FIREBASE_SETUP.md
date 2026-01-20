# Firebase 串接完整設定指南

本文件提供完整的 Firebase 串接步驟，讓你的課表應用程式從本地端 LocalStorage 遷移至雲端資料庫。

---

## 📋 目錄

1. [建立 Firebase 專案](#1-建立-firebase-專案)
2. [設定環境變數](#2-設定環境變數)
3. [啟用 Cloud Firestore](#3-啟用-cloud-firestore)
4. [設定 Firestore 安全規則](#4-設定-firestore-安全規則)
5. [啟用 Authentication](#5-啟用-authentication)
6. [驗證設定](#6-驗證設定)
7. [後續開發步驟](#7-後續開發步驟)

---

## 1. 建立 Firebase 專案

### 步驟 1.1：前往 Firebase Console

1. 開啟瀏覽器，前往 [Firebase Console](https://console.firebase.google.com/)
2. 使用你的 Google 帳號登入

### 步驟 1.2：建立新專案

1. 點選「**新增專案**」或「**Add project**」
2. 輸入專案名稱，例如：`schedule-app` 或 `my-schedule`
3. 點選「**繼續**」

### 步驟 1.3：Google Analytics 設定（可選）

1. 可以選擇啟用或停用 Google Analytics
2. 如果不需要數據分析，可以關閉此選項
3. 點選「**建立專案**」

### 步驟 1.4：等待專案建立完成

- 通常需要 10-30 秒
- 完成後點選「**繼續**」進入專案控制台

---

## 2. 設定環境變數

### 步驟 2.1：註冊網頁應用程式

1. 在 Firebase 專案首頁，找到「**開始使用**」區塊
2. 點選 **網頁圖示** `</>`（或是左上角齒輪 → 專案設定 → 你的應用程式 → 新增應用程式）
3. 輸入應用程式暱稱，例如：`Schedule Web App`
4. **不需要**勾選「Firebase Hosting」（我們使用 GitHub Pages）
5. 點選「**註冊應用程式**」

### 步驟 2.2：複製 Firebase 設定

你會看到類似這樣的程式碼：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 步驟 2.3：建立 `.env.local` 檔案

1. 在專案根目錄執行以下指令（或手動複製檔案）：

```bash
cp .env.local.example .env.local
```

2. 使用文字編輯器打開 `.env.local`

3. 將剛才複製的 Firebase 設定值填入對應欄位：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

4. **儲存檔案**

> ⚠️ **注意**：`.env.local` 已經在 `.gitignore` 中，不會被提交到 Git。請確保這個檔案的安全性。

---

## 3. 啟用 Cloud Firestore

### 步驟 3.1：進入 Firestore Database

1. 在 Firebase Console 左側選單，點選「**Firestore Database**」
2. 點選「**建立資料庫**」

### 步驟 3.2：選擇模式

- 選擇「**以測試模式啟動**」（稍後我們會設定安全規則）
- 點選「**下一步**」

### 步驟 3.3：選擇位置

1. 選擇 Firestore 資料中心位置
   - 建議選擇：`asia-east1 (Taiwan)` 或 `asia-northeast1 (Tokyo)`
   - **注意**：位置一旦選定就無法更改
2. 點選「**啟用**」

### 步驟 3.4：等待資料庫建立完成

- 通常需要 1-2 分鐘
- 完成後會看到空的資料庫介面

---

## 4. 設定 Firestore 安全規則

### 步驟 4.1：進入規則編輯器

1. 在 Firestore Database 頁面
2. 點選頂部的「**規則**」分頁

### 步驟 4.2：設定安全規則

將預設規則替換為以下內容：

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

### 步驟 4.3：發布規則

1. 點選「**發布**」按鈕
2. 確認發布

> 📖 **規則說明**：
> - 只有已登入的使用者才能讀寫資料
> - 使用者只能存取 `/users/{自己的UID}/` 底下的資料
> - 確保資料隔離，A 使用者無法看到 B 使用者的課表

---

## 5. 啟用 Authentication

### 步驟 5.1：進入 Authentication

1. 在 Firebase Console 左側選單，點選「**Authentication**」
2. 點選「**開始使用**」（如果是第一次使用）

### 步驟 5.2：啟用 Google 登入

1. 點選「**Sign-in method**」分頁
2. 在「登入提供者」清單中，找到「**Google**」
3. 點選 Google 列右側的編輯圖示（鉛筆）
4. 將「啟用」開關切換為 **ON**
5. 設定「專案公開名稱」，例如：`Schedule App`
6. 選擇「專案支援電子郵件」（選擇你的 Google 帳號）
7. 點選「**儲存**」

### 步驟 5.3：（可選）啟用其他登入方式

根據需求，你也可以啟用：
- Email/Password（需要額外的註冊流程）
- GitHub、Facebook 等（需要各平台的 OAuth 設定）

> 💡 **建議**：個人使用的話，只啟用 Google 登入最為簡便。

---

## 6. 驗證設定

### 步驟 6.1：檢查環境變數

在專案根目錄執行以下指令：

```bash
# 確認 .env.local 檔案存在
ls .env.local

# 或在 Windows PowerShell
dir .env.local
```

### 步驟 6.2：啟動開發伺服器

```bash
npm run dev
```

### 步驟 6.3：檢查主控台

開啟瀏覽器開發者工具（F12），確認沒有 Firebase 相關錯誤：

```
❌ 錯誤範例：
Firebase: Error (auth/invalid-api-key)
→ 表示 API Key 設定錯誤

✅ 正確狀態：
應該沒有任何 Firebase 錯誤訊息
```

---

## 7. 後續開發步驟

完成上述設定後，接下來的開發階段包括：

### 階段二：身份驗證系統
- [ ] 建立 `AuthContext` 提供全域登入狀態
- [ ] 實作 Google 登入/登出功能
- [ ] 建立登入頁面 UI
- [ ] 設定路由保護（未登入時導向登入頁）

### 階段三：Firestore 資料存取
- [ ] 建立 `firestoreService.ts` 封裝 CRUD 操作
- [ ] 重構 `useScheduleData.ts` 改用 Firestore
- [ ] 重構 `SalaryCalculator.tsx` 改用 Firestore
- [ ] 實作即時同步功能（使用 `onSnapshot`）

### 階段四：資料遷移
- [ ] 建立「同步至雲端」功能
- [ ] 從 LocalStorage 讀取現有資料
- [ ] 批次寫入 Firestore
- [ ] 提供遷移進度顯示

### 階段五：測試與部署
- [ ] 測試登入/登出流程
- [ ] 測試資料讀寫與即時同步
- [ ] 測試多裝置同步（手機 + 電腦）
- [ ] 部署至 GitHub Pages

---

## 🔧 常見問題

### Q1: API Key 外洩會有安全問題嗎？

**A:** Firebase 的 API Key 設計為公開使用，安全性由 **Firestore Security Rules** 和 **Authentication** 控管。只要規則設定正確，即使 API Key 外洩也不會有資料外洩風險。

### Q2: 為什麼要使用 `NEXT_PUBLIC_` 前綴？

**A:** Next.js 只會將 `NEXT_PUBLIC_` 開頭的環境變數暴露給瀏覽器端。Firebase 需要在客戶端執行，因此必須加上此前綴。

### Q3: Firestore 位置選錯了怎麼辦？

**A:** 位置無法更改，只能刪除專案重新建立。建議在正式使用前先確認位置。

### Q4: 測試模式會自動過期嗎？

**A:** 是的，測試模式預設 30 天後會關閉寫入權限。但我們在步驟 4 已經設定正式的安全規則，不會有此問題。

### Q5: 可以在本地端測試 Firestore 嗎？

**A:** 可以使用 Firebase Emulator Suite，但需要額外設定。對於此專案規模，直接使用線上 Firestore 即可（免費額度綽綽有餘）。

---

## 📚 參考資源

- [Firebase 官方文件](https://firebase.google.com/docs)
- [Firestore 入門指南](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Authentication 文件](https://firebase.google.com/docs/auth)
- [Next.js 環境變數](https://nextjs.org/docs/basic-features/environment-variables)

---

## ✅ 檢查清單

在開始開發前，請確認以下項目都已完成：

- [ ] Firebase 專案已建立
- [ ] 網頁應用程式已註冊
- [ ] `.env.local` 檔案已建立並填入正確設定
- [ ] Firestore Database 已啟用
- [ ] Firestore 安全規則已設定
- [ ] Google Authentication 已啟用
- [ ] 開發伺服器可正常啟動且無 Firebase 錯誤

**全部完成後，就可以開始進行階段二：身份驗證系統的開發！**
