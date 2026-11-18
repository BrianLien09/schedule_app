import { useEffect, useRef, type RefObject } from 'react';

/**
 * 浮動面板的關閉行為：點面板與觸發按鈕以外的地方、或按 Esc 就收合。
 * 為什麼只給浮動面板用：行內面板本來就推開版面、不會蓋住其他欄位；浮在欄位上方的面板若點外面不會關，
 * 使用者會以為下方的欄位壞掉了。
 */
export function useDismissOnOutside(ref: RefObject<HTMLElement | null>, isActive: boolean, onDismiss: () => void): void {
  // 用 ref 保存最新的 callback，呼叫端傳行內箭頭函式時才不會每次重繪都重新掛監聽
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!isActive) return;
    const handlePointer = (event: PointerEvent): void => {
      if (event.target instanceof Node && ref.current && !ref.current.contains(event.target)) dismissRef.current();
    };
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') dismissRef.current();
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ref, isActive]);
}
