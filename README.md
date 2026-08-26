<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="DayMate：將課程、班表與薪資整合成個人日常節奏的管理工具。">
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.1.1-3d3a36?logo=nextdotjs&logoColor=white" alt="Next.js 16.1.1"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-5f7186?logo=typescript&logoColor=white" alt="TypeScript 5"></a>
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-Firestore_%2B_Auth-b87e6b?logo=firebase&logoColor=white" alt="Firebase Firestore 與 Authentication"></a>
</p>

DayMate 是為學生與兼職工作者設計的日常管理工具。它將學校課表、打工月曆、薪資記錄、生活費與課程筆記集中在一個 App 中，讓每天要做什麼、何時上班、這個月賺了多少，都能在同一條工作流完成。

## 為什麼是 DayMate？

日程與薪資不是兩套互不相干的資料：班表會直接帶入薪資記錄，而首頁則把今日安排、事件與當月概況放在一起。登入後，資料透過 Firestore 即時訂閱保存到共用資料集合；未設定 Firebase 時，專案仍可正常建置。

```text
課表與班表 ──→ 今日儀表板 ──→ 薪資記錄與分析 ──→ Excel / PDF 報表
       │                  │
       └──→ Firestore 共用資料 ──→ 課程筆記、生活費與遊戲攻略
```

## 主要功能

### 規劃每天的節奏

- **學校課表**：以節次網格管理課程，支援跨節次呈現。
- **打工月曆**：按月查看、建立與編輯班別，並可同步到設定好的 family-web 行事曆。
- **首頁儀表板**：整合今天的課程與班別、近期事件、每月班表與統計概況。
- **課程筆記**：依課程整理筆記、作業與考試，追蹤截止日與完成狀態。

### 把班表轉成可用的薪資資料

- 以班別範本預填時段、時數與時薪；可從當月打工班表帶入薪資記錄。
- 提供明細、趨勢、工時與平均時薪分析，以及批次編輯與刪除。
- 支援 Excel 匯入與匯出、PDF 報表和列印。

### 補足生活與興趣記錄

- **生活費記錄**：管理支出資料與類別。
- **遊戲攻略中心**：建立、編輯並以版本與類型篩選攻略內容。
- **PWA**：提供可安裝的 Web App 設定與 Service Worker 快取。

## 技術與資料流

| 層次 | 使用方式 |
| --- | --- |
| 介面 | Next.js App Router、React 19、CSS Modules 與 CSS Variables |
| 資料 | Firebase Authentication（Google 登入）與 Firestore 即時訂閱 |
| 結構 | 頁面 → Custom Hooks → Firestore Service → `/shared/data/{collection}` |
| 匯出 | `xlsx`、`jspdf`、`html2canvas` |
| 部署 | GitHub Pages 靜態匯出（production base path：`/schedule_app`） |

## 快速開始

### 1. 安裝並啟動

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

### 2. 設定 Firebase（選用）

若要使用 Google 登入與雲端資料，建立 `.env.local`：

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

`src/lib/firebase.ts` 會先檢查設定是否完整；未設定時不會初始化 Firebase，因此仍可執行靜態建置。

### 3. 檢查、建置或部署

```bash
npm run lint
npm run build
npm run deploy
```

## 專案結構

```text
src/
├── app/              # App Router 路由：首頁、日程、工具、資料管理與遊戲攻略
├── components/       # 可重用介面與薪資工具元件
├── context/          # Auth、Toast 與確認對話框狀態
├── data/             # 預設資料與 TypeScript 型別
├── hooks/            # 日程、薪資、筆記、生活費與攻略資料流程
├── lib/              # Firebase 初始化
├── services/         # Firestore 與 family-web 同步服務
└── utils/            # Excel 解析、ICS 匯出與衝突檢查
```

## 作者

由 [Brian Lien](https://github.com/BrianLien09) 維護。
