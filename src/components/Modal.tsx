'use client';

import { useEffect, useCallback, useRef } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  /** 控制 Modal 是否顯示 */
  isOpen: boolean;
  /** 關閉 Modal 的 callback */
  onClose: () => void;
  /** Modal 標題 */
  title: string;
  /** Modal 內容 */
  children: React.ReactNode;
  /** 自訂最大寬度（預設 500px） */
  maxWidth?: string;
  /** 額外的 className 給 dialog 容器 */
  className?: string;
}

/**
 * 統一 Modal 基礎元件
 *
 * 提供一致的 overlay、dialog、header、Esc 關閉、
 * 點擊外部關閉、body scroll lock 等行為。
 * 三個 Editor 元件皆使用此基礎元件。
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px',
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Esc 鍵關閉
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 開啟時鎖定 body 捲動
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        className={`glass ${styles.dialog} ${className || ''}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="關閉"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
