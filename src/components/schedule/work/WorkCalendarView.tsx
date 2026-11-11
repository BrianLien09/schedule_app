'use client';

import type { CSSProperties, DragEvent, KeyboardEvent, MouseEvent } from 'react';
import { getWorkRoleHourlyRate, getWorkRoleLabel, type WorkRole } from '@/data/workRoles';
import type { WorkShift } from '@/data/schedule';
import type { Todo } from '@/data/todos';
import { formatTodoRange, getTodoColor } from '@/utils/todos';
import { EmptyState } from '@/components/shared/Loading';
import styles from '@/app/schedule/work/page.module.css';

interface WorkCalendarViewProps {
  days: number;
  startDay: number;
  monthKey: string;
  monthDirection: 'previous' | 'next';
  selectedDate: string | null;
  currentMonthShifts: WorkShift[];
  selectedDays: number[];
  dragOverDay: number | null;
  roles: WorkRole[];
  currentMonthTodos: { date: string; todo: Todo }[];
  getShiftsForDate: (day: number) => WorkShift[];
  getTodosForDate: (day: number) => Todo[];
  onOpenEditTodo: (todo: Todo) => void;
  onDeleteTodo: (todo: Todo) => void;
  onDayClick: (day: number, event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void;
  onAddShift: (day: number) => void;
  onDragStart: (shift: WorkShift, event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (day: number, event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (day: number, event: DragEvent<HTMLDivElement>) => void;
  onOpenEditShift: (shift: WorkShift) => void;
  onDeleteShift: (shiftId: string) => void;
}

const getShiftBadgeStyle = (title: string, role?: string) => {
  const isInstructor = role === 'instructor' || title.includes('講師');
  const isAssistant = role === 'assistant' || title.includes('助教');
  if (isInstructor) return { background: '#c88d55', color: '#f0ece1' };
  if (isAssistant) return { background: '#5f7186', color: '#f0ece1' };

  const palette = [
    { background: '#b87e6b', color: '#f0ece1' },
    { background: '#6b8e78', color: '#f0ece1' },
    { background: '#886b86', color: '#f0ece1' },
    { background: '#78716c', color: '#f0ece1' },
    { background: '#9e6d5b', color: '#f0ece1' },
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

type TodoColorStyle = CSSProperties & Record<'--todo-color', string>;

/** 以 CSS 變數傳遞課程色，讓月曆 badge 與卡片在 CSS 端各自推導淡底／邊框，不必在 TSX 拼多組顏色。 */
const todoColorStyle = (todo: Todo): TodoColorStyle => ({ '--todo-color': getTodoColor(todo) });

/** 行程月曆的日期格與本月清單，保留所有操作由頁面協調器注入。 */
export default function WorkCalendarView({
  days,
  startDay,
  monthKey,
  monthDirection,
  selectedDate,
  currentMonthShifts,
  selectedDays,
  dragOverDay,
  roles,
  currentMonthTodos,
  getShiftsForDate,
  getTodosForDate,
  onOpenEditTodo,
  onDeleteTodo,
  onDayClick,
  onAddShift,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenEditShift,
  onDeleteShift,
}: WorkCalendarViewProps) {
  // 只有正在檢視「本月」時才標注今天；monthKey 格式為 YYYY-M（月份不補零）
  const now = new Date();
  const todayDay = monthKey === `${now.getFullYear()}-${now.getMonth() + 1}` ? now.getDate() : null;

  return (
    <>
      <div
        key={monthKey}
        className={`${styles.calendarGrid} ${
          monthDirection === 'previous' ? styles.calendarGridPrevious : styles.calendarGridNext
        }`}
      >
        <div className={styles.weekdaysGrid}>
          {['一', '二', '三', '四', '五', '六', '日'].map((dayLabel) => (
            <div key={dayLabel} className={styles.weekdayLabel}>{dayLabel}</div>
          ))}
        </div>

        <div className={styles.daysGrid}>
          {Array.from({ length: startDay }).map((_, index) => (
            <div key={`empty-${index}`} className={styles.emptyCell} />
          ))}

          {Array.from({ length: days }).map((_, index) => {
            const day = index + 1;
            const dayShifts = getShiftsForDate(day);
            const dayTodos = getTodosForDate(day);
            const hasShifts = dayShifts.length > 0;
            const hasItems = hasShifts || dayTodos.length > 0;
            const isSelected = selectedDays.includes(day);
            const isDragOver = dragOverDay === day;
            const isToday = todayDay === day;

            return (
              <div
                key={day}
                onClick={(event) => onDayClick(day, event)}
                // 鍵盤使用者以 Enter / 空白鍵操作日期格，行為等同點擊
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onDayClick(day, event);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                aria-label={`${isToday ? '今天，' : ''}${day} 日${hasItems ? `，${dayShifts.length + dayTodos.length} 個行程` : ''}`}
                onDragOver={(event) => onDragOver(day, event)}
                onDragLeave={onDragLeave}
                onDrop={(event) => onDrop(day, event)}
                className={`${styles.dayCell} ${hasShifts ? styles.dayCellWithShift : styles.dayCellEmpty} ${isSelected ? styles.dayCellSelected : ''} ${isDragOver ? styles.dayCellDragOver : ''} ${isToday ? styles.dayCellToday : ''} ${hasShifts ? 'card' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.dayCellHeader}>
                  <div className={`${styles.dayNumber} ${hasShifts ? styles.dayNumberWithShift : styles.dayNumberEmpty}`}>
                    {day}
                  </div>
                  {isToday && <span className={styles.todayTag}>今天</span>}
                  {hasItems && (
                    <button
                      type="button"
                      className={styles.addShiftIconBtn}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddShift(day);
                      }}
                      title={`為 ${day} 日新增另一個行程`}
                      aria-label={`為 ${day} 日新增行程`}
                    >
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="6" y1="2" x2="6" y2="10" />
                        <line x1="2" y1="6" x2="10" y2="6" />
                      </svg>
                    </button>
                  )}
                </div>
                {dayShifts.map((shift) => {
                  const title = shift.shiftCategory || shift.note || '打工';
                  const badgeStyle = getShiftBadgeStyle(title, shift.role);
                  return (
                    <div
                      key={shift.id}
                      className={styles.shiftBadge}
                      style={{ background: badgeStyle.background, color: badgeStyle.color }}
                      draggable
                      role="button"
                      tabIndex={0}
                      onDragStart={(event) => onDragStart(shift, event)}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenEditShift(shift);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          onOpenEditShift(shift);
                        }
                      }}
                      title={`點擊編輯：${title}`}
                    >
                      {title}
                    </div>
                  );
                })}
                {dayTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`${styles.todoBadge} ${todo.completed ? styles.todoBadgeDone : ''}`}
                    style={todoColorStyle(todo)}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenEditTodo(todo);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        onOpenEditTodo(todo);
                      }
                    }}
                    title={`點擊編輯代辦：${todo.title}`}
                  >
                    {todo.title}
                  </div>
                ))}
                {isSelected && <div className={styles.selectedOverlay}>✓</div>}
              </div>
            );
          })}
        </div>
      </div>

      <details className={styles.detailsSection} open>
        <summary className={styles.detailsSummary}>
          <span className={styles.sectionTitle}>本月詳細列表</span>
          <span className={styles.detailsHints}>
            <span className={styles.hintInline}>點擊班次編輯</span>
            <span className={styles.hintDivider}>/</span>
            <span className={styles.hintInline}>拖曳複製</span>
            <span className={styles.hintDivider}>/</span>
            <span className={styles.hintInline}>多選日期</span>
          </span>
          <span className={styles.detailsToggle}>
            <span className={styles.detailsChevron} aria-hidden="true" />
            <span className={styles.detailsToggleClosed}>展開</span>
            <span className={styles.detailsToggleOpen}>收合</span>
          </span>
        </summary>
        <div className={styles.detailsContent}>
          {/* 空狀態放在 grid 外，否則只會佔第一欄而偏左 */}
          {currentMonthShifts.length === 0 ? (
            <EmptyState icon="🗓️" title="本月尚無排定打工班表" compact />
          ) : (
            <div className={styles.shiftsGrid}>
              {currentMonthShifts.map((shift) => {
                const isSelected = selectedDate === shift.date;
                const roleLabel = getWorkRoleLabel(shift.role, roles, shift.roleName);
                const rate = shift.hourlyRate ?? getWorkRoleHourlyRate(shift.role, roles);
                const title = shift.shiftCategory || shift.note || '打工';
                const badgeStyle = getShiftBadgeStyle(title, shift.role);
                return (
                  <div
                    key={shift.id}
                    data-date={shift.date}
                    className={`${styles.shiftCard} ${isSelected ? styles.shiftCardSelected : styles.shiftCardNormal}`}
                  >
                    <div className={styles.cardHeader}>
                      <div className={styles.shiftDateBadge}>{shift.date.split('-')[2]} 日</div>
                      <div className={styles.roleBadge} style={{
                        background: shift.role === 'instructor' ? 'rgba(200, 141, 85, 0.18)' : 'rgba(95, 113, 134, 0.18)',
                        color: shift.role === 'instructor' ? '#c88d55' : 'var(--color-secondary)',
                        border: shift.role === 'instructor' ? '1px dashed rgba(200, 141, 85, 0.4)' : '1px dashed rgba(95, 113, 134, 0.4)',
                      }}>
                        {roleLabel} ${rate}/h
                      </div>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.shiftNameTag} style={{ background: badgeStyle.background, color: badgeStyle.color }}>
                        {title}
                      </div>
                      <div className={styles.shiftTimeText}>
                        ⏰ {shift.startTime} - {shift.endTime} ({shift.workHours ?? '-'}小時)
                      </div>
                    </div>
                    <div className={styles.cardFooter}>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => onOpenEditShift(shift)} title="編輯班表">
                        ✏️ 編輯
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onDeleteShift(shift.id)} title="刪除班表">
                        🗑️ 刪除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {currentMonthTodos.length > 0 && (
            <>
              <h3 className={styles.todoSectionTitle}>本月代辦行程</h3>
              <div className={styles.shiftsGrid}>
                {currentMonthTodos.map(({ date, todo }) => (
                  <div
                    key={`${todo.id}-${date}`}
                    className={`${styles.todoCard} ${todo.completed ? styles.todoCardDone : ''}`}
                    style={todoColorStyle(todo)}
                  >
                    {/* 標題直接做成課程色帶，取代原本「日期 badge + 標題 pill」兩層，長標題也不會撐出不規則的色塊 */}
                    <div className={styles.todoCardHeader}>
                      <span className={styles.todoCardDay}>{Number(date.split('-')[2])}</span>
                      <span className={styles.todoCardTitle}>{todo.title}</span>
                    </div>
                    <div className={styles.todoCardBody}>
                      <div className={styles.todoMeta}>
                        <span aria-hidden="true">⏰</span>
                        <span>{formatTodoRange(todo)}</span>
                      </div>
                      <div className={styles.todoMeta}>
                        <span aria-hidden="true">📘</span>
                        <span className={todo.associationLabel ? '' : styles.todoMetaMuted}>{todo.associationLabel || '未關聯課程'}</span>
                      </div>
                    </div>
                    <div className={styles.todoCardFooter}>
                      {/* 同步狀態降為頁尾小字，不再和標題搶視覺焦點 */}
                      <span className={styles.todoSyncText}>{todo.syncToFamily ? '✓ 已同步家庭月曆' : ''}</span>
                      <div className={styles.todoActions}>
                        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => onOpenEditTodo(todo)} title="編輯代辦">
                          編輯
                        </button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onDeleteTodo(todo)} title="刪除代辦">
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </details>
    </>
  );
}
