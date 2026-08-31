'use client';

import React from 'react';

interface SalaryHeaderStatsProps {
  /** 總收入 ($) */
  totalPay: number;
  /** 總工時 (小時) */
  totalHours: number;
  /** 平均時薪 ($) */
  avgHourlyRate: number;
  /** 工作天數 */
  workDays: number;
}

/**
 * 薪資速覽 KPI 卡片組件
 * 
 * 呈現當前篩選範圍內的四大核心指標：總收入、總工時、平均時薪、工作天數。
 */
export default function SalaryHeaderStats({
  totalPay,
  totalHours,
  avgHourlyRate,
  workDays,
}: SalaryHeaderStatsProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 'var(--spacing-md)',
      marginBottom: 'var(--spacing-lg)'
    }}>
      {/* 總收入卡片 */}
      <div style={{
        padding: '1.25rem',
        borderRadius: '12px',
        background: 'rgba(184, 126, 107, 0.12)',
        border: '1px dashed rgba(184, 126, 107, 0.3)',
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
          總收入
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-primary)' }}>
          ${totalPay.toLocaleString()}
        </div>
      </div>

      {/* 總工時卡片 */}
      <div style={{
        padding: '1.25rem',
        borderRadius: '12px',
        background: 'rgba(95, 113, 134, 0.12)',
        border: '1px dashed rgba(95, 113, 134, 0.3)',
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
          總工時
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-secondary)' }}>
          {totalHours.toFixed(2)} 小時
        </div>
      </div>

      {/* 平均時薪卡片 */}
      <div style={{
        padding: '1.25rem',
        borderRadius: '12px',
        background: 'rgba(120, 136, 155, 0.12)',
        border: '1px dashed rgba(120, 136, 155, 0.3)',
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
          平均時薪
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-secondary)' }}>
          ${avgHourlyRate}
        </div>
      </div>

      {/* 工作天數卡片 */}
      <div style={{
        padding: '1.25rem',
        borderRadius: '12px',
        background: 'rgba(217, 119, 6, 0.12)',
        border: '1px dashed rgba(217, 119, 6, 0.3)',
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
          工作天數
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-highlight)' }}>
          {workDays} 天
        </div>
      </div>
    </div>
  );
}
