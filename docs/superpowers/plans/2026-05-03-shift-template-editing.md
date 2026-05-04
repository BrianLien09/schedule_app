# 班別管理編輯模式 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在薪資計算的班別管理中加入編輯模式，使用既有表單完成更新。

**Architecture:** 在 `SalaryCalculator.tsx` 內新增編輯狀態與表單模式切換，班別列表提供「編輯」入口並將資料帶入表單，更新時沿用 `updateTemplate` 並處理預設衝突。

**Tech Stack:** Next.js App Router, React, TypeScript, Firebase Firestore

---

## 檔案結構與責任
- `src/components/SalaryCalculator.tsx`: 編輯模式 UI/狀態、更新流程、權限與提示。

---

### Task 1: 加入編輯狀態與表單模式切換

**Files:**
- Modify: `src/components/SalaryCalculator.tsx`

- [ ] **Step 1: Write the failing test**

本專案無測試框架，略過。

- [ ] **Step 2: Run test to verify it fails**

略過。

- [ ] **Step 3: Write minimal implementation**

1) 新增編輯狀態：

```ts
const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
```

2) 進入編輯模式函式（由列表按鈕觸發）：

```ts
const handleStartEditTemplate = (template: ShiftTemplate) => {
  if (!canEditTemplates) {
    toast.warning('目前沒有編輯班別的權限');
    return;
  }

  setEditingTemplateId(template.id);
  setNewTemplate({
    name: template.name,
    weekday: template.weekday,
    startTime: template.startTime,
    endTime: template.endTime,
    workHours: template.workHours ?? 0,
    hourlyRate: template.hourlyRate,
    isDefault: template.isDefault,
  });
};
```

3) 取消編輯：

```ts
const resetTemplateForm = () => {
  setEditingTemplateId(null);
  setNewTemplate({
    name: '',
    weekday: 1,
    startTime: '09:00',
    endTime: '17:00',
    workHours: 8,
    hourlyRate: 200,
    isDefault: false,
  });
};
```

4) 表單顯示編輯提示與取消按鈕：

```tsx
{editingTemplateId && (
  <div style={{
    marginBottom: 'var(--spacing-md)',
    color: 'var(--text-secondary)',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  }}>
    <span>正在編輯：{newTemplate.name || '未命名班別'}</span>
    <button onClick={resetTemplateForm} style={{ ... }}>
      取消編輯
    </button>
  </div>
)}
```

5) 表單按鈕文字切換：

```tsx
<button ...>
  {editingTemplateId ? '更新班別' : '新增班別'}
</button>
```

- [ ] **Step 4: Run test to verify it passes**

略過。

- [ ] **Step 5: Commit**

```bash
git add src/components/SalaryCalculator.tsx
git commit -m "feat: add shift template edit mode"
```

---

### Task 2: 更新流程與預設衝突規則

**Files:**
- Modify: `src/components/SalaryCalculator.tsx`

- [ ] **Step 1: Write the failing test**

本專案無測試框架，略過。

- [ ] **Step 2: Run test to verify it fails**

略過。

- [ ] **Step 3: Write minimal implementation**

1) 將 `handleCreateTemplate` 改為兼容更新：

```ts
const handleSaveTemplate = async () => {
  if (!newTemplate.name.trim()) {
    toast.warning('班別名稱不可為空');
    return;
  }

  if (!canEditTemplates) {
    toast.warning('目前沒有編輯班別的權限');
    return;
  }

  if (newTemplate.isDefault) {
    const sameWeekdayDefaults = templates.filter(
      template => template.weekday === newTemplate.weekday && template.isDefault
    );
    for (const template of sameWeekdayDefaults) {
      if (template.id !== editingTemplateId) {
        await updateTemplate(template.id, { isDefault: false });
      }
    }
  }

  if (editingTemplateId) {
    await updateTemplate(editingTemplateId, {
      ...newTemplate,
    });
    resetTemplateForm();
    return;
  }

  const template: ShiftTemplate = {
    ...newTemplate,
    id: generateShiftTemplateId(),
    createdAt: Date.now(),
  };
  await addTemplate(template);
  resetTemplateForm();
};
```

2) 按鈕 onClick 改用 `handleSaveTemplate`。

3) 列表每列新增「編輯」按鈕：

```tsx
<button onClick={() => handleStartEditTemplate(template)} ...>
  編輯
</button>
```

- [ ] **Step 4: Run test to verify it passes**

略過。

- [ ] **Step 5: Commit**

```bash
git add src/components/SalaryCalculator.tsx
git commit -m "feat: enable editing shift templates"
```

---

### Task 3: 手動驗證

**Files:**
- None

- [ ] **Step 1: 手動驗證清單**

1. `npm run dev`
2. 點班別列表的「編輯」→ 表單進入編輯模式
3. 修改欄位後更新 → 列表同步
4. 取消編輯 → 表單回復新增模式
5. 改成預設班別 → 同星期只剩一個預設

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "test: verify shift template editing"
```

---

## 計畫自我審查
- 規格涵蓋：編輯入口、表單模式切換、預設衝突、權限限制。
- 無 TODO/TBD 占位。
- 命名一致：`editingTemplateId`、`handleSaveTemplate`。
