# 📅 我的日程與遊戲助手 (My Personal Schedule & Game Guide)

這是一個專為大學生設計的個人助理網頁應用程式，整合了 **學校課表**、**打工排班**、**重要事件提醒** 以及 **遊戲攻略整理** 功能。

使用 Next.js 構建，介面採用現代化的毛玻璃 (Glassmorphism) 風格，美觀且實用，並支援部署至 GitHub Pages。

## ✨ 主要功能

### 1. 🏠 首頁儀表板 (Dashboard)

- **今日概況**：一眼掌握稍後的課程或打工安排。
- **本月打工一覽**：直接在首頁顯示當月份的所有打工班表，不用切換頁面即可查看。
- **即將到來的事件**：倒數計時顯示重要的作業死線 (Deadline) 或學校日程（如選課時間）。

### 2. 🗓️ 日程表 (Schedule)

- **雙模式切換**：
  - **🏫 學校課表**：只顯示週一至週五的精簡週視圖，過濾掉週末干擾，讓你看課表更專注。
  - **💼 打工月曆**：全版的月曆視圖，清楚標示哪幾天有排班（如秋季班、冬令營），並支援月份切換。

### 3. 🎮 遊戲攻略 (Game Guides)

- **針對遊戲與版本分類**：
  - 目前支援《重返未來：1999》與《崩壞：星穹鐵道》。
- **版本詳細資訊**：
  - 像《重返未來：1999》會依照 v3.1, v3.2, v3.3 等版本區分。
  - 每個版本列出 Focus 角色與該版本的活動攻略連結。
- **實用工具**：
  - **一鍵複製共鳴譜**：對於有共鳴代碼的角色，提供「📋 複製共鳴譜分享碼」按鈕，點擊即可複製到剪貼簿。

## 🛠️ 技術架構

- **框架**: [Next.js 15](https://nextjs.org/) (App Router)
- **語言**: TypeScript
- **樣式**: Vanilla CSS (CSS Modules & CSS Variables)
- **部屬**: GitHub Pages (Static Export)

## 🚀 如何開始 (Getting Started)

### 安裝依賴

```bash
npm install
# 或
yarn install
```

### 啟動開發伺服器

```bash
npm run dev
```

打開瀏覽器前往 [http://localhost:3000](http://localhost:3000) 即可看到畫面。

## 📦 部署 (Deployment)

本專案已設定好可以部屬到 GitHub Pages。

1. 確認 `next.config.ts` 中的 `output: 'export'` 設定已開啟。
2. 執行部署指令：

```bash
npm run deploy
```

這會自動執行 `next build` 並將 `out` 目錄推送至 `gh-pages` 分支。

## 📂 專案結構

- `src/app/page.tsx`: 首頁 (Dashboard)
- `src/app/schedule/page.tsx`: 日程表頁面 (包含課表與月曆)
- `src/app/games/page.tsx`: 遊戲攻略頁面
- `src/data/`: 存放課表、打工、遊戲等靜態資料的設定檔
  - `schedule.ts`: 課程與打工資料
  - `games.ts`: 遊戲與攻略連結資料

---

