# 新功能使用說明

本次更新實現了三個高優先級功能，大幅提升了應用的使用體驗！

## ✅ 已完成功能

### 1. 📦 LocalStorage 儲存功能

**功能說明：**
- 所有課表、打工班表和重要事件資料現在都會自動儲存在瀏覽器的 LocalStorage 中
- 資料會在關閉瀏覽器後保留，下次開啟時自動載入
- 為未來新增編輯功能奠定基礎

**技術實現：**
- 新增 `useLocalStorage` hook 用於管理本地儲存
- 新增 `useScheduleData` hook 提供統一的資料管理介面
- 所有頁面已更新為使用新的資料管理系統

**未來擴展：**
- 可以輕鬆新增「編輯課表」功能
- 支援匯入/匯出資料
- 支援多組資料切換（例如：上學期/下學期）

---

### 2. 📱 PWA (漸進式網頁應用) 支援

**功能說明：**
- 支援將應用「安裝」到手機或電腦主畫面
- 離線時仍可查看已快取的頁面
- 載入速度更快，體驗更接近原生 App

**如何安裝到主畫面：**

**手機 (Android/iOS):**
1. 使用 Chrome 或 Safari 開啟網頁
2. 點擊瀏覽器選單（三個點或分享按鈕）
3. 選擇「加入主畫面」或「Add to Home Screen」
4. 確認後，應用圖示會出現在桌面上

**電腦 (Chrome/Edge):**
1. 開啟網頁後，在網址列右側會出現「安裝」圖示
2. 點擊圖示並確認安裝
3. 應用會以獨立視窗開啟，體驗更佳

**技術實現：**
- 新增 `manifest.json` 定義應用資訊
- 新增 `sw.js` Service Worker 實現離線快取
- 新增 `PWAHandler` 元件自動註冊 Service Worker

---

### 3. 🌓 深色/淺色模式切換

**功能說明：**
- 一鍵切換深色或淺色主題
- 主題選擇會自動儲存，下次開啟時保持上次的設定
- 平滑的過渡動畫，視覺體驗更佳

**如何使用：**
1. 在導覽列最右側找到「太陽/月亮」圖示按鈕
2. 點擊按鈕即可切換主題
3. 深色模式：適合夜間使用，保護眼睛
4. 淺色模式：適合白天使用，清晰明亮

**技術實現：**
- 使用 CSS 變數實現主題切換
- 新增 `useTheme` hook 管理主題狀態
- 新增 `ThemeToggle` 元件提供切換按鈕
- 主題偏好儲存在 LocalStorage 中

---

## 🎯 使用建議

1. **首次使用：**
   - 建議先切換主題試試看，選擇最適合自己的模式
   - 在手機上將應用安裝到主畫面，使用更方便

2. **日常使用：**
   - 白天使用淺色模式
   - 晚上使用深色模式保護眼睛
   - 離線時也能查看已快取的課表

3. **未來功能預告：**
   - 通知提醒系統（上課前提醒）
   - 直接在網頁上編輯課表
   - 匯出課表到 Google Calendar
   - 資料視覺化圖表

---

## 📊 技術架構

### 新增檔案：
```
src/
├── hooks/
│   ├── useLocalStorage.ts      # LocalStorage 管理
│   ├── useScheduleData.ts      # 資料管理（課表、打工、事件）
│   └── useTheme.ts             # 主題管理
├── components/
│   ├── PWAHandler.tsx          # PWA Service Worker 註冊
│   ├── ThemeToggle.tsx         # 主題切換按鈕
│   └── ThemeToggle.module.css  # 主題切換按鈕樣式
public/
├── manifest.json               # PWA 應用資訊
└── sw.js                       # Service Worker (離線支援)
```

### 修改檔案：
- `src/app/layout.tsx` - 新增 PWA 和主題支援
- `src/app/page.tsx` - 使用新的資料管理
- `src/app/schedule/school/page.tsx` - 使用新的資料管理
- `src/app/schedule/work/page.tsx` - 使用新的資料管理
- `src/app/globals.css` - 新增淺色主題樣式
- `src/hooks/useHomeDashboard.ts` - 接受參數化資料
- `src/hooks/useWorkCalendar.ts` - 接受參數化資料
- `src/components/Navbar.tsx` - 加入主題切換按鈕

---

## 🚀 部署說明

執行以下指令即可部署更新：

```bash
npm run deploy
```

部署後，使用者需要：
1. 重新整理頁面（Ctrl/Cmd + Shift + R 強制重新整理）
2. 清除瀏覽器快取（如果主題切換未生效）

---

## 🔧 開發模式測試

```bash
# 本地開發
npm run dev

# 建置測試
npm run build
npm start
```

---

祝使用愉快！🎉
