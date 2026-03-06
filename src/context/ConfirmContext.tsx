'use client';

/**
 * 全域 Confirm Dialog 系統
 * 
 * 提供自訂的確認對話框，取代瀏覽器原生 confirm()。
 * 支援自訂標題、訊息、按鈕文字和危險模式。
 * 
 * 使用方式：
 * ```tsx
 * const { confirm } = useConfirm();
 * 
 * const confirmed = await confirm({
 *   title: '刪除課程',
 *   message: '確定要刪除「資料結構」嗎？此操作無法復原。',
 *   confirmText: '刪除',
 *   danger: true,
 * });
 * 
 * if (confirmed) {
 *   // 使用者按了確認
 * }
 * ```
 */

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

// ========== 型別定義 ==========

interface ConfirmOptions {
  /** 對話框標題 */
  title?: string;
  /** 訊息內容 */
  message: string;
  /** 確認按鈕文字（預設「確認」） */
  confirmText?: string;
  /** 取消按鈕文字（預設「取消」） */
  cancelText?: string;
  /** 是否為危險操作（會將確認按鈕改為紅色） */
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
}

interface ConfirmContextType {
  /** 非同步確認函數，回傳 true 表示使用者按了確認 */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** 當前對話框狀態（給 ConfirmDialog 元件用） */
  state: ConfirmState;
  /** 處理使用者回應 */
  handleResponse: (confirmed: boolean) => void;
}

// ========== Context ==========

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

// ========== Provider ==========

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
  });

  // 用 ref 保存 resolve 函數，避免 state 競爭
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        ...options,
      });
    });
  }, []);

  const handleResponse = useCallback((confirmed: boolean) => {
    setState((prev) => ({ ...prev, isOpen: false }));
    if (resolveRef.current) {
      resolveRef.current(confirmed);
      resolveRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, state, handleResponse }}>
      {children}
    </ConfirmContext.Provider>
  );
}

// ========== Hook ==========

/**
 * useConfirm Hook
 * 
 * 在任何元件中使用此 Hook 來顯示確認對話框。
 * 回傳一個 Promise，resolve 為 true/false。
 */
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm 必須在 ConfirmProvider 內部使用');
  }
  return context;
}
