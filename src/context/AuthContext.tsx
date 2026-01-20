'use client';

/**
 * Authentication Context
 * 
 * 提供全域的身份驗證狀態管理，包含：
 * - 使用者登入/登出狀態
 * - Google 登入功能
 * - 使用者資訊 (UID, Email, DisplayName, PhotoURL)
 * 
 * 使用方式：
 * ```tsx
 * const { user, loading, signInWithGoogle, signOut } = useAuth();
 * ```
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * AuthContext 的值型別定義
 */
interface AuthContextType {
  /** 當前登入的使用者，未登入時為 null */
  user: User | null;
  /** 是否正在載入驗證狀態 */
  loading: boolean;
  /** Google 登入方法 */
  signInWithGoogle: () => Promise<void>;
  /** 登出方法 */
  signOut: () => Promise<void>;
}

/**
 * 建立 AuthContext
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider 元件
 * 
 * 包裹在應用程式最外層，提供全域的身份驗證狀態。
 * 會自動監聽 Firebase Auth 狀態變化。
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 監聽 Firebase Auth 狀態變化
   * 
   * 當使用者登入/登出時，Firebase 會自動觸發回呼函數。
   * 這確保了即使使用者重新整理頁面，登入狀態也能保持。
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // 清理函數：元件卸載時取消監聽
    return () => unsubscribe();
  }, []);

  /**
   * Google 登入
   * 
   * 使用 Firebase 提供的 Google OAuth 登入流程。
   * 會彈出 Google 登入視窗，使用者選擇帳號後完成登入。
   */
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // 設定為繁體中文介面
      provider.setCustomParameters({
        prompt: 'select_account', // 每次都顯示帳號選擇畫面
      });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google 登入失敗:', error);
      throw error;
    }
  };

  /**
   * 登出
   * 
   * 清除 Firebase Auth 的登入狀態。
   */
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('登出失敗:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * 
 * 在任何元件中使用此 Hook 來存取身份驗證狀態。
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, signInWithGoogle, signOut } = useAuth();
 *   
 *   if (loading) return <div>載入中...</div>;
 *   
 *   if (!user) {
 *     return <button onClick={signInWithGoogle}>登入</button>;
 *   }
 *   
 *   return (
 *     <div>
 *       <p>歡迎，{user.displayName}</p>
 *       <button onClick={signOut}>登出</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必須在 AuthProvider 內部使用');
  }
  return context;
}
