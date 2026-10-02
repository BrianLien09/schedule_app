'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const compact = pathname === '/' || pathname === '/schedule/overview';

  return (
    <div key={pathname} className={`page-transition${compact ? ' page-transition-compact' : ''}`}>
      {children}
    </div>
  );
}
