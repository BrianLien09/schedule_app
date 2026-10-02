import { BriefcaseIcon, CalendarIcon, SchoolIcon } from '@/components/shared/Icons';
import type { AgendaKind } from '@/utils/agenda';

interface AgendaIconProps {
  kind: AgendaKind | 'clock' | 'next' | 'tasks';
  size?: number;
}

export default function AgendaIcon({ kind, size = 20 }: AgendaIconProps) {
  if (kind === 'class') return <SchoolIcon size={size} />;
  if (kind === 'work') return <BriefcaseIcon size={size} />;
  if (kind === 'event') return <CalendarIcon size={size} />;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'clock' ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> :
      kind === 'next' ? <><path d="M4 12h15m-6-6 6 6-6 6" /><path d="M4 6v12" /></> :
        kind === 'exam' ? <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6m-6 4h6m-6 4h3" /></> :
          <><rect x="4" y="4" width="16" height="17" rx="2" /><path d="M9 3h6v3H9zM8 12l2 2 5-5m-7 9h8" /></>}
  </svg>;
}
