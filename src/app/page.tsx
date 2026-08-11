'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  SchoolIcon,
  BriefcaseIcon,
  WalletIcon,
  CalendarIcon,
  ToolboxIcon,
} from '@/components/Icons';
import { TimelineItem } from '@/components/VisualComponents';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useAllowanceData } from '@/hooks/useAllowanceData';
import { useSalaryData } from '@/hooks/useSalaryData';
import { useAuth } from '@/context/AuthContext';
import LoginPrompt from '@/components/LoginPrompt';
import { formatDateForCopy, calculateKongBalance } from '@/data/allowance';
import { LoadingSpinner } from '@/components/Loading';
import QuickActionModal from '@/components/QuickActionModal';
import CommandPalette from '@/components/CommandPalette';
import FloatingQuickActions from '@/components/FloatingQuickActions';
import styles from './page.module.css';

export default function Home() {
  const { user, loading: authLoading } = useAuth();

  // 資料 Hooks
  const { courses, shifts, events } = useScheduleData();
  const { records: allowanceRecords } = useAllowanceData();
  const { records: salaryRecords } = useSalaryData();

  const {
    currentTimeStr,
    currentDayOfWeek,
    thisWeekClasses,
    thisMonthWorkDays,
    nextEvent,
    currentEvent,
    todayTimeline,
    monthlyWorkShifts,
    upcomingImportantEvents,
  } = useHomeDashboard(courses, shifts, events);

  // 彈窗 Modal 狀態
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickModalTab, setQuickModalTab] = useState<'allowance' | 'work'>('allowance');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // 動態進度條計算與即時秒鐘計時器
  const [nowDate, setNowDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 10000); // 每 10 秒更新一次
    return () => clearInterval(timer);
  }, []);

  // 鍵盤 Ctrl+K 全局監聽
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const latestAllowance = allowanceRecords.length > 0 ? allowanceRecords[0] : null;

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

  // 招呼語
  const hour = nowDate.getHours();
  const greetingStr =
    hour < 12 ? '☀️ 早安' : hour < 18 ? '☕ 下午好' : '🌙 晚上好';

  return (
    <div className={styles.pageContainer}>
      {/* ===== 1. 頂部動態問候與快捷按鈕列 ===== */}
      <div className={styles.heroGreeting}>
        <div className={styles.greetingText}>
          <div className={styles.greetingTitle}>
            {greetingStr}，{user.displayName || '使用者'}！
          </div>
          <div className={styles.greetingSubtitle}>
            今天是 {nowDate.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>

        <div className={styles.quickActionBar}>
          <button
            className={styles.quickBtn}
            onClick={() => {
              setQuickModalTab('allowance');
              setQuickModalOpen(true);
            }}
          >
            <span>💵 記生活費</span>
          </button>

          <button
            className={styles.quickBtn}
            onClick={() => {
              setQuickModalTab('work');
              setQuickModalOpen(true);
            }}
          >
            <span>💼 登記打工</span>
          </button>

          <button
            className={styles.quickBtn}
            onClick={() => setCommandPaletteOpen(true)}
          >
            <span>🔍 搜尋 (Ctrl+K)</span>
          </button>
        </div>
      </div>

      {/* ===== 2. 核心 Highlights 雙欄 Grid ===== */}
      <div className={styles.heroGrid}>
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

        {/* 右側：生活費小帳簿卡片 */}
        <div className={styles.allowanceCard}>
          <div className={styles.allowanceCardHeader}>
            <div className={styles.allowanceTitle}>
              <WalletIcon size={20} />
              <span>生活費帳簿摘要</span>
            </div>
            <button
              onClick={() => {
                setQuickModalTab('allowance');
                setQuickModalOpen(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + 記一筆
            </button>
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
              <button
                className={styles.quickBtn}
                onClick={() => {
                  setQuickModalTab('allowance');
                  setQuickModalOpen(true);
                }}
              >
                建立第一筆記錄
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== 3. 中間二合一 Section (今日時間軸 + 即將到來) ===== */}
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
                  {thisMonthSalaryStats.totalHours.toFixed(1)} h
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

      {/* ===== 4. 底部打工 Glance ===== */}
      {monthlyWorkShifts.length > 0 && (
        <div className={styles.workGlanceCard}>
          <div className={styles.workGlanceHeader}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BriefcaseIcon size={20} />
              <span>本月打工安排 Glance ({monthlyWorkShifts.length} 天)</span>
            </div>
            <Link
              href="/schedule/work"
              style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none' }}
            >
              打工月曆詳情 →
            </Link>
          </div>

          <div className={styles.workGlanceGrid}>
            {monthlyWorkShifts.slice(0, 12).map((shift) => (
              <div key={shift.id} className={styles.shiftPill}>
                <span className={styles.shiftDate}>{shift.date.slice(5)}</span>
                <span className={styles.shiftTime}>
                  {shift.startTime} - {shift.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 彈窗與全域 Floating Speed Dial ===== */}
      <QuickActionModal
        isOpen={quickModalOpen}
        initialTab={quickModalTab}
        onClose={() => setQuickModalOpen(false)}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenQuickModal={(tab) => {
          setQuickModalTab(tab);
          setQuickModalOpen(true);
        }}
      />

      <FloatingQuickActions
        onOpenQuickModal={(tab) => {
          setQuickModalTab(tab);
          setQuickModalOpen(true);
        }}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />
    </div>
  );
}
