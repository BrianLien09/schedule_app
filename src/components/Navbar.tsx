'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar if scrolling up or at the very top
      // Hide if scrolling down and past a threshold (e.g., 50px)
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav 
      className="glass" 
      style={{ 
        margin: '1rem', 
        padding: '1rem', 
        position: 'sticky', 
        top: '1rem', 
        zIndex: 100,
        transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
        transform: isVisible ? 'translateY(0)' : 'translateY(-150%)',
        opacity: isVisible ? 1 : 0
      }}
    >
      {/* Use container + navbar-content class for responsive layout */}
      <div className="container navbar-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
                🏫 學校課表
              </Link>
              <Link href="/schedule/work" className="dropdown-item">
                💼 打工月曆
              </Link>
            </div>
          </li>
          <li>
            <Link 
              href="/games" 
              className={`nav-link ${pathname === '/games' ? 'active' : ''}`}
            >
              遊戲攻略
            </Link>
          </li>
          <li>
            <a 
              href="https://brianlien09.github.io/Music_app" 
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              冥夜音樂 🎵
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
