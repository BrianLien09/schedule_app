# 打工月曆完整月一屏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓打工月曆在手機與桌機一屏顯示整月，日期格維持正方形，詳細列表預設收合。

**Architecture:** 以 CSS `aspect-ratio` 讓日期格固定為正方形，移除固定高度依賴；以原生 `<details>/<summary>` 實作「本月詳細列表」收合，不新增狀態管理。

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules

---

## 檔案結構與責任
- 修改 `src/app/schedule/work/page.tsx`：將「本月詳細列表」改為可收合區塊（`details/summary`），維持原列表內容。
- 修改 `src/app/schedule/work/page.module.css`：
  - 日期格與空白格套用 `aspect-ratio: 1`，移除固定高度。
  - 新增收合區塊的樣式（summary 排版、展開/收合字樣顯示）。

---

### Task 1: 「本月詳細列表」改為可收合

**Files:**
- Modify: `src/app/schedule/work/page.tsx`

- [ ] **Step 1: 以 `<details>/<summary>` 包裝詳細列表**

將原本的「詳細列表」區塊替換為以下結構：

```tsx
<details className={styles.detailsSection}>
  <summary className={styles.detailsSummary}>
    <span className={styles.sectionTitle}>本月詳細列表</span>
    <span className={styles.detailsToggle}>
      <span className={styles.detailsToggleClosed}>展開</span>
      <span className={styles.detailsToggleOpen}>收合</span>
    </span>
  </summary>
  <div className={styles.detailsContent}>
    <div className={styles.shiftsGrid}>
      {currentMonthShifts.map((shift: WorkShift) => {
        const isSelected = selectedDate === shift.date;
        return (
          <div
            key={shift.id}
            data-date={shift.date}
            className={`${styles.shiftCard} ${isSelected ? styles.shiftCardSelected : styles.shiftCardNormal}`}
          >
            <div className={styles.shiftDate}>{shift.date.split('-')[2]}日</div>
            <div className={styles.shiftDetails}>
              <div className={styles.shiftName}>{shift.note}</div>
              <div className={styles.shiftTime}>
                {shift.startTime} - {shift.endTime}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</details>
```

- [ ] **Step 2: 手動驗證（UI）**

操作：
1. 開啟打工月曆頁面。
2. 確認「本月詳細列表」預設收合。
3. 點擊標題列可展開/收合，內容顯示正常。

預期：不影響月曆互動（點擊、拖曳、多選）。

- [ ] **Step 3: Commit**

```bash
git add src/app/schedule/work/page.tsx
git commit -m "feat(work): make monthly details collapsible"
```

---

### Task 2: 日期格改為正方形並縮短高度

**Files:**
- Modify: `src/app/schedule/work/page.module.css`

- [ ] **Step 1: 套用 `aspect-ratio: 1`，移除固定高度依賴**

調整以下樣式（保留其餘設定不變）：

```css
.emptyCell {
  aspect-ratio: 1;
  min-height: 0;
}

.dayCell {
  aspect-ratio: 1;
  min-height: 0;
}
```

若需要保留小螢幕內距，可維持既有 `@media (max-width: 768px)` 的 padding 設定，不再設定 `aspect-ratio` 重複規則。

- [ ] **Step 2: 加入收合區塊樣式**

新增以下樣式：

```css
.detailsSection {
  margin-top: 2rem;
}

.detailsSummary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  cursor: pointer;
  list-style: none;
}

.detailsSummary::-webkit-details-marker {
  display: none;
}

.detailsToggle {
  font-size: 0.9rem;
  color: var(--muted);
}

.detailsToggleOpen {
  display: none;
}

.detailsSection[open] .detailsToggleOpen {
  display: inline;
}

.detailsSection[open] .detailsToggleClosed {
  display: none;
}

.detailsContent {
  margin-top: 1rem;
}
```

- [ ] **Step 3: 手動驗證（UI）**

操作：
1. 桌機與手機各檢視一個月份。
2. 確認月曆日期格為正方形，且整月在一屏內可見。
3. 展開「本月詳細列表」後，列表仍可正常顯示。

預期：不影響班次卡片樣式與可讀性。

- [ ] **Step 4: Commit**

```bash
git add src/app/schedule/work/page.module.css
git commit -m "style(work): square calendar cells"
```

---

## 規格覆蓋檢查
- 一屏顯示整月：Task 2 透過 `aspect-ratio` 與移除固定高度達成。
- 正方形日期格：Task 2 完成。
- 詳細列表可收合且預設收合：Task 1 完成。

---

## 注意事項
- 專案目前無測試框架；依 AGENTS.md 指示，以手動 UI 驗證為主。
