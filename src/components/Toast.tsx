'use client';

/**
 * Toast 通知元件
 * 
 * 顯示在畫面右上角，自動淡出。
 * 使用 Portal 確保不被其他元素遮蓋。
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/context/ToastContext';
import styles from './Toast.module.css';

/** 各類型對應的圖示 */
const TOAST_ICONS: Record<string, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Portal 需要等 DOM 就緒
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className={styles.container} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          role="alert"
        >
          <span className={styles.icon}>{TOAST_ICONS[toast.type]}</span>
          <span className={styles.message}>{toast.message}</span>
          <button
            className={styles.closeBtn}
            onClick={() => removeToast(toast.id)}
            aria-label="關閉通知"
          >
            ✕
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
