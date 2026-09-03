'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  SchoolIcon,
  BriefcaseIcon,
  WalletIcon,
} from '@/components/Icons';
import { TimelineItem } from '@/components/VisualComponents';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useAllowanceData } from '@/hooks/useAllowanceData';
import { useSalaryData } from '@/hooks/useSalaryData';
import { useAuth } from '@/context/AuthContext';
import LoginPrompt from '@/components/LoginPrompt';
import { calculateKongBalance } from '@/data/allowance';
import { LoadingSpinner } from '@/components/Loading';
import WorkShiftEditor from '@/components/WorkShiftEditor';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import type { WorkShift } from '@/data/schedule';
import styles from './page.module.css';

// 生活費功能暫時隱藏開關（相關代碼保留，切換為 true 即可恢復）
const SHOW_ALLOWANCE = false;

// 星期中文名稱對照
const WEEKDAY_NAMES = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

// 計算單班工時（小時）
function getShiftHours(s: { startTime: string; endTime: string; workHours?: number }): number {
  if (s.workHours && s.workHours > 0) return s.workHours;
  if (!s.startTime || !s.endTime) return 0;
  const [sh, sm] = s.startTime.split(':').map(Number);
  const [eh, em] = s.endTime.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? parseFloat((diff / 60).toFixed(1)) : 0;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();

  // 資料 Hooks
  const { courses, shifts, events, updateWorkShift, deleteWorkShift } = useScheduleData();
  const { records: allowanceRecords } = useAllowanceData();
  const { records: salaryRecords } = useSalaryData();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const {
    currentTimeStr,
    currentDayOfWeek,
    thisWeekClasses,
    thisMonthWorkDays,
    nextEvent,
    currentEvent,
    todayTimeline,
    monthlyWorkShifts,
  } = useHomeDashboard(courses, shifts, events);

  // 動態進度條計算與即時秒鐘計時器
  const [nowDate, setNowDate] = useState(new Date());

  // 打工安排卡片的篩選狀態與展開控制
  const [shiftFilter, setShiftFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [isShiftsExpanded, setIsShiftsExpanded] = useState(false);

  // 編輯打工班表狀態
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleOpenEditShift = (shift: WorkShift) => {
    setEditingShift(shift);
    setIsEditorOpen(true);
  };

  const handleSaveShift = async (updatedShift: WorkShift): Promise<boolean> => {
    try {
      await updateWorkShift(updatedShift.id, updatedShift);
      toast.success('已成功更新打工班表');
      setIsEditorOpen(false);
      setEditingShift(null);
      return true;
    } catch {
      toast.error('更新班表失敗，請稍後再試');
      return false;
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    const target = shifts.find((s) => s.id === shiftId);
    const dateText = target?.date || '';
    const nameText = target?.shiftCategory || target?.note || '打工班表';

    const confirmed = await confirm({
      title: '刪除打工班表',
      message: `確定要刪除 ${dateText} 「${nameText}」嗎？此操作會同時刪除對應的薪資計算記錄。`,
      confirmText: '刪除',
      danger: true,
    });

    if (confirmed) {
      try {
        await deleteWorkShift(shiftId);
        toast.success('已刪除打工班表與薪資記錄');
        setIsEditorOpen(false);
        setEditingShift(null);
      } catch {
        toast.error('刪除班表失敗，請稍後再試');
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 10000); // 每 10 秒更新一次
    return () => clearInterval(timer);
  }, []);

  const latestAllowance = allowanceRecords.length > 0 ? allowanceRecords[0] : null;

  // 今日本地日期字串 YYYY-MM-DD
  const todayDateStr = useMemo(() => {
    const y = nowDate.getFullYear();
    const m = String(nowDate.getMonth() + 1).padStart(2, '0');
    const d = String(nowDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [nowDate]);

  // 分析本月打工班次詳細狀態與視覺資訊
  const analyzedShifts = useMemo(() => {
    return monthlyWorkShifts.map((shift) => {
      const shiftDate = new Date(`${shift.date}T00:00:00`);
      const dayOfWeek = WEEKDAY_NAMES[shiftDate.getDay()];
      const isWeekend = shiftDate.getDay() === 0 || shiftDate.getDay() === 6;
      const hours = getShiftHours(shift);

      // 班次狀態判定
      let status: 'today_in_progress' | 'today_upcoming' | 'today_completed' | 'upcoming' | 'completed' = 'upcoming';
      let statusLabel = '即將到來';
      let daysDiff = 0;

      if (shift.date < todayDateStr) {
        status = 'completed';
        statusLabel = '已完工';
      } else if (shift.date === todayDateStr) {
        if (currentTimeStr >= shift.startTime && currentTimeStr <= shift.endTime) {
          status = 'today_in_progress';
          statusLabel = '上班中 🔥';
        } else if (currentTimeStr > shift.endTime) {
          status = 'today_completed';
          statusLabel = '今日已完工 ✓';
        } else {
          status = 'today_upcoming';
          statusLabel = '今日上班 ⚡';
        }
      } else {
        status = 'upcoming';
        const diffTime = shiftDate.getTime() - new Date(`${todayDateStr}T00:00:00`).getTime();
        daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        statusLabel = daysDiff === 1 ? '明天上班' : `${daysDiff}天後`;
      }

      // 班次名稱：優先使用當天填寫的班別名稱 (shiftCategory 或 note)，次之依角色 (講師/助教) 判定
      const title =
        shift.shiftCategory?.trim() ||
        shift.note?.trim() ||
        (shift.role === 'instructor' || shift.roleName === '講師'
          ? '講師'
          : shift.role === 'assistant' || shift.roleName === '助教'
          ? '助教'
          : shift.roleName || '打工班次');

      return {
        ...shift,
        dayOfWeek,
        isWeekend,
        hours,
        status,
        statusLabel,
        daysDiff,
        title,
      };
    });
  }, [monthlyWorkShifts, todayDateStr, currentTimeStr]);

  // 本月打工指標與進度統計
  const shiftMetrics = useMemo(() => {
    const totalCount = analyzedShifts.length;
    const completedShifts = analyzedShifts.filter((s) => s.status === 'completed' || s.status === 'today_completed');
    const upcomingShifts = analyzedShifts.filter(
      (s) => s.status === 'upcoming' || s.status === 'today_upcoming' || s.status === 'today_in_progress'
    );
    const completedCount = completedShifts.length;
    const remainingCount = totalCount - completedCount;
    const totalHours = analyzedShifts.reduce((sum, s) => sum + s.hours, 0);
    const completedHours = completedShifts.reduce((sum, s) => sum + s.hours, 0);
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const nextShift = upcomingShifts[0] || null;

    return {
      totalCount,
      completedCount,
      remainingCount,
      totalHours: parseFloat(totalHours.toFixed(1)),
      completedHours: parseFloat(completedHours.toFixed(1)),
      progressPct,
      nextShift,
      upcomingCount: upcomingShifts.length,
    };
  }, [analyzedShifts]);

  // 依篩選標籤過濾班次
  const filteredShifts = useMemo(() => {
    if (shiftFilter === 'upcoming') {
      return analyzedShifts.filter((s) => s.status !== 'completed' && s.status !== 'today_completed');
    }
    if (shiftFilter === 'completed') {
      return analyzedShifts.filter((s) => s.status === 'completed' || s.status === 'today_completed');
    }
    return analyzedShifts;
  }, [analyzedShifts, shiftFilter]);

  // 實際渲染的班次列表（預設顯示前 8 筆）
  const displayedShifts = isShiftsExpanded ? filteredShifts : filteredShifts.slice(0, 8);

  // 計算本月薪資統計（與薪資計算器邏輯一致）
  const currentMonthStr = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const thisMonthSalaryStats = useMemo(() => {
    const monthRecords = salaryRecords.filter((r) => r.date.startsWith(currentMonthStr));
    const totalPay = monthRecords.reduce((sum, r) => sum + r.workHours * r.hourlyRate, 0);
    const totalHours = monthRecords.reduce((sum, r) => sum + r.workHours, 0);
    const workDays = monthRecords.length;
    return { totalPay, totalHours, workDays };
  }, [salaryRecords, currentMonthStr]);

  // 計算目前行程剩餘時間與進度百分比
  let progressPercent = 0;
  let remainingMinutesStr = '';

  if (currentEvent && currentEvent.time) {
    const times = currentEvent.time.split(' - ');
    if (times.length === 2) {
      const [startStr, endStr] = times;
      const todayDateStr = nowDate.toISOString().slice(0, 10);
      const start = new Date(`${todayDateStr}T${startStr}:00`);
      const end = new Date(`${todayDateStr}T${endStr}:00`);
      const now = nowDate;

      const totalMs = end.getTime() - start.getTime();
      const elapsedMs = now.getTime() - start.getTime();

      if (totalMs > 0) {
        progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
        const remainingMs = end.getTime() - now.getTime();
        if (remainingMs > 0) {
          const remMin = Math.ceil(remainingMs / (1000 * 60));
          const hours = Math.floor(remMin / 60);
          const mins = remMin % 60;
          remainingMinutesStr = hours > 0 ? `${hours} 小時 ${mins} 分鐘` : `${mins} 分鐘`;
        }
      }
    }
  }

  // 登入狀態檢查
  if (authLoading) {
    return (
      <div className={styles.pageContainer}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <LoginPrompt />;
  }

  return (
    <div className={styles.pageContainer}>
      {/* ===== 核心 Highlights Grid (生活費隱藏時自動滿版) ===== */}
      <div className={SHOW_ALLOWANCE ? styles.heroGrid : styles.heroGridSingle}>
        {/* 左側主視覺卡片：即時焦點與時間軸倒數 */}
        <div className={styles.liveFocusCard}>
          <div className={styles.cardHeaderLabel}>
            <span>
              <span className={styles.pulseDot}></span>{' '}
              {currentEvent ? '正在進行中' : '今日行程狀態'}
            </span>
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              {currentTimeStr}
            </span>
          </div>

          {currentEvent ? (
            <div className={styles.currentEventRow}>
              <div className={styles.currentIcon}>
                {currentEvent.type === 'class' ? (
                  <SchoolIcon size={28} />
                ) : (
                  <BriefcaseIcon size={28} />
                )}
              </div>
              <div className={styles.eventMeta}>
                <div className={styles.eventTitle}>{currentEvent.title}</div>
                <div className={styles.eventSubInfo}>
                  <span>🕒 {currentEvent.time}</span>
                  {currentEvent.location && <span>📍 {currentEvent.location}</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.currentEventRow}>
              <div className={styles.currentIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                ☕
              </div>
              <div className={styles.eventMeta}>
                <div className={styles.eventTitle}>目前無進行中行程</div>
                <div className={styles.eventSubInfo}>
                  {nextEvent ? `下個行程：${nextEvent.title} (${nextEvent.time})` : '今日行程順利完成 ✨'}
                </div>
              </div>
            </div>
          )}

          {/* 倒數進度條 */}
          {currentEvent && (
            <div className={styles.progressContainer}>
              <div className={styles.progressLabel}>
                <span>
                  {remainingMinutesStr ? `距離結束剩餘 ${remainingMinutesStr}` : '時間倒數中'}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className={styles.progressBarTrack}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 膠囊統計 Badges (解決過去巨大空白問題) */}
          <div className={styles.pillBadgesRow}>
            <div className={styles.pillBadge}>
              <SchoolIcon size={16} />
              <span>本週課程：</span>
              <span className={styles.pillBadgeValue}>{thisWeekClasses} 堂</span>
            </div>

            <div className={styles.pillBadge}>
              <BriefcaseIcon size={16} />
              <span>本月打工：</span>
              <span className={styles.pillBadgeValue}>{thisMonthWorkDays} 天</span>
            </div>

            {nextEvent && (
              <div className={styles.pillBadge} style={{ borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                <span>稍後：</span>
                <span style={{ fontWeight: 600 }}>{nextEvent.title} ({nextEvent.time})</span>
              </div>
            )}
          </div>
        </div>

        {/* 右側：生活費小帳簿卡片（暫時隱藏，代碼保留） */}
        {SHOW_ALLOWANCE && (
          <div className={styles.allowanceCard}>
            <div className={styles.allowanceCardHeader}>
              <div className={styles.allowanceTitle}>
                <WalletIcon size={20} />
                <span>生活費帳簿摘要</span>
              </div>
              <Link href="/tools/allowance" className={styles.cardActionLink}>
                查看明細 →
              </Link>
            </div>

            {latestAllowance ? (
              <>
                <div className={styles.allowanceBalanceBlock}>
                  <span className={styles.balanceLabel}>帳簿總餘額</span>
                  <span className={styles.balanceValue}>
                    NT$ {latestAllowance.totalBalance.toLocaleString()}
                  </span>
                </div>

                {/* 小呆/孔呆餘額分割條 */}
                <div className={styles.splitBarContainer}>
                  <div className={styles.splitInfoRow}>
                    <span className={styles.xiaoLabel}>
                      小呆: NT$ {latestAllowance.xiaoBalance.toLocaleString()}
                    </span>
                    <span className={styles.kongLabel}>
                      孔呆: NT${' '}
                      {calculateKongBalance(
                        latestAllowance.totalBalance,
                        latestAllowance.xiaoBalance
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.splitTrack}>
                    <div
                      className={styles.splitXiaoFill}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            (latestAllowance.xiaoBalance / (latestAllowance.totalBalance || 1)) * 100
                          )
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <Link href="/tools/allowance" className={styles.cardActionLink}>
                  查看詳細流水帳明細 →
                </Link>
              </>
            ) : (
              <div className={styles.emptyBlock}>
                <p>尚無生活費記錄</p>
                <Link href="/tools/allowance" className={styles.cardActionLink}>
                  前往新增記錄 →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== 3. 本月打工安排（往上提一個行！全新高視覺化卡片） ===== */}
      <div className={styles.workGlanceCard}>
        {/* Header 標題列 */}
        <div className={styles.workGlanceHeader}>
          <div className={styles.workGlanceTitle}>
            <BriefcaseIcon size={22} />
            <span>本月打工安排</span>
            <span className={styles.monthTag}>
              {nowDate.getMonth() + 1} 月份班表 ({shiftMetrics.totalCount} 班)
            </span>
            <span className={styles.editHintTag}>
              ✏️ 點擊卡片可直接編輯
            </span>
          </div>
          <Link
            href="/schedule/work"
            className={styles.cardActionLink}
            style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
          >
            完整打工月曆 →
          </Link>
        </div>

        {/* 頂部打工指標橫幅 (KPI Cards) */}
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
            <span className={styles.metricValue}>
              NT$ {thisMonthSalaryStats.totalPay.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 本月打工進度條 */}
        {shiftMetrics.totalCount > 0 && (
          <div className={styles.workProgressBlock}>
            <div className={styles.workProgressHeader}>
              <span>班次達成進度</span>
              <span className={styles.workProgressValue}>
                已完成 {shiftMetrics.completedCount} 班 · 剩餘 {shiftMetrics.remainingCount} 班 ({shiftMetrics.progressPct}%)
              </span>
            </div>
            <div className={styles.workProgressBarTrack}>
              <div
                className={styles.workProgressBarFill}
                style={{ width: `${shiftMetrics.progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* 篩選 Tab 列 */}
        {shiftMetrics.totalCount > 0 && (
          <div className={styles.shiftControlBar}>
            <div className={styles.filterGroup}>
              <button
                type="button"
                className={`${styles.filterChip} ${shiftFilter === 'all' ? styles.filterChipActive : ''}`}
                onClick={() => setShiftFilter('all')}
              >
                全部 ({shiftMetrics.totalCount})
              </button>
              <button
                type="button"
                className={`${styles.filterChip} ${shiftFilter === 'upcoming' ? styles.filterChipActive : ''}`}
                onClick={() => setShiftFilter('upcoming')}
              >
                即將到來 ({shiftMetrics.upcomingCount})
              </button>
              <button
                type="button"
                className={`${styles.filterChip} ${shiftFilter === 'completed' ? styles.filterChipActive : ''}`}
                onClick={() => setShiftFilter('completed')}
              >
                已完成 ({shiftMetrics.completedCount})
              </button>
            </div>
          </div>
        )}

        {/* 班次卡片網格 Grid */}
        {filteredShifts.length > 0 ? (
          <div className={styles.workGlanceGrid}>
            {displayedShifts.map((shift) => {
              const isToday = shift.status.startsWith('today');
              const isPast = shift.status === 'completed';
              const isInProgress = shift.status === 'today_in_progress';

              const cardClass = `${styles.shiftCard} ${
                isInProgress ? styles.shiftCardInProgress : isToday ? styles.shiftCardToday : isPast ? styles.shiftCardPast : ''
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
                  onClick={() => handleOpenEditShift(shift)}
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

                  <div className={styles.shiftRoleTitle} title={shift.title}>
                    {shift.title}
                  </div>

                  <div className={styles.shiftMetaRow}>
                    <span className={styles.shiftTime}>
                      🕒 {shift.startTime} - {shift.endTime}
                    </span>
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
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              前往打工月曆安排班次 →
            </Link>
          </div>
        )}

        {/* 展開/收合更多班次按鈕 */}
        {filteredShifts.length > 8 && (
          <button
            type="button"
            className={styles.expandShiftsBtn}
            onClick={() => setIsShiftsExpanded((prev) => !prev)}
          >
            {isShiftsExpanded
              ? '收合部分班次 ▴'
              : `展開查看全部 (${filteredShifts.length} 班) ▾`}
          </button>
        )}
      </div>

      {/* ===== 4. 今日整合行程 + 本月薪資統計 ===== */}
      <div className={styles.dualSection}>
        {/* 左欄：今日課程時間軸 */}
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

        {/* 右欄：本月薪資統計 */}
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>💼 本月薪資統計</span>
            <Link href="/tools/salary" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
              詳細紀錄 →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 總收入 */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(184, 126, 107, 0.12)',
              border: '1px dashed rgba(184, 126, 107, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '2px' }}>本月總收入</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  NT$ {thisMonthSalaryStats.totalPay.toLocaleString()}
                </div>
              </div>
              <span style={{ fontSize: '2rem' }}>💰</span>
            </div>

            {/* 總工時 + 工作天數 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(95, 113, 134, 0.1)',
                border: '1px dashed rgba(95, 113, 134, 0.3)',
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '4px' }}>總工時</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                  {thisMonthSalaryStats.totalHours.toFixed(2)} h
                </div>
              </div>
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '4px' }}>工作天數</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fbbf24' }}>
                  {thisMonthSalaryStats.workDays} 天
                </div>
              </div>
            </div>

            {/* 無記錄提示 */}
            {thisMonthSalaryStats.workDays === 0 && (
              <div className={styles.emptyBlock}>
                <span className={styles.emptyEmoji}>📋</span>
                <span>本月尚無打工記錄</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 班次編輯器（直接覆用打工月曆之編輯元件） */}
      <WorkShiftEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingShift(null);
        }}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
        shift={editingShift}
        mode="edit"
        existingCourses={courses}
        existingShifts={shifts}
      />
    </div>
  );
}
