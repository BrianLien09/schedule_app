'use client';
import { useState } from 'react';
import { useScheduleData } from '../hooks/useScheduleData';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { WorkShift } from '../data/schedule';
import WorkShiftEditor from './WorkShiftEditor';
import styles from './WorkShiftManager.module.css';

/**
 * Work Shift Manager Component
 * 管理打工班表的新增、編輯、刪除和快速複製
 */
export default function WorkShiftManager() {
  const { shifts, addWorkShift, updateWorkShift, deleteWorkShift } = useScheduleData();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add');

  const handleAddShift = () => {
    setEditingShift(null);
    setEditorMode('add');
    setIsEditorOpen(true);
  };

  const handleEditShift = (shift: WorkShift) => {
    setEditingShift(shift);
    setEditorMode('edit');
    setIsEditorOpen(true);
  };

  const handleDeleteShift = async (shift: WorkShift) => {
    const confirmed = await confirm({
      title: '刪除班表',
      message: `確定要刪除 ${shift.date} 的班表嗎？`,
      confirmText: '刪除',
      danger: true,
    });
    if (confirmed) {
      deleteWorkShift(shift.id);
    }
  };

  const handleSaveShift = (shift: WorkShift) => {
    if (editorMode === 'add') {
      addWorkShift(shift);
    } else {
      updateWorkShift(shift.id, shift);
    }
  };

  // 快速複製上週班表
  const handleCopyLastWeek = async () => {
    const now = new Date();
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);

    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(now.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const lastWeekShifts = shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= lastWeekStart && shiftDate <= lastWeekEnd;
    });

    if (lastWeekShifts.length === 0) {
      toast.info('上週沒有班表可以複製');
      return;
    }

    const confirmed = await confirm({
      title: '複製班表',
      message: `確定要複製上週的 ${lastWeekShifts.length} 個班表到本週嗎？`,
    });
    if (!confirmed) {
      return;
    }

    lastWeekShifts.forEach((shift) => {
      const shiftDate = new Date(shift.date);
      shiftDate.setDate(shiftDate.getDate() + 7); // 加7天
      
      const newShift: WorkShift = {
        id: `shift-${Date.now()}-${Math.random()}`,
        date: shiftDate.toISOString().split('T')[0],
        startTime: shift.startTime,
        endTime: shift.endTime,
        note: shift.note,
      };
      
      addWorkShift(newShift);
    });

    toast.success(`已成功複製 ${lastWeekShifts.length} 個班表到本週！`);
  };

  // 快速複製上個月班表
  const handleCopyLastMonth = async () => {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const lastMonthShifts = shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= lastMonthStart && shiftDate <= lastMonthEnd;
    });

    if (lastMonthShifts.length === 0) {
      toast.info('上個月沒有班表可以複製');
      return;
    }

    const confirmed = await confirm({
      title: '複製班表',
      message: `確定要複製上個月的 ${lastMonthShifts.length} 個班表到本月嗎？\n\n日期會自動調整到本月對應的日期。`,
    });
    if (!confirmed) {
      return;
    }

    lastMonthShifts.forEach((shift) => {
      const oldDate = new Date(shift.date);
      const dayOfMonth = oldDate.getDate();
      
      // 創建本月同一天的日期
      const newDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
      
      // 如果本月沒有這一天（例如2月30日），則跳過
      if (newDate.getMonth() !== now.getMonth()) {
        return;
      }
      
      const newShift: WorkShift = {
        id: `shift-${Date.now()}-${Math.random()}`,
        date: newDate.toISOString().split('T')[0],
        startTime: shift.startTime,
        endTime: shift.endTime,
        note: shift.note,
      };
      
      addWorkShift(newShift);
    });

    toast.success('已成功複製班表到本月！');
  };

  const sortedShifts = [...shifts].sort((a, b) => b.date.localeCompare(a.date));

  // 按月分組
  const shiftsByMonth: { [key: string]: WorkShift[] } = {};
  sortedShifts.forEach((shift) => {
    const monthKey = shift.date.substring(0, 7); // YYYY-MM
    if (!shiftsByMonth[monthKey]) {
      shiftsByMonth[monthKey] = [];
    }
    shiftsByMonth[monthKey].push(shift);
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>打工班表管理</h2>
        <div className={styles.headerActions}>
          <button className={`btn ${styles.copyButton}`} onClick={handleCopyLastWeek} title="複製上週班表">
            📋 複製上週
          </button>
          <button className={`btn ${styles.copyButton}`} onClick={handleCopyLastMonth} title="複製上月班表">
            📋 複製上月
          </button>
          <button className={`btn ${styles.addButton}`} onClick={handleAddShift}>
            + 新增班表
          </button>
        </div>
      </div>

      <div className={styles.shiftList}>
        {sortedShifts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💼</div>
            <p>尚未新增任何班表</p>
            <button className="btn" onClick={handleAddShift}>
              新增第一個班表
            </button>
          </div>
        ) : (
          Object.entries(shiftsByMonth).map(([month, monthShifts]) => (
            <div key={month} className={styles.monthGroup}>
              <h3 className={styles.monthTitle}>
                {month.split('-')[0]} 年 {month.split('-')[1]} 月
                <span className={styles.monthCount}>({monthShifts.length} 天)</span>
              </h3>
              <div className={styles.monthShifts}>
                {monthShifts.map((shift) => (
                  <div key={shift.id} className={`glass ${styles.shiftCard}`}>
                    <div className={styles.shiftDate}>
                      <div className={styles.shiftDay}>{new Date(shift.date).getDate()}</div>
                      <div className={styles.shiftWeekday}>
                        {['日', '一', '二', '三', '四', '五', '六'][new Date(shift.date).getDay()]}
                      </div>
                    </div>
                    <div className={styles.shiftInfo}>
                      <div className={styles.shiftNote}>{shift.note || '打工'}</div>
                      <div className={styles.shiftTime}>
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                    <div className={styles.shiftActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEditShift(shift)}
                        title="編輯"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteShift(shift)}
                        title="刪除"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <WorkShiftEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveShift}
        shift={editingShift}
        mode={editorMode}
      />
    </div>
  );
}
