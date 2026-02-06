# 課程筆記系統 - 功能說明

## 📝 功能概述

課程筆記系統是 Schedule App 的全新功能，讓你可以為每堂課記錄筆記、作業和考試資訊。所有資料即時同步到 Firestore，支援多裝置存取。

---

## ✨ 核心功能

### 1. 筆記類型
- **📝 筆記**：課堂筆記、重點整理
- **📚 作業**：作業內容、繳交日期
- **📝 考試**：考試資訊、考試日期

### 2. 筆記內容支援
- **Markdown 格式**：支援粗體、斜體、標題、程式碼、項目符號
- **Markdown 工具列**：一鍵插入格式（粗體、斜體、標題、程式碼）
- **即時預覽**：展開筆記後查看格式化內容

### 3. 管理功能
- ✅ **完成標記**：勾選完成的作業/考試
- 🏷️ **標籤系統**：自訂標籤分類筆記
- ⚡ **優先級**：低/中/高三種優先級
- 📅 **到期日期**：作業/考試到期提醒
- 🔍 **類型篩選**：快速篩選筆記類型

### 4. 整合功能
- 📊 **課程關聯**：筆記自動關聯到對應課程
- 🔔 **筆記數量標記**：課表顯示筆記數量
- 🎨 **玻璃擬態設計**：符合 App 整體風格

---

## 🎯 使用方式

### 在課表頁面新增筆記
1. 進入「學校課表」頁面（`/schedule/school`）
2. 滑鼠移到課程卡片上，點擊 📝 按鈕
3. 在彈出的編輯器中填寫筆記資訊
4. 點擊「新增」儲存

### 編輯/刪除筆記
1. 在課表頁面下方的「📝 課程筆記」區塊
2. 點擊筆記卡片的 ✏️ 編輯或 🗑️ 刪除按鈕
3. 編輯完成後點擊「更新」

### 查看筆記內容
1. 點擊筆記標題或「展開 ▼」按鈕
2. 查看格式化後的 Markdown 內容
3. 點擊「收合 ▲」隱藏內容

### 篩選筆記
1. 在筆記列表上方選擇篩選類型
2. 「全部」、「📝 筆記」、「📚 作業」、「📝 考試」

---

## 📐 資料結構

```typescript
interface CourseNote {
  id: string;
  courseId: string;        // 關聯課程 ID
  courseName: string;      // 課程名稱
  type: 'note' | 'homework' | 'exam';
  title: string;           // 標題
  content: string;         // 內容（Markdown）
  dueDate?: string;        // 到期日期（ISO 8601）
  completed: boolean;      // 完成狀態
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];         // 標籤
  createdAt: string;       // 建立時間
  updatedAt: string;       // 更新時間
}
```

---

## 🔧 技術實作

### 檔案結構
```
src/
├── data/courseNotes.ts                # 型別定義
├── services/firestoreService.ts       # Firestore CRUD 方法
├── hooks/useCourseNotes.ts            # 狀態管理 Hook
├── components/
│   ├── CourseNoteEditor.tsx           # 編輯器元件
│   ├── CourseNoteEditor.module.css
│   ├── CourseNoteList.tsx             # 列表元件
│   └── CourseNoteList.module.css
└── app/schedule/school/page.tsx       # 課表頁面整合
```

### Firestore 路徑
```
/shared/data/courseNotes/{noteId}
```

### 新增的 Firestore 方法
- `getAllCourseNotes()` - 取得所有筆記
- `getCourseNotesByCourse(courseId)` - 取得特定課程的筆記
- `subscribeToCourseNotes(callback)` - 訂閱所有筆記
- `subscribeToCourseNotesByCourse(courseId, callback)` - 訂閱特定課程筆記
- `addCourseNote(note)` - 新增筆記
- `updateCourseNote(noteId, updates)` - 更新筆記
- `deleteCourseNote(noteId)` - 刪除筆記
- `toggleCourseNoteCompletion(noteId, completed)` - 切換完成狀態
- `getIncompleteTasks()` - 取得未完成的作業/考試

---

## 🎨 UI 設計特色

### 編輯器 (CourseNoteEditor)
- ✨ 全螢幕 Modal 設計
- 🎯 類型快速切換按鈕
- 🛠️ Markdown 工具列
- 🎨 優先級顏色標示
- 📱 響應式設計（手機適配）

### 列表 (CourseNoteList)
- 🎴 卡片式設計
- 🏷️ 類型顏色標籤
- ⏰ 到期日期智慧顯示（「今天」、「明天」、「X 天後」）
- ⚠️ 過期警告（紅色邊框）
- ✅ 完成狀態視覺化（半透明 + 刪除線）
- 📖 展開/收合內容

---

## 🚀 後續優化方向

### 短期（1-2 週）
1. **搜尋功能**：全文搜尋筆記內容
2. **匯出功能**：匯出為 PDF/Markdown
3. **通知提醒**：作業/考試到期前提醒

### 中期（1 個月）
1. **圖片上傳**：整合 Firebase Storage
2. **筆記分享**：生成分享連結
3. **版本歷史**：查看筆記修改記錄

### 長期（3 個月）
1. **AI 摘要**：自動生成筆記摘要
2. **語音筆記**：語音轉文字功能
3. **協作編輯**：多人即時編輯

---

## 📊 效能指標

- ✅ **建置成功**：無 TypeScript 錯誤
- ✅ **即時同步**：Firestore `onSnapshot` 即時更新
- ✅ **型別安全**：100% TypeScript 覆蓋
- ✅ **響應式**：支援桌面/平板/手機

---

## 🔒 資料安全

- ✅ **權限控制**：Firestore Security Rules 白名單機制
- ✅ **資料驗證**：清理 `undefined` 值
- ✅ **錯誤處理**：完整的 try-catch 包裹

---

**建立日期**: 2026-02-07  
**版本**: v1.0.0  
**狀態**: ✅ 已完成並通過建置測試
