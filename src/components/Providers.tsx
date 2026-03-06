'use client';

/**
 * Client-side Providers 包裝元件
 * 
 * 將所有需要 client-side 的 Context Provider 集中管理。
 * 在 layout.tsx 中使用，避免 layout 本身需要 'use client'。
 */

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import ToastContainer from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          {children}
          <ToastContainer />
          <ConfirmDialog />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
