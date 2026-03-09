'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { SchoolIcon, BriefcaseIcon, GamepadIcon, MusicIcon, CalculatorIcon, WalletIcon, ExternalLinkIcon } from './Icons';
import styles from './GlassRadioNav.module.css';

/**
 * Glass Radio Navigation
 * 桌面版使用的 Glass Radio Group 導航列
 * 特色：扁平化單層結構 + 滑動高亮 (Glider)
 */
export default function GlassRadioNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingPosition, setPendingPosition] = useState<number | null>(null);

  /**
   * 根據路由計算 Glider 位置
   * 0: 總覽
   * 1: 學校課表
   * 2: 打工月曆
   * 3: 薪資計算
   * 4: 生活費記錄
   * 5: 遊戲攻略
   * 6: 冥夜音樂（外部連結，不會觸發）
   */
  const getGliderPosition = useCallback((path: string): number => {
    if (path === '/') return 0;
    if (path.startsWith('/schedule/school') || path === '/manage') return 1;
    if (path.startsWith('/schedule/work')) return 2;
    if (path.startsWith('/tools/salary')) return 3;
    if (path.startsWith('/tools/allowance')) return 4;
    if (path === '/games') return 5;
    // 冥夜音樂是外部連結，不改變路由
    return 0;
  }, []);

  const gliderPosition = pendingPosition ?? getGliderPosition(pathname);

  /**
   * 處理導航點擊 - 立即更新 Glider，無需等待路由變更
   */
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLLabelElement>, href: string, position: number) => {
    e.preventDefault();
    setPendingPosition(position);
    startTransition(() => {
      router.push(href);
      // 路由變更完成後清除 pending 狀態
      setTimeout(() => setPendingPosition(null), 600);
    });
  }, [router]);

  return (
    <div className={styles.glassRadioGroup}>
      {/* 總覽 */}
      <input
        type="radio"
        name="nav"
        id="nav-overview"
        checked={pathname === '/'}
        readOnly
      />
      <label 
        htmlFor="nav-overview"
        onClick={(e) => handleNavClick(e, '/', 0)}
      >
        <span>
          <span>總覽</span>
        </span>
      </label>

      {/* 學校課表 */}
      <input
        type="radio"
        name="nav"
        id="nav-school"
        checked={pathname.startsWith('/schedule/school') || pathname === '/manage'}
        readOnly
      />
      <label 
        htmlFor="nav-school"
        onClick={(e) => handleNavClick(e, '/schedule/school', 1)}
      >
        <span>
          <SchoolIcon size={16} />
          <span>學校課表</span>
        </span>
      </label>

      {/* 打工月曆 */}
      <input
        type="radio"
        name="nav"
        id="nav-work"
        checked={pathname.startsWith('/schedule/work')}
        readOnly
      />
      <label 
        htmlFor="nav-work"
        onClick={(e) => handleNavClick(e, '/schedule/work', 2)}
      >
        <span>
          <BriefcaseIcon size={16} />
          <span>打工月曆</span>
        </span>
      </label>

      {/* 薪資計算 */}
      <input
        type="radio"
        name="nav"
        id="nav-salary"
        checked={pathname.startsWith('/tools/salary')}
        readOnly
      />
      <label 
        htmlFor="nav-salary"
        onClick={(e) => handleNavClick(e, '/tools/salary', 3)}
      >
        <span>
          <CalculatorIcon size={16} />
          <span>薪資計算</span>
        </span>
      </label>

      {/* 生活費記錄 */}
      <input
        type="radio"
        name="nav"
        id="nav-allowance"
        checked={pathname.startsWith('/tools/allowance')}
        readOnly
      />
      <label 
        htmlFor="nav-allowance"
        onClick={(e) => handleNavClick(e, '/tools/allowance', 4)}
      >
        <span>
          <WalletIcon size={16} />
          <span>生活費</span>
        </span>
      </label>

      {/* 遊戲攻略 */}
      <input
        type="radio"
        name="nav"
        id="nav-games"
        checked={pathname === '/games'}
        readOnly
      />
      <label 
        htmlFor="nav-games"
        onClick={(e) => handleNavClick(e, '/games', 5)}
      >
        <span>
          <GamepadIcon size={16} />
          <span>遊戲攻略</span>
        </span>
      </label>

      {/* 冥夜音樂 (外部連結) */}
      <input
        type="radio"
        name="nav"
        id="nav-music"
        checked={false}
        readOnly
      />
      <label htmlFor="nav-music">
        <a
          href="https://brianlien09.github.io/Music_app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <MusicIcon size={16} />
          <span>冥夜音樂</span>
          <ExternalLinkIcon size={10} />
        </a>
      </label>

      {/* Glider 滑動高亮 */}
      <div
        className={styles.glassGlider}
        style={{
          transform: `translateX(${gliderPosition * 100}%)`
        }}
      />
    </div>
  );
}
