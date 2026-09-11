'use client';

import Link from 'next/link';
import { TimelineItem } from '@/components/shared/VisualComponents';
import type { TodayTimelineItem } from '@/hooks/useHomeDashboard';
import styles from '@/app/page.module.css';

interface HomeTimelineAndSalaryProps {
  todayTimeline: TodayTimelineItem[];
  currentDayOfWeek: number;
  currentTimeStr: string;
  thisMonthSalaryStats: {
    totalPay: number;
    totalHours: number;
    workDays: number;
  };
}

/** 首頁的今日整合行程與薪資摘要，讓頁面只負責組合資料與互動。 */
export default function HomeTimelineAndSalary({
  todayTimeline,
  currentDayOfWeek,
  currentTimeStr,
  thisMonthSalaryStats,
}: HomeTimelineAndSalaryProps) {
  return (
    <div className={styles.dualSection}>
      <div className={styles.contentCard}>
        <div className={styles.sectionHeader}>
          <span>📅 今日整合行程</span>
          <Link
            href="/schedule/school"
            style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none' }}
          >
            完整課表 →
          </Link>
        </div>

        <div className={styles.timelineList}>
          {todayTimeline.length > 0 ? (
            todayTimeline.map((item) => {
              const isPast = !item.isAllDay && Boolean(item.endTime && item.endTime < currentTimeStr);
              const isActive = !item.isAllDay && Boolean(
                item.startTime && item.endTime &&
                item.startTime <= currentTimeStr && item.endTime > currentTimeStr
              );
              const typeIcon = item.type === 'class' ? '📚' : item.type === 'work' ? '💼' : '📌';

              return (
                <TimelineItem
                  key={item.id}
                  time={item.isAllDay ? '全天' : `${item.startTime} - ${item.endTime}`}
                  title={`${typeIcon} ${item.title}`}
                  location={item.location}
                  isActive={isActive}
                  isPast={isPast}
                />
              );
            })
          ) : (
            <div className={styles.emptyBlock}>
              <span className={styles.emptyEmoji}>
                {currentDayOfWeek === 0 || currentDayOfWeek === 6 ? '🎉' : '☕'}
              </span>
              <span>
                {currentDayOfWeek === 0 || currentDayOfWeek === 6
                  ? '週末美好假期，好好休息吧！'
                  : '今日沒有課程、打工或重要事件'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.contentCard}>
        <div
          className={styles.sectionHeader}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>💼 本月薪資統計</span>
          <Link
            href="/tools/salary"
            style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none' }}
          >
            詳細紀錄 →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(184, 126, 107, 0.12)',
              border: '1px dashed rgba(184, 126, 107, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '2px' }}>本月總收入</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                NT$ {thisMonthSalaryStats.totalPay.toLocaleString()}
              </div>
            </div>
            <span style={{ fontSize: '2rem' }}>💰</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(95, 113, 134, 0.1)',
                border: '1px dashed rgba(95, 113, 134, 0.3)',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '4px' }}>總工時</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                {thisMonthSalaryStats.totalHours.toFixed(2)} h
              </div>
            </div>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '4px' }}>工作天數</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fbbf24' }}>
                {thisMonthSalaryStats.workDays} 天
              </div>
            </div>
          </div>

          {thisMonthSalaryStats.workDays === 0 && (
            <div className={styles.emptyBlock}>
              <span className={styles.emptyEmoji}>📋</span>
              <span>本月尚無打工記錄</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
