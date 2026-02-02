# 📅 冥夜小助手 - 個人日程管理

這是一個專為大學生設計的個人助理網頁應用程式，整合了 **學校課表**、**打工排班**、**重要事件提醒** 以及 **遊戲攻略整理** 功能。

使用 Next.js 構建，介面採用現代化的毛玻璃 (Glassmorphism) 風格，美觀且實用，並支援部署至 GitHub Pages。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## ✨ 主要功能

### 🏠 首頁儀表板
- **今日概況**：即時顯示正在進行和稍後的課程或打工
- **統計卡片**：本週課程數量、本月打工天數
- **本月打工一覽**：直接在首頁顯示當月份的所有打工班表
- **即將到來的事件**：倒數計時顯示重要的作業死線或學校日程
- **今日課程時間軸**：依據目前時間動態顯示課程狀態（已結束/進行中/未開始）
- **快速訪問**：透過導航欄「日程表 ▾ → 資料管理」進入資料編輯頁面

### 🗓️ 日程管理
#### 學校課表
- 節次網格呈現（第 1-11 節）
- 雙層置頂表頭，滾動時不迷路
- 彩色課程標示，一目瞭然
- 支援跨節次課程顯示

#### 打工月曆
- 月曆介面清楚標示排班日期
- 支援月份切換
- 點擊日期快速滾動到詳細資訊
- 按月分組顯示班表列表

### 🎮 遊戲攻略中心
- **多遊戲支援**：《重返未來：1999》、《崩壞：星穹鐵道》
- **動態攻略管理**：新增、編輯、刪除攻略（Firestore 雲端同步）
- **版本智慧篩選**：
  - 自動選擇最新版本（v3.1, v3.2, v3.3...）
  - 初始渲染優化（減少 66% 卡片數量）
  - 無版本攻略自動顯示於所有版本
- **五大分類系統**：角色養成、角色攻略、活動攻略、版本總覽、通用資源
- **視覺化資訊層次**：
  - 星級評分（1-5 星）
  - 完成進度追蹤
  - 彩色標籤系統（新手必看、速刷指南、配隊推薦等 8 種預設標籤）
  - 完成標記與遮罩效果
- **一鍵複製共鳴譜**：Base64 分享碼快速複製（重返未來：1999）
- **編輯模式**：點擊編輯後自動滾動至表單
- **高效能渲染**：FPS 55-60、GPU 負載降低 60%

### 💰 薪資計算器
- 完整的打工薪資管理與統計工具
- 從打工月曆一鍵匯入班表
- 自動計算工時與薪資
- 月度收入趨勢圖表（最近 6 個月）
- 批次編輯時薪與批量刪除
- 支援 Excel/PDF 匯出與列印

---

## 🎯 進階功能

### 💾 資料持久化與雲端同步
#### 🔥 Firebase 雲端同步（已登入）
- **Google 登入**：一鍵使用 Google 帳號登入
- **即時同步**：所有資料自動儲存至 Firestore 雲端資料庫
- **多裝置支援**：手機、平板、電腦自動同步，隨時隨地存取
- **資料隔離**：每個使用者的資料完全獨立，安全有保障
- **自動遷移**：首次登入時自動從 localStorage 轉移資料至雲端

#### 💿 LocalStorage 本地儲存（未登入）
- 所有課表、打工班表和事件自動儲存在瀏覽器
- 關閉瀏覽器後資料仍保留
- 支援完整的 CRUD 操作
- 透過「日程表 ▾ → 資料管理」進入編輯介面
- **向後相容**：未登入時仍可正常使用所有功能

### ✏️ 互動式編輯介面
#### 課程管理
- 新增/編輯/刪除課程
- 自訂課程顏色
- 支援週一至週日排課
- 即時更新課表顯示
- 課程列表依星期和時間自動排序

#### 打工班表管理
- 新增/編輯/刪除班表
- 按月分組顯示
- 日期卡片式設計
- **快速複製上週班表**（一鍵複製上週所有班表到本週）
- **快速複製上月班表**（自動調整日期到本月）

#### 💰 薪資計算器
- **工作記錄管理**：新增、編輯、刪除、複製工作記錄
- **班表整合**：從打工月曆按月份匯入記錄，自動帶入時間
- **自動計算**：工時自動扣除休息時間、薪資自動計算
- **統計圖表**：
  - 4 張統計卡片（總收入、總工時、平均時薪、工作天數）
  - 月度收入趨勢長條圖（最近 6 個月）
  - 互動式圖表（hover 顯示詳細資訊）
- **批次操作**：
  - 全選/多選記錄
  - 批次編輯時薪
  - 批量刪除記錄
- **匯出功能**：
  - Excel 匯出（xlsx 格式）
  - PDF 匯出（支援中文）
  - 列印友善版面（白底黑字）
- **資料持久化**：localStorage 自動儲存

#### 管理頁面
- 整合課程和班表管理
- Tab 切換介面
- 空狀態引導
- 刪除前確認提示

### 📱 PWA 支援
- 支援「安裝到主畫面」功能
- 離線瀏覽已快取的頁面
- 載入速度更快
- 類原生 App 體驗

### 🌓 主題系統
- 深色/淺色模式切換
- 主題偏好自動儲存
- 使用 CSS 變數動態切換
- 平滑的過渡動畫

### 🎨 UI/UX 優化
- 玻璃擬態設計 (Glassmorphism)
- 自動隱藏導航列（下滑收合、上滑顯示）
- 下拉選單快速導航（日程表下拉包含：學校課表、打工月曆、資料管理）
- 平滑動畫效果
- 完全響應式設計
- 操作即時回饋

---

## 🛠️ 技術架構

### 核心技術
- **框架**: [Next.js 16.1.1](https://nextjs.org/) (App Router)
- **語言**: TypeScript 5
- **樣式**: Vanilla CSS (CSS Modules & CSS Variables)
- **後端服務**: [Firebase](https://firebase.google.com/) (Firestore + Authentication)
- **部署**: GitHub Pages (Static Export)
- **圖表/匯出**: xlsx, jspdf, jspdf-autotable, html2canvas

### 關鍵特性
- **Client-side Rendering**: 使用 `'use client'` 指令
- **Custom Hooks**: 抽離業務邏輯與狀態管理
- **Firebase Authentication**: Google OAuth 登入
- **Firestore Database**: NoSQL 雲端資料庫，支援即時同步
- **LocalStorage Fallback**: 未登入時的本地資料持久化
- **Service Worker**: PWA 離線支援
- **CSS Variables**: 動態主題切換

---

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 環境設定（啟用雲端同步）

如果你想使用 **Firebase 雲端同步功能**，請按照以下步驟設定：

1. **建立 Firebase 專案**（詳細步驟請參閱 [FIREBASE_SETUP.md](FIREBASE_SETUP.md)）
   - 前往 [Firebase Console](https://console.firebase.google.com/)
   - 建立新專案並啟用 Firestore 與 Authentication (Google)

2. **複製環境變數範例檔案**
   ```bash
   cp .env.local.example .env.local
   ```

3. **填入 Firebase 設定**
   
   編輯 `.env.local`，將你的 Firebase 專案設定填入：
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

> 💡 **提示**：如果不設定 Firebase，應用程式仍可正常使用，資料會儲存在瀏覽器的 localStorage。

### 啟動開發伺服器

```bash
npm run dev
```

打開瀏覽器前往 [http://localhost:3000](http://localhost:3000)

### 建置生產版本

```bash
npm run build
```

### 部署到 GitHub Pages

```bash
npm run deploy
```

這會自動執行 `next build` 並將 `out` 目錄推送至 `gh-pages` 分支。

---

## 📂 專案結構

```
schedule/
├── public/                      # 靜態資源
│   ├── avatar.jpg              # 使用者頭像
│   ├── icon.jpg                # 應用圖示
│   ├── manifest.json           # PWA 設定檔
│   └── sw.js                   # Service Worker
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   │   ├── layout.tsx         # 根佈局（含 AuthProvider）
│   │   ├── page.tsx           # 首頁儀表板
│   │   ├── login/             # 登入頁面
│   │   ├── globals.css        # 全域樣式與主題系統
│   │   ├── games/             # 遊戲攻略頁面
│   │   ├── manage/            # 資料管理頁面
│   │   ├── tools/             # 工具箱
│   │   │   └── salary/        # 薪資計算器
│   │   └── schedule/          # 日程表頁面
│   │       ├── school/        # 學校課表
│   │       └── work/          # 打工月曆
│   ├── components/            # React 元件
│   │   ├── Navbar.tsx         # 導航列（自動隱藏、下拉選單、使用者頭像）
│   │   ├── Icons.tsx          # SVG 圖示元件
│   │   ├── VisualComponents.tsx    # 視覺元件（卡片、時間軸）
│   │   ├── ThemeToggle.tsx    # 主題切換按鈕
│   │   ├── PWAHandler.tsx     # PWA 註冊器
│   │   ├── CourseEditor.tsx   # 課程編輯對話框
│   │   ├── CourseManager.tsx  # 課程管理元件
│   │   ├── WorkShiftEditor.tsx      # 班表編輯對話框
│   │   ├── WorkShiftManager.tsx     # 班表管理元件
│   │   ├── SalaryCalculator.tsx     # 薪資計算器元件
│   │   ├── GuideComponents.tsx      # 遊戲攻略視覺化元件（卡片、標籤、評分）
│   │   └── GuideEditForm.tsx        # 攻略編輯表單
│   ├── context/               # React Context
│   │   └── AuthContext.tsx    # 身份驗證全域狀態（useAuth Hook）
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useLocalStorage.ts       # LocalStorage 管理
│   │   ├── useScheduleData.ts       # 資料管理（整合 Firestore + localStorage）
│   │   ├── useSalaryData.ts         # 薪資資料管理（整合 Firestore）
│   │   ├── useGameGuides.ts         # 遊戲攻略資料管理（整合 Firestore）
│   │   ├── useHomeDashboard.ts      # 儀表板邏輯
│   │   ├── useWorkCalendar.ts       # 月曆邏輯
│   │   ├── useTheme.ts             # 主題管理
│   │   └── useIsMobile.ts          # 響應式偵測
│   ├── lib/                   # 第三方服務初始化
│   │   └── firebase.ts        # Firebase SDK 初始化（db, auth）
│   ├── services/              # 業務邏輯服務
│   │   └── firestoreService.ts      # Firestore CRUD 封裝（通用資料操作）
│   └── data/                  # 資料定義與預設資料
│       ├── schedule.ts        # 課程、班表、事件資料與型別
│       ├── games.ts           # 遊戲基本資訊
│       └── gameGuides.ts      # 遊戲攻略資料型別與預設分類
├── .env.local.example         # 環境變數範例檔案
├── FIREBASE_SETUP.md          # Firebase 設定完整指南
├── next.config.ts             # Next.js 配置
├── tsconfig.json              # TypeScript 配置
├── eslint.config.mjs          # ESLint 配置
└── package.json               # 專案依賴與腳本
```

---

## 📱 使用指南

### 🔐 雲端同步與登入

#### 登入（啟用雲端同步）
1. 點擊導覽列右上角的「**登入**」按鈕
2. 選擇 Google 帳號完成登入
3. 首次登入時，系統會自動將 localStorage 中的資料遷移至雲端
4. 登入後，所有資料會即時同步到 Firestore

#### 多裝置同步
- 在手機登入後新增的課表，會立即在電腦上顯示
- 修改或刪除資料時，所有裝置會自動同步更新
- 無需手動「同步」按鈕，一切都是自動的

#### 登出
- 點擊導覽列右上角的使用者頭像
- 選擇「登出」
- 登出後會回到 localStorage 模式，資料仍保留在本地

> 💡 **提示**：建議登入使用雲端同步，資料更安全且支援多裝置存取。

---

### 資料管理

#### ✏️ 編輯資料
1. 點擊導覽列的「日程表 ▾」展開下拉選單
2. 選擇「資料管理」進入管理頁面
3. 在課程管理或打工班表分頁中：
   - 新增：點擊「+ 新增」按鈕
   - 編輯：點擊項目的 ✏️ 按鈕
   - 刪除：點擊項目的 🗑️ 按鈕

#### 🔄 快速複製班表
1. 進入打工班表管理
2. 點擊「📋 複製上週」或「📋 複製上月」
3. 確認後自動建立新班表

### 🎮 遊戲攻略管理

#### 新增攻略
1. 進入「遊戲攻略中心」頁面
2. 點擊右上角「✎ 編輯模式」
3. 點擊「+ 新增攻略」
4. 填寫表單內容：
   - 選擇遊戲與版本
   - 輸入標題與副標題
   - 貼上攻略連結
   - 設定星級評分（1-5）
   - 選擇分類與標籤
   - （選填）共鳴譜分享碼
5. 點擊「儲存」完成

#### 編輯/刪除攻略
1. 開啟編輯模式
2. 點擊卡片上的「編輯」或「刪除」按鈕
3. 編輯後自動滾動至表單位置

#### 版本篩選
- 系統自動選擇最新版本
- 點擊版本按鈕切換不同版本攻略
- 點擊「全部版本」顯示所有攻略
- 無版本標記的攻略（通用資源）在所有版本下都顯示

#### 追蹤進度
- 點擊卡片左上角的「☐ 完成」標記
- 已完成的攻略會顯示綠色遮罩和「✓ 已完成」標籤
- 統計會即時更新

### 主題切換
- 點擊導覽列右側的 🌞/🌙 按鈕
- 主題偏好會自動儲存

### PWA 安裝
**手機 (Android/iOS):**
1. 使用 Chrome 或 Safari 開啟網頁
2. 點擊瀏覽器選單 → 「加入主畫面」
3. 確認安裝

**電腦 (Chrome/Edge):**
1. 點擊網址列右側的「安裝」圖示
2. 確認安裝

---

## 🔧 開發指南

### 新增課程
修改 `src/data/schedule.ts` 中的 `schoolSchedule` 陣列：

```typescript
{
  id: 'mon-1',
  name: '課程名稱',
  day: 1,  // 1-7 代表週一到週日
  startTime: '08:10',
  endTime: '10:00',
  location: '教室位置',
  color: '#818cf8'  // 課程顏色
}
```

### 新增遊戲攻略
修改 `src/data/games.ts`：

```typescript
{
  id: 'game-1',
  title: '遊戲名稱',
  versions: [
    {
      version: 'v1.0',
      focusCharacters: ['角色A', '角色B'],
      links: [
        { text: '攻略標題', url: 'https://...' }
      ]
    }
  ]
}
```

### 自訂主題
修改 `src/app/globals.css` 中的 CSS 變數：

```css
:root {
  --color-primary: #818cf8;
  --color-secondary: #f472b6;
  /* ... 其他顏色變數 */
}
```

---

## 📊 功能清單

### 已實現功能
- ✅ 首頁儀表板（統計卡片、今日課程、打工一覽）
- ✅ 學校課表（網格顯示、雙層置頂）
- ✅ 打工月曆（月份切換、日期點擊）
- ✅ **遊戲攻略中心**（動態管理、版本篩選、視覺化標籤、進度追蹤）
- ✅ 薪資計算器（工時計算、統計圖表、批次操作、匯出）
- ✅ **Firebase 身份驗證**（Google 登入/登出）
- ✅ **Firestore 雲端同步**（即時多裝置同步）
- ✅ **自動資料遷移**（localStorage → Firestore）
- ✅ **高效能渲染優化**（FPS 55-60、GPU 負載 ↓60%）
- ✅ 自動隱藏導航列
- ✅ LocalStorage 資料持久化（向後相容）
- ✅ PWA 支援（離線瀏覽、安裝到主畫面）
- ✅ 深色/淺色主題切換
- ✅ 互動式課程編輯（新增/編輯/刪除）
- ✅ 互動式班表編輯（新增/編輯/刪除）
- ✅ 快速複製班表（上週/上月）
- ✅ 響應式設計（手機/平板/桌面）

### 未來規劃
- 📅 瀏覽器通知提醒（上課前 10 分鐘）
- 🌐 多語系支援（中英文切換）
- 🔗 從學校系統匯入課表
- 🎨 更多主題選項
- 📊 更多統計維度（週統計、年度統計）
- 🎮 遊戲攻略圖片上傳與預覽
- 🔍 攻略全文搜尋功能

---

## ⚡ 性能優化

### 遊戲攻略頁面優化（v2.0）

**優化成果：**
- 📊 **FPS 提升 71%**：從 30-35 提升至 55-60
- 🖥️ **GPU 負載降低 60-70%**：移除動態 `backdrop-filter`
- 🚀 **初始渲染減少 66%**：智慧版本篩選（50 張卡片 → 15-20 張）
- 💾 **記憶體使用降低 60%**：優化 React 元件與狀態管理

**技術細節：**
1. **CSS 性能優化**
   - 移除 hover/動態元素的 `backdrop-filter: blur()`
   - 簡化 `transition` 屬性（從 `all` 改為具體屬性）
   - 新增 `will-change` 性能提示

2. **React 優化**
   - 移除簡單元件的不必要 `React.memo`
   - 保留複雜元件的記憶化（GuideCard、GuideEditForm）
   - 使用 `useMemo` 與 `useCallback` 減少重新計算

3. **渲染優化**
   - 預設選擇最新版本（減少初始卡片數量）
   - 按版本動態篩選攻略
   - 按分類分組顯示（避免扁平化大列表）

4. **UX 改善**
   - 編輯時自動滾動至表單（`scrollIntoView`）
   - 連續編輯時表單資料正確同步（`useEffect` 監聽）

**測試方法：**
```bash
# 開啟 Chrome DevTools
# Performance Tab → 錄製 → 滾動 + Hover
# 檢查 FPS 是否穩定在 55-60
```

---

## 🤝 貢獻

歡迎提出 Issue 或 Pull Request！

1. Fork 此專案
2. 建立新分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

---

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

---

## 👤 作者

**Brian Lien**
- GitHub: [@Brianlien09](https://github.com/Brianlien09)
- Email: brianlien09@gmail.com

---

## 🙏 致謝

- [Next.js](https://nextjs.org/) - React 框架
- [Firebase](https://firebase.google.com/) - 雲端資料庫與身份驗證
- [Vercel](https://vercel.com/) - 部署平台
- [GitHub Pages](https://pages.github.com/) - 靜態網站託管

---

⭐ 如果這個專案對你有幫助，請給個星星支持！
