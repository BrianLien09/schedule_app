'use client';

import type { SalaryRecord } from '@/hooks/useSalaryData';
import type { ImportValidation } from '@/utils/excelParser';

interface SalaryCalculatorImportModalProps {
  validation: ImportValidation;
  showAllRecords: boolean;
  isConfirming: boolean;
  calculatePay: (record: Omit<SalaryRecord, 'id'>) => number;
  onShowAll: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Excel 匯入預覽與確認流程，隔離檔案解析結果的展示。 */
export default function SalaryCalculatorImportModal({
  validation,
  showAllRecords,
  isConfirming,
  calculatePay,
  onShowAll,
  onCancel,
  onConfirm,
}: SalaryCalculatorImportModalProps) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000,
    }}>
      <div className="glass" style={{
        width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
        padding: 'var(--spacing-lg)', background: '#f0ece1',
      }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: 'var(--spacing-md)' }}>
          Excel 匯入預覽
        </h3>

        {validation.errors.length > 0 && (
          <div style={{
            padding: '1rem', marginBottom: 'var(--spacing-md)', borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626',
          }}>
            <strong>驗證錯誤：</strong>
            <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
              {validation.errors.map((error, index) => <li key={index}>{error}</li>)}
            </ul>
          </div>
        )}

        {validation.success && (
          <div>
            <div style={{
              padding: '1rem', marginBottom: 'var(--spacing-md)', borderRadius: '8px',
              background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#16a34a',
            }}>
              成功解析 <strong>{validation.records.length}</strong> 筆記錄！
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: 'var(--spacing-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.05)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>日期</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>班別</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>工時</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>時薪</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>薪資</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllRecords ? validation.records : validation.records.slice(0, 5)).map((record, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '0.5rem' }}>{record.date}</td>
                      <td style={{ padding: '0.5rem' }}>{record.shiftCategory || '-'}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>{record.workHours}h</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>${record.hourlyRate}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>${calculatePay(record).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!showAllRecords && validation.records.length > 5 && (
                <button
                  type="button"
                  onClick={onShowAll}
                  style={{
                    width: '100%', padding: '0.5rem', marginTop: '0.5rem', background: 'transparent',
                    border: '1px dashed rgba(0,0,0,0.2)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-secondary)',
                  }}
                >
                  顯示全部 ({validation.records.length} 筆)
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', background: 'transparent', cursor: 'pointer' }}
          >
            取消
          </button>
          {validation.success && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
            >
              {isConfirming ? '匯入中...' : `確認匯入 (${validation.records.length} 筆)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
