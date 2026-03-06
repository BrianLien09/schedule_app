'use client';

/**
 * Confirm Dialog 元件
 * 
 * 取代瀏覽器原生 confirm() 的自訂對話框。
 * 支援 Esc 關閉、點擊 overlay 關閉、danger 模式。
 */

import { useEffect } from 'react';
import { useConfirm } from '@/context/ConfirmContext';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog() {
  const { state, handleResponse } = useConfirm();

  // Esc 鍵關閉
  useEffect(() => {
    if (!state.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleResponse(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen, handleResponse]);

  // 開啟時鎖定 body 滾動
  useEffect(() => {
    if (state.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [state.isOpen]);

  if (!state.isOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => handleResponse(false)}>
      <div
        className={`glass ${styles.dialog}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        {state.title && (
          <h2 id="confirm-title" className={styles.title}>
            {state.title}
          </h2>
        )}
        <p id="confirm-message" className={styles.message}>
          {state.message}
        </p>
        <div className={styles.actions}>
          <button
            className={`btn ${styles.cancelBtn}`}
            onClick={() => handleResponse(false)}
          >
            {state.cancelText || '取消'}
          </button>
          <button
            className={`btn ${styles.confirmBtn} ${state.danger ? styles.danger : ''}`}
            onClick={() => handleResponse(true)}
            autoFocus
          >
            {state.confirmText || '確認'}
          </button>
        </div>
      </div>
    </div>
  );
}
