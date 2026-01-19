'use client';
import Link from 'next/link';
import { CalendarIcon, GamepadIcon, SchoolIcon, BriefcaseIcon } from '../components/Icons';
import { StatCard, TimelineItem } from '../components/VisualComponents';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useScheduleData } from '../hooks/useScheduleData';
import ExportImport from '../components/ExportImport';
import styles from './page.module.css';

export default function Home() {
  // 使用新的資料管理 hook
  const { courses, shifts, events } = useScheduleData();
  
  const {
    currentTimeStr,
    currentDayOfWeek,
    currentMonth,
    thisWeekClasses,
    thisMonthWorkDays,
    nextEvent,
    currentEvent,
    todaySchedule,
    monthlyWorkShifts,
    upcomingImportantEvents,
  } = useHomeDashboard(courses, shifts, events);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <section className={styles.header}>
        <h2 className={styles.headerTitle}>Welcome Back, Brian!</h2>
        <p className={styles.headerSubtitle}>今天也是充滿活力的一天 💪</p>
      </section>

      {/* 統計卡片區 */}
      <div className={styles.statsGrid}>
        <StatCard
          icon={<CalendarIcon size={32} />}
          label="本週課程"
          value={thisWeekClasses}
          subtext="堂課"
          color="var(--color-primary)"
        />
        <StatCard
          icon={<CalendarIcon size={32} />}
          label="本月打工"
          value={thisMonthWorkDays}
          subtext="天"
          color="var(--color-highlight)"
        />
        <div className={`glass card ${styles.eventCard}`}>
          {/* Top Section: Current Event */}
          <div className={styles.eventSectionTop}>
            <div className={styles.eventLabel}>
              <span className="animate-pulse">●</span> {currentEvent ? '正在進行' : '目前狀態'}
            </div>

            {currentEvent ? (
              <div className={styles.eventContent}>
                <div
                  className={`${styles.eventIcon} ${
                    currentEvent.type === 'class' ? styles.eventIconClass : styles.eventIconWork
                  }`}
                >
                  {currentEvent.type === 'class' ? <SchoolIcon size={28} /> : <BriefcaseIcon size={28} />}
                </div>
                <div>
                  <div className={styles.eventTitle}>{currentEvent.title}</div>
                  <div className={styles.eventTime}>{currentEvent.time}</div>
                </div>
              </div>
            ) : (
              <div className={styles.eventContentFaded}>
                <div className={styles.eventIcon + ' ' + styles.eventIconFree}>
                  <span className={styles.eventEmoji}>☕</span>
                </div>
                <div>
                  <div className={styles.eventTitle}>目前空檔</div>
                  <div className={styles.eventTime}>休息一下,準備迎接挑戰</div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section: Next Event */}
          <div className={styles.eventSection}>
            <div className={styles.eventLabelMuted}>{nextEvent ? '稍後行程' : '今日後續'}</div>

            {nextEvent ? (
              <div className={styles.eventContent}>
                <div
                  className={`${styles.eventIconSmall} ${
                    nextEvent.type === 'class' ? styles.eventIconClassLight : styles.eventIconWorkLight
                  }`}
                >
                  {nextEvent.type === 'class' ? <SchoolIcon size={20} /> : <BriefcaseIcon size={20} />}
                </div>
                <div>
                  <div className={styles.eventTitleSmall}>{nextEvent.title}</div>
                  <div className={styles.eventTimeNext}>
                    {nextEvent.time} <span className={styles.eventLocationMuted}>@ {nextEvent.location}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.eventContentFadedMore}>
                <div className={styles.eventIconSmall + ' ' + styles.eventIconDone}>
                  <span className={styles.eventEmojiSmall}>🌙</span>
                </div>
                <div>
                  <div className={styles.eventTitleSmall}>今日行程已結束</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.gridAuto}>
        {/* 今日時間軸 */}
        <section className="glass card">
          <h3 className={styles.sectionHeader}>📅 今日課程</h3>

          <div className={styles.timelineContainer}>
            {todaySchedule.length > 0 ? (
              todaySchedule.map((item) => {
                const isPast = item.endTime < currentTimeStr;
                const isActive = item.startTime <= currentTimeStr && item.endTime > currentTimeStr;

                return (
                  <TimelineItem
                    key={item.id}
                    time={item.startTime}
                    title={item.name}
                    location={item.location}
                    isActive={isActive}
                    isPast={isPast}
                  />
                );
              })
            ) : (
              <div className={styles.emptyState}>
                {currentDayOfWeek === 0 || currentDayOfWeek === 6 ? (
                  <>
                    <div className={styles.emptyStateIcon}>🎉</div>
                    <div className={styles.emptyStateTitle}>今天是週末!</div>
                    <div className={styles.emptyStateSubtitle}>好好休息,享受美好時光 ✨</div>
                  </>
                ) : (
                  <>
                    <div className={styles.emptyStateIcon}>☕</div>
                    <div className={styles.emptyStateTitle}>今天沒有課程</div>
                    <div className={styles.emptyStateSubtitle}>可以好好利用這段時間!</div>
                  </>
                )}
              </div>
            )}
          </div>

          <Link href="/schedule" className={`btn ${styles.linkButton}`}>
            查看完整日程 &rarr;
          </Link>
        </section>

        {/* Important Events */}
        <section className="glass card">
          <h3 className={styles.sectionTitle}>⚡ 即將到來</h3>
          <div className={styles.eventsGrid}>
            {upcomingImportantEvents.map((event) => (
              <div key={event.id} className={styles.eventItem}>
                <div
                  className={`${styles.eventDot} ${
                    event.type === 'deadline'
                      ? styles.eventDotDeadline
                      : event.type === 'holiday'
                      ? styles.eventDotHoliday
                      : styles.eventDotOther
                  }`}
                />
                <div className={styles.eventDetails}>
                  <div className={styles.eventName}>{event.title}</div>
                  <div className={styles.eventDate}>{event.date}</div>
                </div>
                {event.type === 'deadline' && <span className={styles.urgentBadge}>緊急</span>}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Current Month Work Shifts Summary */}
      <section className="glass card">
        <h3 className={styles.monthTitle}>
          <CalendarIcon size={24} />
          <span>本月打工一覽 ({currentMonth}月)</span>
        </h3>
        <div className={styles.workShiftsGrid}>
          {monthlyWorkShifts.map((shift) => (
            <div key={shift.id} className={styles.workShiftCard}>
              <div className={styles.workShiftDate}>
                {shift.date.split('-')[1]}/{shift.date.split('-')[2]}
              </div>
              <div>
                <div className={styles.workShiftName}>{shift.note}</div>
                <div className={styles.workShiftTime}>
                  {shift.startTime} - {shift.endTime}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.gamesSection}>
        <h3 className={styles.gamesSectionTitle}>休息一下?</h3>
        <p className={styles.gamesSectionSubtitle}>工作學習之餘,也別忘了放鬆心情。</p>
        <Link href="/games" className={`btn ${styles.gamesButton}`}>
          <GamepadIcon size={20} />
          <span>前往攻略中心</span>
        </Link>
      </section>

      {/* Export/Import Manager */}
      <ExportImport />
    </div>
  );
}
