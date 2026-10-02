'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAgendaData } from '@/hooks/useAgendaData';
import WeeklyAgenda from '@/components/schedule/overview/WeeklyAgenda';
import LoginPrompt from '@/components/shared/LoginPrompt';
import { LoadingSpinner } from '@/components/shared/Loading';
import { localDateKey } from '@/utils/agenda';

function ScheduleOverviewContent() {
  const { user, loading: authLoading } = useAuth();
  const data = useAgendaData();
  const searchParams = useSearchParams();
  const date = searchParams.get('date');
  const parsed = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : undefined;
  const initialDate = parsed && !Number.isNaN(parsed.getTime()) && localDateKey(parsed) === date ? parsed : undefined;
  if (authLoading) return <LoadingSpinner />;
  if (!user) return <LoginPrompt />;
  return <WeeklyAgenda key={date ?? 'current'} {...data} initialDate={initialDate} />;
}

export default function ScheduleOverviewPage() {
  return <Suspense fallback={<LoadingSpinner />}><ScheduleOverviewContent /></Suspense>;
}
