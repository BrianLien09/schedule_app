'use client';

/**
 * 全域 Toast 通知系統
 * 
 * 提供非阻斷式的操作回饋通知，取代所有 alert()。
 * 支援 success / error / warning / info 四種類型。
 * 
 * 使用方式：
 * ```tsx
 * const { toast } = useToast();
 * toast.success('儲存成功');
 * toast.error('操作失敗，請稍後再試');
 * toast.warning('注意：結束時間必須晚於開始時間');
 * toast.info('已複製到剪貼簿');
 * ```
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ========== 型別定義 ==========

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastActions {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

interface ToastContextType {
  toasts: ToastItem[];
  toast: ToastActions;
  removeToast: (id: string) => void;
}

// ========== Context ==========

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ========== Provider ==========

interface ToastProviderProps {
  children: ReactNode;
}

/** Toast 持續時間（毫秒） */
const TOAST_DURATION = 3500;

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      // 自動移除
      setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION);
    },
    [removeToast]
  );

  const toast: ToastActions = {
    success: useCallback((msg: string) => addToast(msg, 'success'), [addToast]),
    error: useCallback((msg: string) => addToast(msg, 'error'), [addToast]),
    warning: useCallback((msg: string) => addToast(msg, 'warning'), [addToast]),
    info: useCallback((msg: string) => addToast(msg, 'info'), [addToast]),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// ========== Hook ==========

/**
 * useToast Hook
 * 
 * 在任何元件中使用此 Hook 來顯示 Toast 通知。
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast 必須在 ToastProvider 內部使用');
  }
  return context;
}
