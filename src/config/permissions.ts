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
 * 個人資料的寫入由 Firestore Rules 限制為使用者自己的 UID；
 * 此函數只負責控制介面是否顯示編輯操作，不能取代 Rules 的安全性。
 */
export function hasWriteAccess(email: string | null | undefined): boolean {
  return isAuthenticated(email);
}

/**
 * 遊戲攻略由管理帳號維護，其他家庭成員保留共用讀取權限。
 * 這只控制前端介面；真正的寫入限制必須同步設定在 Firestore Rules。
 */
export function hasGameGuideWriteAccess(email: string | null | undefined): boolean {
  return email?.toLowerCase() === 'brianlien09@gmail.com';
}

/**
 * 只有指定家庭帳號需要把打工資料同步到 family-web。
 */
export function getFamilyWebTitlePrefix(email: string | null | undefined): string | null {
  const normalizedEmail = email?.trim().toLowerCase();

  if (normalizedEmail === 'brianlien09@gmail.com') return '百頁';
  if (normalizedEmail === 'lovesweet95170@gmail.com') return '布丁';
  return null;
}

export function hasFamilyWebSyncAccess(email: string | null | undefined): boolean {
  return getFamilyWebTitlePrefix(email) !== null;
}
