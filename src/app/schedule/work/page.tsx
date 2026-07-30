'use client';
import { useState } from 'react';
import { type WorkShift } from '../../../data/schedule';
import { useWorkCalendar } from '../../../hooks/useWorkCalendar';
import { useScheduleData } from '../../../hooks/useScheduleData';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import LoginPrompt from '../../../components/LoginPrompt';
import WorkShiftEditor from '../../../components/WorkShiftEditor';
import { LoadingSpinner } from '../../../components/Loading';
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
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <button
              onClick={() => changeMonth(-1)}
              className="btn"
              style={{ flexShrink: 0 }}
            >
              &larr; 上個月
            </button>
            <h2 
              style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                margin: 0, 
                color: 'var(--foreground)',
                textAlign: 'center',
                flex: 1,
              }}
            >
              {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="btn"
              style={{ flexShrink: 0 }}
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
                        <div className={styles.shiftDate}>{shift.date.split('-')[2]}日</div>
                        <div className={styles.shiftDetails}>
                          <div 
                            className={styles.shiftName}
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              background: badgeStyle.background,
                              color: badgeStyle.color,
                            }}
                          >
                            {shiftTitle}
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
