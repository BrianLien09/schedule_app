# 薪資統計獨立篩選與班別管理摺疊 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在薪資計算器中加入獨立的薪資統計篩選（預設本月），並讓班別管理區塊可摺疊收合。

**Architecture:** 在 `SalaryCalculator` 中新增 `statsFilter` 狀態與 `statsRecords` 資料來源，統計卡片與趨勢圖改用該資料；班別管理區塊改為 `<details>/<summary>` 以原生狀態控制展開。

**Tech Stack:** Next.js (App Router), React 19, TypeScript, CSS Variables, inline styles

---

## 檔案結構與責任
- 修改：`src/components/SalaryCalculator.tsx`
  - 新增統計篩選狀態與計算
  - 新增統計篩選按鈕 UI
  - 班別管理區塊改為可摺疊

## Task 1: 建立薪資統計獨立篩選狀態與資料流

**Files:**
- Modify: `src/components/SalaryCalculator.tsx`

- [ ] **Step 1: 寫入 `statsFilter` 狀態與快速選項**

```tsx
// 於 quickFilters 下方新增（或緊接 quickFilters 定義後）
const statsQuickFilters = useMemo(() => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthNum = today.getMonth() + 1;
  const currentMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastYear = lastMonthDate.getFullYear();
  const lastMonthNum = lastMonthDate.getMonth() + 1;
  const lastMonth = `${lastYear}-${String(lastMonthNum).padStart(2, '0')}`;

  return [
    { label: '全部', value: '', description: '顯示所有統計' },
    { label: '本月', value: currentMonth, description: '僅顯示本月統計' },
    { label: '上月', value: lastMonth, description: '僅顯示上月統計' },
  ];
}, []);

const [statsFilter, setStatsFilter] = useState<string>(() => {
  // 預設本月
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
});
```

- [ ] **Step 2: 建立 `statsRecords`**

```tsx
const statsRecords = useMemo(() => {
  if (!statsFilter) return records;
  return records.filter(record => record.date.startsWith(statsFilter));
}, [records, statsFilter]);
```

- [ ] **Step 3: 將統計計算改用 `statsRecords`**

```tsx
const statsTotalPay = useMemo(() => {
  return statsRecords.reduce((sum, record) => sum + calculatePay(record), 0);
}, [statsRecords]);

const statsTotalHours = useMemo(() => {
  return statsRecords.reduce((sum, r) => sum + calculateHours(r), 0);
}, [statsRecords]);

const statsAvgHourlyRate = useMemo(() => {
  if (statsTotalHours === 0) return 0;
  return Math.round(statsTotalPay / statsTotalHours);
}, [statsTotalPay, statsTotalHours]);

const statsWorkDays = useMemo(() => statsRecords.length, [statsRecords]);
```

- [ ] **Step 4: 將月度趨勢圖改用 `statsRecords`**

```tsx
const getMonthlyStats = (): MonthStats[] => {
  const statsMap = new Map<string, MonthStats>();

  statsRecords.forEach(record => {
    const month = record.date.slice(0, 7);
    const pay = calculatePay(record);
    const hours = calculateHours(record);

    if (!statsMap.has(month)) {
      statsMap.set(month, {
        month,
        totalPay: 0,
        totalHours: 0,
        recordCount: 0,
      });
    }

    const stats = statsMap.get(month)!;
    stats.totalPay += pay;
    stats.totalHours += hours;
    stats.recordCount += 1;
  });

  const today = new Date();
  const monthsList: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    monthsList.push(`${year}-${month}`);
  }

  return monthsList.map(month => {
    return statsMap.get(month) || {
      month,
      totalPay: 0,
      totalHours: 0,
      recordCount: 0,
    };
  });
};
```

- [ ] **Step 5: 更新統計卡片使用新變數**

```tsx
// 原本 totalPay/totalHours/avgHourlyRate/filteredRecords.length
// 替換為 statsTotalPay / statsTotalHours / statsAvgHourlyRate / statsWorkDays
```

- [ ] **Step 6: 執行 lint**

Run: `npm run lint`
Expected: ESLint pass

- [ ] **Step 7: Commit**

```bash
git add src/components/SalaryCalculator.tsx
git commit -m "feat: add independent salary stats filter"
```

## Task 2: 薪資統計 UI 按鈕群組

**Files:**
- Modify: `src/components/SalaryCalculator.tsx`

- [ ] **Step 1: 在薪資統計標題列加入按鈕群組**

```tsx
<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
  {statsQuickFilters.map(filter => (
    <button
      key={filter.value}
      onClick={() => setStatsFilter(filter.value)}
      style={{
        padding: '0.4rem 0.9rem',
        borderRadius: '8px',
        border: statsFilter === filter.value
          ? '2px solid var(--color-primary)'
          : '1px solid rgba(255,255,255,0.2)',
        background: statsFilter === filter.value
          ? 'rgba(139, 92, 246, 0.3)'
          : 'rgba(255,255,255,0.05)',
        color: statsFilter === filter.value
          ? 'var(--color-primary)'
          : 'var(--text-secondary)',
        fontWeight: statsFilter === filter.value ? '600' : '400',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: '0.85rem',
      }}
      title={filter.description}
    >
      {filter.label}
    </button>
  ))}
</div>
```

- [ ] **Step 2: 調整標題列佈局**

```tsx
// 在薪資統計標題列保持 justifyContent: 'space-between'
// 右側改成按鈕群組 + 現有顯示/隱藏按鈕
```

- [ ] **Step 3: 執行 lint**

Run: `npm run lint`
Expected: ESLint pass

- [ ] **Step 4: Commit**

```bash
git add src/components/SalaryCalculator.tsx
git commit -m "feat: add stats filter buttons"
```

## Task 3: 班別管理區塊摺疊

**Files:**
- Modify: `src/components/SalaryCalculator.tsx`

- [ ] **Step 1: 將班別管理容器改為 details/summary**

```tsx
<details className="glass no-print" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }} open>
  <summary style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--spacing-md)',
    cursor: 'pointer',
    listStyle: 'none',
  }}>
    <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>班別管理</h3>
    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>展開 / 收合</span>
  </summary>

  {/* 班別管理原本內容維持 */}
</details>
```

- [ ] **Step 2: 確保內容縮排與結構無變**

```tsx
// 將原本班別管理區塊的內容（含 loading、表單、列表）
// 移入 details 內，保持 DOM 結構與樣式一致
```

- [ ] **Step 3: 執行 lint**

Run: `npm run lint`
Expected: ESLint pass

- [ ] **Step 4: Commit**

```bash
git add src/components/SalaryCalculator.tsx
git commit -m "feat: make shift management collapsible"
```

## 自我審查（對照規格）
- 覆蓋：統計獨立篩選、預設本月、統計按鈕、統計計算改用 statsRecords、班別管理摺疊。
- 未覆蓋項：無。
- Placeholder 檢查：無 TBD/TODO。
- 型別一致性：`statsFilter` 仍為字串，與既有 `filterMonth` 相容。
