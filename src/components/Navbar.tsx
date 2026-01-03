'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="glass" style={{ margin: '1rem', padding: '1rem', position: 'sticky', top: '1rem', zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Brian's Space
        </h1>
        <ul style={{ display: 'flex', gap: '1.5rem', listStyle: 'none' }}>
          <li>
            <Link 
              href="/" 
              className={`nav-link ${pathname === '/' ? 'active' : ''}`}
            >
              總覽
            </Link>
          </li>
          <li>
            <Link 
              href="/schedule" 
              className={`nav-link ${pathname === '/schedule' ? 'active' : ''}`}
            >
              日程表
            </Link>
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
