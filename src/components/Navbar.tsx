'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="glass" style={{ margin: '1rem', padding: '1rem', position: 'sticky', top: '1rem', zIndex: 100 }}>
      {/* Use container + navbar-content class for responsive layout */}
      <div className="container navbar-content">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Brian's Space
        </h1>
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
        </ul>
      </div>
    </nav>
  );
}
