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

### 🎮 遊戲攻略
- 支援《重返未來：1999》與《崩壞：星穹鐵道》
- 依版本分類（v3.1, v3.2, v3.3...）
- Focus 角色與活動攻略連結
- 一鍵複製共鳴譜分享碼

### 💰 薪資計算器
- 完整的打工薪資管理與統計工具
- 從打工月曆一鍵匯入班表
- 自動計算工時與薪資
- 月度收入趨勢圖表（最近 6 個月）
- 批次編輯時薪與批量刪除
- 支援 Excel/PDF 匯出與列印

---

## 🎯 進階功能

### 💾 資料持久化與備份
#### LocalStorage 自動儲存
- 所有課表、打工班表和事件自動儲存在瀏覽器
- 關閉瀏覽器後資料仍保留
- 支援完整的 CRUD 操作

#### 備份與還原
- 一鍵下載完整資料備份（JSON 格式）
- 包含課程、班表、事件和主題設定
- 匯入前自動驗證備份檔案格式
- 可用於跨裝置資料同步

#### 行事曆匯出（ICS 格式）
- 匯出課程表（支援每週重複，18週學期）
- 匯出打工班表
- 匯出重要事件
- 匯出完整行程（整合所有資料）
- **可同步到**：Google Calendar、Apple Calendar、Microsoft Outlook

#### CSV 匯出
- 匯出課程表為 CSV 格式
- 匯出打工班表為 CSV 格式
- UTF-8 編碼，支援中文
- 可用 Excel 或 Google Sheets 開啟

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
- 下拉選單快速導航
- 平滑動畫效果
- 完全響應式設計
- 操作即時回饋

---

## 🛠️ 技術架構

### 核心技術
- **框架**: [Next.js 16.1.1](https://nextjs.org/) (App Router)
- **語言**: TypeScript 5
- **樣式**: Vanilla CSS (CSS Modules & CSS Variables)
- **部署**: GitHub Pages (Static Export)
- **圖表/匯出**: xlsx, jspdf, jspdf-autotable, html2canvas

### 關鍵特性
- **Client-side Rendering**: 使用 `'use client'` 指令
- **Custom Hooks**: 抽離業務邏輯與狀態管理
- **LocalStorage**: 瀏覽器本地資料持久化
- **Service Worker**: PWA 離線支援
- **ICS Export**: 標準 iCalendar 格式匯出
- **CSS Variables**: 動態主題切換

---

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

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
│   │   ├── layout.tsx         # 根佈局（含 Navbar）
│   │   ├── page.tsx           # 首頁儀表板
│   │   ├── globals.css        # 全域樣式與主題系統
│   │   ├── games/             # 遊戲攻略頁面
│   │   ├── manage/            # 資料管理頁面
│   │   ├── tools/             # 工具箱
│   │   │   └── salary/        # 薪資計算器
│   │   └── schedule/          # 日程表頁面
│   │       ├── school/        # 學校課表
│   │       └── work/          # 打工月曆
│   ├── components/            # React 元件
│   │   ├── Navbar.tsx         # 導航列（自動隱藏、下拉選單）
│   │   ├── Icons.tsx          # SVG 圖示元件
│   │   ├── VisualComponents.tsx    # 視覺元件（卡片、時間軸）
│   │   ├── ThemeToggle.tsx    # 主題切換按鈕
│   │   ├── PWAHandler.tsx     # PWA 註冊器
│   │   ├── ExportImport.tsx   # 匯出/匯入管理面板
│   │   ├── CourseEditor.tsx   # 課程編輯對話框
│   │   ├── CourseManager.tsx  # 課程管理元件
│   │   ├── WorkShiftEditor.tsx      # 班表編輯對話框
│   │   ├── WorkShiftManager.tsx     # 班表管理元件
│   │   └── SalaryCalculator.tsx     # 薪資計算器元件
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useLocalStorage.ts       # LocalStorage 管理
│   │   ├── useScheduleData.ts       # 資料管理（CRUD）
│   │   ├── useHomeDashboard.ts      # 儀表板邏輯
│   │   ├── useWorkCalendar.ts       # 月曆邏輯
│   │   ├── useTheme.ts             # 主題管理
│   │   └── useIsMobile.ts          # 響應式偵測
│   ├── data/                  # 資料定義與預設資料
│   │   ├── schedule.ts        # 課程、班表、事件資料與型別
│   │   └── games.ts           # 遊戲攻略資料
│   └── utils/                 # 工具函式
│       ├── icsExport.ts       # ICS 格式匯出
│       └── backup.ts          # 備份與還原邏輯
├── next.config.ts             # Next.js 配置
├── tsconfig.json              # TypeScript 配置
├── eslint.config.mjs          # ESLint 配置
└── package.json               # 專案依賴與腳本
```

---

## 📱 使用指南

### 資料管理

#### 📥 匯出資料
1. 點擊首頁右下角的「匯出 / 匯入」按鈕
2. 選擇匯出格式：
   - **ICS 行事曆**：可同步到 Google/Apple Calendar
   - **JSON 備份**：完整資料備份
   - **CSV 檔案**：Excel/Sheets 格式

#### 📤 匯入資料
1. 點擊「匯入備份檔」按鈕
2. 選擇之前下載的 JSON 備份檔案
3. 確認備份資訊後還原

#### ✏️ 編輯資料
1. 點擊導覽列的「管理」
2. 在課程管理或打工班表分頁中：
   - 新增：點擊「+ 新增」按鈕
   - 編輯：點擊項目的 ✏️ 按鈕
   - 刪除：點擊項目的 🗑️ 按鈕

#### 🔄 快速複製班表
1. 進入打工班表管理
2. 點擊「📋 複製上週」或「📋 複製上月」
3. 確認後自動建立新班表

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
- ✅ 遊戲攻略（版本分類、一鍵複製）
- ✅ 薪資計算器（工時計算、統計圖表、批次操作、匯出）
- ✅ 自動隱藏導航列
- ✅ LocalStorage 資料持久化
- ✅ PWA 支援（離線瀏覽、安裝到主畫面）
- ✅ 深色/淺色主題切換
- ✅ ICS 行事曆匯出
- ✅ JSON 備份與還原
- ✅ CSV 資料匯出
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
- [Vercel](https://vercel.com/) - 部署平台
- [GitHub Pages](https://pages.github.com/) - 靜態網站託管

---

⭐ 如果這個專案對你有幫助，請給個星星支持！
