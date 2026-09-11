'use client';
import { useState } from 'react';
import { generateWorkShiftId, type WorkShift } from '../../../data/schedule';
import { useWorkCalendar } from '../../../hooks/useWorkCalendar';
import { useScheduleData } from '../../../hooks/useScheduleData';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import LoginPrompt from '../../../components/shared/LoginPrompt';
import WorkShiftEditor from '../../../components/schedule/work/WorkShiftEditor';
import { LoadingSpinner } from '../../../components/shared/Loading';
import { useShiftTemplates } from '@/hooks/useShiftTemplates';
import { useWorkRoles } from '@/hooks/useWorkRoles';
import type { ShiftTemplate } from '@/data/shiftTemplates';
import { getWorkRoleHourlyRate, getWorkRoleLabel } from '@/data/workRoles';
import WorkCalendarView from '@/components/schedule/work/WorkCalendarView';
import {
  findWorkShiftConflicts,
  formatConflictMessage,
} from '@/utils/scheduleConflicts';
import styles from './page.module.css';

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
    // 一般點擊日期（無論有無班次）：
    // 若該天已有班次，同步標記選擇該日期，並開啟該日期的「新增打工班表」彈窗！
    else {
      const dateStr = formatDate(day);
      if (dayShifts.length > 0) {
        handleDateClick(day);
      }
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

  const handleAddShiftForDay = (day: number) => {
    const dateStr = formatDate(day);
    handleDateClick(day);
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

          <WorkCalendarView
            days={days}
            startDay={startDay}
            monthKey={monthKey}
            monthDirection={monthDirection}
            selectedDate={selectedDate}
            currentMonthShifts={currentMonthShifts}
            selectedDays={selectedDays}
            dragOverDay={dragOverDay}
            roles={roles}
            getShiftsForDate={getShiftsForDate}
            onDayClick={handleDayClick}
            onAddShift={handleAddShiftForDay}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onOpenEditShift={handleOpenEditShift}
            onDeleteShift={handleDeleteShift}
          />
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
