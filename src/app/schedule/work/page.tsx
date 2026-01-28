'use client';
import { useState } from 'react';
import { type WorkShift } from '../../../data/schedule';
import { useWorkCalendar } from '../../../hooks/useWorkCalendar';
import { useScheduleData } from '../../../hooks/useScheduleData';
import { useAuth } from '../../../context/AuthContext';
import LoginPrompt from '../../../components/LoginPrompt';
import WorkShiftEditor from '../../../components/WorkShiftEditor';
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
  
  // 使用新的資料管理 hook
  const { shifts, addWorkShift } = useScheduleData();
  
  const { currentMonth, selectedDate, changeMonth, getDaysInMonth, getShiftsForDate, currentMonthShifts, handleDateClick } =
    useWorkCalendar(shifts);

  const { days, startDay } = getDaysInMonth(currentMonth);

  // ========== 拖曳相關狀態 ==========
  const [draggedShift, setDraggedShift] = useState<WorkShift | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  // ========== 多選相關狀態 ==========
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // ========== 編輯器狀態 ==========
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'add' | 'batch'>('add');
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // 檢查登入狀態
  if (authLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>載入中...</div>;
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
    
    // 檢查目標日期是否已有班次
    const existingShifts = getShiftsForDate(day);
    if (existingShifts.length > 0) {
      alert('此日期已有班次，無法複製');
      return;
    }

    // 複製班次到新日期
    const newShift: WorkShift = {
      id: `shift-${Date.now()}-${Math.random()}`,
      date: targetDate,
      startTime: draggedShift.startTime,
      endTime: draggedShift.endTime,
      note: draggedShift.note,
    };

    addWorkShift(newShift);
    setDraggedShift(null);
  };

  // ========== 多選功能 ==========
  const handleDayClick = (day: number, e: React.MouseEvent) => {
    const shifts = getShiftsForDate(day);
    
    // Ctrl/Cmd 點擊：多選模式
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      // 只能選擇空白日期
      if (shifts.length > 0) {
        return;
      }

      setIsMultiSelectMode(true);
      
      if (selectedDays.includes(day)) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      } else {
        setSelectedDays([...selectedDays, day]);
      }
    } 
    // 一般點擊：有班次則顯示詳情
    else if (shifts.length > 0) {
      handleDateClick(day);
    }
    // 點擊空白日期：開啟單日新增
    else {
      setEditingDate(formatDate(day));
      setEditorMode('add');
      setIsEditorOpen(true);
    }
  };

  // 批次新增班次
  const handleBatchAdd = () => {
    if (selectedDays.length === 0) {
      alert('請先選擇日期（按住 Ctrl 點擊多個空白日期）');
      return;
    }
    setEditorMode('batch');
    setIsEditorOpen(true);
  };

  // 儲存班次
  const handleSaveShift = (shift: WorkShift) => {
    if (editorMode === 'add') {
      addWorkShift(shift);
    } else if (editorMode === 'batch') {
      // 批次新增到所有選中的日期
      selectedDays.forEach(day => {
        const newShift: WorkShift = {
          id: `shift-${Date.now()}-${Math.random()}-${day}`,
          date: formatDate(day),
          startTime: shift.startTime,
          endTime: shift.endTime,
          note: shift.note,
        };
        addWorkShift(newShift);
      });
      
      // 清空選擇
      setSelectedDays([]);
      setIsMultiSelectMode(false);
    }
  };

  // 取消多選模式
  const handleCancelMultiSelect = () => {
    setSelectedDays([]);
    setIsMultiSelectMode(false);
  };

  // 快速套用模板
  const handleApplyTemplate = (template: typeof SHIFT_TEMPLATES[0]) => {
    if (selectedDays.length === 0) {
      alert('請先選擇日期（按住 Ctrl 點擊多個空白日期）');
      return;
    }

    if (!confirm(`確定要將「${template.name}」套用到 ${selectedDays.length} 個日期嗎？`)) {
      return;
    }

    selectedDays.forEach(day => {
      const newShift: WorkShift = {
        id: `shift-${Date.now()}-${Math.random()}-${day}`,
        date: formatDate(day),
        startTime: template.startTime,
        endTime: template.endTime,
        note: template.note,
      };
      addWorkShift(newShift);
    });

    setSelectedDays([]);
    setIsMultiSelectMode(false);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={`glass ${styles.calendarContainer}`}>
        {/* Work Month Calendar */}
        <div>
          <div className="calendar-header">
            <button
              onClick={() => changeMonth(-1)}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}
            >
              &larr; 上個月
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}
            >
              下個月 &rarr;
            </button>
          </div>

          {/* 多選提示與操作區 */}
          {isMultiSelectMode && (
            <div className={styles.multiSelectBar}>
              <div className={styles.multiSelectInfo}>
                已選擇 {selectedDays.length} 個日期
              </div>
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

          {/* 功能提示 */}
          <div className={styles.hints}>
            <span className={styles.hint}>💡 拖曳班次到其他日期可快速複製</span>
            <span className={styles.hint}>💡 按住 Ctrl 點擊多個空白日期可批次新增</span>
            <span className={styles.hint}>💡 點擊空白日期可新增單一班次</span>
          </div>

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
              const shifts = getShiftsForDate(day);
              const hasShifts = shifts.length > 0;
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
                  style={{ cursor: hasShifts ? 'pointer' : 'default' }}
                >
                  <div
                    className={`${styles.dayNumber} ${
                      hasShifts ? styles.dayNumberWithShift : styles.dayNumberEmpty
                    }`}
                  >
                    {day}
                  </div>
                  {shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className={styles.shiftBadge}
                      draggable
                      onDragStart={(e) => handleDragStart(shift, e)}
                    >
                      {shift.note || '打工'}
                    </div>
                  ))}
                  {isSelected && (
                    <div className={styles.selectedOverlay}>✓</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 詳細列表 */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>本月詳細列表</h3>
            <div className={styles.shiftsGrid}>
              {currentMonthShifts.map((shift: WorkShift) => {
                const isSelected = selectedDate === shift.date;
                return (
                  <div
                    key={shift.id}
                    data-date={shift.date}
                    className={`${styles.shiftCard} ${isSelected ? styles.shiftCardSelected : styles.shiftCardNormal}`}
                  >
                    <div className={styles.shiftDate}>{shift.date.split('-')[2]}日</div>
                    <div className={styles.shiftDetails}>
                      <div className={styles.shiftName}>{shift.note}</div>
                      <div className={styles.shiftTime}>
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 班次編輯器 */}
      <WorkShiftEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingDate(null);
        }}
        onSave={handleSaveShift}
        shift={editingDate ? { id: '', date: editingDate, startTime: '09:00', endTime: '18:00', note: '' } as WorkShift : null}
        mode="add"
      />
    </div>
  );
}
