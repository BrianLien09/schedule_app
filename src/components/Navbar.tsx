'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { SchoolIcon, BriefcaseIcon, GamepadIcon, MusicIcon, ToolboxIcon, CalculatorIcon } from './Icons';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar if scrolling up or at the very top
      // Hide if scrolling down and past a threshold (e.g., 50px)
      if (currentScrollY < lastScrollYRef.current || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollYRef.current && currentScrollY > 50) {
        setIsVisible(false);
      }
      
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty deps array - no risk of infinite loop

  return (
    <nav 
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
      {/* Use container + navbar-content class for responsive layout */}
      <div className="container navbar-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            冥夜小助手
          </h1>
        </div>
        <ul className="navbar-links">
          <li>
            <Link 
              href="/" 
              className={`nav-link ${pathname === '/' ? 'active' : ''}`}
            >
              總覽
            </Link>
          </li>
          <li className="dropdown">
            <Link 
              href="/schedule/school" 
              className={`nav-link ${pathname.startsWith('/schedule') ? 'active' : ''}`}
            >
              日程表 ▾
            </Link>
            <div className="dropdown-content">
              <Link href="/schedule/school" className="dropdown-item">
                <SchoolIcon size={18} />
                <span>學校課表</span>
              </Link>
              <Link href="/schedule/work" className="dropdown-item">
                <BriefcaseIcon size={18} />
                <span>打工月曆</span>
              </Link>
            </div>
          </li>
          <li className="dropdown">
            <Link 
              href="/tools/salary" 
              className={`nav-link ${pathname.startsWith('/tools') ? 'active' : ''}`}
            >
              <ToolboxIcon size={18} />
              <span>工具箱 ▾</span>
            </Link>
            <div className="dropdown-content">
              <Link href="/tools/salary" className="dropdown-item">
                <CalculatorIcon size={18} />
                <span>薪資計算</span>
              </Link>
            </div>
          </li>
          <li>
            <Link 
              href="/games" 
              className={`nav-link ${pathname === '/games' ? 'active' : ''}`}
            >
              <GamepadIcon size={18} />
              <span>遊戲攻略</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/manage" 
              className={`nav-link ${pathname === '/manage' ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>管理</span>
            </Link>
          </li>
          <li>
            <a 
              href="https://brianlien09.github.io/Music_app" 
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              <MusicIcon size={18} />
              <span>冥夜音樂</span>
            </a>
          </li>
          <li>
            <ThemeToggle />
          </li>
        </ul>
      </div>
    </nav>
  );
}
