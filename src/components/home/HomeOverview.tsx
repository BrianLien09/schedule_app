'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Course, Event, WorkShift } from '@/data/schedule';
import type { AgendaTask } from '@/data/todos';
import { CalendarIcon } from '@/components/shared/Icons';
import AgendaIcon from '@/components/schedule/overview/AgendaIcon';
import HomeMonthlyWork from './HomeMonthlyWork';
import { AGENDA_LABELS, addCalendarDays, agendaHref, buildAgenda, dateLabel, getPendingTasks, isTaskOverdue, localDateKey, taskDueDate, todoDateTimeLabel } from '@/utils/agenda';
import styles from './HomeOverview.module.css';

interface HomeOverviewProps {
  courses: Course[];
  shifts: WorkShift[];
  events: Event[];
  notes: AgendaTask[];
  now: Date;
  loading: boolean;
  notesLoading: boolean;
  notesError: string | null;
  busyTaskIds: Set<string>;
  onComplete: (note: AgendaTask) => void;
  onOpenNote: (note: AgendaTask) => void;
  onAddTodo: () => void;
  onEditShift: (shift: WorkShift) => void;
  canEdit: boolean;
}

export default function HomeOverview({ courses, shifts, events, notes, now, loading, notesLoading, notesError, busyTaskIds, onComplete, onOpenNote, onAddTodo, onEditShift, canEdit }: HomeOverviewProps) {
  const [recentOnly, setRecentOnly] = useState(true);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const agenda = useMemo(() => buildAgenda(Array.from({ length: 7 }, (_, day) => addCalendarDays(now, day)), courses, shifts, events, []), [courses, shifts, events, now]);
  const today = localDateKey(now);
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const timed = agenda.filter((item) => item.startTime && item.endTime);
  const current = timed.filter((item) => item.date === today && item.startTime! <= time && item.endTime! > time);
  const next = timed.find((item) => item.date > today || item.startTime! > time);
  const important = agenda.filter((item) => item.kind !== 'class' && (item.date > today || !item.endTime || item.endTime > time));
  const tasks = getPendingTasks(notes, now, recentOnly);
  const shownTasks = tasksExpanded ? tasks : tasks.slice(0, 6);
  const shownEvents = eventsExpanded ? important : important.slice(0, 6);

  return (
    <div className={styles.page}>
      <header className={`${styles.header} page-section-enter`}>
        <div><p className={styles.eyebrow}>{now.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}</p><h1>日常總覽</h1></div>
        <Link className={styles.primaryLink} href="/schedule/overview"><CalendarIcon size={18} />整合週視圖</Link>
      </header>

      <section className={`${styles.focus} page-section-enter page-section-enter-delay-1`} aria-label="現在與下一個行程">
        {loading ? <p className={styles.empty}>行程載入中…</p> : <>
          <div className={`${styles.focusBlock} ${styles.currentBlock}`}><p className={styles.focusLabel}><span className={styles.iconBadge} aria-hidden="true"><AgendaIcon kind="clock" size={22} /></span>{current.length ? '進行中' : '現在'}</p>
            {current.length ? current.map((item) => <div key={item.id}><h2>{item.title}</h2><p className={styles.meta}>{item.startTime}–{item.endTime}{item.detail && ` · ${item.detail}`}</p></div>) : <><h2>目前沒有進行中的行程</h2><p className={styles.meta}>接下來的安排與期限都在下方。</p></>}
          </div>
          <div className={`${styles.focusBlock} ${styles.nextBlock}`}><p className={styles.focusLabel}><span className={styles.iconBadge} aria-hidden="true"><AgendaIcon kind="next" size={22} /></span>下一個行程</p>
            {next ? <Link href={agendaHref(next)} className={styles.nextLink}><h2>{next.title}</h2><p className={styles.meta}>{dateLabel(next.date, now)} · {next.startTime}–{next.endTime}{next.detail && ` · ${next.detail}`}</p></Link> : <><h2>近期沒有排定行程</h2><Link className={styles.textLink} href="/schedule/work">查看打工月曆</Link></>}
          </div>
        </>}
      </section>

      <div className={styles.columns}>
        <section className={`${styles.panel} page-section-enter page-section-enter-delay-2`} aria-labelledby="upcoming-title">
          <div className={styles.panelHeader}><div className={styles.headingGroup}><span className={`${styles.iconBadge} ${styles.calendarBadge}`} aria-hidden="true"><AgendaIcon kind="event" size={22} /></span><div><p className={styles.eyebrow}>今天起七天內</p><h2 id="upcoming-title">近期重要安排</h2></div></div><Link className={styles.textLink} href="/schedule/overview">全部行程</Link></div>
          {loading ? <p className={styles.empty}>行程載入中…</p> : shownEvents.length ? <ul className={styles.list}>{shownEvents.map((item) => <li key={item.id}><Link className={styles.eventRow} href={agendaHref(item)}>
            <span className={styles.date}>{dateLabel(item.date, now)}</span><div className={styles.rowBody}><strong>{item.title}</strong><span className={styles.meta}><span className={item.kind === "work" ? styles.workKind : styles.eventKind}><span aria-hidden="true"><AgendaIcon kind={item.kind} size={14} /></span>{AGENDA_LABELS[item.kind]}</span> · {item.startTime ? `${item.startTime}–${item.endTime}` : '全天'}{item.detail && ` · ${item.detail}`}</span></div>
          </Link></li>)}</ul> : <p className={styles.empty}>近期沒有打工或重要事件。</p>}
          {important.length > 6 && <button className={styles.textButton} onClick={() => setEventsExpanded((value) => !value)}>{eventsExpanded ? '收起安排' : `顯示其餘 ${important.length - 6} 個安排`}</button>}
        </section>

        <section className={`${styles.panel} page-section-enter page-section-enter-delay-3`} aria-labelledby="tasks-title">
          <div className={styles.panelHeader}><div className={styles.headingGroup}><span className={`${styles.iconBadge} ${styles.taskBadge}`} aria-hidden="true"><AgendaIcon kind="tasks" size={22} /></span><div><p className={styles.eyebrow}>個人待辦・作業・考試</p><h2 id="tasks-title">待辦事項</h2></div></div><button className={styles.addTodo} onClick={onAddTodo}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>新增待辦</button></div>
          <div className={styles.filters} aria-label="待辦範圍">
            <button aria-pressed={recentOnly} className={recentOnly ? styles.selected : ''} onClick={() => { setRecentOnly(true); setTasksExpanded(false); }}>近期與逾期</button>
            <button aria-pressed={!recentOnly} className={!recentOnly ? styles.selected : ''} onClick={() => { setRecentOnly(false); setTasksExpanded(false); }}>全部待辦</button>
          </div>
          {notesError && <p className={styles.empty} role="alert">部分待辦讀取失敗，請重新載入。</p>}
          {notesLoading || loading ? <p className={styles.empty}>待辦載入中…</p> : shownTasks.length ? <ul className={styles.list} key={recentOnly ? "recent" : "all"}>{shownTasks.map((note) => {
            const due = taskDueDate(note);
            const overdue = isTaskOverdue(note, now);
            return <li key={note.id} className={styles.taskRow}>
              <button type="button" className={styles.completeButton} aria-label={`完成「${note.title}」`} disabled={busyTaskIds.has(note.id)} onClick={() => onComplete(note)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
              </button>
              <button className={styles.taskTitle} disabled={busyTaskIds.has(note.id)} onClick={() => onOpenNote(note)}><strong>{note.title}</strong><span className={styles.meta}>{note.type === 'todo' ? note.associationLabel || '無關聯' : note.courseName || courses.find((course) => course.id === note.courseId)?.name || '課程'} · {note.type === 'todo' ? '待辦' : note.type === 'exam' ? '考試' : '作業'}</span></button>
              <span className={overdue ? styles.overdue : styles.due}>{busyTaskIds.has(note.id) ? '保存中' : due ? `${overdue ? '逾期 · ' : ''}${note.type === 'todo' ? todoDateTimeLabel(note, now) : dateLabel(due, now)}` : '未設定日期'}</span>
            </li>;
          })}</ul> : <p className={styles.empty}>{recentOnly ? notesError ? '暫時無法取得完整待辦。' : '近期沒有未完成的待辦。' : notesError ? '暫時無法取得完整待辦。' : '目前沒有未完成的待辦。'}</p>}
          {tasks.length > 6 && <button className={styles.textButton} onClick={() => setTasksExpanded((value) => !value)}>{tasksExpanded ? '收起待辦' : `顯示其餘 ${tasks.length - 6} 個待辦`}</button>}
        </section>
      </div>
      <HomeMonthlyWork shifts={shifts} now={now} loading={loading} canEdit={canEdit} onEdit={onEditShift} />
    </div>
  );
}
