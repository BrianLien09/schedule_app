'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BriefcaseIcon, CalculatorIcon, CalendarIcon, GamepadIcon, SchoolIcon } from '../shared/Icons';
import styles from './BottomNav.module.css';

interface NavEntry {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
  /** 首頁需要完全比對，避免所有路徑都被判定為啟用 */
  exact?: boolean;
}

const ENTRIES: NavEntry[] = [
  { href: '/', label: '首頁', Icon: CalendarIcon, exact: true },
  { href: '/schedule/school', label: '課表', Icon: SchoolIcon },
  { href: '/schedule/work', label: '班表', Icon: BriefcaseIcon },
  { href: '/tools/salary', label: '薪資', Icon: CalculatorIcon },
  { href: '/games', label: '遊戲', Icon: GamepadIcon },
];

/**
 * 手機底部導覽列
 *
 * 為什麼獨立於 Navbar：原本手機換頁需「開漢堡選單 → 展開子選單 → 點連結」三步，
 * 常用頁面改為一步直達；顯示與否完全交給 CSS 媒體查詢，避免 JS 判斷造成 SSR 首次渲染閃動。
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // 未登入時各頁都只顯示登入提示，不需要導覽
  if (!user) return null;

  return (
    <nav className={styles.bottomNav} aria-label="主要導覽">
      {ENTRIES.map(({ href, label, Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.item} ${isActive ? styles.active : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.icon}>
              <Icon size={22} />
            </span>
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
