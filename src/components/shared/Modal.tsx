'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

// 必須與 Modal.module.css 的離場動畫時間一致，否則元件會在動畫播完前被移除
const MODAL_EXIT_DURATION = 260;

const ModalCloseContext = createContext<(() => void) | null>(null);

interface ModalProps {
  /** 控制 Modal 是否顯示 */
  isOpen: boolean;
  /** 關閉 Modal 的 callback */
  onClose: () => void;
  /** Modal 標題 */
  title: string;
  /** Modal 內容 */
  children: ReactNode;
  /** 是否播放彈出動畫；在同一位置切換內容（例如切換表單類型）時設為 false，改以內容淡入過渡 */
  animateIn?: boolean;
  /** 標題列右側（關閉鈕左邊）的額外控制項，例如類型切換 */
  headerExtra?: ReactNode;
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
  headerExtra,
  animateIn = true,
  maxWidth = '500px',
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const titleId = useId();
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

  const requestClose = useCallback(() => {
    if (!isOpen || isClosing) return;

    clearCloseTimer();
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setIsClosing(false);
      restoreFocus();
      onClose();
    }, MODAL_EXIT_DURATION);
  }, [clearCloseTimer, isClosing, isOpen, onClose, restoreFocus]);

  // 開啟時保存觸發元素並把焦點移入 Modal；外部關閉時也還原焦點。
  useEffect(() => {
    if (!isOpen) {
      restoreFocus();
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    focusFrameRef.current = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
      focusFrameRef.current = null;
    });

    return () => {
      if (focusFrameRef.current !== null) {
        window.cancelAnimationFrame(focusFrameRef.current);
        focusFrameRef.current = null;
      }
    };
  }, [isOpen, restoreFocus]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  // Esc 鍵關閉
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
        return;
      }

      // 焦點陷阱：Tab 只在 Modal 內循環，避免鍵盤使用者跑到被遮住的背景
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, requestClose]);

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

  return createPortal(
    <div
      className={`${styles.overlay} ${animateIn ? '' : styles.overlayStatic} ${isClosing ? styles.overlayClosing : ''}`}
      onClick={requestClose}
    >
      <div
        ref={dialogRef}
        className={`glass ${styles.dialog} ${animateIn ? '' : styles.dialogSwap} ${isClosing ? styles.dialogClosing : ''} ${className || ''}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <div className={styles.headerActions}>
            {headerExtra}
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.closeButton}
              onClick={requestClose}
              aria-label="關閉"
            >
              ✕
            </button>
          </div>
        </div>
        <ModalCloseContext.Provider value={requestClose}>
          {children}
        </ModalCloseContext.Provider>
      </div>
    </div>,
    document.body
  );
}

interface ModalContentProps {
  render: (requestClose: () => void) => ReactNode;
}

/** 在 Modal 內容樹中取得具備離場動畫的關閉函式。 */
export function ModalContent({ render }: ModalContentProps) {
  const requestClose = useContext(ModalCloseContext);

  if (!requestClose) {
    throw new Error('ModalContent 必須放在 Modal 元件內');
  }

  return render(requestClose);
}
