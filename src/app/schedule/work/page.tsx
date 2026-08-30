'use client';
import { useState } from 'react';
import { generateWorkShiftId, type WorkShift } from '../../../data/schedule';
import { useWorkCalendar } from '../../../hooks/useWorkCalendar';
import { useScheduleData } from '../../../hooks/useScheduleData';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import LoginPrompt from '../../../components/LoginPrompt';
import WorkShiftEditor from '../../../components/WorkShiftEditor';
import { LoadingSpinner } from '../../../components/Loading';
import { useShiftTemplates } from '@/hooks/useShiftTemplates';
import { useWorkRoles } from '@/hooks/useWorkRoles';
import type { ShiftTemplate } from '@/data/shiftTemplates';
import { getWorkRoleHourlyRate, getWorkRoleLabel } from '@/data/workRoles';
import {
  findWorkShiftConflicts,
  formatConflictMessage,
} from '@/utils/scheduleConflicts';
import styles from './page.module.css';

/**
 * 依據打工角色 (role) 與內容名稱 (title) 動態計算 Woven & Weft 大地色系標籤樣式
 */
const getShiftBadgeStyle = (title: string, role?: string) => {
  const isInstructor = role === 'instructor' || title.includes('講師');
  const isAssistant = role === 'assistant' || title.includes('助教');

  // 講師：暖陶琥珀色 (#c88d55)
  if (isInstructor) {
    return { background: '#c88d55', color: '#f0ece1' };
  }

  // 助教（且沒有其他特殊分類）：石板藍色 (#5f7186)
  if (isAssistant) {
    return { background: '#5f7186', color: '#f0ece1' };
  }

  // 其他打工類別：依名稱 Hash 散列其他大地色票
  const palette = [
    { background: '#b87e6b', color: '#f0ece1' }, // 鐵鏽紅 (Terracotta)
    { background: '#6b8e78', color: '#f0ece1' }, // 鼠尾草綠 (Sage Green)
    { background: '#886b86', color: '#f0ece1' }, // 灰紫紅 (Plum Slate)
    { background: '#78716c', color: '#f0ece1' }, // 溫暖炭棕 (Warm Taupe)
    { background: '#9e6d5b', color: '#f0ece1' }, // 深紅陶色
  ];

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
};

export default function WorkSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  // 使用個人資料 Hook，避免不同 Google 帳號共用班表
  const {
    courses,
    shifts,
    addWorkShift,
    updateWorkShift,
    deleteWorkShift,
    canSyncToFamilyWeb,
    syncAllWorkShiftsToFamilyWeb,
  } = useScheduleData();
  const { templates, loading: templatesLoading } = useShiftTemplates();
  const { roles } = useWorkRoles();
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    currentMonth,
    selectedDate,
    changeMonth,
    getDaysInMonth,
    getShiftsForDate,
    currentMonthShifts,
    handleDateClick,
  } = useWorkCalendar(shifts);

  const { days, startDay } = getDaysInMonth(currentMonth);
  const [monthDirection, setMonthDirection] = useState<'previous' | 'next'>('next');
  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}`;

  const handleMonthChange = (offset: number) => {
    setMonthDirection(offset < 0 ? 'previous' : 'next');
    changeMonth(offset);
  };

  // ========== 拖曳相關狀態 ==========
  const [draggedShift, setDraggedShift] = useState<WorkShift | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  // ========== 多選相關狀態 ==========
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // ========== 編輯器狀態 ==========
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'add' | 'edit' | 'batch'>('add');
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);

  // 檢查登入狀態
  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPrompt />;
  }

  /**
   * 格式化日期為 YYYY-MM-DD
   */
  const formatDate = (day: number): string => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const confirmShiftConflicts = async (candidates: WorkShift[]): Promise<boolean> => {
    const conflicts = candidates.flatMap((candidate) =>
      findWorkShiftConflicts(candidate, courses, [...shifts, ...candidates], candidate.id)
    );
    if (conflicts.length === 0) return true;

    return confirm({
      title: '發現重複班表衝突',
      message: formatConflictMessage(conflicts),
      confirmText: '仍要建立',
    });
  };

  // ========== 拖曳功能 ==========
  const handleDragStart = (shift: WorkShift, e: React.DragEvent) => {
    setDraggedShift(shift);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (day: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = async (day: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDay(null);

    if (!draggedShift) return;

    const targetDate = formatDate(day);

    // 複製班次到新日期
    const newShift: WorkShift = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: targetDate,
      startTime: draggedShift.startTime,
      endTime: draggedShift.endTime,
      note: draggedShift.note,
      shiftCategory: draggedShift.shiftCategory || draggedShift.note,
      role: draggedShift.role || 'assistant',
      roleName: draggedShift.roleName || getWorkRoleLabel(draggedShift.role || 'assistant', roles),
      hourlyRate: draggedShift.hourlyRate ?? getWorkRoleHourlyRate(draggedShift.role, roles),
      workHours: draggedShift.workHours,
    };

    if (!(await confirmShiftConflicts([newShift]))) return;

    await addWorkShift(newShift);
    toast.success(`已將班次複製到 ${targetDate}`);
    setDraggedShift(null);
  };

  // ========== 多選與日期點擊功能 ==========
  const handleDayClick = (day: number, e: React.MouseEvent) => {
    const dayShifts = getShiftsForDate(day);

    // 進入多選模式後，直接點擊日期即可加入或移除選取，不需要按住 Ctrl。
    if (isMultiSelectMode || e.ctrlKey || e.metaKey) {
      e.preventDefault();

      setIsMultiSelectMode(true);

      if (selectedDays.includes(day)) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      } else {
        setSelectedDays([...selectedDays, day]);
      }
    }
    // 一般點擊有班次的日期：捲動到下方列表並標記選擇
    else if (dayShifts.length > 0) {
      handleDateClick(day);
    }
    // 點擊空白日期：開啟新增彈窗
    else {
      const dateStr = formatDate(day);
      setEditingShift({
        id: '',
        date: dateStr,
        startTime: '09:00',
        endTime: '18:00',
        role: roles[0]?.id || 'assistant',
        roleName: getWorkRoleLabel(roles[0]?.id || 'assistant', roles),
        hourlyRate: getWorkRoleHourlyRate(roles[0]?.id || 'assistant', roles),
        note: '',
      } as WorkShift);
      setEditorMode('add');
      setIsEditorOpen(true);
    }
  };

  const handleStartMultiSelect = () => {
    setSelectedDays([]);
    setIsMultiSelectMode(true);
  };

  // 開啟編輯指定班表
  const handleOpenEditShift = (shift: WorkShift, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setEditingShift(shift);
    setEditorMode('edit');
    setIsEditorOpen(true);
  };

  // 刪除指定班表
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
      await deleteWorkShift(shiftId);
      toast.success('已刪除打工班表與薪資記錄');
    }
  };

  // 批次新增班次
  const handleBatchAdd = () => {
    if (selectedDays.length === 0) {
      toast.info('請先點擊選取多個日期');
      return;
    }
    setEditingShift(null);
    setEditorMode('batch');
    setIsEditorOpen(true);
  };

  // 儲存班次 (新增 / 編輯 / 批次)
  const handleSaveShift = async (shift: WorkShift): Promise<boolean> => {
    const candidates: WorkShift[] =
      editorMode === 'edit'
        ? [shift]
        : editorMode === 'batch'
          ? selectedDays.map((day) => ({
              ...shift,
              id: generateWorkShiftId(),
              date: formatDate(day),
            }))
          : [shift];

    // 編輯器已檢查單筆新增；這裡補檢查批次日期，避免一次建立多筆後才發現衝突。
    const candidatesToCheck = editorMode === 'batch' ? candidates : [];
    if (candidatesToCheck.length > 0) {
      if (!(await confirmShiftConflicts(candidatesToCheck))) return false;
    }

    if (editorMode === 'edit') {
      await updateWorkShift(shift.id, shift);
      toast.success('已成功更新打工班表');
      return true;
    } else if (editorMode === 'add') {
      for (const candidate of candidates) {
        await addWorkShift(candidate);
      }
      toast.success('已成功新增打工班表');
      return true;
    } else if (editorMode === 'batch') {
      for (const candidate of candidates) {
        await addWorkShift(candidate);
      }
      const selectedCount = candidates.length;
      setSelectedDays([]);
      setIsMultiSelectMode(false);
      toast.success(`已成功新增 ${selectedCount} 天班表`);
      return true;
    }

    return false;
  };

  // 取消多選模式
  const handleCancelMultiSelect = () => {
    setSelectedDays([]);
    setIsMultiSelectMode(false);
  };

  // 快速套用模板
  const handleApplyTemplate = async (template: ShiftTemplate) => {
    if (selectedDays.length === 0) {
      toast.info('請先點擊選取多個日期');
      return;
    }

    const confirmed = await confirm({
      title: '套用班次模板',
      message: `確定要將「${template.name}」套用到 ${selectedDays.length} 個日期嗎？`,
      confirmText: '套用',
    });
    if (!confirmed) {
      return;
    }

    const candidates: WorkShift[] = selectedDays.map((day) => ({
      id: generateWorkShiftId(),
      date: formatDate(day),
      startTime: template.startTime,
      endTime: template.endTime,
      note: template.name,
      shiftCategory: template.name,
      role: template.role || roles[0]?.id || 'assistant',
      roleName: getWorkRoleLabel(template.role || roles[0]?.id || 'assistant', roles),
      hourlyRate: template.hourlyRate,
      workHours: template.workHours,
    }));

    if (!(await confirmShiftConflicts(candidates))) return;

    for (const candidate of candidates) {
      await addWorkShift(candidate);
    }

    setSelectedDays([]);
    setIsMultiSelectMode(false);
    toast.success(`已成功為 ${candidates.length} 個日期套用「${template.name}」`);
  };

  // 將目前月份的個人班表手動同步到 family-web
  const handleSyncMonthToFamily = async () => {
    const year = currentMonth.getFullYear();
    const month = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
    const monthPrefix = `${year}-${month}`;

    setIsSyncing(true);
    try {
      const count = await syncAllWorkShiftsToFamilyWeb(monthPrefix);
      if (count > 0) {
        toast.success(`🎉 已將 ${year}年${month}月共 ${count} 筆打工班表同步至家庭月曆！`);
      } else {
        toast.info(`${year}年${month}月目前尚無排班資料。`);
      }
    } catch (error) {
      console.error(error);
      toast.error('同步至家庭月曆失敗');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={`glass ${styles.calendarContainer} page-section-enter`}>
        <div className={styles.calendarContent}>
          {/* 月曆標題區 */}
          <div className={styles.calendarHeader}>
            <button
              onClick={() => handleMonthChange(-1)}
              className={`btn ${styles.monthNavButton} ${styles.previousMonthButton}`}
            >
              &larr; 上個月
            </button>
            <div className={styles.monthHeadingGroup}>
              <h2 className={styles.monthTitle}>
                {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
              </h2>
              <div className={styles.monthActions}>
                {canSyncToFamilyWeb && (
                  <button
                    onClick={handleSyncMonthToFamily}
                    disabled={isSyncing}
                    className={`btn ${styles.headerAction} ${styles.syncButton}`}
                    style={{
                      cursor: isSyncing ? 'not-allowed' : 'pointer',
                      opacity: isSyncing ? 0.7 : 1,
                    }}
                    title="將本月個人打工班表同步至 family-web 家庭月曆"
                  >
                    {isSyncing ? '同步中...' : '同步至家庭月曆'}
                  </button>
                )}
                <button
                  onClick={isMultiSelectMode ? handleCancelMultiSelect : handleStartMultiSelect}
                  className={`btn ${styles.headerAction}`}
                >
                  {isMultiSelectMode ? '取消多選' : '多選日期'}
                </button>
              </div>
            </div>
            <button
              onClick={() => handleMonthChange(1)}
              className={`btn ${styles.monthNavButton} ${styles.nextMonthButton}`}
            >
              下個月 &rarr;
            </button>
          </div>

          {/* 多選提示與操作區 */}
          {isMultiSelectMode && (
            <div className={styles.multiSelectBar}>
              <div className={styles.multiSelectInfo}>
                <span className={styles.multiSelectLabel}>批次套用班表</span>
                <strong>已選擇 {selectedDays.length} 個日期</strong>
                <span className={styles.multiSelectHint}>直接點擊日期即可加入或取消</span>
              </div>
              <div className={styles.multiSelectActions}>
                <button className={`btn ${styles.templateButton}`} onClick={handleBatchAdd}>
                  自訂班表
                </button>
                {templatesLoading ? (
                  <span className={styles.templateLoading}>班表範本載入中...</span>
                ) : templates.length > 0 ? (
                  templates.map((template) => (
                    <button
                      key={template.id}
                      className={`btn ${styles.templateButton}`}
                      onClick={() => handleApplyTemplate(template)}
                    >
                      {template.name}
                    </button>
                  ))
                ) : (
                  <span className={styles.templateLoading}>尚未建立班表範本，請先到薪資計算設定</span>
                )}
              </div>
              <button className={`btn ${styles.cancelButton}`} onClick={handleCancelMultiSelect}>
                取消選取
              </button>
            </div>
          )}

          <div
            key={monthKey}
            className={`${styles.calendarGrid} ${
              monthDirection === 'previous'
                ? styles.calendarGridPrevious
                : styles.calendarGridNext
            }`}
          >
          {/* 週標題 */}
          <div className={styles.weekdaysGrid}>
            {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
              <div key={d} className={styles.weekdayLabel}>
                {d}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className={styles.daysGrid}>
            {/* 月初空白格 */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className={styles.emptyCell} />
            ))}

            {/* 日期 */}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const dayShifts = getShiftsForDate(day);
              const hasShifts = dayShifts.length > 0;
              const isSelected = selectedDays.includes(day);
              const isDragOver = dragOverDay === day;

              return (
                <div
                  key={day}
                  onClick={(e) => handleDayClick(day, e)}
                  onDragOver={(e) => handleDragOver(day, e)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(day, e)}
                  className={`${styles.dayCell} ${
                    hasShifts ? styles.dayCellWithShift : styles.dayCellEmpty
                  } ${isSelected ? styles.dayCellSelected : ''} ${
                    isDragOver ? styles.dayCellDragOver : ''
                  } ${hasShifts ? 'card' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    className={`${styles.dayNumber} ${
                      hasShifts ? styles.dayNumberWithShift : styles.dayNumberEmpty
                    }`}
                  >
                    {day}
                  </div>
                  {dayShifts.map((shift) => {
                    const badgeTitle = shift.shiftCategory || shift.note || '打工';
                    const badgeStyle = getShiftBadgeStyle(badgeTitle, shift.role);
                    return (
                      <div
                        key={shift.id}
                        className={styles.shiftBadge}
                        style={{
                          background: badgeStyle.background,
                          color: badgeStyle.color,
                        }}
                        draggable
                        onDragStart={(e) => handleDragStart(shift, e)}
                        onClick={(e) => handleOpenEditShift(shift, e)}
                        title={`點擊編輯：${badgeTitle}`}
                      >
                        {badgeTitle}
                      </div>
                    );
                  })}
                  {isSelected && <div className={styles.selectedOverlay}>✓</div>}
                </div>
              );
            })}
          </div>
          </div>

          {/* 本月詳細列表 */}
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
                  currentMonthShifts.map((shift: WorkShift) => {
                    const isSelected = selectedDate === shift.date;
                    const roleLabel = getWorkRoleLabel(shift.role, roles, shift.roleName);
                    const rate = shift.hourlyRate ?? getWorkRoleHourlyRate(shift.role, roles);
                    const shiftTitle = shift.shiftCategory || shift.note || '打工';
                    const badgeStyle = getShiftBadgeStyle(shiftTitle, shift.role);

                    return (
                      <div
                        key={shift.id}
                        data-date={shift.date}
                        className={`${styles.shiftCard} ${
                          isSelected ? styles.shiftCardSelected : styles.shiftCardNormal
                        }`}
                      >
                        {/* 卡片頁首：日期與角色/時薪 */}
                        <div className={styles.cardHeader}>
                          <div className={styles.shiftDateBadge}>
                            {shift.date.split('-')[2]} 日
                          </div>
                          <div
                            className={styles.roleBadge}
                            style={{
                              background: shift.role === 'instructor' ? 'rgba(200, 141, 85, 0.18)' : 'rgba(95, 113, 134, 0.18)',
                              color: shift.role === 'instructor' ? '#c88d55' : 'var(--color-secondary)',
                              border: shift.role === 'instructor' ? '1px dashed rgba(200, 141, 85, 0.4)' : '1px dashed rgba(95, 113, 134, 0.4)',
                            }}
                          >
                            {roleLabel} ${rate}/h
                          </div>
                        </div>

                        {/* 卡片內文：打工名稱與時間工時 */}
                        <div className={styles.cardBody}>
                          <div
                            className={styles.shiftNameTag}
                            style={{
                              background: badgeStyle.background,
                              color: badgeStyle.color,
                            }}
                          >
                            {shiftTitle}
                          </div>
                          <div className={styles.shiftTimeText}>
                            ⏰ {shift.startTime} - {shift.endTime} ({shift.workHours ?? '-'}小時)
                          </div>
                        </div>

                        {/* 卡片頁尾：操作按鈕 */}
                        <div className={styles.cardFooter}>
                          <button
                            className={`${styles.actionBtn} ${styles.editBtn}`}
                            onClick={() => handleOpenEditShift(shift)}
                            title="編輯班表"
                          >
                            ✏️ 編輯
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            onClick={() => handleDeleteShift(shift.id)}
                            title="刪除班表"
                          >
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
        </div>
      </div>

      {/* 班次編輯器 */}
      <WorkShiftEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingShift(null);
        }}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
        shift={editingShift}
        mode={editorMode === 'edit' ? 'edit' : 'add'}
        existingCourses={editorMode === 'batch' ? [] : courses}
        existingShifts={editorMode === 'batch' ? [] : shifts}
      />
    </div>
  );
}
