# 打工月曆詳細列表箭頭與間距 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「本月詳細列表」右側加入 chevron 指示收合狀態，並讓標題列與卡片區間距增加 8px。

**Architecture:** 以 CSS 偽元素或額外 span 顯示 chevron，配合 `[open]` 切換方向；調整詳細列表內容的 margin 來增加間距。

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules

---

## 檔案結構與責任
- 修改 `src/app/schedule/work/page.tsx`：加入 chevron 標籤位置（與「展開/收合」同列）。
- 修改 `src/app/schedule/work/page.module.css`：新增 chevron 樣式與間距調整。

---

### Task 1: 加入 chevron 元素並與狀態同步

**Files:**
- Modify: `src/app/schedule/work/page.tsx`

- [ ] **Step 1: 在 summary 右側加入 chevron span**

將 summary 右側切換區塊改為以下結構：

```tsx
<span className={styles.detailsToggle}>
  <span className={styles.detailsChevron} aria-hidden="true" />
  <span className={styles.detailsToggleClosed}>展開</span>
  <span className={styles.detailsToggleOpen}>收合</span>
</span>
```

- [ ] **Step 2: 手動驗證（UI）**

操作：
1. 點擊「本月詳細列表」。
2. 觀察 chevron 是否在收合/展開切換方向。

預期：收合向右、展開向下。

- [ ] **Step 3: Commit**

```bash
git add src/app/schedule/work/page.tsx
git commit -m "feat(work): add details chevron"
```

---

### Task 2: 新增 chevron 樣式與間距調整

**Files:**
- Modify: `src/app/schedule/work/page.module.css`

- [ ] **Step 1: 新增 chevron 樣式**

加入以下樣式：

```css
.detailsToggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.detailsChevron {
  width: 0.5rem;
  height: 0.5rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(-45deg);
  transition: transform 0.2s ease;
  opacity: 0.7;
}

.detailsSection[open] .detailsChevron {
  transform: rotate(45deg);
}
```

- [ ] **Step 2: 詳細列表內容間距增加 8px**

將 `.detailsContent` 的 `margin-top` 設為 `1.5rem`（原本為 `1rem`）：

```css
.detailsContent {
  margin-top: 1.5rem;
}
```

- [ ] **Step 3: 手動驗證（UI）**

操作：
1. 檢視標題列與卡片區間距是否增加約 8px。
2. 確認 chevron 顯示清楚且方向切換。

預期：間距增加，視覺不擁擠。

- [ ] **Step 4: Commit**

```bash
git add src/app/schedule/work/page.module.css
git commit -m "style(work): add details chevron and spacing"
```

---

## 規格覆蓋檢查
- chevron 指示收合狀態：Task 1、Task 2 完成。
- 標題列與卡片區間距增加 8px：Task 2 完成。

---

## 注意事項
- 專案目前無測試框架；依 AGENTS.md 指示，以手動 UI 驗證為主。
