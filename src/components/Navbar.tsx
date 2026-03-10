'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SchoolIcon, BriefcaseIcon, GamepadIcon, MusicIcon, ToolboxIcon, CalculatorIcon, WalletIcon } from './Icons';
import GlassRadioNav from './GlassRadioNav';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile(768);

  const [isVisible, setIsVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  // 追蹤哪個 dropdown 在行動裝置上被展開（用 key 標識）
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);
  const navRef = useRef<HTMLElement>(null);

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
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // 當切回桌面時重置行動選單狀態
  useEffect(() => {
    if (!isMobile) {
      setMenuOpen(false);
      setOpenDropdown(null);
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

  // 捲動時自動隱藏/顯示 Navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollYRef.current || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollYRef.current && currentScrollY > 50) {
        setIsVisible(false);
        // 捲動隱藏時也關閉行動選單
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
        className="glass"
        style={{
          margin: '0 var(--spacing-md) var(--spacing-md) var(--spacing-md)',
          padding: 'var(--spacing-md)',
          position: 'sticky',
          top: '0',
          zIndex: 100,
          transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
          transform: isVisible ? 'translateY(0)' : 'translateY(-150%)',
          opacity: isVisible ? 1 : 0
        }}
      >
        <div className="container navbar-content">
          {/* 桌面版：左側 Logo */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginLeft: '-0.75rem' }}>
              <img
                src="/schedule_app/avatar.jpg"
                alt="Avatar"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
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
                冥夜小助手
              </h1>
            </div>
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
                    <div className={`dropdown`}>
                      <button
                        className="nav-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <img
                          src={user.photoURL || '/schedule_app/avatar.jpg'}
                          alt="User Avatar"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--color-primary)'
                          }}
                        />
                      </button>
                      <div
                        className="dropdown-content"
                        style={{ right: 0, left: 'auto' }}
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

          {/* 行動版：導航連結列表 */}
          {isMobile && (
            <ul
              className={`navbar-links ${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}
            >
            <li>
              <Link
                href="/"
                className={`nav-link ${pathname === '/' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                總覽
              </Link>
            </li>

            {/* 日程表 Dropdown */}
            <li className={`dropdown ${isMobile && openDropdown === 'schedule' ? styles.dropdownOpen : ''}`}>
              <Link
                href="/schedule/school"
                className={`nav-link ${pathname.startsWith('/schedule') ? 'active' : ''}`}
                onClick={(e) => {
                  if (isMobile) {
                    toggleDropdown('schedule', e);
                  }
                }}
              >
                日程表 ▾
              </Link>
              <div className={`dropdown-content ${isMobile && openDropdown === 'schedule' ? styles.dropdownContentOpen : ''}`}>
                <Link href="/schedule/school" className="dropdown-item" onClick={closeMenu}>
                  <SchoolIcon size={18} />
                  <span>學校課表</span>
                </Link>
                <Link href="/schedule/work" className="dropdown-item" onClick={closeMenu}>
                  <BriefcaseIcon size={18} />
                  <span>打工月曆</span>
                </Link>
                <Link href="/manage" className="dropdown-item" onClick={closeMenu}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>資料管理</span>
                </Link>
              </div>
            </li>

            {/* 工具箱 Dropdown */}
            <li className={`dropdown ${isMobile && openDropdown === 'tools' ? styles.dropdownOpen : ''}`}>
              <Link
                href="/tools/salary"
                className={`nav-link ${pathname.startsWith('/tools') ? 'active' : ''}`}
                onClick={(e) => {
                  if (isMobile) {
                    toggleDropdown('tools', e);
                  }
                }}
              >
                <ToolboxIcon size={18} />
                <span>工具箱 ▾</span>
              </Link>
              <div className={`dropdown-content ${isMobile && openDropdown === 'tools' ? styles.dropdownContentOpen : ''}`}>
                <Link href="/tools/salary" className="dropdown-item" onClick={closeMenu}>
                  <CalculatorIcon size={18} />
                  <span>薪資計算</span>
                </Link>
                <Link href="/tools/allowance" className="dropdown-item" onClick={closeMenu}>
                  <WalletIcon size={18} />
                  <span>生活費記錄</span>
                </Link>
              </div>
            </li>

            <li>
              <Link
                href="/games"
                className={`nav-link ${pathname === '/games' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <GamepadIcon size={18} />
                <span>遊戲攻略</span>
              </Link>
            </li>
            <li>
              <a
                href="https://brianlien09.github.io/Music_app"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link"
                onClick={closeMenu}
              >
                <MusicIcon size={18} />
                <span>冥夜音樂</span>
              </a>
            </li>
            {!loading && (
              <li>
                {user ? (
                  <div className={`dropdown ${isMobile && openDropdown === 'user' ? styles.dropdownOpen : ''}`}>
                    <button
                      className="nav-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={(e) => {
                        if (isMobile) {
                          toggleDropdown('user', e);
                        }
                      }}
                    >
                      <img
                        src={user.photoURL || '/schedule_app/avatar.jpg'}
                        alt="User Avatar"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--color-primary)'
                        }}
                      />
                    </button>
                    <div
                      className={`dropdown-content ${isMobile && openDropdown === 'user' ? styles.dropdownContentOpen : ''}`}
                      style={!isMobile ? { right: 0, left: 'auto' } : undefined}
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
                  <Link href="/login" className="nav-link" onClick={closeMenu}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    <span>登入</span>
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
