'use client';
import { useState } from 'react';
import Link from 'next/link';
import { type WorkShift } from '../../../data/schedule';
import { useWorkCalendar } from '../../../hooks/useWorkCalendar';
import { useScheduleData } from '../../../hooks/useScheduleData';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import LoginPrompt from '../../../components/LoginPrompt';
import WorkShiftEditor from '../../../components/WorkShiftEditor';
import { LoadingSpinner } from '../../../components/Loading';
import { exportToICS, CalendarEventItem } from '@/utils/icsExport';
import styles from './page.module.css';

/**
 * 班次模板定義
 */
const SHIFT_TEMPLATES = [
  { name: '秋季班', startTime: '09:00', endTime: '18:00', note: '秋季班' },
  { name: '冬令營助教', startTime: '09:00', endTime: '18:00', note: '冬令營助教' },
  { name: '半天班 (上午)', startTime: '09:00', endTime: '13:00', note: '半天班' },
  { name: '半天班 (下午)', startTime: '13:00', endTime: '18:00', note: '半天班' },
];

export default function WorkSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  // 使用共享資料 Hook（包含 CRUD 操作）
  const { shifts, addWorkShift, updateWorkShift, deleteWorkShift } = useScheduleData();

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

  const handleDrop = (day: number, e: React.DragEvent) => {
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
      hourlyRate: draggedShift.hourlyRate || 200,
      workHours: draggedShift.workHours,
    };

    addWorkShift(newShift);
    toast.success(`已將班次複製到 ${targetDate}`);
    setDraggedShift(null);
  };

  // ========== 多選與日期點擊功能 ==========
  const handleDayClick = (day: number, e: React.MouseEvent) => {
    const dayShifts = getShiftsForDate(day);

    // Ctrl/Cmd 點擊：多選模式
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();

      if (dayShifts.length > 0) {
        return;
      }

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
        role: 'assistant',
        hourlyRate: 200,
        note: '',
      } as WorkShift);
      setEditorMode('add');
      setIsEditorOpen(true);
    }
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
      toast.info('請先選擇日期（按住 Ctrl 點擊多個空白日期）');
      return;
    }
    setEditingShift(null);
    setEditorMode('batch');
    setIsEditorOpen(true);
  };

  // 儲存班次 (新增 / 編輯 / 批次)
  const handleSaveShift = async (shift: WorkShift) => {
    if (editorMode === 'edit') {
      await updateWorkShift(shift.id, shift);
      toast.success('已成功更新打工班表');
    } else if (editorMode === 'add') {
      await addWorkShift(shift);
      toast.success('已成功新增打工班表');
    } else if (editorMode === 'batch') {
      for (const day of selectedDays) {
        const newShift: WorkShift = {
          ...shift,
          id: `shift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${day}`,
          date: formatDate(day),
        };
        await addWorkShift(newShift);
      }
      setSelectedDays([]);
      setIsMultiSelectMode(false);
      toast.success(`已成功新增 ${selectedDays.length} 天班表`);
    }
  };

  // 取消多選模式
  const handleCancelMultiSelect = () => {
    setSelectedDays([]);
    setIsMultiSelectMode(false);
  };

  // 快速套用模板
  const handleApplyTemplate = async (template: (typeof SHIFT_TEMPLATES)[0]) => {
    if (selectedDays.length === 0) {
      toast.info('請先選擇日期（按住 Ctrl 點擊多個空白日期）');
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

    for (const day of selectedDays) {
      const newShift: WorkShift = {
        id: `shift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${day}`,
        date: formatDate(day),
        startTime: template.startTime,
        endTime: template.endTime,
        note: template.note,
        shiftCategory: template.note,
        role: 'assistant',
        hourlyRate: 200,
      };
      await addWorkShift(newShift);
    }

    setSelectedDays([]);
    setIsMultiSelectMode(false);
    toast.success(`已成功為 ${selectedDays.length} 個日期套用模板`);
  };

  // 匯出打工班表 .ics
  const handleExportICS = () => {
    if (shifts.length === 0) {
      toast.warning('目前尚無打工班表可匯出');
      return;
    }

    const events: CalendarEventItem[] = shifts.map((s) => {
      const [startH, startM] = s.startTime.split(':').map(Number);
      const [endH, endM] = s.endTime.split(':').map(Number);

      const startDate = new Date(`${s.date}T00:00:00`);
      startDate.setHours(startH, startM, 0);

      const endDate = new Date(`${s.date}T00:00:00`);
      endDate.setHours(endH, endM, 0);

      return {
        title: `[打工] ${s.shiftCategory || s.note || s.location || '打工'}`,
        location: s.location || '單位',
        startDate,
        endDate,
        description: s.note ? `備註: ${s.note}` : '打工班表',
      };
    });

    exportToICS('打工班表', events, 'work_shifts.ics');
    toast.success('🎉 成功匯出打工班表 .ics 行事曆檔！');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="glass" style={{ padding: '1.5rem', minHeight: '600px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* 月曆標題區 */}
          <div
            className="calendar-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <button
              onClick={() => changeMonth(-1)}
              className="btn"
            >
              &larr; 上個月
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'var(--foreground)' }}>
              {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
            </h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={handleExportICS}
                style={{
                  padding: '6px 14px',
                  borderRadius: '99px',
                  background: 'rgba(95, 113, 134, 0.15)',
                  color: 'var(--color-secondary)',
                  border: '1px dashed rgba(95, 113, 134, 0.4)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                📅 匯出班表 (.ics)
              </button>
              <Link
                href={`/tools/salary?month=${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: '99px',
                  background: 'rgba(184, 126, 107, 0.15)',
                  color: 'var(--color-primary)',
                  border: '1px dashed rgba(184, 126, 107, 0.4)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                💰 檢視本月薪資
              </Link>
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="btn"
            >
              下個月 &rarr;
            </button>
          </div>

          {/* 多選提示與操作區 */}
          {isMultiSelectMode && (
            <div className={styles.multiSelectBar}>
              <div className={styles.multiSelectInfo}>已選擇 {selectedDays.length} 個日期</div>
              <div className={styles.multiSelectActions}>
                <button className={`btn ${styles.templateButton}`} onClick={handleBatchAdd}>
                  📝 批次新增
                </button>
                {SHIFT_TEMPLATES.map((template, idx) => (
                  <button
                    key={idx}
                    className={`btn ${styles.templateButton}`}
                    onClick={() => handleApplyTemplate(template)}
                  >
                    ⚡ {template.name}
                  </button>
                ))}
                <button className={`btn ${styles.cancelButton}`} onClick={handleCancelMultiSelect}>
                  取消
                </button>
              </div>
            </div>
          )}

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
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className={styles.shiftBadge}
                      draggable
                      onDragStart={(e) => handleDragStart(shift, e)}
                      onClick={(e) => handleOpenEditShift(shift, e)}
                      title="點擊編輯班表"
                    >
                      {shift.shiftCategory || shift.note || '打工'}
                    </div>
                  ))}
                  {isSelected && <div className={styles.selectedOverlay}>✓</div>}
                </div>
              );
            })}
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
                <span className={styles.hintInline}>Ctrl多選</span>
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
                    const roleLabel = shift.role === 'instructor' ? '講師' : '助教';
                    const rate = shift.hourlyRate || (shift.role === 'instructor' ? 500 : 200);

                    return (
                      <div
                        key={shift.id}
                        data-date={shift.date}
                        className={`${styles.shiftCard} ${
                          isSelected ? styles.shiftCardSelected : styles.shiftCardNormal
                        }`}
                      >
                        <div className={styles.shiftDate}>{shift.date.split('-')[2]}日</div>
                        <div className={styles.shiftDetails}>
                          <div className={styles.shiftName}>
                            {shift.shiftCategory || shift.note || '打工'}
                          </div>
                          <div className={styles.shiftTime}>
                            {shift.startTime} - {shift.endTime} ({shift.workHours ?? '-'}h)
                          </div>
                          <div className={styles.shiftMeta}>
                            <span className={styles.roleBadge}>
                              {roleLabel} ${rate}/h
                            </span>
                          </div>
                        </div>
                        <div className={styles.shiftActions}>
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
      />
    </div>
  );
}
