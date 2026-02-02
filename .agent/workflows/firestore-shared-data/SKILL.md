---
name: firestore-shared-data
description: 設計和實作 Firebase/Firestore「白名單 + 共用資料」權限架構。解決家庭或小團隊共用資料時的路徑設計、Security Rules 設定、資料遷移與權限除錯等問題。適用於需要多人共用同一份資料的場景。
---

# Firestore 共用資料架構專家

## 🎯 核心能力

當使用者遇到以下情況時，你應該主動使用這個 Skill：

1. **設定 Firestore Security Rules**
   - 實作白名單權限控制
   - 設定家庭/團隊成員共用資料
   - 配置 Firebase Console 的 Rules

2. **修正 Firestore 路徑錯誤**
   - 診斷「奇數段路徑」錯誤（最常見的坑）
   - 修正 `Invalid document reference` 錯誤
   - 重構資料路徑結構

3. **資料遷移**
   - 從個人資料路徑 (`/users/{uid}/`) 遷移到共用路徑 (`/shared/data/`)
   - 批次複製資料
   - 驗證遷移完整性

4. **權限除錯**
   - 診斷 `permission-denied` 錯誤
   - 驗證 Email 白名單設定
   - 測試 Security Rules

5. **架構設計**
   - 設計共用資料的 Collection 結構
   - 規劃權限控制策略
   - 提供前端程式碼實作建議

---

## 📚 關鍵知識點

### 1. **Firestore 路徑規則（最重要！）**

```
❌ 錯誤（奇數段）：
/shared/courses/{docId}           → 3 段，會報錯！

✅ 正確（偶數段）：
/shared/data/courses/{docId}      → 4 段，正確！
```

**規則**：Firestore 路徑必須是 `collection/document/collection/document...` 的偶數段結構。

---

### 2. **共用資料架構**

```
Firestore Database
└── /shared (collection)
    └── /data (document)
        ├── /courses (sub-collection) - 課程資料
        ├── /workShifts (sub-collection) - 打工班表
        ├── /events (sub-collection) - 重要事件
        └── /salaryRecords (sub-collection) - 薪資記錄
```

**特點**：
- 所有白名單成員共用同一份資料
- 無需複雜的跨使用者資料讀取邏輯
- 適合家庭或小團隊使用

---

### 3. **Firestore Security Rules 範本**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // 共用資料路徑：所有子路徑都適用
    match /shared/{document=**} {
      // 必須登入 且 Email 在白名單內
      allow read, write: if request.auth != null && 
          request.auth.token.email in [
              'member1@gmail.com',
              'member2@gmail.com',
              'member3@gmail.com'
          ];
    }
    
    // 禁止存取其他路徑
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**關鍵語法**：
- `{document=**}` - 匹配所有子路徑
- `request.auth != null` - 使用者必須已登入
- `request.auth.token.email` - 取得登入使用者的 Email
- `in [...]` - 檢查 Email 是否在白名單中

---

### 4. **前端程式碼實作**

在 `src/services/firestoreService.ts` 中：

```typescript
export function getUserCollection(userId: string, collectionName: string) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase 未設定，請檢查環境變數');
  }
  // 共用資料路徑：/shared/data/{collectionName}
  return collection(db, 'shared', 'data', collectionName);
}
```

**重點**：
- 使用 `collection(db, 'shared', 'data', collectionName)` 確保偶數段
- `userId` 參數保留但不使用（向後相容）
- 所有 CRUD 操作都會使用這個路徑

---

## 🔧 工作流程

當使用者請求協助時，請按照以下流程執行：

### **步驟 1：診斷現況**

詢問或檢查以下資訊：
1. 目前遇到什麼問題？（路徑錯誤 / 權限錯誤 / 需要設定 Rules）
2. 專案是否已初始化 Firebase？
3. 資料是否已存在？（如果是，需要遷移）
4. 有多少位使用者需要存取？

### **步驟 2：提供解決方案**

根據問題類型提供對應方案：

#### **情況 A：奇數段路徑錯誤**

**症狀**：
```
Invalid document reference. Document references must have 
an even number of segments, but shared/courses has 3.
```

**解決方案**：
1. 檢查 `firestoreService.ts` 中的路徑結構
2. 將路徑從 `/shared/{collection}` 改為 `/shared/data/{collection}`
3. 更新所有使用該路徑的程式碼

**提供的程式碼**：
```typescript
// 修改前（錯誤）
return collection(db, 'shared', collectionName);

// 修改後（正確）
return collection(db, 'shared', 'data', collectionName);
```

---

#### **情況 B：permission-denied 錯誤**

**症狀**：
```
FirebaseError: [code=permission-denied]: 
Missing or insufficient permissions.
```

**可能原因**：
1. Firestore Rules 未設定
2. Email 不在白名單中
3. Rules 尚未發布

**解決方案**：
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇專案 → Firestore Database → 規則
3. 貼上 Security Rules 範本（記得替換 Email）
4. 點選「發布」按鈕
5. 等待 5-10 秒讓規則生效
6. 重新整理應用程式

---

#### **情況 C：需要設定白名單**

**互動流程**：

1. **詢問白名單成員**：
   > 請提供需要存取系統的成員 Email 地址（Gmail）：

2. **生成 Security Rules**：
   ```javascript
   allow read, write: if request.auth != null && 
       request.auth.token.email in [
           'user1@gmail.com',
           'user2@gmail.com'
           // ... 使用者提供的 Email
       ];
   ```

3. **提供完整設定步驟**：
   - Firebase Console 操作步驟
   - 驗證方法
   - 測試建議

---

#### **情況 D：資料遷移**

**從個人資料遷移到共用資料**：

1. **備份資料**（非常重要！）
   ```typescript
   // 匯出現有資料到 JSON
   const backup = await getDocuments(userId, 'courses');
   console.log(JSON.stringify(backup, null, 2));
   ```

2. **批次複製到新路徑**
   ```typescript
   import { batchSetDocuments } from '@/services/firestoreService';
   
   // 複製到共用路徑
   await batchSetDocuments('shared', 'courses', oldData);
   await batchSetDocuments('shared', 'workShifts', oldShifts);
   ```

3. **驗證資料完整性**
   - 檢查文件數量是否一致
   - 抽樣檢查資料內容
   - 測試 CRUD 操作

4. **清理舊資料**（確認無誤後）
   ```typescript
   await clearCollection(userId, 'courses');
   ```

---

### **步驟 3：驗證與測試**

提供以下驗證 Checklist：

#### ✅ **白名單成員測試**
- [ ] 使用白名單中的 Google 帳號登入
- [ ] 嘗試讀取資料（應該成功）
- [ ] 嘗試新增資料（應該成功）
- [ ] 嘗試編輯資料（應該成功）
- [ ] 嘗試刪除資料（應該成功）

#### ❌ **未授權使用者測試**
- [ ] 使用不在白名單中的 Google 帳號登入
- [ ] 嘗試讀取資料（應該失敗，顯示空白或錯誤）
- [ ] 檢查瀏覽器 Console（應該顯示 `permission-denied`）

#### 🔍 **路徑驗證**
- [ ] 在 Firebase Console 檢查資料路徑
- [ ] 確認路徑為 `/shared/data/{collection}/{docId}`
- [ ] 確認所有文件都在正確位置

---

## 🐛 常見錯誤與解決方案

### 錯誤 1：奇數段路徑
```
Error: Invalid document reference. Document references must 
have an even number of segments
```
**解決**：檢查所有 `collection()` 和 `doc()` 呼叫，確保路徑段數為偶數。

---

### 錯誤 2：權限被拒
```
FirebaseError: [code=permission-denied]
```
**檢查清單**：
1. Firestore Rules 是否已發布？
2. Email 是否在白名單中？（大小寫一致？）
3. 使用者是否已登入？
4. 路徑是否正確？

---

### 錯誤 3：資料找不到
```
資料為空，但應該要有資料
```
**可能原因**：
1. 路徑錯誤（查看 Firebase Console 的實際路徑）
2. Rules 阻擋（檢查 Console 的錯誤訊息）
3. 資料尚未寫入

---

### 錯誤 4：Rules 設定後沒生效
**解決方案**：
1. 確認已點選「發布」按鈕
2. 等待 5-10 秒
3. 清除瀏覽器快取並重新整理
4. 檢查 Firebase Console 的「規則」分頁，確認最新版本

---

## 📋 輸出格式

當提供解決方案時，請使用以下結構：

### 1. **問題診斷**
- 問題類型：[路徑錯誤 / 權限錯誤 / 設定需求 / 資料遷移]
- 錯誤訊息：[貼上完整錯誤訊息]
- 影響範圍：[前端 / 後端 / Rules]

### 2. **解決方案**
- **程式碼修改**（如果需要）
  - 檔案路徑與行號
  - 修改前後對照
  - 詳細說明

- **Firebase Console 操作**（如果需要）
  - 逐步操作指引
  - 截圖提示（描述應該看到什麼）

- **驗證步驟**
  - 如何確認修改成功
  - 預期結果

### 3. **完整範例**

如果是設定 Rules，提供完整的可複製程式碼：

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /shared/{document=**} {
      allow read, write: if request.auth != null && 
          request.auth.token.email in [
              // 替換為實際的 Email
              'example@gmail.com'
          ];
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. **注意事項**
- ⚠️ 重要提醒（例如：記得備份資料）
- 💡 最佳實踐建議
- 🔗 相關文件連結

---

## 🎓 教學重點

在協助使用者時，確保他們理解以下核心概念：

### 1. **為什麼路徑必須是偶數段？**
> Firestore 的資料模型是 Collection → Document → Collection → Document... 的階層結構。每一層都必須明確指定，所以路徑段數必須是偶數。

### 2. **為什麼選擇共用資料而非個人資料？**
> 共用資料適合家庭或小團隊，所有人都平等存取同一份資料，無需複雜的權限邏輯或資料同步機制。如果需要個人隱私資料，應該改用 `/users/{uid}/` 路徑。

### 3. **為什麼 Rules 在後端而非前端？**
> 前端的權限檢查可以被繞過（使用者可以修改 JavaScript），真正的安全必須由後端（Firestore Rules）保證。前端檢查只是為了 UX，不是為了安全。

### 4. **為什麼 Email 白名單在 Rules 而非程式碼？**
> 避免敏感資訊（Email 清單）暴露在前端程式碼中。Rules 在 Firebase 後端執行，更安全且修改無需重新部署應用程式。

---

## 🔗 相關資源

當提供解決方案時，可以附上以下參考連結：

- [Firebase Security Rules 官方文件](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore 資料模型](https://firebase.google.com/docs/firestore/data-model)
- [Rules 測試模擬器](https://firebase.google.com/docs/rules/simulator)
- [常見 Rules 範例](https://firebase.google.com/docs/firestore/security/rules-examples)

---

## ⚠️ 重要提醒

1. **備份優先**：任何資料遷移前務必備份
2. **測試 Rules**：修改 Rules 後務必測試白名單和非白名單使用者
3. **權限最小化**：只給予必要的權限
4. **定期檢查**：定期檢查白名單，移除不再需要的成員
5. **避免硬編碼**：不要在前端程式碼中硬編碼 Email 或 UID

---

## 🎯 成功標準

協助完成後，使用者應該：

✅ 理解 Firestore 路徑的偶數段規則  
✅ 能夠正確設定 Security Rules  
✅ 知道如何在 Firebase Console 操作  
✅ 能夠診斷常見的權限錯誤  
✅ 理解共用資料的優缺點  
✅ 知道如何驗證設定是否正確  

---

**記住**：這個 Skill 的目標是幫助使用者建立安全、可靠、易維護的共用資料架構。不只是解決眼前的問題，更要讓使用者理解背後的原理，避免未來再次犯錯。
