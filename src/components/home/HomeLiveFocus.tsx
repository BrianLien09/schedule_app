'use client';

import Link from 'next/link';
import { SchoolIcon, BriefcaseIcon, WalletIcon } from '@/components/shared/Icons';
import { calculateKongBalance, type AllowanceRecord } from '@/data/allowance';
import type { CurrentEvent } from '@/hooks/useHomeDashboard';
import styles from '@/app/page.module.css';

interface HomeLiveFocusProps {
  showAllowance: boolean;
  currentEvent: CurrentEvent | null;
  nextEvent: CurrentEvent | null;
  currentTimeStr: string;
  remainingMinutesStr: string;
  progressPercent: number;
  thisWeekClasses: number;
  thisMonthWorkDays: number;
  latestAllowance: AllowanceRecord | null;
}

/** 儀表板首屏焦點區，集中即時行程、倒數與摘要卡片的呈現。 */
export default function HomeLiveFocus({
  showAllowance,
  currentEvent,
  nextEvent,
  currentTimeStr,
  remainingMinutesStr,
  progressPercent,
  thisWeekClasses,
  thisMonthWorkDays,
  latestAllowance,
}: HomeLiveFocusProps) {
  return (
    <div className={showAllowance ? styles.heroGrid : styles.heroGridSingle}>
      <div className={styles.liveFocusCard}>
        <div className={styles.cardHeaderLabel}>
          <span>
            <span className={styles.pulseDot}></span>{' '}
            {currentEvent ? '正在進行中' : '今日行程狀態'}
          </span>
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{currentTimeStr}</span>
        </div>

        {currentEvent ? (
          <div className={styles.currentEventRow}>
            <div className={styles.currentIcon}>
              {currentEvent.type === 'class' ? <SchoolIcon size={28} /> : <BriefcaseIcon size={28} />}
            </div>
            <div className={styles.eventMeta}>
              <div className={styles.eventTitle}>{currentEvent.title}</div>
              <div className={styles.eventSubInfo}>
                <span>🕒 {currentEvent.time}</span>
                {currentEvent.location && <span>📍 {currentEvent.location}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.currentEventRow}>
            <div
              className={styles.currentIcon}
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
            >
              ☕
            </div>
            <div className={styles.eventMeta}>
              <div className={styles.eventTitle}>目前無進行中行程</div>
              <div className={styles.eventSubInfo}>
                {nextEvent ? `下個行程：${nextEvent.title} (${nextEvent.time})` : '今日行程順利完成 ✨'}
              </div>
            </div>
          </div>
        )}

        {currentEvent && (
          <div className={styles.progressContainer}>
            <div className={styles.progressLabel}>
              <span>{remainingMinutesStr ? `距離結束剩餘 ${remainingMinutesStr}` : '時間倒數中'}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        )}

        <div className={styles.pillBadgesRow}>
          <div className={styles.pillBadge}>
            <SchoolIcon size={16} />
            <span>本週課程：</span>
            <span className={styles.pillBadgeValue}>{thisWeekClasses} 堂</span>
          </div>
          <div className={styles.pillBadge}>
            <BriefcaseIcon size={16} />
            <span>本月打工：</span>
            <span className={styles.pillBadgeValue}>{thisMonthWorkDays} 天</span>
          </div>
          {nextEvent && (
            <div className={styles.pillBadge} style={{ borderColor: 'rgba(251, 191, 36, 0.3)' }}>
              <span>稍後：</span>
              <span style={{ fontWeight: 600 }}>{nextEvent.title} ({nextEvent.time})</span>
            </div>
          )}
        </div>
      </div>

      {showAllowance && (
        <div className={styles.allowanceCard}>
          <div className={styles.allowanceCardHeader}>
            <div className={styles.allowanceTitle}>
              <WalletIcon size={20} />
              <span>生活費帳簿摘要</span>
            </div>
            <Link href="/tools/allowance" className={styles.cardActionLink}>
              查看明細 →
            </Link>
          </div>

          {latestAllowance ? (
            <>
              <div className={styles.allowanceBalanceBlock}>
                <span className={styles.balanceLabel}>帳簿總餘額</span>
                <span className={styles.balanceValue}>
                  NT$ {latestAllowance.totalBalance.toLocaleString()}
                </span>
              </div>
              <div className={styles.splitBarContainer}>
                <div className={styles.splitInfoRow}>
                  <span className={styles.xiaoLabel}>
                    小呆: NT$ {latestAllowance.xiaoBalance.toLocaleString()}
                  </span>
                  <span className={styles.kongLabel}>
                    孔呆: NT${' '}
                    {calculateKongBalance(
                      latestAllowance.totalBalance,
                      latestAllowance.xiaoBalance
                    ).toLocaleString()}
                  </span>
                </div>
                <div className={styles.splitTrack}>
                  <div
                    className={styles.splitXiaoFill}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          (latestAllowance.xiaoBalance / (latestAllowance.totalBalance || 1)) * 100
                        )
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              <Link href="/tools/allowance" className={styles.cardActionLink}>
                查看詳細流水帳明細 →
              </Link>
            </>
          ) : (
            <div className={styles.emptyBlock}>
              <p>尚無生活費記錄</p>
              <Link href="/tools/allowance" className={styles.cardActionLink}>
                前往新增記錄 →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
