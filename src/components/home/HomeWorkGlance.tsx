'use client';

import Link from 'next/link';
import { BriefcaseIcon } from '@/components/shared/Icons';
import type { WorkShift } from '@/data/schedule';
import styles from '@/app/page.module.css';

export type ShiftStatus =
  | 'today_in_progress'
  | 'today_upcoming'
  | 'today_completed'
  | 'upcoming'
  | 'completed';

export interface AnalyzedShift extends WorkShift {
  dayOfWeek: string;
  isWeekend: boolean;
  hours: number;
  status: ShiftStatus;
  statusLabel: string;
  daysDiff: number;
  title: string;
}

export interface ShiftMetrics {
  totalCount: number;
  completedCount: number;
  remainingCount: number;
  totalHours: number;
  completedHours: number;
  progressPct: number;
  nextShift: AnalyzedShift | null;
  upcomingCount: number;
}

interface HomeWorkGlanceProps {
  nowDate: Date;
  shiftMetrics: ShiftMetrics;
  monthlyTotalPay: number;
  shiftFilter: 'all' | 'upcoming' | 'completed';
  filteredShifts: AnalyzedShift[];
  displayedShifts: AnalyzedShift[];
  isShiftsExpanded: boolean;
  onShiftFilterChange: (filter: 'all' | 'upcoming' | 'completed') => void;
  onToggleExpanded: () => void;
  onOpenEditShift: (shift: WorkShift) => void;
}

/** 儀表板本月打工摘要，集中指標、篩選與班次卡片呈現。 */
export default function HomeWorkGlance({
  nowDate,
  shiftMetrics,
  monthlyTotalPay,
  shiftFilter,
  filteredShifts,
  displayedShifts,
  isShiftsExpanded,
  onShiftFilterChange,
  onToggleExpanded,
  onOpenEditShift,
}: HomeWorkGlanceProps) {
  return (
    <div className={styles.workGlanceCard}>
      <div className={styles.workGlanceHeader}>
        <div className={styles.workGlanceTitle}>
          <BriefcaseIcon size={22} />
          <span>本月打工安排</span>
          <span className={styles.monthTag}>
            {nowDate.getMonth() + 1} 月份班表 ({shiftMetrics.totalCount} 班)
          </span>
          <span className={styles.editHintTag}>✏️ 點擊卡片可直接編輯</span>
        </div>
        <Link
          href="/schedule/work"
          className={styles.cardActionLink}
          style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
        >
          完整打工月曆 →
        </Link>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>總排班天數</span>
          <span className={styles.metricValue}>{shiftMetrics.totalCount} 天</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>工時累計</span>
          <span className={styles.metricValue}>
            {shiftMetrics.completedHours}h{' '}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--muted)' }}>
              / {shiftMetrics.totalHours}h
            </span>
          </span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>排班進度</span>
          <span className={`${styles.metricValue} ${styles.metricHighlight}`}>
            {shiftMetrics.progressPct}%
          </span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>本月總收入</span>
          <span className={styles.metricValue}>NT$ {monthlyTotalPay.toLocaleString()}</span>
        </div>
      </div>

      {shiftMetrics.totalCount > 0 && (
        <div className={styles.workProgressBlock}>
          <div className={styles.workProgressHeader}>
            <span>班次達成進度</span>
            <span className={styles.workProgressValue}>
              已完成 {shiftMetrics.completedCount} 班 · 剩餘 {shiftMetrics.remainingCount} 班 ({shiftMetrics.progressPct}%)
            </span>
          </div>
          <div className={styles.workProgressBarTrack}>
            <div className={styles.workProgressBarFill} style={{ width: `${shiftMetrics.progressPct}%` }} />
          </div>
        </div>
      )}

      {shiftMetrics.totalCount > 0 && (
        <div className={styles.shiftControlBar}>
          <div className={styles.filterGroup}>
            <button
              type="button"
              className={`${styles.filterChip} ${shiftFilter === 'all' ? styles.filterChipActive : ''}`}
              onClick={() => onShiftFilterChange('all')}
            >
              全部 ({shiftMetrics.totalCount})
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${shiftFilter === 'upcoming' ? styles.filterChipActive : ''}`}
              onClick={() => onShiftFilterChange('upcoming')}
            >
              即將到來 ({shiftMetrics.upcomingCount})
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${shiftFilter === 'completed' ? styles.filterChipActive : ''}`}
              onClick={() => onShiftFilterChange('completed')}
            >
              已完成 ({shiftMetrics.completedCount})
            </button>
          </div>
        </div>
      )}

      {filteredShifts.length > 0 ? (
        <div className={styles.workGlanceGrid}>
          {displayedShifts.map((shift) => {
            const isToday = shift.status.startsWith('today');
            const isPast = shift.status === 'completed';
            const isInProgress = shift.status === 'today_in_progress';
            const cardClass = `${styles.shiftCard} ${
              isInProgress
                ? styles.shiftCardInProgress
                : isToday
                ? styles.shiftCardToday
                : isPast
                ? styles.shiftCardPast
                : ''
            }`;
            const badgeClass = `${styles.shiftStatusBadge} ${
              isInProgress
                ? styles.statusBadgeInProgress
                : isToday
                ? styles.statusBadgeToday
                : isPast
                ? styles.statusBadgeCompleted
                : styles.statusBadgeUpcoming
            }`;

            return (
              <div
                key={shift.id}
                className={cardClass}
                onClick={() => onOpenEditShift(shift)}
                style={{ cursor: 'pointer' }}
                title="點擊編輯打工班表"
              >
                <div className={styles.shiftCardHeader}>
                  <div className={styles.shiftDateGroup}>
                    <span className={styles.shiftDateText}>{shift.date.slice(5)}</span>
                    <span className={`${styles.shiftWeekday} ${shift.isWeekend ? styles.shiftWeekend : ''}`}>
                      {shift.dayOfWeek}
                    </span>
                  </div>
                  <span className={badgeClass}>{shift.statusLabel}</span>
                </div>
                <div className={styles.shiftRoleTitle} title={shift.title}>{shift.title}</div>
                <div className={styles.shiftMetaRow}>
                  <span className={styles.shiftTime}>🕒 {shift.startTime} - {shift.endTime}</span>
                  <span className={styles.shiftHoursPill}>{shift.hours}h</span>
                </div>
                {shift.location && (
                  <div className={styles.shiftLocation} title={shift.location}>
                    📍 {shift.location}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyShiftsBlock}>
          <span style={{ fontSize: '2rem' }}>📋</span>
          <span>
            {shiftFilter === 'upcoming'
              ? '目前沒有即將到來的班次'
              : shiftFilter === 'completed'
              ? '本月尚未有已完工班次'
              : '本月尚無安排打工記錄'}
          </span>
          <Link
            href="/schedule/work"
            style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
          >
            前往打工月曆安排班次 →
          </Link>
        </div>
      )}

      {filteredShifts.length > 8 && (
        <button type="button" className={styles.expandShiftsBtn} onClick={onToggleExpanded}>
          {isShiftsExpanded ? '收合部分班次 ▴' : `展開查看全部 (${filteredShifts.length} 班) ▾`}
        </button>
      )}
    </div>
  );
}
