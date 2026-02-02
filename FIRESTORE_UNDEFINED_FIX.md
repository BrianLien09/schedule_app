# 🔧 Firestore Undefined 錯誤修正

## 問題描述

```
❌ 錯誤：Function addDoc() called with invalid data. 
Unsupported field value: undefined (found in field subtitle)
```

## 原因分析

Firestore 不允許欄位值為 `undefined`，必須是以下其中之一：
- 有效的值（string、number、boolean 等）
- `null`（明確表示空值）
- **不包含該欄位**（推薦做法）

## 解決方案

### 1. 新增 `cleanUndefined` 輔助函式

在 `src/services/firestoreService.ts` 新增：

```typescript
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

### 2. 更新 CRUD 方法

所有寫入 Firestore 的方法都使用 `cleanUndefined`：

```typescript
// addDocument
const cleanedData = cleanUndefined({
  ...data,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
const docRef = await addDoc(colRef, cleanedData);

// setDocument
const cleanedData = cleanUndefined({
  ...data,
  updatedAt: new Date().toISOString(),
});
await setDoc(docRef, cleanedData);

// updateDocument
const cleanedData = cleanUndefined({
  ...data,
  updatedAt: new Date().toISOString(),
});
await updateDoc(docRef, cleanedData);
```

### 3. 修正預設值產生器

`src/data/gameGuides.ts` 中的 `createDefaultGuide`：

```typescript
export const createDefaultGuide = (gameId: string, version?: string): Omit<GameGuide, 'id'> => {
  const now = new Date().toISOString();
  const guide: any = {
    gameId,
    title: '',
    url: '',
    category: '角色攻略',
    priority: 3,
    tags: [],
    completed: false,
    order: Date.now(),
    createdAt: now,
    updatedAt: now
  };
  
  // 只有在有值時才加入選填欄位
  if (version) {
    guide.version = version;
  }
  
  return guide as Omit<GameGuide, 'id'>;
};
```

### 4. 表單提交時清理空字串

`src/components/GuideEditForm.tsx`：

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 清理空字串
  const cleanedData: any = { ...formData };
  
  if (!cleanedData.subtitle?.trim()) {
    delete cleanedData.subtitle;
  }
  if (!cleanedData.resonanceCode?.trim()) {
    delete cleanedData.resonanceCode;
  }
  if (!cleanedData.version?.trim()) {
    delete cleanedData.version;
  }
  
  await onSave(cleanedData);
};
```

### 5. 資料遷移腳本調整

`src/app/games/migration/page.tsx`：

```typescript
// 通用連結
const guide: any = {
  gameId: game.id,
  title: link.title,
  url: link.url,
  category: '通用資源',
  priority: 3,
  tags: [],
  completed: false,
  order: Date.now() + guidesToMigrate.length,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 只有在有描述時才加入 subtitle
if (link.description) {
  guide.subtitle = link.description;
}

guidesToMigrate.push(guide);
```

## 測試驗證

修正後執行：

```bash
npm run build
```

應該會看到：
```
✓ Compiled successfully
✓ Generating static pages
```

## 最佳實踐

### ❌ 錯誤做法

```typescript
// 不要這樣做
{
  title: 'test',
  subtitle: undefined,  // ❌ Firestore 不允許
  url: ''
}
```

### ✅ 正確做法

```typescript
// 方案 1：不包含該欄位（推薦）
{
  title: 'test',
  url: ''
  // subtitle 完全不存在
}

// 方案 2：使用 null
{
  title: 'test',
  subtitle: null,  // ✅ 明確表示空值
  url: ''
}
```

## 注意事項

1. **TypeScript 型別定義**
   - 保持 `subtitle?: string`（選填）
   - 實際儲存時移除 undefined 值

2. **讀取資料**
   - Firestore 讀取時，不存在的欄位會自動變成 `undefined`
   - TypeScript 型別已正確標記為選填（`?:`）

3. **更新資料**
   - 使用 `updateDoc` 時同樣需要清理 undefined
   - 已在 `updateDocument` 函式中處理

## 相關檔案

修正涉及的檔案：
- ✅ `src/services/firestoreService.ts`
- ✅ `src/data/gameGuides.ts`
- ✅ `src/components/GuideEditForm.tsx`
- ✅ `src/app/games/migration/page.tsx`

## 完成狀態

所有修正已完成，現在可以：
- ✅ 新增攻略（含選填欄位）
- ✅ 修改攻略
- ✅ 執行資料遷移
- ✅ 正常儲存到 Firestore

問題已解決！🎉
