'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAllowanceData } from '@/hooks/useAllowanceData';
import { useScheduleData } from '@/hooks/useScheduleData';
import { calculateWorkHours } from '@/data/workRecords';
import { getWorkRoleHourlyRate, getWorkRoleLabel, type RoleType } from '@/data/workRoles';
import { useShiftTemplates } from '@/hooks/useShiftTemplates';
import { useWorkRoles } from '@/hooks/useWorkRoles';
import { useToast } from '@/context/ToastContext';
import { generateAllowanceId } from '@/data/allowance';
import { generateWorkShiftId } from '@/data/schedule';
import styles from './QuickActionModal.module.css';

/** 身份類型 (與 SalaryCalculator 保持一致) */

/** 身份對應時薪 (與 SalaryCalculator 保持一致) */

/** 計算兩個 HH:mm 字串之間的工作時數 */
interface QuickActionModalProps {
  isOpen: boolean;
  initialTab?: 'allowance' | 'work';
  onClose: () => void;
}

const QUICK_ACTION_EXIT_DURATION = 220;

export default function QuickActionModal({
  isOpen,
  initialTab = 'allowance',
  onClose,
}: QuickActionModalProps) {
  const [activeTab, setActiveTab] = useState<'allowance' | 'work'>(initialTab);
  const [isClosing, setIsClosing] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const restoreFocus = useCallback(() => {
    const previousFocus = previousFocusRef.current;
    previousFocusRef.current = null;

    if (previousFocus && document.contains(previousFocus)) {
      previousFocus.focus();
    }
  }, []);

  const requestClose = useCallback(() => {
    if (!isOpen || isClosing) return;

    clearCloseTimer();
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setIsClosing(false);
      restoreFocus();
      onClose();
    }, QUICK_ACTION_EXIT_DURATION);
  }, [clearCloseTimer, isClosing, isOpen, onClose, restoreFocus]);

  // 每次 Modal 開啟時，依照呼叫方設定的 initialTab 重置 Tab
  // 因為 useState 只在首次 mount 時使用初始值，後續父元件改變 initialTab 不會觸發更新
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) {
      restoreFocus();
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    focusFrameRef.current = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
      focusFrameRef.current = null;
    });

    return () => {
      if (focusFrameRef.current !== null) {
        window.cancelAnimationFrame(focusFrameRef.current);
        focusFrameRef.current = null;
      }
    };
  }, [isOpen, restoreFocus]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, requestClose]);

  // 生活費資料 Hook
  const { records: allowanceRecords, addRecord: addAllowanceRecord } = useAllowanceData();
  // 班表資料 Hook
  const { addWorkShift } = useScheduleData();
  const { roles } = useWorkRoles();
  // 薪資記錄 Hook（同步寫入薪資記錄）
  // 班別模板 Hook
  const { templates } = useShiftTemplates();

  // ===== 生活費表單狀態 =====
  const todayStr = new Date().toISOString().slice(0, 10);
  const [allowanceDate, setAllowanceDate] = useState(todayStr);
  const [allowanceAmount, setAllowanceAmount] = useState('');
  const [allowanceXiaoBalance, setAllowanceXiaoBalance] = useState('');
  const [allowanceSource, setAllowanceSource] = useState('生活費匯款');
  const [allowanceNote, setAllowanceNote] = useState('');

  // ===== 打工班表表單狀態（與薪資計算器對齊）=====
  const [shiftDate, setShiftDate] = useState(todayStr);
  const [role, setRole] = useState<RoleType>('assistant');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [hourlyRate, setHourlyRate] = useState(200);
  const [shiftCategory, setShiftCategory] = useState('');

  // 計算工作時數（自動從開始/結束時間算出）
  const workHours = calculateWorkHours(startTime, endTime);

  if (!isOpen) return null;

  // 最新生活費記錄
  const latestRecord = allowanceRecords.length > 0 ? allowanceRecords[0] : null;

  // 當選擇班別模板時，自動帶入時間與時薪（與薪資計算器行為一致）
  const handleShiftCategoryChange = (categoryName: string) => {
    setShiftCategory(categoryName);
    const template = templates.find((t) => t.name === categoryName);
    if (template) {
      setStartTime(template.startTime);
      setEndTime(template.endTime);
      setHourlyRate(template.hourlyRate);
      if (template.role) setRole(template.role);
    }
  };

  // 當切換身份時自動更新預設時薪
  const handleRoleChange = (newRole: RoleType) => {
    setRole(newRole);
    setHourlyRate(getWorkRoleHourlyRate(newRole, roles));
  };

  // 提交生活費快捷新增
  const handleAllowanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(allowanceAmount);
    if (!amt || amt <= 0) {
      toast.error('請輸入有效的匯入金額');
      return;
    }

    const prevTotal = latestRecord ? latestRecord.totalBalance : 0;
    const newTotalBalance = prevTotal + amt;
    const xiaoBal = allowanceXiaoBalance
      ? Number(allowanceXiaoBalance)
      : latestRecord
      ? latestRecord.xiaoBalance
      : 0;

    try {
      await addAllowanceRecord({
        id: generateAllowanceId(),
        date: allowanceDate,
        amount: amt,
        totalBalance: newTotalBalance,
        xiaoBalance: xiaoBal,
        sourceType: allowanceSource,
        note: allowanceNote || undefined,
        timestamp: Date.now(),
      });
      toast.success('🎉 成功快捷新增生活費記錄！');
      requestClose();
    } catch {
      toast.error('儲存失敗，請確認權限');
    }
  };

  // 提交打工班表快捷新增（自動寫入 salaryRecords 實現同步）
  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime >= endTime) {
      toast.warning('結束時間必須晚於開始時間');
      return;
    }

    const workShiftId = generateWorkShiftId();

    try {
      // 寫入打工班表與薪資記錄（addWorkShift 會自動建立對應薪資記錄）
      await addWorkShift({
        id: workShiftId,
        date: shiftDate,
        startTime,
        endTime,
        note: shiftCategory || undefined,
        shiftCategory: shiftCategory || undefined,
        role,
        roleName: getWorkRoleLabel(role, roles),
        hourlyRate,
        workHours,
        location: undefined,
      });

      toast.success(`🎉 成功新增 ${shiftCategory || '打工'} 班表，並同步薪資記錄！`);
      requestClose();
    } catch {
      toast.error('儲存失敗，請確認權限');
    }
  };

  return (
    <div
      className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ''}`}
      onClick={requestClose}
    >
      <div
        className={`${styles.modal} ${isClosing ? styles.modalClosing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>⚡ 快捷新增 (Quick Action)</h3>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeBtn}
            onClick={requestClose}
            aria-label="關閉"
          >
            &times;
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'allowance' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('allowance')}
          >
            💵 記生活費
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'work' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('work')}
          >
            💼 登記打工
          </button>
        </div>

        {activeTab === 'allowance' ? (
          <form onSubmit={handleAllowanceSubmit}>
            <div className={styles.body}>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>匯入日期</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={allowanceDate}
                    onChange={(e) => setAllowanceDate(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>來源類型</label>
                  <select
                    className={styles.select}
                    value={allowanceSource}
                    onChange={(e) => setAllowanceSource(e.target.value)}
                  >
                    <option value="生活費匯款">生活費匯款</option>
                    <option value="打工收入">打工收入</option>
                    <option value="獎學金">獎學金</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>匯入金額 (NT$)</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="例如 5000"
                    value={allowanceAmount}
                    onChange={(e) => setAllowanceAmount(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>小呆餘額 (可視需求調整)</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder={latestRecord ? `上次: ${latestRecord.xiaoBalance}` : '預設 0'}
                    value={allowanceXiaoBalance}
                    onChange={(e) => setAllowanceXiaoBalance(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>備註 (選填)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="可註記備忘細項..."
                  value={allowanceNote}
                  onChange={(e) => setAllowanceNote(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={requestClose}>
                取消
              </button>
              <button type="submit" className={styles.submitBtn}>
                儲存記錄
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleShiftSubmit}>
            <div className={styles.body}>
              {/* 第一行：日期 */}
              <div className={styles.formGroup}>
                <label className={styles.label}>打工日期</label>
                <input
                  type="date"
                  className={styles.input}
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  required
                />
              </div>

              {/* 第二行：職位 / 身份 + 班別（與薪資計算器對齊） */}
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>職位 / 身份</label>
                  <select
                    className={styles.select}
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                  >
                    {roles.length === 0 ? (
                      <option value={role}>{getWorkRoleLabel(role, roles)}</option>
                    ) : (
                      roles.map((workRole) => (
                        <option key={workRole.id} value={workRole.id}>
                          {workRole.name} (NT$ {workRole.hourlyRate}/小時)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>班別 (選填)</label>
                  <select
                    className={styles.select}
                    value={shiftCategory}
                    onChange={(e) => handleShiftCategoryChange(e.target.value)}
                  >
                    <option value="">-- 無班別 --</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 第三行：開始時間 + 結束時間 */}
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>開始時間</label>
                  <input
                    type="time"
                    className={styles.input}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>結束時間</label>
                  <input
                    type="time"
                    className={styles.input}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 第四行：工作時數（唯讀自動計算）+ 時薪 */}
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>工作時數（自動計算）</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={`${workHours} 小時`}
                    readOnly
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>時薪 (元)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
              </div>

              {/* 預估薪資 Banner */}
              {workHours > 0 && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: 'var(--muted, #94a3b8)' }}>
                    💰 預估薪資
                  </span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                    NT$ {(workHours * hourlyRate).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={requestClose}>
                取消
              </button>
              <button type="submit" className={styles.submitBtn}>
                新增班表
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
