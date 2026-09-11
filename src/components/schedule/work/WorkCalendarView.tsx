'use client';

import type { DragEvent, MouseEvent } from 'react';
import { getWorkRoleHourlyRate, getWorkRoleLabel, type WorkRole } from '@/data/workRoles';
import type { WorkShift } from '@/data/schedule';
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
  getShiftsForDate: (day: number) => WorkShift[];
  onDayClick: (day: number, event: MouseEvent<HTMLDivElement>) => void;
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

/** 打工月曆的日期格與本月清單，保留所有操作由頁面協調器注入。 */
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
  getShiftsForDate,
  onDayClick,
  onAddShift,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenEditShift,
  onDeleteShift,
}: WorkCalendarViewProps) {
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
            const hasShifts = dayShifts.length > 0;
            const isSelected = selectedDays.includes(day);
            const isDragOver = dragOverDay === day;

            return (
              <div
                key={day}
                onClick={(event) => onDayClick(day, event)}
                onDragOver={(event) => onDragOver(day, event)}
                onDragLeave={onDragLeave}
                onDrop={(event) => onDrop(day, event)}
                className={`${styles.dayCell} ${hasShifts ? styles.dayCellWithShift : styles.dayCellEmpty} ${isSelected ? styles.dayCellSelected : ''} ${isDragOver ? styles.dayCellDragOver : ''} ${hasShifts ? 'card' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.dayCellHeader}>
                  <div className={`${styles.dayNumber} ${hasShifts ? styles.dayNumberWithShift : styles.dayNumberEmpty}`}>
                    {day}
                  </div>
                  {hasShifts && (
                    <button
                      type="button"
                      className={styles.addShiftIconBtn}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddShift(day);
                      }}
                      title={`為 ${day} 日新增另一個排班`}
                      aria-label={`為 ${day} 日新增排班`}
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
                      onDragStart={(event) => onDragStart(shift, event)}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenEditShift(shift);
                      }}
                      title={`點擊編輯：${title}`}
                    >
                      {title}
                    </div>
                  );
                })}
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
          <div className={styles.shiftsGrid}>
            {currentMonthShifts.length === 0 ? (
              <p style={{ opacity: 0.7, padding: '1rem' }}>本月尚無排定打工班表。</p>
            ) : (
              currentMonthShifts.map((shift) => {
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
              })
            )}
          </div>
        </div>
      </details>
    </>
  );
}
