'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Course, Event, WorkShift } from '@/data/schedule';
import type { AgendaTask } from '@/data/todos';
import { AGENDA_LABELS, addCalendarDays, agendaHref, buildAgenda, getWeekDays, localDateKey, type AgendaKind } from '@/utils/agenda';
import styles from './WeeklyAgenda.module.css';
import AgendaIcon from './AgendaIcon';
import DataReadError from '@/components/shared/DataReadError';

interface WeeklyAgendaProps {
  courses: Course[]; shifts: WorkShift[]; events: Event[]; notes: AgendaTask[];
  now: Date; loading: boolean; notesLoading: boolean; initialDate?: Date; notesError: string | null;
  loadError?: string | null;
}

type AgendaFilter = 'all' | 'class' | 'work' | 'event' | 'tasks';
const FILTERS: Array<{ value: AgendaFilter; label: string }> = [
  { value: 'all', label: '全部' }, { value: 'class', label: '課程' },
  { value: 'work', label: '打工' }, { value: 'event', label: '事件' }, { value: 'tasks', label: '待辦／作業' },
];
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export default function WeeklyAgenda({ courses, shifts, events, notes, now, loading, loadError, notesLoading, initialDate, notesError }: WeeklyAgendaProps) {
  const [anchor, setAnchor] = useState(initialDate ?? now);
  const [selectedDay, setSelectedDay] = useState(((initialDate ?? now).getDay() + 6) % 7);
  const [filter, setFilter] = useState<AgendaFilter>('all');
  const days = useMemo(() => getWeekDays(anchor), [anchor]);
  const agenda = useMemo(() => buildAgenda(days, courses, shifts, events, notes), [days, courses, shifts, events, notes]);
  const matches = (kind: AgendaKind): boolean => filter === 'all' || (filter === 'tasks' ? kind === 'homework' || kind === 'exam' || kind === 'todo' : kind === filter);
  const start = days[0];
  const end = days[6];
  const isLoading = loading || ((filter === 'all' || filter === 'tasks') && notesLoading);

  return <div className={styles.page}>
    <header className={`${styles.header} page-section-enter`}><div className={styles.headingGroup}><span className={styles.headerIcon} aria-hidden="true"><AgendaIcon kind="event" size={24} /></span><div><p className={styles.eyebrow}>{start.getFullYear()} 年</p><h1>整合週視圖</h1></div></div><Link className={styles.backLink} href="/">返回總覽</Link></header>
    <section className={`${styles.workspace} page-section-enter page-section-enter-delay-1`}>
      <div className={styles.toolbar}>
        <div className={styles.weekNav}>
          <button onClick={() => setAnchor((date) => addCalendarDays(date, -7))} aria-label="上一週">← 上週</button>
          <h2 aria-live="polite">{start.getMonth() + 1}/{start.getDate()} — {end.getMonth() + 1}/{end.getDate()}</h2>
          <button onClick={() => setAnchor((date) => addCalendarDays(date, 7))} aria-label="下一週">下週 →</button>
          <button onClick={() => { setAnchor(now); setSelectedDay((now.getDay() + 6) % 7); }}>本週</button>
        </div>
        <div className={styles.filters} aria-label="行程類型">{FILTERS.map((entry) => <button key={entry.value} aria-pressed={filter === entry.value} className={filter === entry.value ? styles.active : ''} onClick={() => setFilter(entry.value)}>{entry.label}</button>)}</div>
      </div>

      <div className={styles.dayPicker} aria-label="選擇日期">{days.map((day, index) => <button key={localDateKey(day)} aria-pressed={selectedDay === index} className={selectedDay === index ? styles.active : ''} onClick={() => setSelectedDay(index)}><span>週{WEEKDAYS[index]}</span><strong>{day.getDate()}</strong></button>)}</div>

      {notesError && <p className={styles.empty} role="alert">部分待辦讀取失敗，其他行程仍可查看。<button onClick={() => window.location.reload()}>重新讀取</button></p>}
      <DataReadError message={loadError} />

      {isLoading ? <p className={styles.empty}>週行程載入中…</p> : <div className={styles.weekGrid} key={`${localDateKey(start)}-${filter}-${selectedDay}`}>
        {days.map((day, index) => {
          const key = localDateKey(day);
          const dayItems = agenda.filter((item) => item.date === key && matches(item.kind));
          const today = key === localDateKey(now);
          return <section key={key} className={`${styles.day} ${index === selectedDay ? styles.selectedDay : ''} ${today ? styles.today : ''}`} aria-label={`${day.getMonth() + 1}月${day.getDate()}日週${WEEKDAYS[index]}`}>
            <h3><span>週{WEEKDAYS[index]}</span><span>{day.getMonth() + 1}/{day.getDate()}{today && <small>今天</small>}</span></h3>
            {dayItems.length ? <ul className={styles.list}>{dayItems.map((item) => <li key={item.id} className={styles.item}>
              <p className={styles.time}>{item.startTime ? `${item.startTime}${item.endTime ? `–${item.endTime}` : ''}` : item.kind === 'homework' || item.kind === 'exam' || item.kind === 'todo' ? item.kind === 'todo' ? '全天' : '截止日' : '全天'}</p>
              <span className={`${styles.kind} ${item.kind === 'work' ? styles.work : item.kind === 'homework' || item.kind === 'exam' || item.kind === 'todo' ? styles.task : ''}`}><span aria-hidden="true"><AgendaIcon kind={item.kind} size={15} /></span>{AGENDA_LABELS[item.kind]}</span>
              {item.kind === 'event' ? <strong className={styles.title}>{item.title}</strong> : <Link className={styles.title} href={agendaHref(item)}>{item.title}</Link>}
              {item.detail && <p className={styles.detail}>{item.detail}</p>}
            </li>)}</ul> : <p className={styles.empty}>{filter === 'all' ? '沒有行程' : '沒有此類行程'}</p>}
          </section>;
        })}
      </div>}
    </section>
  </div>;
}
