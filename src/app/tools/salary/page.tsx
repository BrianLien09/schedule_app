'use client';
import SalaryCalculator from '@/components/salary/SalaryCalculator';
import { useAuth } from '@/context/AuthContext';
import LoginPrompt from '@/components/shared/LoginPrompt';
import { LoadingSpinner } from '@/components/shared/Loading';

export default function SalaryPage() {
  const { user, loading: authLoading } = useAuth();

  // 檢查登入狀態
  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPrompt />;
  }

  return <SalaryCalculator />;
}
