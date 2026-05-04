# 薪資計算班別模板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在薪資計算中提供可重用的班別模板，並依星期規則自動套用到空白新增與打工月曆匯入。

**Architecture:** 以新 Hook `useShiftTemplates` 管理 `/shared/data/shiftTemplates`，在 `SalaryCalculator` 內查詢與套用班別模板規則。班別管理 UI 置於薪資計算頁，與既有新增表單並列。

**Tech Stack:** Next.js App Router, React, TypeScript, Firebase Firestore, CSS Modules

---

## 檔案結構與責任
- `src/hooks/useShiftTemplates.ts`: 班別模板資料存取與即時同步。
- `src/data/shiftTemplates.ts`: 班別模板型別與工具（產生 ID、排序）。
- `src/components/SalaryCalculator.tsx`: 新增班別管理 UI、套用規則、匯入邏輯。
- `src/components/SalaryCalculator.module.css` 或既有樣式檔：班別管理 UI 樣式（若目前使用 inline style，先沿用）。

---

### Task 1: 新增班別模板型別與工具

**Files:**
- Create: `src/data/shiftTemplates.ts`

- [ ] **Step 1: Write the failing test**

本專案無測試框架，略過。

- [ ] **Step 2: Run test to verify it fails**

略過。

- [ ] **Step 3: Write minimal implementation**

在 `src/data/shiftTemplates.ts` 新增型別與工具函數：

```ts
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=日, 6=六

export interface ShiftTemplate {
  id: string;
  name: string;
  weekday: Weekday;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  hourlyRate: number;
  isDefault: boolean;
  createdAt: number;
}

export function generateShiftTemplateId(): string {
  return `shift-template-${Date.now()}`;
}

export function sortShiftTemplatesByPriority(templates: ShiftTemplate[]): ShiftTemplate[] {
  return [...templates].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

略過。

- [ ] **Step 5: Commit**

```bash
git add src/data/shiftTemplates.ts
git commit -m "feat: add shift template types"
```

---

### Task 2: 建立 useShiftTemplates Hook

**Files:**
- Create: `src/hooks/useShiftTemplates.ts`

- [ ] **Step 1: Write the failing test**

本專案無測試框架，略過。

- [ ] **Step 2: Run test to verify it fails**

略過。

- [ ] **Step 3: Write minimal implementation**

建立與 `useSalaryData`/`useAllowanceData` 同風格的 Hook：

```ts
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
} from '@/services/firestoreService';
import { hasWriteAccess } from '@/config/permissions';
import type { ShiftTemplate } from '@/data/shiftTemplates';
import { sortShiftTemplatesByPriority } from '@/data/shiftTemplates';

const SHARED_DATA_PATH = 'shared';
const SHIFT_TEMPLATES_COLLECTION = 'shiftTemplates';

export function useShiftTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      setCanEdit(false);
      return;
    }

    setLoading(true);
    setCanEdit(hasWriteAccess(user.email));

    const unsubscribe = subscribeToCollection<ShiftTemplate>(
      SHARED_DATA_PATH,
      SHIFT_TEMPLATES_COLLECTION,
      (data) => {
        setTemplates(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const sortedTemplates = useMemo(() => {
    return sortShiftTemplatesByPriority(templates);
  }, [templates]);

  const addTemplate = async (template: ShiftTemplate) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }
    await setDocument(SHARED_DATA_PATH, SHIFT_TEMPLATES_COLLECTION, template.id, template);
  };

  const updateTemplate = async (id: string, updates: Partial<ShiftTemplate>) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }
    await updateDocument(SHARED_DATA_PATH, SHIFT_TEMPLATES_COLLECTION, id, updates);
  };

  const deleteTemplate = async (id: string) => {
    if (!user || !canEdit) {
      console.warn('❌ 無編輯權限');
      return;
    }
    await deleteDocument(SHARED_DATA_PATH, SHIFT_TEMPLATES_COLLECTION, id);
  };

  return {
    templates: sortedTemplates,
    loading,
    canEdit,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

略過。

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useShiftTemplates.ts
git commit -m "feat: add shift template data hook"
```

---

### Task 3: 薪資頁班別管理 UI 與資料串接

**Files:**
- Modify: `src/components/SalaryCalculator.tsx`

- [ ] **Step 1: Write the failing test**

本專案無測試框架，略過。

- [ ] **Step 2: Run test to verify it fails**

略過。

- [ ] **Step 3: Write minimal implementation**

1) 引入 Hook 與型別：

```ts
import { useShiftTemplates } from '@/hooks/useShiftTemplates';
import { generateShiftTemplateId, type ShiftTemplate, type Weekday } from '@/data/shiftTemplates';
```

2) 加入狀態：

```ts
const { templates, addTemplate, updateTemplate, deleteTemplate } = useShiftTemplates();
const [newTemplate, setNewTemplate] = useState<Omit<ShiftTemplate, 'id' | 'createdAt'>>({
  name: '',
  weekday: 1,
  startTime: '09:00',
  endTime: '17:00',
  hourlyRate: 200,
  isDefault: false,
});
```

3) 新增新增/編輯/刪除函數（含預設班別唯一性）：

```ts
const handleCreateTemplate = async () => {
  if (!newTemplate.name.trim()) {
    toast.warning('班別名稱不可為空');
    return;
  }

  if (newTemplate.isDefault) {
    const sameWeekday = templates.filter(t => t.weekday === newTemplate.weekday && t.isDefault);
    for (const item of sameWeekday) {
      await updateTemplate(item.id, { isDefault: false });
    }
  }

  const template: ShiftTemplate = {
    ...newTemplate,
    id: generateShiftTemplateId(),
    createdAt: Date.now(),
  };

  await addTemplate(template);
  setNewTemplate({
    name: '',
    weekday: 1,
    startTime: '09:00',
    endTime: '17:00',
    hourlyRate: 200,
    isDefault: false,
  });
};
```

4) UI 區塊插入在「新增工作記錄」表單上方或下方：

```tsx
<div className="glass no-print" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
    班別管理
  </h3>

  {/* 新增班別 */}
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
    <input ... />
    <select ... />
    <input type="time" ... />
    <input type="time" ... />
    <input type="number" ... />
    <label>預設班別 <input type="checkbox" ... /></label>
  </div>
  <button onClick={handleCreateTemplate}>新增班別</button>

  {/* 班別列表 */}
  <div style={{ marginTop: 'var(--spacing-lg)' }}>
    {templates.length === 0 ? (
      <div style={{ color: 'var(--text-secondary)' }}>尚未建立班別</div>
    ) : (
      templates.map(t => (
        <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 'var(--spacing-sm)' }}>
          <div>{t.name}</div>
          <div>{weekdayLabel(t.weekday)}</div>
          <div>{t.startTime} - {t.endTime}</div>
          <div>${t.hourlyRate}</div>
          <button onClick={() => updateTemplate(t.id, { isDefault: true })}>設為預設</button>
          <button onClick={() => deleteTemplate(t.id)}>刪除</button>
        </div>
      ))
    )}
  </div>
</div>
```

> `weekdayLabel` 可用簡單陣列對應：`['日','一','二','三','四','五','六']`。

- [ ] **Step 4: Run test to verify it passes**

略過。

- [ ] **Step 5: Commit**

```bash
git add src/components/SalaryCalculator.tsx
git commit -m "feat: add shift template management UI"
```

---

### Task 4: 空白新增自動套用班別

**Files:**
- Modify: `src/components/SalaryCalculator.tsx`

- [ ] **Step 1: Write the failing test**

本專案無測試框架，略過。

- [ ] **Step 2: Run test to verify it fails**

略過。

- [ ] **Step 3: Write minimal implementation**

1) 新增工具函數：

```ts
const getWeekday = (dateStr: string): Weekday => {
  const date = new Date(dateStr);
  return date.getDay() as Weekday;
};

const pickTemplateForDate = (dateStr: string): ShiftTemplate | undefined => {
  const weekday = getWeekday(dateStr);
  return templates.find(t => t.weekday === weekday);
};
```

2) 在日期變更時自動套用：

```ts
useEffect(() => {
  const template = pickTemplateForDate(currentRecord.date);
  if (!template) return;

  const hours = calculateWorkHoursFromTimes(template.startTime, template.endTime);

  setCurrentRecord(prev => ({
    ...prev,
    startTime: template.startTime,
    endTime: template.endTime,
    hourlyRate: template.hourlyRate,
  }));
  setWorkHours(hours.toString());
}, [currentRecord.date, templates]);
```

> 為避免覆寫使用者剛手動修改的欄位，可在 state 加入 `lastAppliedTemplateId`，只有日期變更時才套用。

- [ ] **Step 4: Run test to verify it passes**

略過。

- [ ] **Step 5: Commit**

```bash
git add src/components/SalaryCalculator.tsx
git commit -m "feat: auto-apply shift template on date change"
```

---

### Task 5: 打工月曆匯入時套用班別

**Files:**
- Modify: `src/components/SalaryCalculator.tsx`

- [ ] **Step 1: Write the failing test**

本專案無測試框架，略過。

- [ ] **Step 2: Run test to verify it fails**

略過。

- [ ] **Step 3: Write minimal implementation**

在 `handleImportFromWorkShifts` 內，建立紀錄時優先使用班別模板：

```ts
const template = pickTemplateForDate(shift.date);
const startTime = template?.startTime ?? shift.startTime;
const endTime = template?.endTime ?? shift.endTime;
const hourlyRate = template?.hourlyRate ?? 200;
const hours = calculateWorkHoursFromTimes(startTime, endTime);

return {
  id: `shift-${shift.id}-${Date.now()}`,
  date: shift.date,
  startTime,
  endTime,
  workHours: hours,
  role: 'assistant' as RoleType,
  hourlyRate,
  shiftCategory: shift.note || '',
  workShiftId: shift.id,
};
```

- [ ] **Step 4: Run test to verify it passes**

略過。

- [ ] **Step 5: Commit**

```bash
git add src/components/SalaryCalculator.tsx
git commit -m "feat: apply shift templates during import"
```

---

### Task 6: 手動驗證

**Files:**
- None

- [ ] **Step 1: 手動驗證清單**

1. `npm run dev`
2. 薪資計算頁新增班別模板（含預設）
3. 空白新增：變更日期，確認自動套用
4. 匯入打工月曆：確認時間/時薪套用
5. 同星期多班別：確認預設優先

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "test: verify shift template workflow"
```

---

## 計畫自我審查
- 規格涵蓋：資料模型、班別管理 UI、空白新增與匯入自動套用、優先順序。
- 無 TODO/TBD 占位。
- 型別與函式命名一致。
