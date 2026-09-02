'use client';

import React, { useState } from 'react';
import styles from './FloatingQuickActions.module.css';

interface FloatingQuickActionsProps {
  onOpenQuickModal: (tab: 'allowance' | 'work') => void;
  onOpenCommandPalette: () => void;
}

export default function FloatingQuickActions({
  onOpenQuickModal,
  onOpenCommandPalette,
}: FloatingQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.floatingContainer}>
      <button
        type="button"
        className={`${styles.mainFab} ${isOpen ? styles.mainFabActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="快捷動作選單"
        aria-label={isOpen ? '關閉快捷動作選單' : '開啟快捷動作選單'}
        aria-expanded={isOpen}
        aria-controls="quick-actions-menu"
      >
        +
      </button>

      {isOpen && (
        <div id="quick-actions-menu" className={styles.menuList}>
          <button
            className={styles.menuItem}
            onClick={() => {
              onOpenQuickModal('allowance');
              setIsOpen(false);
            }}
          >
            <span className={styles.itemIcon}>💵</span>
            <span>記生活費</span>
          </button>

          <button
            className={styles.menuItem}
            onClick={() => {
              onOpenQuickModal('work');
              setIsOpen(false);
            }}
          >
            <span className={styles.itemIcon}>💼</span>
            <span>登記打工</span>
          </button>

          <button
            className={styles.menuItem}
            onClick={() => {
              onOpenCommandPalette();
              setIsOpen(false);
            }}
          >
            <span className={styles.itemIcon}>🔍</span>
            <span>全局搜尋 (Ctrl+K)</span>
          </button>
        </div>
      )}
    </div>
  );
}
