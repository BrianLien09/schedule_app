'use client';

import React, { useState, useEffect } from 'react';
import { useAllowanceData } from '@/hooks/useAllowanceData';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useSalaryData, type SalaryRecord } from '@/hooks/useSalaryData';
import { useShiftTemplates } from '@/hooks/useShiftTemplates';
import { useToast } from '@/context/ToastContext';
import { generateAllowanceId } from '@/data/allowance';
import { generateWorkShiftId } from '@/data/schedule';
import styles from './QuickActionModal.module.css';

/** 身份類型 (與 SalaryCalculator 保持一致) */
type RoleType = 'assistant' | 'instructor';

/** 身份對應時薪 (與 SalaryCalculator 保持一致) */
const ROLE_HOURLY_RATES: Record<RoleType, number> = {
  assistant: 200,
  instructor: 500,
};

/** 計算兩個 HH:mm 字串之間的工作時數 */
function calculateWorkHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, parseFloat((diff / 60).toFixed(1)));
}

interface QuickActionModalProps {
  isOpen: boolean;
  initialTab?: 'allowance' | 'work';
  onClose: () => void;
}

export default function QuickActionModal({
  isOpen,
  initialTab = 'allowance',
  onClose,
}: QuickActionModalProps) {
  const [activeTab, setActiveTab] = useState<'allowance' | 'work'>(initialTab);
  const { toast } = useToast();

  // 每次 Modal 開啟時，依照呼叫方設定的 initialTab 重置 Tab
  // 因為 useState 只在首次 mount 時使用初始值，後續父元件改變 initialTab 不會觸發更新
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // 生活費資料 Hook
  const { records: allowanceRecords, addRecord: addAllowanceRecord } = useAllowanceData();
  // 班表資料 Hook
  const { addWorkShift } = useScheduleData();
  // 薪資記錄 Hook（同步寫入薪資記錄）
  const { addRecord: addSalaryRecord } = useSalaryData();
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
  const [hourlyRate, setHourlyRate] = useState(ROLE_HOURLY_RATES['assistant']);
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
    }
  };

  // 當切換身份時自動更新預設時薪
  const handleRoleChange = (newRole: RoleType) => {
    setRole(newRole);
    setHourlyRate(ROLE_HOURLY_RATES[newRole]);
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
      onClose();
    } catch {
      toast.error('儲存失敗，請確認權限');
    }
  };

  // 提交打工班表快捷新增（同時寫入 workShifts 與 salaryRecords）
  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime >= endTime) {
      toast.warning('結束時間必須晚於開始時間');
      return;
    }

    const workShiftId = generateWorkShiftId();

    try {
      // 1. 寫入 workShifts（打工班表月曆）
      await addWorkShift({
        id: workShiftId,
        date: shiftDate,
        startTime,
        endTime,
        note: shiftCategory || undefined,
        location: undefined,
      });

      // 2. 同步寫入 salaryRecords（薪資計算器）
      const salaryRecord: SalaryRecord = {
        id: `salary-${workShiftId}`,
        date: shiftDate,
        startTime,
        endTime,
        workHours,
        role,
        hourlyRate,
        shiftCategory: shiftCategory || undefined,
        workShiftId,
      };
      await addSalaryRecord(salaryRecord);

      toast.success(`🎉 成功新增 ${shiftCategory || '打工'} 班表，並同步薪資記錄！`);
      onClose();
    } catch {
      toast.error('儲存失敗，請確認權限');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>⚡ 快捷新增 (Quick Action)</h3>
          <button className={styles.closeBtn} onClick={onClose}>
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
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
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

              {/* 第二行：身份 + 班別（與薪資計算器對齊） */}
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>身份</label>
                  <select
                    className={styles.select}
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as RoleType)}
                  >
                    <option value="assistant">助教 ($200/hr)</option>
                    <option value="instructor">講師 ($500/hr)</option>
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
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
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
