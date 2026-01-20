/**
 * 權限配置檔案（簡化版）
 * 
 * 權限控制已由 Firestore Security Rules 處理：
 * - 只有白名單中的 Email 可以通過 Firestore Rules
 * - 前端只需檢查使用者是否已登入
 * 
 * 白名單設定位置：Firebase Console > Firestore Database > Rules
 */

/**
 * 檢查使用者是否已登入
 * 
 * 因為 Firestore Rules 已經控制權限，前端只需確認使用者已登入即可。
 * 未在白名單中的使用者會在存取 Firestore 時被拒絕。
 */
export function isAuthenticated(email: string | null | undefined): boolean {
  return Boolean(email);
}

/**
 * 檢查使用者是否有讀取權限
 * 
 * 實際權限由 Firestore Rules 控制，此函數僅用於 UI 層級的檢查。
 * 如果使用者能成功登入，就表示他在白名單中。
 */
export function hasReadAccess(email: string | null | undefined): boolean {
  return isAuthenticated(email);
}

/**
 * 檢查使用者是否有寫入權限
 * 
 * 因為採用共用資料策略，所有白名單使用者都有寫入權限。
 * 實際權限由 Firestore Rules 控制。
 */
export function hasWriteAccess(email: string | null | undefined): boolean {
  return isAuthenticated(email);
}
