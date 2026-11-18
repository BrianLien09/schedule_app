'use client';

import { useMemo, useState, type FormEvent } from 'react';
import type { SalaryRecord } from '@/hooks/useSalaryData';
import { useCountUp } from '@/hooks/useCountUp';
import { useToast } from '@/context/ToastContext';
import { calculateHours, calculateMonthlyTakeHome, calculatePay } from '@/utils/salaryStats';
import { monthKeyOf, shiftMonthKey } from '@/utils/pickerDateTime';
import { BriefcaseIcon, CalendarIcon, ClockIcon, PencilIcon, ShieldIcon, WalletIcon } from '@/components/shared/Icons';
import MonthStepper from '@/components/shared/pickers/MonthStepper';
import styles from './SalaryPayslip.module.css';

interface SalaryPayslipProps {
  /** YYYY-MM */
  month: string;
  onMonthChange: (month: string) => void;
  records: SalaryRecord[];
  laborInsuranceEmployee: number;
  canEditSettings: boolean;
  onSaveLaborInsurance: (amount: number) => Promise<void>;
}

interface MonthSummary {
  grossPay: number;
  hours: number;
  workDays: number;
  shiftCount: number;
}

function summarize(records: SalaryRecord[], month: string): MonthSummary {
  const monthRecords = records.filter((record) => record.date.startsWith(month));
  return {
    grossPay: monthRecords.reduce((sum, record) => sum + calculatePay(record), 0),
    hours: monthRecords.reduce((sum, record) => sum + calculateHours(record), 0),
    workDays: new Set(monthRecords.map((record) => record.date)).size,
    shiftCount: monthRecords.length,
  };
}

const formatMoney = (value: number): string => `NT$ ${value.toLocaleString()}`;

/** 印章文字：過去的月份已發薪、本月還在累積、未來月份只是預排，避免把未發的錢看成已入帳 */
function stampOf(month: string): { label: string; tone: 'done' | 'live' | 'future' } {
  const current = monthKeyOf(new Date());
  if (month < current) return { label: '已結算', tone: 'done' };
  if (month === current) return { label: '累計中', tone: 'live' };
  return { label: '預排', tone: 'future' };
}

/**
 * 月薪資單：做成一張從出紙口印出來的收據。
 * 為什麼固定以月為單位：勞保按月扣除，只有單月的到帳金額才對得上銀行入帳，
 * 跨月的總覽留給「統計與趨勢分析」頁籤。
 * 切換月份時整張紙以 month 為 key 重新掛載，重播出紙動畫，讓「換了一張薪資單」的感覺更明確。
 */
export default function SalaryPayslip({
  month,
  onMonthChange,
  records,
  laborInsuranceEmployee,
  canEditSettings,
  onSaveLaborInsurance,
}: SalaryPayslipProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const current = useMemo(() => summarize(records, month), [records, month]);
  const previous = useMemo(() => summarize(records, shiftMonthKey(month, -1)), [records, month]);
  const breakdown = calculateMonthlyTakeHome(current.grossPay, laborInsuranceEmployee);
  const previousNet = calculateMonthlyTakeHome(previous.grossPay, laborInsuranceEmployee).netPay;
  const netDiff = breakdown.netPay - previousNet;
  const animatedNet = useCountUp(breakdown.netPay);
  const avgRate = current.hours > 0 ? Math.round(current.grossPay / current.hours) : 0;
  const [year, monthNumber] = month.split('-').map(Number);
  const stamp = stampOf(month);
  const hasPay = breakdown.grossPay > 0;

  const startEditing = (): void => {
    setDraft(laborInsuranceEmployee ? String(laborInsuranceEmployee) : '');
    setIsEditing(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const amount = draft.trim() === '' ? 0 : Number(draft);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.warning('請輸入 0 以上的金額');
      return;
    }
    setIsSaving(true);
    try {
      await onSaveLaborInsurance(Math.round(amount));
      toast.success(amount > 0 ? `勞保自付額已設為 NT$ ${Math.round(amount).toLocaleString()}` : '已取消勞保扣除');
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '儲存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={`no-print ${styles.payslip}`} aria-label={`${monthNumber} 月薪資單`}>
      {/* 出紙口：深石板藍的機台，薪資單從它下方「印」出來 */}
      <header className={styles.printer}>
        <div className={styles.printerText}>
          <p className={styles.eyebrow}>PAYSLIP</p>
          <h3 className={styles.title}>月薪資單</h3>
        </div>
        <MonthStepper value={month} onChange={onMonthChange} ariaLabel="切換薪資月份" />
        <span className={styles.slot} aria-hidden="true" />
      </header>

      <div className={styles.feed}>
        <article key={month} className={styles.paper}>
          <div className={styles.paperHead}>
            <div>
              <span className={styles.serial}>No. {year}-{String(monthNumber).padStart(2, '0')}</span>
              <h4 className={styles.paperTitle}>{year} 年 {monthNumber} 月</h4>
            </div>
            <span className={`${styles.stamp} ${styles[`stamp_${stamp.tone}`]}`}>{stamp.label}</span>
          </div>

          <div className={styles.paperBody}>
            <div className={styles.ledger}>
              <div className={styles.row}>
                <span className={styles.label}>應發總額</span>
                <span className={styles.value}>{formatMoney(breakdown.grossPay)}</span>
              </div>
              <div className={`${styles.row} ${styles.rowDeduct}`}>
                <span className={styles.label}>
                  <ShieldIcon size={15} />
                  勞保勞工自付
                  {canEditSettings && !isEditing && (
                    <button type="button" className={styles.editButton} onClick={startEditing} aria-label="設定勞保勞工自付額">
                      <PencilIcon size={12} />{laborInsuranceEmployee ? '修改' : '設定'}
                    </button>
                  )}
                </span>
                <span className={styles.value}>{breakdown.laborInsurance ? `− ${formatMoney(breakdown.laborInsurance)}` : '—'}</span>
              </div>

              {isEditing && (
                <form className={styles.editor} onSubmit={(event) => { void submit(event); }}>
                  <label className={styles.editorLabel} htmlFor="labor-insurance">每月勞保勞工自付額</label>
                  <div className={styles.editorRow}>
                    <span className={styles.editorPrefix}>NT$</span>
                    <input
                      id="labor-insurance"
                      className={styles.editorInput}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      autoFocus
                      placeholder="例如 700"
                      value={draft}
                      disabled={isSaving}
                      onChange={(event) => setDraft(event.target.value)}
                    />
                    <button type="button" className={styles.editorCancel} disabled={isSaving} onClick={() => setIsEditing(false)}>取消</button>
                    <button type="submit" className={styles.editorSave} disabled={isSaving}>{isSaving ? '儲存中…' : '儲存'}</button>
                  </div>
                  <p className={styles.editorHint}>
                    金額可在薪資單或勞保局 e 化服務查詢。只會從有薪資的月份扣除，留空或填 0 代表不扣。
                  </p>
                </form>
              )}

              {/* 撕線：收據上「小計」與「實收」之間的分界 */}
              <div className={styles.tear} aria-hidden="true" />

              <div className={styles.total}>
                <span className={styles.label}>實際到帳</span>
                <span className={styles.value}>
                  <span className={styles.totalCurrency}>NT$</span>
                  <span className={styles.totalValue}>{animatedNet.toLocaleString()}</span>
                </span>
              </div>
              {(hasPay || previous.grossPay > 0) && (
                <span className={`${styles.diff} ${netDiff > 0 ? styles.diffUp : netDiff < 0 ? styles.diffDown : ''}`}>
                  {netDiff === 0 ? '與上月持平' : `${netDiff > 0 ? '▲' : '▼'} 比上月${netDiff > 0 ? '多' : '少'} NT$ ${Math.abs(netDiff).toLocaleString()}`}
                </span>
              )}
            </div>

            {/* 工作量指標：班數、工時、時薪是對帳時最常看的數字，用大字卡片呈現，不擠在明細的小字裡 */}
            <ul className={styles.stats}>
              <li className={styles.stat}>
                <span className={styles.statIcon} aria-hidden="true"><BriefcaseIcon size={18} /></span>
                <span className={styles.statLabel}>班數</span>
                <strong className={styles.statValue}>{current.shiftCount}<small>班</small></strong>
              </li>
              <li className={styles.stat}>
                <span className={styles.statIcon} aria-hidden="true"><ClockIcon size={18} /></span>
                <span className={styles.statLabel}>總工時</span>
                <strong className={styles.statValue}>{Number(current.hours.toFixed(2))}<small>小時</small></strong>
              </li>
              <li className={`${styles.stat} ${styles.statFeature}`}>
                <span className={styles.statIcon} aria-hidden="true"><WalletIcon size={18} /></span>
                <span className={styles.statLabel}>平均時薪</span>
                <strong className={styles.statValue}>
                  {avgRate ? <><small>$</small>{avgRate}<small>/h</small></> : '—'}
                </strong>
              </li>
              <li className={styles.stat}>
                <span className={styles.statIcon} aria-hidden="true"><CalendarIcon size={18} /></span>
                <span className={styles.statLabel}>工作天數</span>
                <strong className={styles.statValue}>{current.workDays}<small>天</small></strong>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
}
