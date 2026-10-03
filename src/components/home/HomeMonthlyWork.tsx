'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { WorkShift } from '@/data/schedule';
import AgendaIcon from '@/components/schedule/overview/AgendaIcon';
import { summarizeMonthlyWork } from '@/utils/monthlyWork';
import { localDateKey } from '@/utils/agenda';
import styles from './HomeMonthlyWork.module.css';

interface HomeMonthlyWorkProps {
  shifts: WorkShift[]; now: Date; loading: boolean; canEdit: boolean;
  onEdit: (shift: WorkShift) => void;
}

export default function HomeMonthlyWork(props: HomeMonthlyWorkProps) {
  return <MonthlyWork key={localDateKey(props.now).slice(0, 7)} {...props} />;
}

function MonthlyWork({ shifts, now, loading, canEdit, onEdit }: HomeMonthlyWorkProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [expanded, setExpanded] = useState(false);
  const summary = useMemo(() => summarizeMonthlyWork(shifts, now), [shifts, now]);
  const filtered = summary.items.filter((item) => filter === 'all' || (filter === 'completed' ? item.completed : !item.completed));
  const shown = expanded ? filtered : filtered.slice(0, 8);
  const hours = (value: number): string => Number(value.toFixed(2)).toLocaleString();
  return <section className={`${styles.panel} page-section-enter`} aria-labelledby="monthly-work-title">
    <header className={styles.header}><div className={styles.heading}><span className={styles.icon} aria-hidden="true"><AgendaIcon kind="work" size={23} /></span><h2 id="monthly-work-title">本月打工安排</h2><span className={styles.tag}>{now.getMonth() + 1} 月份班表（{summary.items.length} 班）</span></div><Link href="/schedule/work">完整打工月曆 →</Link></header>
    {loading ? <p className={styles.empty}>班表載入中…</p> : <>
      <dl className={styles.metrics}><div><dt>排班天數</dt><dd>{summary.days} 天</dd></div><div><dt>工時累計</dt><dd>{hours(summary.completedHours)}h <small>/ {hours(summary.totalHours)}h</small></dd></div><div><dt>排班進度</dt><dd>{summary.progress}%</dd></div><div><dt>本月總收入</dt><dd>NT$ {Math.round(summary.totalPay).toLocaleString()}</dd></div></dl>
      {summary.items.length > 0 && <><div className={styles.progress}><div><strong>班次達成進度</strong><span>已完成 {summary.completedCount} 班 · 剩餘 {summary.remainingCount} 班</span></div><progress aria-label="班次達成進度" max={summary.items.length} value={summary.completedCount} /></div>
        <div className={styles.filters} aria-label="本月班表篩選">{([{ value: 'all', label: '全部', count: summary.items.length }, { value: 'upcoming', label: '即將到來', count: summary.remainingCount }, { value: 'completed', label: '已完成', count: summary.completedCount }] as const).map((entry) => <button key={entry.value} aria-pressed={filter === entry.value} onClick={() => { setFilter(entry.value); setExpanded(false); }}>{entry.label}（{entry.count}）</button>)}{canEdit && <span className={styles.hint}>點擊班次可編輯</span>}</div></>}
      {shown.length ? <div className={styles.grid} key={filter}>{shown.map((item) => <button key={item.shift.id} className={`${styles.shift} ${item.ongoing ? styles.ongoing : item.completed ? styles.past : item.shift.date === localDateKey(now) ? styles.today : styles.future}`} disabled={!canEdit} aria-label={`編輯 ${item.shift.date} ${item.title}`} onClick={() => onEdit(item.shift)}>
        <div className={styles.shiftHeader}><span><strong>{item.shift.date.slice(5)}</strong> <small>{new Date(`${item.shift.date}T00:00:00`).toLocaleDateString('zh-TW', { weekday: 'short' })}</small></span><span className={styles.status}><span className={styles.statusIcon}><AgendaIcon kind={item.ongoing ? 'clock' : item.shift.date === localDateKey(now) ? 'next' : 'event'} size={14} /></span>{item.status}</span></div>
        <strong className={styles.title}>{item.title}</strong><div className={styles.time}><span aria-hidden="true"><AgendaIcon kind="clock" size={16} /></span><span>{item.shift.startTime}–{item.shift.endTime}</span><span className={styles.hours}>{hours(item.hours)}h</span></div>{item.shift.location && <p className={styles.location}>{item.shift.location}</p>}
      </button>)}</div> : <p className={styles.empty}>{filter === 'completed' ? '本月尚無已完成班次。' : filter === 'upcoming' ? '本月沒有尚未完成的班次。' : '本月尚未安排打工。'}</p>}
      {filtered.length > 8 && <button className={styles.expand} onClick={() => setExpanded((value) => !value)}>{expanded ? '收合班次' : `展開全部 ${filtered.length} 班`}</button>}
    </>}
  </section>;
}
