'use client';

import React from 'react';
import styles from './SalaryAnalytics.module.css';

export interface MonthStats {
  month: string; // YYYY-MM
  totalPay: number;
  totalHours: number;
  recordCount: number;
}

interface SalaryAnalyticsProps {
  statsFilter: string;
  setStatsFilter: (val: string) => void;
  statsQuickFilters: Array<{ label: string; value: string; description: string }>;
  showStats: boolean;
  setShowStats: (val: boolean) => void;
  statsTotalPay: number;
  statsTotalHours: number;
  statsAvgHourlyRate: number;
  statsWorkDays: number;
  monthlyStats: MonthStats[];
  maxMonthlyPay: number;
}

/**
 * 薪資視覺化統計與跨月趨勢組件
 * 
 * 呈現過去 6 個月收入趨勢長條圖與統計指標。
 */
export default function SalaryAnalytics({
  statsFilter,
  setStatsFilter,
  statsQuickFilters,
  showStats,
  setShowStats,
  statsTotalPay,
  statsTotalHours,
  statsAvgHourlyRate,
  statsWorkDays,
  monthlyStats,
  maxMonthlyPay,
}: SalaryAnalyticsProps) {
  return (
    <div className="glass no-print" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-md)',
        gap: 'var(--spacing-md)',
        flexWrap: 'wrap',
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>
          薪資統計與趨勢分析
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {statsQuickFilters.map(filter => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatsFilter(filter.value)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '8px',
                  border: statsFilter === filter.value
                    ? '2px solid var(--color-primary)'
                    : '1px solid rgba(255,255,255,0.2)',
                  background: statsFilter === filter.value
                    ? 'rgba(184, 126, 107, 0.25)'
                    : 'rgba(255,255,255,0.05)',
                  color: statsFilter === filter.value
                    ? 'var(--color-primary)'
                    : 'var(--text-secondary)',
                  fontWeight: statsFilter === filter.value ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.85rem',
                }}
                title={filter.description}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowStats(!showStats)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#a855f7',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease, color 0.2s ease',
              fontSize: '0.9rem',
            }}
          >
            {showStats ? '隱藏圖表' : '顯示圖表'}
          </button>
        </div>
      </div>

      {showStats && (
        <div className={styles.statsContent}>
          {/* 總覽指標列 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            <div className={styles.statCard} style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(184, 126, 107, 0.12)',
              border: '1px dashed rgba(184, 126, 107, 0.3)',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                總收入
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                ${statsTotalPay.toLocaleString()}
              </div>
            </div>

            <div className={styles.statCard} style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(95, 113, 134, 0.12)',
              border: '1px dashed rgba(95, 113, 134, 0.3)',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                總工時
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-secondary)' }}>
                {statsTotalHours.toFixed(1)}h
              </div>
            </div>

            <div className={styles.statCard} style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(120, 136, 155, 0.12)',
              border: '1px dashed rgba(120, 136, 155, 0.3)',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                平均時薪
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-secondary)' }}>
                ${statsAvgHourlyRate}
              </div>
            </div>

            <div className={styles.statCard} style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(217, 119, 6, 0.12)',
              border: '1px dashed rgba(217, 119, 6, 0.3)',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                工作天數
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-highlight)' }}>
                {statsWorkDays} 天
              </div>
            </div>
          </div>

          {/* 月度趨勢長條圖 */}
          <div>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: 'var(--spacing-md)',
              color: 'var(--foreground)'
            }}>
              月度收入趨勢（最近 6 個月）
            </h4>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-around',
              gap: '1rem',
              height: '260px',
              padding: '1rem 1.25rem',
              background: '#f0ece1',
              borderRadius: '12px',
              border: '2px dashed rgba(220, 208, 194, 0.7)',
              boxShadow: 'var(--glass-shadow)',
              position: 'relative',
            }}>
              {monthlyStats.map((stat) => {
                const heightPercent = (stat.totalPay / maxMonthlyPay) * 100;
                const barHeight = Math.max(heightPercent, 5);
                const [, month] = stat.month.split('-');
                
                const labelTop = stat.totalPay === 0 
                  ? 'calc(100% - 50px)' 
                  : `${100 - barHeight - 12}%`;
                
                return (
                  <div
                    key={stat.month}
                    className={styles.chartColumn}
                    style={{
                      flex: 1,
                      maxWidth: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      position: 'relative',
                    }}
                  >
                    {/* 數值標記 */}
                    <div className={styles.chartValue} style={{
                      position: 'absolute',
                      top: labelTop,
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: stat.totalPay === 0 ? 'var(--muted)' : 'var(--color-primary)',
                      whiteSpace: 'nowrap',
                      transform: 'translateY(-100%)',
                      opacity: stat.totalPay === 0 ? 0.6 : 1,
                    }}>
                      ${(stat.totalPay / 1000).toFixed(1)}k
                    </div>
                    
                    <div style={{ flex: 1 }}></div>
                    
                    {/* 長條本體 */}
                    <div
                      className={styles.chartBar}
                      style={{
                        width: '100%',
                        height: `${barHeight}%`,
                        minHeight: '20px',
                        background: 'linear-gradient(to top, var(--color-primary, #b87e6b) 0%, #d89e8b 100%)',
                        borderRadius: '8px 8px 0 0',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(184, 126, 107, 0.2)',
                      }}
                      title={`${stat.month}: $${stat.totalPay.toLocaleString()} (${stat.totalHours.toFixed(1)}h, ${stat.recordCount}天)`}
                    />
                    
                    {/* 月份標籤 */}
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      marginTop: '0.75rem',
                    }}>
                      {month}月
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}>
              提示：將游標移動至長條圖上方可查看該月詳細數據。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
