# 打工月曆提示區標題列右側 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將打工月曆提示區移至「本月詳細列表」標題列右側並維持同一行顯示，桌機與手機皆適用。

**Architecture:** 以現有頁面結構為基礎，移動提示區 DOM 位置並縮短文案；使用 CSS 讓標題列與提示同一行，並針對小螢幕縮小字級與內距。

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules

---

## 檔案結構與責任
- 修改 `src/app/schedule/work/page.tsx`：移除原提示區，改放到詳細列表標題列右側。
- 修改 `src/app/schedule/work/page.module.css`：新增標題列排版與提示樣式，調整手機字級與內距。

---

### Task 1: 調整提示區 DOM 位置與文案

**Files:**
- Modify: `src/app/schedule/work/page.tsx`

- [ ] **Step 1: 移除原提示區並加入標題列右側提示**

將原本位於「功能提示」的區塊移除，並在詳細列表標題列加入提示：

```tsx
<div className={styles.detailsHeader}>
  <h3 className={styles.sectionTitle}>本月詳細列表</h3>
  <div className={styles.hintsInline}>
    <span className={styles.hintInline}>拖曳複製</span>
    <span className={styles.hintDivider}>/</span>
    <span className={styles.hintInline}>Ctrl多選</span>
    <span className={styles.hintDivider}>/</span>
    <span className={styles.hintInline}>點擊新增</span>
  </div>
</div>
```

- [ ] **Step 2: 手動驗證（UI）**

操作：
1. 桌機與手機開啟打工月曆頁面。
2. 確認提示區出現在「本月詳細列表」標題列右側且同一行。
3. 確認原本提示區不再顯示。

預期：提示文字清楚可讀，且不影響月曆互動。

- [ ] **Step 3: Commit**

```bash
git add src/app/schedule/work/page.tsx
git commit -m "feat(work): move hints to details header"
```

---

### Task 2: 新增標題列排版與提示樣式

**Files:**
- Modify: `src/app/schedule/work/page.module.css`

- [ ] **Step 1: 新增標題列與提示樣式**

加入以下樣式：

```css
.detailsHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.hintsInline {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--muted);
  white-space: nowrap;
}

.hintInline {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.6);
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
}

.hintDivider {
  opacity: 0.6;
}

@media (max-width: 768px) {
  .hintsInline {
    font-size: 0.7rem;
    gap: 0.3rem;
  }

  .hintInline {
    padding: 0.1rem 0.35rem;
    border-radius: 5px;
  }
}
```

- [ ] **Step 2: 移除舊提示區樣式**

刪除以下樣式區塊：

```css
.hints { ... }
.hint { ... }
:global([data-theme="dark"]) .hint { ... }
```

- [ ] **Step 3: 手動驗證（UI）**

操作：
1. 確認詳細列表標題列與提示同一行。
2. 手機字級與內距縮小，仍可讀。

預期：提示不換行、且不影響詳細列表收合/顯示。

- [ ] **Step 4: Commit**

```bash
git add src/app/schedule/work/page.module.css
git commit -m "style(work): add inline hints styling"
```

---

## 規格覆蓋檢查
- 提示區移到標題列右側同一行：Task 1、Task 2 完成。
- 手機同一行顯示：Task 2 手機樣式完成。
- 原提示區移除：Task 1、Task 2 完成。

---

## 注意事項
- 專案目前無測試框架；依 AGENTS.md 指示，以手動 UI 驗證為主。
