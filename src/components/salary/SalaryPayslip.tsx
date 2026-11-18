'use client';

import { useMemo, useState, type FormEvent } from 'react';
import type { SalaryRecord } from '@/hooks/useSalaryData';
import { useCountUp } from '@/hooks/useCountUp';
import { useToast } from '@/context/ToastContext';
import { calculateHours, calculateMonthlyTakeHome, calculatePay } from '@/utils/salaryStats';
import { shiftMonthKey } from '@/utils/pickerDateTime';
import { PencilIcon, ShieldIcon } from '@/components/shared/Icons';
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

/**
 * 月薪資單：取代原本四格 KPI，改以「應發 − 勞保 ＝ 實際到帳」的薪資單版面呈現。
 * 為什麼固定以月為單位：勞保按月扣除，只有單月的到帳金額才對得上銀行入帳，
 * 跨月的總覽留給「統計與趨勢分析」頁籤。
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
  // 到帳占比條：讓「勞保吃掉多少」有直覺的比例感，而不只是一個減號
  const netRatio = breakdown.grossPay > 0 ? (breakdown.netPay / breakdown.grossPay) * 100 : 0;
  const [, monthNumber] = month.split('-').map(Number);

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
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>月薪資單</p>
          <h3 className={styles.title}>{monthNumber} 月實際到帳</h3>
        </div>
        <MonthStepper value={month} onChange={onMonthChange} ariaLabel="切換薪資月份" />
      </header>

      <div className={styles.body}>
        <div className={styles.hero}>
          <span className={styles.heroLabel}>實際到帳</span>
          <strong className={styles.heroValue}>
            <span className={styles.currency}>NT$</span>
            {animatedNet.toLocaleString()}
          </strong>
          {(current.grossPay > 0 || previous.grossPay > 0) && (
            <span className={`${styles.diff} ${netDiff >= 0 ? styles.diffUp : styles.diffDown}`}>
              {netDiff === 0 ? '與上月持平' : `比上月 ${netDiff > 0 ? '+' : '−'}NT$ ${Math.abs(netDiff).toLocaleString()}`}
            </span>
          )}
          <div className={styles.ratioTrack} aria-hidden="true">
            <span className={styles.ratioFill} style={{ width: `${netRatio}%` }} />
          </div>
        </div>

        <dl className={styles.ledger}>
          <div className={styles.ledgerRow}>
            <dt>應發總額</dt>
            <dd>{formatMoney(breakdown.grossPay)}</dd>
          </div>
          <div className={`${styles.ledgerRow} ${styles.ledgerDeduct}`}>
            <dt>
              <ShieldIcon size={15} />
              勞保勞工自付
              {canEditSettings && !isEditing && (
                <button type="button" className={styles.editButton} onClick={startEditing} aria-label="設定勞保勞工自付額">
                  <PencilIcon size={13} />{laborInsuranceEmployee ? '修改' : '設定'}
                </button>
              )}
            </dt>
            <dd>{breakdown.laborInsurance ? `− ${formatMoney(breakdown.laborInsurance)}` : '—'}</dd>
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

          <div className={`${styles.ledgerRow} ${styles.ledgerTotal}`}>
            <dt>實際到帳</dt>
            <dd>{formatMoney(breakdown.netPay)}</dd>
          </div>
        </dl>
      </div>

      <ul className={styles.metrics}>
        <li><span>總工時</span><strong>{Number(current.hours.toFixed(2))}<small> 小時</small></strong></li>
        <li><span>平均時薪</span><strong>{avgRate ? `$${avgRate}` : '—'}</strong></li>
        <li><span>工作天數</span><strong>{current.workDays}<small> 天</small></strong></li>
        <li><span>班數</span><strong>{current.shiftCount}<small> 班</small></strong></li>
      </ul>
    </section>
  );
}
