# 薪資統計預設全部 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將薪資統計預設範圍改為全部資料。

**Architecture:** 在 `SalaryCalculator` 中調整 `statsFilter` 初始值為空字串，統計資料流沿用既有 `statsRecords` 邏輯不變。

**Tech Stack:** Next.js (App Router), React 19, TypeScript

---

## 檔案結構與責任
- 修改：`src/components/SalaryCalculator.tsx`
  - 調整 `statsFilter` 初始值

### Task 1: 調整薪資統計預設範圍

**Files:**
- Modify: `src/components/SalaryCalculator.tsx`

- [ ] **Step 1: 更新 `statsFilter` 初始值**

```tsx
const [statsFilter, setStatsFilter] = useState<string>(() => {
  return '';
});
```

- [ ] **Step 2: 執行 lint**

Run: `npm run lint`
Expected: ESLint pass

- [ ] **Step 3: Commit**

```bash
git add src/components/SalaryCalculator.tsx
git commit -m "feat: default stats filter to all"
```

## 自我審查（對照規格）
- 覆蓋：`statsFilter` 初始值為全部、UI 預設高亮「全部」。
- 未覆蓋項：無。
- Placeholder 檢查：無 TBD/TODO。
- 型別一致性：沿用既有字串型別。
