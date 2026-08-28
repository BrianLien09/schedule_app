'use client';

/**
 * Confirm Dialog 元件
 * 
 * 取代瀏覽器原生 confirm() 的自訂對話框。
 * 支援 Esc 關閉、點擊 overlay 關閉、danger 模式。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConfirm } from '@/context/ConfirmContext';
import styles from './ConfirmDialog.module.css';

const CONFIRM_EXIT_DURATION = 220;

export default function ConfirmDialog() {
  const { state, handleResponse } = useConfirm();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const restoreFocus = useCallback(() => {
    const previousFocus = previousFocusRef.current;
    previousFocusRef.current = null;

    if (previousFocus && document.contains(previousFocus)) {
      previousFocus.focus();
    }
  }, []);

  const requestResponse = useCallback((confirmed: boolean) => {
    if (!state.isOpen || isClosing) return;

    clearCloseTimer();
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setIsClosing(false);
      restoreFocus();
      handleResponse(confirmed);
    }, CONFIRM_EXIT_DURATION);
  }, [clearCloseTimer, handleResponse, isClosing, restoreFocus, state.isOpen]);

  useEffect(() => {
    if (!state.isOpen) {
      restoreFocus();
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    focusFrameRef.current = window.requestAnimationFrame(() => {
      confirmButtonRef.current?.focus();
      focusFrameRef.current = null;
    });

    return () => {
      if (focusFrameRef.current !== null) {
        window.cancelAnimationFrame(focusFrameRef.current);
        focusFrameRef.current = null;
      }
    };
  }, [restoreFocus, state.isOpen]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  // Esc 鍵關閉
  useEffect(() => {
    if (!state.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestResponse(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [requestResponse, state.isOpen]);

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
    <div
      className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ''}`}
      onClick={() => requestResponse(false)}
    >
      <div
        className={`glass ${styles.dialog} ${isClosing ? styles.dialogClosing : ''}`}
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
            onClick={() => requestResponse(false)}
          >
            {state.cancelText || '取消'}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`btn ${styles.confirmBtn} ${state.danger ? styles.danger : ''}`}
            onClick={() => requestResponse(true)}
            autoFocus
          >
            {state.confirmText || '確認'}
          </button>
        </div>
      </div>
    </div>
  );
}
