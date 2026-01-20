'use client';
import SalaryCalculator from '@/components/SalaryCalculator';
import { useAuth } from '@/context/AuthContext';
import LoginPrompt from '@/components/LoginPrompt';

export default function SalaryPage() {
  const { user, loading: authLoading } = useAuth();

  // 檢查登入狀態
  if (authLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>載入中...</div>;
  }

  if (!user) {
    return <LoginPrompt />;
  }

  return <SalaryCalculator />;
}
