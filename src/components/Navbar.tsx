'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SchoolIcon, BriefcaseIcon, GamepadIcon, CalculatorIcon } from './Icons';
import GlassRadioNav from './GlassRadioNav';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import styles from './Navbar.module.css';

const BASE_PATH = process.env.NODE_ENV === 'production' ? '/schedule_app' : '';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile(768);

  const [isVisible, setIsVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(menuOpen);
  // 追蹤哪個 dropdown 在行動裝置上被展開（用 key 標識）
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);
  const navRef = useRef<HTMLElement>(null);

  // 同步 menuOpen 至 ref，確保 scroll listener 取得最新狀態
  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setMenuOpen(false);
    } catch {
      toast.error('登出失敗，請稍後再試');
    }
  };

  // 路由變更時關閉行動選單
  useEffect(() => {
    const timer = setTimeout(() => {
      setMenuOpen(false);
      setOpenDropdown(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // 當切回桌面時重置行動選單狀態
  useEffect(() => {
    if (!isMobile) {
      const timer = setTimeout(() => {
        setMenuOpen(false);
        setOpenDropdown(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  // 點擊外部時關閉行動選單
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // 行動選單開啟時鎖定 body 捲動
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // 捲動時自動隱藏/顯示 Navbar（選單開啟時絕不隱藏）
  useEffect(() => {
    const handleScroll = () => {
      // 手機端保留頂部入口，避免下滑後失去重新開啟導航的路徑
      if (menuOpenRef.current || window.matchMedia('(max-width: 767px)').matches) {
        setIsVisible(true);
        lastScrollYRef.current = window.scrollY;
        return;
      }

      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;

      // 小於 5px 的微幅捲動不觸發狀態變更，避免手機橡皮筋回彈閃爍
      if (Math.abs(delta) < 5) return;

      if (currentScrollY < lastScrollYRef.current || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollYRef.current && currentScrollY > 50) {
        setIsVisible(false);
        setMenuOpen(false);
        setOpenDropdown(null);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 行動裝置上切換 dropdown 子選單
  const toggleDropdown = useCallback((key: string, e: React.MouseEvent) => {
    if (!isMobile) return; // 桌面版由 CSS :hover 處理
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdown(prev => prev === key ? null : key);
  }, [isMobile]);

  // 關閉選單的通用 handler（點擊連結後）
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        className={`glass ${styles.navbar} ${isVisible ? styles.navbarVisible : styles.navbarHidden}`}
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 100,
        }}
      >
        <div className="container navbar-content">
          {/* 行動版：頂部列 (Logo + 漢堡選單) */}
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Link
                href="/"
                onClick={closeMenu}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', textDecoration: 'none' }}
              >
                <img
                  src={`${BASE_PATH}/avatar.jpg`}
                  alt="Avatar"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}
                />
                <h1 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.05em'
                }}>
                  DayMate
                </h1>
              </Link>
              
              <button
                type="button"
                className={`${styles.hamburger} ${menuOpen ? styles.hamburgerActive : ''}`}
                onClick={() => setMenuOpen(prev => !prev)}
                aria-label={menuOpen ? '關閉選單' : '開啟選單'}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
              >
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
              </button>
            </div>
          )}

          {/* 桌面版：左側 Logo */}
          {!isMobile && (
            <Link
              href="/"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginLeft: '-0.75rem', textDecoration: 'none' }}
            >
              <img
                src={`${BASE_PATH}/icon.png?v=2`}
                alt="DayMate Logo"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}
              />
              <h1 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap',
                letterSpacing: '0.05em'
              }}>
                DayMate
              </h1>
            </Link>
          )}

          {/* 桌面版：Glass Radio Navigation（置中偏右） */}
          {!isMobile && (
            <GlassRadioNav />
          )}

          {/* 右側：使用者頭像（桌面版）*/}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {!loading && (
                <>
                  {user ? (
                    <div className="dropdown" style={{ position: 'relative' }}>
                      <button
                        className="nav-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <img
                          src={user.photoURL || `${BASE_PATH}/avatar.jpg`}
                          alt="User Avatar"
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--color-primary)',
                            boxShadow: '0 2px 8px rgba(184, 126, 107, 0.25)',
                            display: 'block'
                          }}
                        />
                      </button>
                      <div
                        className="dropdown-content dropdown-content-right"
                      >
                        <div className="dropdown-item" style={{ cursor: 'default', opacity: 0.7 }}>
                          <span>{user.displayName || user.email}</span>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="dropdown-item"
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-accent)'
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          <span>登出</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link href="/login" className="nav-link">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      <span>登入</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          )}

          {/* 行動版：導航連結列表（扁平直接呈現所有頁面按鈕） */}
          {isMobile && (
            <ul
              id="mobile-navigation"
              className={`navbar-links ${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}
              aria-hidden={!menuOpen}
            >
              {/* 總覽 */}
              <li className={styles.mobileMenuItem}>
                <Link
                  href="/"
                  className={`${styles.mobileMenuLink} ${pathname === '/' ? styles.mobileMenuLinkActive : ''}`}
                  onClick={closeMenu}
                >
                  <div className={styles.linkContentGroup}>
                    <span>總覽</span>
                  </div>
                </Link>
              </li>

              {/* 學校課表 */}
              <li className={styles.mobileMenuItem}>
                <Link
                  href="/schedule/school"
                  className={`${styles.mobileMenuLink} ${pathname.startsWith('/schedule/school') ? styles.mobileMenuLinkActive : ''}`}
                  onClick={closeMenu}
                >
                  <div className={styles.linkContentGroup}>
                    <SchoolIcon size={20} />
                    <span>學校課表</span>
                  </div>
                </Link>
              </li>

              {/* 打工月曆 */}
              <li className={styles.mobileMenuItem}>
                <Link
                  href="/schedule/work"
                  className={`${styles.mobileMenuLink} ${pathname.startsWith('/schedule/work') ? styles.mobileMenuLinkActive : ''}`}
                  onClick={closeMenu}
                >
                  <div className={styles.linkContentGroup}>
                    <BriefcaseIcon size={20} />
                    <span>打工月曆</span>
                  </div>
                </Link>
              </li>

              {/* 薪資計算 */}
              <li className={styles.mobileMenuItem}>
                <Link
                  href="/tools/salary"
                  className={`${styles.mobileMenuLink} ${pathname.startsWith('/tools/salary') ? styles.mobileMenuLinkActive : ''}`}
                  onClick={closeMenu}
                >
                  <div className={styles.linkContentGroup}>
                    <CalculatorIcon size={20} />
                    <span>薪資計算</span>
                  </div>
                </Link>
              </li>

              {/* 遊戲攻略 */}
              <li className={styles.mobileMenuItem}>
                <Link
                  href="/games"
                  className={`${styles.mobileMenuLink} ${pathname === '/games' ? styles.mobileMenuLinkActive : ''}`}
                  onClick={closeMenu}
                >
                  <div className={styles.linkContentGroup}>
                    <GamepadIcon size={20} />
                    <span>遊戲攻略</span>
                  </div>
                </Link>
              </li>

              {/* 使用者狀態與登入/登出 */}
              {!loading && (
                <li className={styles.mobileMenuItem}>
                  {user ? (
                    <div className={`dropdown ${isMobile && openDropdown === 'user' ? styles.dropdownOpen : ''}`}>
                      <button
                        className={styles.mobileMenuLink}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          if (isMobile) {
                            toggleDropdown('user', e);
                          }
                        }}
                      >
                        <div className={styles.linkContentGroup}>
                          <img
                            src={user.photoURL || `${BASE_PATH}/avatar.jpg`}
                            alt="User Avatar"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid var(--color-primary)'
                            }}
                          />
                          <span>{user.displayName || user.email}</span>
                        </div>
                        <span className={styles.dropdownArrow}>{openDropdown === 'user' ? '▴' : '▾'}</span>
                      </button>
                      <div
                        className={`dropdown-content ${isMobile && openDropdown === 'user' ? styles.dropdownContentOpen : ''}`}
                      >
                        <button
                          onClick={handleSignOut}
                          className="dropdown-item"
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-accent)'
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          <span>登出</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link href="/login" className={styles.mobileMenuLink} onClick={closeMenu}>
                      <div className={styles.linkContentGroup}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                          <polyline points="10 17 15 12 10 7" />
                          <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                        <span>登入</span>
                      </div>
                    </Link>
                  )}
                </li>
              )}
            </ul>
          )}
        </div>
      </nav>

      {/* 行動選單背景遮罩 */}
      {isMobile && menuOpen && (
        <div
          className={styles.overlay}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
}
