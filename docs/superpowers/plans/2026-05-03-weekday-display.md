# 日期顯示週幾 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在新增與編輯工作紀錄的日期欄位右側顯示週幾文字。

**Architecture:** 在 `SalaryCalculator.tsx` 新增 `getWeekdayLabel` 工具函式，並於兩個日期輸入旁加入右側顯示區塊。日期更新時即時刷新顯示。

**Tech Stack:** Next.js App Router, React, TypeScript

---

## 檔案結構與責任
- `src/components/SalaryCalculator.tsx`: 日期欄位週幾顯示與小工具函式。

---

### Task 1: 新增週幾轉換函式

**Files:**
- Modify: `src/components/SalaryCalculator.tsx`

- [ ] **Step 1: Write the failing test**

本專案無測試框架，略過。

- [ ] **Step 2: Run test to verify it fails**

略過。

- [ ] **Step 3: Write minimal implementation**

新增工具函式：

```ts
const WEEKDAY_SHORT_LABELS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'] as const;

const getWeekdayLabel = (dateStr: string): string => {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '--';
  return WEEKDAY_SHORT_LABELS[date.getDay()] ?? '--';
};
```

- [ ] **Step 4: Run test to verify it passes**

略過。

- [ ] **Step 5: Commit**

```bash
git add src/components/SalaryCalculator.tsx
git commit -m "feat: add weekday label helper"
```

---

### Task 2: 新增與編輯日期欄位顯示週幾

**Files:**
- Modify: `src/components/SalaryCalculator.tsx`

- [ ] **Step 1: Write the failing test**

本專案無測試框架，略過。

- [ ] **Step 2: Run test to verify it fails**

略過。

- [ ] **Step 3: Write minimal implementation**

1) 新增工作紀錄日期欄位右側顯示：

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
  <input ... />
  <span style={{
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  }}>
    {getWeekdayLabel(currentRecord.date)}
  </span>
</div>
```

2) 編輯工作紀錄日期欄位右側顯示：

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
  <input ... />
  <span style={{
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.7)',
    whiteSpace: 'nowrap',
  }}>
    {getWeekdayLabel(editingRecord.date)}
  </span>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

略過。

- [ ] **Step 5: Commit**

```bash
git add src/components/SalaryCalculator.tsx
git commit -m "feat: show weekday next to date inputs"
```

---

### Task 3: 手動驗證

**Files:**
- None

- [ ] **Step 1: 手動驗證清單**

1. `npm run dev`
2. 新增工作紀錄：切換日期，週幾同步更新
3. 編輯工作紀錄：切換日期，週幾同步更新
4. 清空日期：顯示 `--`

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "test: verify weekday display"
```

---

## 計畫自我審查
- 規格涵蓋：右側顯示、格式、無效日期顯示。
- 無 TODO/TBD 占位。
- 命名一致：`getWeekdayLabel`。
