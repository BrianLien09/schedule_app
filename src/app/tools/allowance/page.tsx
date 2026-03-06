'use client';
import AllowanceManager from '@/components/AllowanceManager';
import { useAuth } from '@/context/AuthContext';
import LoginPrompt from '@/components/LoginPrompt';
import { LoadingSpinner } from '@/components/Loading';

export default function AllowancePage() {
  const { user, loading: authLoading } = useAuth();

  // 檢查登入狀態
  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPrompt />;
  }

  return <AllowanceManager />;
}
