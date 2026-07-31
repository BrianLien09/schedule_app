# 📅 DayMate - 個人日常與排班管理助手

**DayMate** 是一個專為學生與打工作族設計的個人助理網頁應用程式，整合了 **學校課表**、**打工排班**、**薪資計算與統計**、**重要事件提醒** 以及 **遊戲攻略整理** 功能。

使用 Next.js 構建，介面採用現代化的毛玻璃 (Glassmorphism) 與大地色系質感設計，美觀且實用，並支援部署至 GitHub Pages 及 PWA 離線瀏覽。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

---

## ✨ 主要功能

### 🏠 首頁儀表板
- **今日概況**：即時顯示正在進行和稍後的課程或打工
- **統計卡片**：本週課程數量、本月打工天數與當月薪資估算
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
- 支援月份切換與即時檢視
- 點擊日期快速滾動到詳細資訊
- 按月分組顯示班表列表

### 💰 薪資計算與統計助手 (DayMate Salary Toolkit)
- **三標籤頁架構 (Tabbed Interface)**：
  - **薪資明細與記帳**：當月四大 KPI 卡片速覽、快速記帳表單（支援範本快捷一鍵帶入）與工作記錄清單。
  - **統計與趨勢分析**：專注於 6 個月收入趨勢圖表、工時分佈與平均時薪分析。
  - **班別範本管理**：獨立設定常規班別（如週六班、冬令營講師等），自動計算時數與預設時薪。
- **打工班表同步**：從打工月曆按月份一鍵匯入班表
- **全介面純淨視覺**：去除硬中括號，搭配經典色彩身份 Badge（助教 / 講師標籤）與表格 Footer 總計列。
- **批次編輯與刪除**：多選紀錄批次修改時薪/班別/時數
- **匯出功能**：支援 Excel 匯出/匯入、PDF 報表與列印友善版面

### 📝 課程筆記系統
- **三大筆記類型**：課堂筆記、作業、考試
- **Markdown 支援**：支援 Markdown 格式撰寫筆記
- **多課程管理**：依課程分類整理筆記
- **待辦事項追蹤**：作業/考試截止日期提醒與完成狀態勾選
- **雲端同步**：Firestore 即時同步，多裝置存取

### 🎮 遊戲攻略中心
- **多遊戲支援**：《重返未來：1999》、《崩壞：星穹鐵道》
- **動態攻略管理**：新增、編輯、刪除攻略（Firestore 雲端同步）
- **版本智慧篩選**：自動選擇最新版本與五大分類系統
- **視覺化資訊層次**：星級評分、完成進度追蹤與彩色標籤

---

## 🎯 進階功能

### 💾 資料持久化與雲端同步
#### 🔥 Firebase 雲端同步（已登入）
- **Google 登入**：一鍵使用 Google 帳號登入
- **即時同步**：所有資料自動儲存至 Firestore 雲端資料庫
- **多裝置支援**：手機、平板、電腦自動同步，隨時隨地存取

#### 💿 LocalStorage 本地儲存（未登入）
- 未登入時所有資料自動儲存在瀏覽器，關閉瀏覽器後仍完整保留

### 📱 PWA 支援
- 支援「安裝到主畫面」功能，提供類原生 App 體驗與離線快取

### 🌓 主題系統
- 深色/淺色模式切換，使用 CSS 變數動態平滑過渡

---

## 🛠️ 技術架構

### 核心技術
- **框架**: [Next.js 16.1.1](https://nextjs.org/) (App Router)
- **語言**: TypeScript 5 (Strict Mode)
- **樣式**: Vanilla CSS (CSS Modules & CSS Variables)
- **後端服務**: [Firebase](https://firebase.google.com/) (Firestore + Authentication)
- **部署**: GitHub Pages (Static Export)
- **圖表/匯出**: xlsx, jspdf, html2canvas

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

前往 [http://localhost:3000](http://localhost:3000)

### 建置與部署

```bash
# 靜態網站建置
npm run build

# 部署至 GitHub Pages
npm run deploy
```

---

## 📂 專案結構

```
schedule/
├── public/                      # 靜態資源（logo.jpg, icon.jpg, manifest.json）
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   │   ├── layout.tsx         # 根佈局（含 DayMate Metadata）
│   │   ├── page.tsx           # 首頁儀表板
│   │   ├── login/             # 登入頁面
│   │   ├── tools/             # 工具箱（薪資計算器、生活費）
│   │   └── schedule/          # 學校課表、打工月曆
│   ├── components/            # React 元件
│   │   ├── Navbar.tsx         # 品牌導航列
│   │   ├── salary/            # 薪資助手模組化元件
│   │   │   ├── SalaryHeaderStats.tsx    # KPI 卡片
│   │   │   ├── SalaryRecordForm.tsx     # 記帳與範本快捷表單
│   │   │   ├── SalaryRecordList.tsx     # 明細表格與總計
│   │   │   ├── SalaryAnalytics.tsx      # 趨勢分析
│   │   │   └── ShiftTemplateManager.tsx # 班別範本管理
│   │   └── SalaryCalculator.tsx        # 主 Coordinator 組件
```

---

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

---

## 👤 作者

**Brian Lien**
- GitHub: [@Brianlien09](https://github.com/Brianlien09)
- Email: brianlien09@gmail.com
