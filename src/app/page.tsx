'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useAllowanceData } from '@/hooks/useAllowanceData';
import { useSalaryData } from '@/hooks/useSalaryData';
import { useAuth } from '@/context/AuthContext';
import LoginPrompt from '@/components/shared/LoginPrompt';
import { LoadingSpinner } from '@/components/shared/Loading';
import WorkShiftEditor from '@/components/schedule/work/WorkShiftEditor';
import HomeLiveFocus from '@/components/home/HomeLiveFocus';
import HomeWorkGlance, { type AnalyzedShift, type ShiftMetrics } from '@/components/home/HomeWorkGlance';
import HomeTimelineAndSalary from '@/components/home/HomeTimelineAndSalary';
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
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? parseFloat((diff / 60).toFixed(1)) : 0;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
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

  const [nowDate, setNowDate] = useState(new Date());
  const [shiftFilter, setShiftFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [isShiftsExpanded, setIsShiftsExpanded] = useState(false);
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

    if (!confirmed) return;

    try {
      await deleteWorkShift(shiftId);
      toast.success('已刪除打工班表與薪資記錄');
      setIsEditorOpen(false);
      setEditingShift(null);
    } catch {
      toast.error('刪除班表失敗，請稍後再試');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const latestAllowance = allowanceRecords.length > 0 ? allowanceRecords[0] : null;
  const todayDateStr = useMemo(() => {
    const y = nowDate.getFullYear();
    const m = String(nowDate.getMonth() + 1).padStart(2, '0');
    const d = String(nowDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [nowDate]);

  const analyzedShifts = useMemo<AnalyzedShift[]>(() => {
    return monthlyWorkShifts.map((shift) => {
      const shiftDate = new Date(`${shift.date}T00:00:00`);
      const dayOfWeek = WEEKDAY_NAMES[shiftDate.getDay()];
      const isWeekend = shiftDate.getDay() === 0 || shiftDate.getDay() === 6;
      const hours = getShiftHours(shift);

      let status: AnalyzedShift['status'] = 'upcoming';
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
        const diffTime = shiftDate.getTime() - new Date(`${todayDateStr}T00:00:00`).getTime();
        daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        statusLabel = daysDiff === 1 ? '明天上班' : `${daysDiff}天後`;
      }

      const title =
        shift.shiftCategory?.trim() ||
        shift.note?.trim() ||
        (shift.role === 'instructor' || shift.roleName === '講師'
          ? '講師'
          : shift.role === 'assistant' || shift.roleName === '助教'
          ? '助教'
          : shift.roleName || '打工班次');

      return { ...shift, dayOfWeek, isWeekend, hours, status, statusLabel, daysDiff, title };
    });
  }, [monthlyWorkShifts, todayDateStr, currentTimeStr]);

  const shiftMetrics = useMemo<ShiftMetrics>(() => {
    const totalCount = analyzedShifts.length;
    const completedShifts = analyzedShifts.filter(
      (s) => s.status === 'completed' || s.status === 'today_completed'
    );
    const upcomingShifts = analyzedShifts.filter(
      (s) => s.status === 'upcoming' || s.status === 'today_upcoming' || s.status === 'today_in_progress'
    );
    const completedCount = completedShifts.length;
    const totalHours = analyzedShifts.reduce((sum, s) => sum + s.hours, 0);
    const completedHours = completedShifts.reduce((sum, s) => sum + s.hours, 0);
    return {
      totalCount,
      completedCount,
      remainingCount: totalCount - completedCount,
      totalHours: parseFloat(totalHours.toFixed(1)),
      completedHours: parseFloat(completedHours.toFixed(1)),
      progressPct: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      nextShift: upcomingShifts[0] || null,
      upcomingCount: upcomingShifts.length,
    };
  }, [analyzedShifts]);

  const filteredShifts = useMemo(() => {
    if (shiftFilter === 'upcoming') {
      return analyzedShifts.filter((s) => s.status !== 'completed' && s.status !== 'today_completed');
    }
    if (shiftFilter === 'completed') {
      return analyzedShifts.filter((s) => s.status === 'completed' || s.status === 'today_completed');
    }
    return analyzedShifts;
  }, [analyzedShifts, shiftFilter]);

  const displayedShifts = isShiftsExpanded ? filteredShifts : filteredShifts.slice(0, 8);
  const currentMonthStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const thisMonthSalaryStats = useMemo(() => {
    const monthRecords = salaryRecords.filter((r) => r.date.startsWith(currentMonthStr));
    return {
      totalPay: monthRecords.reduce((sum, r) => sum + r.workHours * r.hourlyRate, 0),
      totalHours: monthRecords.reduce((sum, r) => sum + r.workHours, 0),
      workDays: monthRecords.length,
    };
  }, [salaryRecords, currentMonthStr]);

  let progressPercent = 0;
  let remainingMinutesStr = '';
  if (currentEvent?.time) {
    const times = currentEvent.time.split(' - ');
    if (times.length === 2) {
      const [startStr, endStr] = times;
      const todayIso = nowDate.toISOString().slice(0, 10);
      const start = new Date(`${todayIso}T${startStr}:00`);
      const end = new Date(`${todayIso}T${endStr}:00`);
      const totalMs = end.getTime() - start.getTime();
      if (totalMs > 0) {
        progressPercent = Math.min(100, Math.max(0, Math.round(((nowDate.getTime() - start.getTime()) / totalMs) * 100)));
        const remainingMs = end.getTime() - nowDate.getTime();
        if (remainingMs > 0) {
          const remMin = Math.ceil(remainingMs / (1000 * 60));
          const hours = Math.floor(remMin / 60);
          const mins = remMin % 60;
          remainingMinutesStr = hours > 0 ? `${hours} 小時 ${mins} 分鐘` : `${mins} 分鐘`;
        }
      }
    }
  }

  if (authLoading) {
    return <div className={styles.pageContainer}><LoadingSpinner /></div>;
  }
  if (!user) return <LoginPrompt />;

  return (
    <div className={styles.pageContainer}>
      <HomeLiveFocus
        showAllowance={SHOW_ALLOWANCE}
        currentEvent={currentEvent}
        nextEvent={nextEvent}
        currentTimeStr={currentTimeStr}
        remainingMinutesStr={remainingMinutesStr}
        progressPercent={progressPercent}
        thisWeekClasses={thisWeekClasses}
        thisMonthWorkDays={thisMonthWorkDays}
        latestAllowance={latestAllowance}
      />

      <HomeWorkGlance
        nowDate={nowDate}
        shiftMetrics={shiftMetrics}
        monthlyTotalPay={thisMonthSalaryStats.totalPay}
        shiftFilter={shiftFilter}
        filteredShifts={filteredShifts}
        displayedShifts={displayedShifts}
        isShiftsExpanded={isShiftsExpanded}
        onShiftFilterChange={setShiftFilter}
        onToggleExpanded={() => setIsShiftsExpanded((prev) => !prev)}
        onOpenEditShift={handleOpenEditShift}
      />

      <HomeTimelineAndSalary
        todayTimeline={todayTimeline}
        currentDayOfWeek={currentDayOfWeek}
        currentTimeStr={currentTimeStr}
        thisMonthSalaryStats={thisMonthSalaryStats}
      />

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
